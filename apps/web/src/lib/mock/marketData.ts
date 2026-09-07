export interface BrokerHolding {
  ticker: string;
  exchange: "NSE" | "BSE";
  quantity: number;
  avgBuyPrice: number;
  lastPrice: number;
  sector: string | null;
}

export interface BrokerQuote {
  ticker: string;
  lastPrice: number;
  dayChangePct: number;
}

export interface BrokerHistoricalPoint {
  date: string;
  close: number;
}

/**
 * Small fixed universe of NSE tickers used to generate deterministic-but-
 * randomized fake data for the demo, mirroring the real backend's Phase-1
 * mock adapter. "Deterministic" here means: given the same ticker, the
 * seeded PRNG always produces the same base price / sector / historical
 * curve, so the mock behaves consistently across calls rather than being
 * pure noise.
 */
const TICKER_UNIVERSE: Array<{
  ticker: string;
  sector: string;
  basePrice: number;
}> = [
  { ticker: "TCS", sector: "IT", basePrice: 3800 },
  { ticker: "INFY", sector: "IT", basePrice: 1550 },
  { ticker: "RELIANCE", sector: "Energy", basePrice: 2900 },
  { ticker: "HDFCBANK", sector: "Financials", basePrice: 1650 },
  { ticker: "ICICIBANK", sector: "Financials", basePrice: 1150 },
];

/** Simple string hash -> 32-bit int, used to seed the PRNG per ticker. */
function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32 seeded PRNG - deterministic given the same seed. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function findTicker(ticker: string) {
  const entry = TICKER_UNIVERSE.find(
    (t) => t.ticker.toUpperCase() === ticker.toUpperCase()
  );
  if (entry) return entry;
  // Unknown ticker (e.g. watchlist symbol not in the fixed universe): derive
  // a plausible synthetic base price so the mock still returns *something*.
  const seed = hashString(ticker);
  const rand = mulberry32(seed);
  return {
    ticker: ticker.toUpperCase(),
    sector: "Diversified",
    basePrice: 500 + rand() * 2500,
  };
}

function seededLastPrice(ticker: string, basePrice: number): number {
  const rand = mulberry32(hashString(ticker + ":lastPrice"));
  // +/- 8% jitter around the base price
  const jitter = 1 + (rand() - 0.5) * 0.16;
  return Math.round(basePrice * jitter * 100) / 100;
}

/**
 * Phase-1-equivalent mock: every linked client is simulated as holding a
 * subset of the fixed ticker universe. Quantities/avg buy prices are seeded
 * off the client code so a given client sees stable holdings across calls.
 */
export function fetchHoldings(clientCode: string): BrokerHolding[] {
  const seedBase = hashString(clientCode || "default");
  const rand = mulberry32(seedBase);

  return TICKER_UNIVERSE.map((entry, idx) => {
    const tickerRand = mulberry32(seedBase + idx * 7919);
    const quantity = Math.max(1, Math.round(5 + tickerRand() * 45));
    const avgBuyPrice =
      Math.round(entry.basePrice * (0.85 + rand() * 0.2) * 100) / 100;
    const lastPrice = seededLastPrice(entry.ticker, entry.basePrice);

    return {
      ticker: entry.ticker,
      exchange: "NSE" as const,
      quantity,
      avgBuyPrice,
      lastPrice,
      sector: entry.sector,
    };
  });
}

export function fetchQuote(ticker: string): BrokerQuote {
  const entry = findTicker(ticker);
  const lastPrice = seededLastPrice(entry.ticker, entry.basePrice);
  const rand = mulberry32(hashString(ticker + ":dayChange"));
  const dayChangePct = Math.round((rand() - 0.5) * 6 * 100) / 100; // +/-3%

  return {
    ticker: entry.ticker,
    lastPrice,
    dayChangePct,
  };
}

export function fetchHistorical(
  ticker: string,
  days: number
): BrokerHistoricalPoint[] {
  const entry = findTicker(ticker);
  const rand = mulberry32(hashString(ticker + ":historical"));

  const points: BrokerHistoricalPoint[] = [];
  let price = entry.basePrice * (0.9 + rand() * 0.2);
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    // Small daily drift + noise, seeded deterministically per ticker.
    const drift = (rand() - 0.48) * 0.02; // slight upward bias on average
    price = Math.max(1, price * (1 + drift));

    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - i);

    points.push({
      date: date.toISOString().slice(0, 10),
      close: Math.round(price * 100) / 100,
    });
  }

  return points;
}
