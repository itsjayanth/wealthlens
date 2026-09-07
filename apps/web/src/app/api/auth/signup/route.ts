import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError } from "@/server/lib/errors";
import { withRoute } from "@/server/handler";
import { issueAuthTokens } from "@/server/lib/jwt";
import { createUser, findUserByEmail } from "@/server/repositories/usersRepo";

const SALT_ROUNDS = 10;

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1),
});

export const POST = withRoute(async (req) => {
  const body = await req.json().catch(() => undefined);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid request body"
    );
  }
  const { email, password, name } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ email, passwordHash, name });
  const tokens = issueAuthTokens(user);

  return NextResponse.json({ user, tokens }, { status: 201 });
});
