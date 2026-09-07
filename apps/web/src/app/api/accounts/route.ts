import { NextResponse } from "next/server";
import { withRoute } from "@/server/handler";
import { requireAuth } from "@/server/auth";
import { listLinkedAccountsForUser } from "@/server/repositories/accountsRepo";

export const GET = withRoute(async (req) => {
  const authUser = requireAuth(req);
  const accounts = await listLinkedAccountsForUser(authUser.id);
  return NextResponse.json({ accounts }, { status: 200 });
});
