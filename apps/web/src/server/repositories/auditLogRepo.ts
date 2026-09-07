import type { AuditAction, AuditLogEntry } from "@wealthlens/shared";
import { pool } from "../db/pool";

interface AuditLogRow {
  id: string;
  user_id: string;
  recommendation_id: string | null;
  action: AuditAction;
  detail: string;
  created_at: Date;
}

function mapRow(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    recommendationId: row.recommendation_id,
    action: row.action,
    detail: row.detail,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createAuditLogEntry(params: {
  userId: string;
  recommendationId?: string | null;
  action: AuditAction;
  detail: string;
}): Promise<AuditLogEntry> {
  const result = await pool.query<AuditLogRow>(
    `INSERT INTO audit_log (user_id, recommendation_id, action, detail)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, recommendation_id, action, detail, created_at`,
    [params.userId, params.recommendationId ?? null, params.action, params.detail]
  );
  return mapRow(result.rows[0]);
}

export async function listAuditLogForUser(
  userId: string
): Promise<AuditLogEntry[]> {
  const result = await pool.query<AuditLogRow>(
    `SELECT id, user_id, recommendation_id, action, detail, created_at
     FROM audit_log WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map(mapRow);
}
