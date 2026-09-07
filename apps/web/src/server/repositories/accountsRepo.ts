import type { LinkedAccountStatus, LinkedAccountSummary } from "@wealthlens/shared";
import { pool } from "../db/pool";

interface LinkedAccountRow {
  id: string;
  user_id: string;
  broker: "sharekhan";
  status: LinkedAccountStatus;
  client_code: string;
  encrypted_api_key: string;
  encrypted_secure_key: string;
  linked_at: Date;
  last_synced_at: Date | null;
}

export interface LinkedAccountWithSecrets extends LinkedAccountSummary {
  encryptedApiKey: string;
  encryptedSecureKey: string;
}

function mapRow(row: LinkedAccountRow): LinkedAccountSummary {
  return {
    id: row.id,
    userId: row.user_id,
    broker: row.broker,
    status: row.status,
    clientCode: row.client_code,
    linkedAt: row.linked_at.toISOString(),
    lastSyncedAt: row.last_synced_at ? row.last_synced_at.toISOString() : null,
  };
}

function mapRowWithSecrets(row: LinkedAccountRow): LinkedAccountWithSecrets {
  return {
    ...mapRow(row),
    encryptedApiKey: row.encrypted_api_key,
    encryptedSecureKey: row.encrypted_secure_key,
  };
}

export async function createLinkedAccount(params: {
  userId: string;
  clientCode: string;
  encryptedApiKey: string;
  encryptedSecureKey: string;
}): Promise<LinkedAccountSummary> {
  const result = await pool.query<LinkedAccountRow>(
    `INSERT INTO linked_accounts (user_id, client_code, encrypted_api_key, encrypted_secure_key)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, broker, status, client_code, encrypted_api_key, encrypted_secure_key, linked_at, last_synced_at`,
    [params.userId, params.clientCode, params.encryptedApiKey, params.encryptedSecureKey]
  );
  return mapRow(result.rows[0]);
}

export async function listLinkedAccountsForUser(
  userId: string
): Promise<LinkedAccountSummary[]> {
  const result = await pool.query<LinkedAccountRow>(
    `SELECT id, user_id, broker, status, client_code, encrypted_api_key, encrypted_secure_key, linked_at, last_synced_at
     FROM linked_accounts WHERE user_id = $1 ORDER BY linked_at DESC`,
    [userId]
  );
  return result.rows.map(mapRow);
}

/** Returns the most recently linked active account for a user, with decrypted-capable secrets. */
export async function findActiveLinkedAccountForUser(
  userId: string
): Promise<LinkedAccountWithSecrets | null> {
  const result = await pool.query<LinkedAccountRow>(
    `SELECT id, user_id, broker, status, client_code, encrypted_api_key, encrypted_secure_key, linked_at, last_synced_at
     FROM linked_accounts WHERE user_id = $1 AND status = 'active'
     ORDER BY linked_at DESC LIMIT 1`,
    [userId]
  );
  if (result.rows.length === 0) return null;
  return mapRowWithSecrets(result.rows[0]);
}

export async function findLinkedAccountById(
  id: string
): Promise<LinkedAccountSummary | null> {
  const result = await pool.query<LinkedAccountRow>(
    `SELECT id, user_id, broker, status, client_code, encrypted_api_key, encrypted_secure_key, linked_at, last_synced_at
     FROM linked_accounts WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

export async function deleteLinkedAccount(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM linked_accounts WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function touchLastSynced(id: string): Promise<void> {
  await pool.query(
    `UPDATE linked_accounts SET last_synced_at = now() WHERE id = $1`,
    [id]
  );
}
