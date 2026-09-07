import type { Holding } from "@wealthlens/shared";
import { pool } from "../db/pool";
import type { BrokerHolding } from "../broker";

interface HoldingRow {
  id: string;
  user_id: string;
  ticker: string;
  exchange: "NSE" | "BSE";
  quantity: string;
  avg_buy_price: string;
  last_price: string;
  sector: string | null;
  updated_at: Date;
}

/** Maps a DB row to the shared Holding type, computing derived P&L fields. */
function mapRow(row: HoldingRow): Holding {
  const quantity = Number(row.quantity);
  const avgBuyPrice = Number(row.avg_buy_price);
  const lastPrice = Number(row.last_price);

  const currentValue = quantity * lastPrice;
  const invested = quantity * avgBuyPrice;
  const pnl = currentValue - invested;
  const pnlPct = invested !== 0 ? (pnl / invested) * 100 : 0;

  return {
    id: row.id,
    userId: row.user_id,
    ticker: row.ticker,
    exchange: row.exchange,
    quantity,
    avgBuyPrice,
    lastPrice,
    dayChangePct: 0, // set by the caller from live quote data when available
    currentValue,
    pnl,
    pnlPct,
    sector: row.sector,
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listHoldingsForUser(userId: string): Promise<Holding[]> {
  const result = await pool.query<HoldingRow>(
    `SELECT id, user_id, ticker, exchange, quantity, avg_buy_price, last_price, sector, updated_at
     FROM holdings WHERE user_id = $1 ORDER BY ticker ASC`,
    [userId]
  );
  return result.rows.map(mapRow);
}

/**
 * Upserts a broker-fetched holding into the cache table, keyed on
 * (user_id, ticker) per the schema's unique constraint.
 */
export async function upsertHolding(
  userId: string,
  holding: BrokerHolding
): Promise<Holding> {
  const result = await pool.query<HoldingRow>(
    `INSERT INTO holdings (user_id, ticker, exchange, quantity, avg_buy_price, last_price, sector, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (user_id, ticker)
     DO UPDATE SET
       exchange = EXCLUDED.exchange,
       quantity = EXCLUDED.quantity,
       avg_buy_price = EXCLUDED.avg_buy_price,
       last_price = EXCLUDED.last_price,
       sector = EXCLUDED.sector,
       updated_at = now()
     RETURNING id, user_id, ticker, exchange, quantity, avg_buy_price, last_price, sector, updated_at`,
    [
      userId,
      holding.ticker,
      holding.exchange,
      holding.quantity,
      holding.avgBuyPrice,
      holding.lastPrice,
      holding.sector,
    ]
  );
  return mapRow(result.rows[0]);
}

export async function upsertHoldings(
  userId: string,
  holdings: BrokerHolding[]
): Promise<Holding[]> {
  const results: Holding[] = [];
  for (const holding of holdings) {
    results.push(await upsertHolding(userId, holding));
  }
  return results;
}
