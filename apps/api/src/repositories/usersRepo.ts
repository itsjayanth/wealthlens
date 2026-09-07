import type { User, UserRole } from "@wealthlens/shared";
import { pool } from "../db/pool";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: Date;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}

export interface UserWithPasswordHash extends User {
  passwordHash: string;
}

function mapRowWithHash(row: UserRow): UserWithPasswordHash {
  return {
    ...mapRow(row),
    passwordHash: row.password_hash,
  };
}

export async function createUser(params: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<User> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, password_hash, name, role, created_at`,
    [params.email.toLowerCase(), params.passwordHash, params.name]
  );
  return mapRow(result.rows[0]);
}

export async function findUserByEmail(
  email: string
): Promise<UserWithPasswordHash | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, email, password_hash, name, role, created_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  if (result.rows.length === 0) return null;
  return mapRowWithHash(result.rows[0]);
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, email, password_hash, name, role, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}
