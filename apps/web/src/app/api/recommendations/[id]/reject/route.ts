import { NextResponse } from "next/server";
import { ApiError } from "@/server/lib/errors";
import { withRoute } from "@/server/handler";
import { requireAuth } from "@/server/auth";
import {
  findRecommendationById,
  updateRecommendationStatus,
} from "@/server/repositories/recommendationsRepo";
import { createAuditLogEntry } from "@/server/repositories/auditLogRepo";

export const POST = withRoute(
  async (req: Request, { params }: { params: { id: string } }) => {
    const authUser = requireAuth(req);

    const existing = await findRecommendationById(params.id);
    if (!existing || existing.userId !== authUser.id) {
      throw new ApiError(404, "NOT_FOUND", "Recommendation not found");
    }
    if (existing.status !== "pending") {
      throw new ApiError(409, "INVALID_STATE", "Recommendation is not pending");
    }

    const recommendation = await updateRecommendationStatus(existing.id, "rejected");

    await createAuditLogEntry({
      userId: authUser.id,
      recommendationId: recommendation.id,
      action: "recommendation_rejected",
      detail: `Rejected ${recommendation.action} recommendation for ${recommendation.ticker}.`,
    });

    return NextResponse.json({ recommendation }, { status: 200 });
  }
);
