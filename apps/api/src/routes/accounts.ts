import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { encrypt } from "../lib/crypto";
import {
  createLinkedAccount,
  deleteLinkedAccount,
  findLinkedAccountById,
  listLinkedAccountsForUser,
} from "../repositories/accountsRepo";

const router = Router();

const linkAccountSchema = z.object({
  apiKey: z.string().min(1),
  secureKey: z.string().min(1),
  clientCode: z.string().min(1),
});

router.post(
  "/link",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = linkAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid request body");
    }
    const { apiKey, secureKey, clientCode } = parsed.data;

    const account = await createLinkedAccount({
      userId: req.user!.id,
      clientCode,
      encryptedApiKey: encrypt(apiKey),
      encryptedSecureKey: encrypt(secureKey),
    });

    res.status(201).json({ account });
  })
);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const accounts = await listLinkedAccountsForUser(req.user!.id);
    res.status(200).json({ accounts });
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const account = await findLinkedAccountById(req.params.id);
    if (!account || account.userId !== req.user!.id) {
      throw new ApiError(404, "NOT_FOUND", "Linked account not found");
    }

    await deleteLinkedAccount(account.id);
    res.status(204).send();
  })
);

export default router;
