import jwt from "jsonwebtoken";
import type { UserRole } from "@wealthlens/shared";
import { ApiError } from "./lib/errors";

interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

/**
 * Verifies the Authorization header on a Next.js Route Handler's Request
 * (or NextRequest) and returns the decoded { id, role }. Throws ApiError(401)
 * on any failure - callers should let it propagate to withRoute, which turns
 * it into the standard error response shape.
 */
export function requireAuth(req: Request): AuthenticatedUser {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid Authorization header");
  }

  const token = header.slice("Bearer ".length).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, "SERVER_ERROR", "Server auth misconfiguration");
  }

  try {
    const decoded = jwt.verify(token, secret) as AccessTokenPayload;
    return { id: decoded.sub, role: decoded.role };
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}
