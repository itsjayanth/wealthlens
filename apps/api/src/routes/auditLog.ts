import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { listAuditLogForUser } from "../repositories/auditLogRepo";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const entries = await listAuditLogForUser(req.user!.id);
    res.status(200).json({ entries });
  })
);

export default router;
