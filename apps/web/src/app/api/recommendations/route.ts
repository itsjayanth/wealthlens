import { NextResponse } from "next/server";
import { z } from "zod";
import type { RecommendationStatus } from "@wealthlens/shared";
import { ApiError } from "@/server/lib/errors";
import { withRoute } from "@/server/handler";
import { requireAuth } from "@/server/auth";
import { listRecommendationsForUser } from "@/server/repositories/recommendationsRepo";

const statusQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const GET = withRoute(async (req) => {
  const authUser = requireAuth(req);

  const { searchParams } = new URL(req.url);
  const parsed = statusQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
  });
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid status query parameter");
  }

  const recommendations = await listRecommendationsForUser(
    authUser.id,
    parsed.data.status as RecommendationStatus | undefined
  );
  return NextResponse.json({ recommendations }, { status: 200 });
});
