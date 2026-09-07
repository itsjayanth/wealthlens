import { Router } from "express";
import { z } from "zod";
import type { RecommendationStatus } from "@wealthlens/shared";
import { ApiError } from "../lib/errors";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { getBrokerAdapter } from "../broker";
import { generateRecommendations } from "../engine/recommendationEngine";
import { listHoldingsForUser } from "../repositories/holdingsRepo";
import {
  createRecommendation,
  findPendingRecommendationByTicker,
  findRecommendationById,
  listRecommendationsForUser,
  updateRecommendationStatus,
} from "../repositories/recommendationsRepo";
import { createAuditLogEntry } from "../repositories/auditLogRepo";

const router = Router();

const statusQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = statusQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid status query parameter");
    }

    const recommendations = await listRecommendationsForUser(
      req.user!.id,
      parsed.data.status as RecommendationStatus | undefined
    );
    res.status(200).json({ recommendations });
  })
);

router.post(
  "/generate",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const holdings = await listHoldingsForUser(userId);

    if (holdings.length === 0) {
      res.status(200).json({ recommendations: [] });
      return;
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

    res.status(200).json({ recommendations: created });
  })
);

router.post(
  "/:id/approve",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await findRecommendationById(req.params.id);
    if (!existing || existing.userId !== req.user!.id) {
      throw new ApiError(404, "NOT_FOUND", "Recommendation not found");
    }
    if (existing.status !== "pending") {
      throw new ApiError(409, "INVALID_STATE", "Recommendation is not pending");
    }

    const recommendation = await updateRecommendationStatus(existing.id, "approved");

    await createAuditLogEntry({
      userId: req.user!.id,
      recommendationId: recommendation.id,
      action: "recommendation_approved",
      detail: `Approved ${recommendation.action} recommendation for ${recommendation.ticker}. Trade to be executed manually by the client on Sharekhan (order-routing lands in Phase 3).`,
    });

    res.status(200).json({ recommendation });
  })
);

router.post(
  "/:id/reject",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await findRecommendationById(req.params.id);
    if (!existing || existing.userId !== req.user!.id) {
      throw new ApiError(404, "NOT_FOUND", "Recommendation not found");
    }
    if (existing.status !== "pending") {
      throw new ApiError(409, "INVALID_STATE", "Recommendation is not pending");
    }

    const recommendation = await updateRecommendationStatus(existing.id, "rejected");

    await createAuditLogEntry({
      userId: req.user!.id,
      recommendationId: recommendation.id,
      action: "recommendation_rejected",
      detail: `Rejected ${recommendation.action} recommendation for ${recommendation.ticker}.`,
    });

    res.status(200).json({ recommendation });
  })
);

export default router;
