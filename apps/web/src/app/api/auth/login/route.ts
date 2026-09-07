import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError, errorBody } from "@/server/lib/errors";
import { withRoute } from "@/server/handler";
import { issueAuthTokens } from "@/server/lib/jwt";
import { findUserByEmail } from "@/server/repositories/usersRepo";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = withRoute(async (req) => {
  const body = await req.json().catch(() => undefined);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid request body"
    );
  }
  const { email, password } = parsed.data;

  const userWithHash = await findUserByEmail(email);
  if (!userWithHash) {
    return NextResponse.json(
      errorBody("Invalid email or password", "INVALID_CREDENTIALS"),
      { status: 401 }
    );
  }

  const passwordMatches = await bcrypt.compare(password, userWithHash.passwordHash);
  if (!passwordMatches) {
    return NextResponse.json(
      errorBody("Invalid email or password", "INVALID_CREDENTIALS"),
      { status: 401 }
    );
  }

  const { passwordHash: _passwordHash, ...user } = userWithHash;
  const tokens = issueAuthTokens(user);

  return NextResponse.json({ user, tokens }, { status: 200 });
});
