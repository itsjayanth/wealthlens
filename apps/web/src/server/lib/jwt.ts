import jwt from "jsonwebtoken";
import type { AuthTokens, User } from "@wealthlens/shared";

/**
 * Parses a duration string as accepted by JWT_EXPIRES_IN (e.g. "7d", "12h",
 * "3600s", or a bare number of seconds) into a number of seconds, for the
 * AuthTokens.expiresIn field (which is numeric per packages/shared).
 */
function parseDurationToSeconds(input: string): number {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(trimmed);
  if (!match) {
    throw new Error(`Unsupported JWT_EXPIRES_IN format: "${input}"`);
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };
  return value * multipliers[unit];
}

export function issueAuthTokens(user: User): AuthTokens {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  const expiresInRaw = process.env.JWT_EXPIRES_IN || "7d";
  const expiresInSeconds = parseDurationToSeconds(expiresInRaw);

  const accessToken = jwt.sign({ sub: user.id, role: user.role }, secret, {
    expiresIn: expiresInSeconds,
  });

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: expiresInSeconds,
  };
}
