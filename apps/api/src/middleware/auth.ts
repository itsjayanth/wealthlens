import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@wealthlens/shared";
import { errorBody } from "../lib/errors";

interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json(errorBody("Missing or invalid Authorization header", "UNAUTHORIZED"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json(errorBody("Server auth misconfiguration", "SERVER_ERROR"));
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as AccessTokenPayload;
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    res.status(401).json(errorBody("Invalid or expired token", "UNAUTHORIZED"));
  }
}
