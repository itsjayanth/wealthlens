import type {
  Recommendation,
  RecommendationAction,
  RecommendationStatus,
} from "@wealthlens/shared";
import { pool } from "../db/pool";

interface RecommendationRow {
  id: string;
  user_id: string;
  ticker: string;
  action: RecommendationAction;
  confidence: string;
  reason: string;
  status: RecommendationStatus;
  timestamp: Date;
}

function mapRow(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    userId: row.user_id,
    ticker: row.ticker,
    action: row.action,
    confidence: Number(row.confidence),
    reason: row.reason,
    status: row.status,
    timestamp: row.timestamp.toISOString(),
  };
}

export async function listRecommendationsForUser(
  userId: string,
  status?: RecommendationStatus
): Promise<Recommendation[]> {
  if (status) {
    const result = await pool.query<RecommendationRow>(
      `SELECT id, user_id, ticker, action, confidence, reason, status, "timestamp"
       FROM recommendations WHERE user_id = $1 AND status = $2
       ORDER BY "timestamp" DESC`,
      [userId, status]
    );
    return result.rows.map(mapRow);
  }

  const result = await pool.query<RecommendationRow>(
    `SELECT id, user_id, ticker, action, confidence, reason, status, "timestamp"
     FROM recommendations WHERE user_id = $1
     ORDER BY "timestamp" DESC`,
    [userId]
  );
  return result.rows.map(mapRow);
}

export async function findPendingRecommendationByTicker(
  userId: string,
  ticker: string
): Promise<Recommendation | null> {
  const result = await pool.query<RecommendationRow>(
    `SELECT id, user_id, ticker, action, confidence, reason, status, "timestamp"
     FROM recommendations
     WHERE user_id = $1 AND ticker = $2 AND status = 'pending'
     LIMIT 1`,
    [userId, ticker]
  );
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

export async function createRecommendation(params: {
  userId: string;
  ticker: string;
  action: RecommendationAction;
  confidence: number;
  reason: string;
}): Promise<Recommendation> {
  const result = await pool.query<RecommendationRow>(
    `INSERT INTO recommendations (user_id, ticker, action, confidence, reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, ticker, action, confidence, reason, status, "timestamp"`,
    [params.userId, params.ticker, params.action, params.confidence, params.reason]
  );
  return mapRow(result.rows[0]);
}

export async function findRecommendationById(
  id: string
): Promise<Recommendation | null> {
  const result = await pool.query<RecommendationRow>(
    `SELECT id, user_id, ticker, action, confidence, reason, status, "timestamp"
     FROM recommendations WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

export async function updateRecommendationStatus(
  id: string,
  status: RecommendationStatus
): Promise<Recommendation> {
  const result = await pool.query<RecommendationRow>(
    `UPDATE recommendations SET status = $2 WHERE id = $1
     RETURNING id, user_id, ticker, action, confidence, reason, status, "timestamp"`,
    [id, status]
  );
  return mapRow(result.rows[0]);
}
