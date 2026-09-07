import { NextResponse } from "next/server";
import { withRoute } from "@/server/handler";
import { requireAuth } from "@/server/auth";
import { listAuditLogForUser } from "@/server/repositories/auditLogRepo";

export const GET = withRoute(async (req) => {
  const authUser = requireAuth(req);
  const entries = await listAuditLogForUser(authUser.id);
  return NextResponse.json({ entries }, { status: 200 });
});
