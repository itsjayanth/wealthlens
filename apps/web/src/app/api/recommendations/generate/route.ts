import { NextResponse } from "next/server";
import { withRoute } from "@/server/handler";
import { requireAuth } from "@/server/auth";
import { getBrokerAdapter } from "@/server/broker";
import { generateRecommendations } from "@/server/engine/recommendationEngine";
import { listHoldingsForUser } from "@/server/repositories/holdingsRepo";
import {
  createRecommendation,
  findPendingRecommendationByTicker,
} from "@/server/repositories/recommendationsRepo";
import { createAuditLogEntry } from "@/server/repositories/auditLogRepo";

export const POST = withRoute(async (req) => {
  const authUser = requireAuth(req);
  const userId = authUser.id;

  const holdings = await listHoldingsForUser(userId);

  if (holdings.length === 0) {
    return NextResponse.json({ recommendations: [] }, { status: 200 });
  }

  const adapter = getBrokerAdapter();
  const engineInputs = holdings.map((h) => ({
    ticker: h.ticker,
    quantity: h.quantity,
    avgBuyPrice: h.avgBuyPrice,
    lastPrice: h.lastPrice,
    sector: h.sector,
  }));

  const engineResults = await generateRecommendations(engineInputs, adapter);

  const created = [];
  for (const result of engineResults) {
    // Don't duplicate an already-pending recommendation for the same ticker.
    const existingPending = await findPendingRecommendationByTicker(userId, result.ticker);
    if (existingPending) continue;

    const recommendation = await createRecommendation({
      userId,
      ticker: result.ticker,
      action: result.action,
      confidence: result.confidence,
      reason: result.reason,
    });
    created.push(recommendation);

    await createAuditLogEntry({
      userId,
      recommendationId: recommendation.id,
      action: "recommendation_generated",
      detail: `Generated ${recommendation.action} recommendation for ${recommendation.ticker} (confidence ${recommendation.confidence})`,
    });
  }

  return NextResponse.json({ recommendations: created }, { status: 200 });
});
