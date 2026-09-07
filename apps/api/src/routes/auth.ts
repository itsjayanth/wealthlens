import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { ApiError, errorBody } from "../lib/errors";
import { asyncHandler } from "../lib/asyncHandler";
import { issueAuthTokens } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";
import { createUser, findUserByEmail, findUserById } from "../repositories/usersRepo";

const router = Router();

const SALT_ROUNDS = 10;

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid request body");
    }
    const { email, password, name } = parsed.data;

    const existing = await findUserByEmail(email);
    if (existing) {
      throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({ email, passwordHash, name });
    const tokens = issueAuthTokens(user);

    res.status(201).json({ user, tokens });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid request body");
    }
    const { email, password } = parsed.data;

    const userWithHash = await findUserByEmail(email);
    if (!userWithHash) {
      res.status(401).json(errorBody("Invalid email or password", "INVALID_CREDENTIALS"));
      return;
    }

    const passwordMatches = await bcrypt.compare(password, userWithHash.passwordHash);
    if (!passwordMatches) {
      res.status(401).json(errorBody("Invalid email or password", "INVALID_CREDENTIALS"));
      return;
    }

    const { passwordHash: _passwordHash, ...user } = userWithHash;
    const tokens = issueAuthTokens(user);

    res.status(200).json({ user, tokens });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await findUserById(req.user!.id);
    if (!user) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }
    res.status(200).json({ user });
  })
);

export default router;
