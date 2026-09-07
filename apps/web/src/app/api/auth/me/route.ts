import { NextResponse } from "next/server";
import { ApiError } from "@/server/lib/errors";
import { withRoute } from "@/server/handler";
import { requireAuth } from "@/server/auth";
import { findUserById } from "@/server/repositories/usersRepo";

export const GET = withRoute(async (req) => {
  const authUser = requireAuth(req);

  const user = await findUserById(authUser.id);
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }
  return NextResponse.json({ user }, { status: 200 });
});
