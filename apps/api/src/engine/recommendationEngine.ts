import type { RecommendationAction } from "@wealthlens/shared";
import type { ShareKhanAdapter, BrokerHistoricalPoint } from "../broker";

/**
 * Rule-based v1 recommendation engine per PRD section 7.
 *
 * Rules:
 *  1. Price vs N-day moving average crossover.
 *  2. RSI (14-period) oversold / overbought signal.
 *  3. Sector concentration vs a simple target cap.
 *
 * Each rule casts a directional vote (BUY / SELL / HOLD) with a weight; the
 * votes are combined into a confidence score in [0, 1] and the
 * highest-weighted direction wins. `reason` joins the plain-language
 * explanation of every rule that actually fired (i.e. wasn't neutral),
 * matching the PRD's example output shape:
 * { ticker, action, confidence, reason, timestamp }
 */

const MOVING_AVERAGE_WINDOW = 50;
const RSI_PERIOD = 14;
const RSI_OVERSOLD = 30;
const RSI_OVERBOUGHT = 70;
const SECTOR_TARGET_CAP_PCT = 30; // advisor's simple target: no sector > 30% of portfolio value

export interface EngineHoldingInput {
  ticker: string;
  quantity: number;
  avgBuyPrice: number;
  lastPrice: number;
  sector: string | null;
}

export interface EngineRecommendation {
  ticker: string;
  action: RecommendationAction;
  confidence: number;
  reason: string;
}

interface RuleVote {
  action: RecommendationAction;
  weight: number; // 0..1, contribution strength
  reason: string | null; // null = rule was neutral, doesn't fire
}

/** Simple moving average of the last `window` closes. */
function simpleMovingAverage(closes: number[], window: number): number | null {
  if (closes.length < window) return null;
  const slice = closes.slice(closes.length - window);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / slice.length;
}

/** Standard Wilder-style RSI calculation over `period` price changes. */
function computeRSI(closes: number[], period: number): number | null {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function movingAverageRule(
  lastPrice: number,
  historical: BrokerHistoricalPoint[]
): RuleVote {
  const closes = historical.map((p) => p.close);
  const ma = simpleMovingAverage(closes, MOVING_AVERAGE_WINDOW);

  if (ma === null) {
    return { action: "HOLD", weight: 0, reason: null };
  }

  const pctAboveMa = ((lastPrice - ma) / ma) * 100;

  if (pctAboveMa > 1) {
    return {
      action: "BUY",
      weight: Math.min(1, pctAboveMa / 10),
      reason: `Price crossed above ${MOVING_AVERAGE_WINDOW}-day MA (${pctAboveMa.toFixed(1)}% above)`,
    };
  }

  if (pctAboveMa < -1) {
    return {
      action: "SELL",
      weight: Math.min(1, Math.abs(pctAboveMa) / 10),
      reason: `Price fell below ${MOVING_AVERAGE_WINDOW}-day MA (${Math.abs(pctAboveMa).toFixed(1)}% below)`,
    };
  }

  return { action: "HOLD", weight: 0, reason: null };
}

function rsiRule(historical: BrokerHistoricalPoint[]): RuleVote {
  const closes = historical.map((p) => p.close);
  const rsi = computeRSI(closes, RSI_PERIOD);

  if (rsi === null) {
    return { action: "HOLD", weight: 0, reason: null };
  }

  if (rsi < RSI_OVERSOLD) {
    return {
      action: "BUY",
      weight: Math.min(1, (RSI_OVERSOLD - rsi) / RSI_OVERSOLD),
      reason: `RSI at ${rsi.toFixed(0)}, below ${RSI_OVERSOLD} (oversold signal)`,
    };
  }

  if (rsi > RSI_OVERBOUGHT) {
    return {
      action: "SELL",
      weight: Math.min(1, (rsi - RSI_OVERBOUGHT) / (100 - RSI_OVERBOUGHT)),
      reason: `RSI at ${rsi.toFixed(0)}, above ${RSI_OVERBOUGHT} (overbought signal)`,
    };
  }

  return { action: "HOLD", weight: 0, reason: null };
}

function sectorConcentrationRule(
  holding: EngineHoldingInput,
  sectorValuePct: number | null
): RuleVote {
  if (sectorValuePct === null || holding.sector === null) {
    return { action: "HOLD", weight: 0, reason: null };
  }

  if (sectorValuePct > SECTOR_TARGET_CAP_PCT) {
    const over = sectorValuePct - SECTOR_TARGET_CAP_PCT;
    return {
      action: "SELL",
      weight: Math.min(1, over / SECTOR_TARGET_CAP_PCT),
      reason: `${holding.sector} sector at ${sectorValuePct.toFixed(0)}% of portfolio, above ${SECTOR_TARGET_CAP_PCT}% target cap`,
    };
  }

  return {
    action: "HOLD",
    weight: 0,
    reason: `${holding.sector} sector allocation within target range`,
  };
}

/**
 * Combines rule votes into a single action + confidence score.
 * Each direction (BUY/SELL/HOLD) accumulates the weights of votes for it;
 * the direction with the highest accumulated weight wins. Confidence is
 * that direction's share of total weight cast (falls back to a low neutral
 * confidence when every rule was neutral).
 */
function combineVotes(votes: RuleVote[]): {
  action: RecommendationAction;
  confidence: number;
} {
  const totals: Record<RecommendationAction, number> = {
    BUY: 0,
    SELL: 0,
    HOLD: 0,
  };

  for (const vote of votes) {
    totals[vote.action] += vote.weight;
  }

  const totalWeight = totals.BUY + totals.SELL + totals.HOLD;

  if (totalWeight === 0) {
    return { action: "HOLD", confidence: 0.5 };
  }

  let winner: RecommendationAction = "HOLD";
  if (totals.BUY >= totals.SELL && totals.BUY >= totals.HOLD) {
    winner = "BUY";
  } else if (totals.SELL >= totals.BUY && totals.SELL >= totals.HOLD) {
    winner = "SELL";
  }

  const confidence = totals[winner] / totalWeight;
  // Clamp into [0, 1] and round to 2 decimals for readability.
  const clamped = Math.max(0, Math.min(1, confidence));
  return { action: winner, confidence: Math.round(clamped * 100) / 100 };
}

/**
 * Runs the rule-based engine for a set of holdings, fetching historical
 * data via the provided broker adapter. Returns recommendations without
 * id/status/timestamp - the route layer fills those in when persisting.
 */
export async function generateRecommendations(
  holdings: EngineHoldingInput[],
  adapter: ShareKhanAdapter
): Promise<EngineRecommendation[]> {
  if (holdings.length === 0) return [];

  const totalPortfolioValue = holdings.reduce(
    (sum, h) => sum + h.quantity * h.lastPrice,
    0
  );

  const sectorValueMap = new Map<string, number>();
  for (const h of holdings) {
    if (!h.sector) continue;
    const value = h.quantity * h.lastPrice;
    sectorValueMap.set(h.sector, (sectorValueMap.get(h.sector) ?? 0) + value);
  }

  const results: EngineRecommendation[] = [];

  for (const holding of holdings) {
    const historical = await adapter.fetchHistorical(
      holding.ticker,
      Math.max(MOVING_AVERAGE_WINDOW, RSI_PERIOD) + 5
    );

    const sectorValuePct =
      holding.sector && totalPortfolioValue > 0
        ? ((sectorValueMap.get(holding.sector) ?? 0) / totalPortfolioValue) * 100
        : null;

    const votes: RuleVote[] = [
      movingAverageRule(holding.lastPrice, historical),
      rsiRule(historical),
      sectorConcentrationRule(holding, sectorValuePct),
    ];

    const { action, confidence } = combineVotes(votes);

    const firedReasons = votes
      .filter((v) => v.reason !== null)
      .map((v) => v.reason as string);

    const reason =
      firedReasons.length > 0
        ? firedReasons.join("; ")
        : "No strong signal from moving average, RSI, or sector exposure rules";

    results.push({
      ticker: holding.ticker,
      action,
      confidence,
      reason,
    });
  }

  return results;
}
