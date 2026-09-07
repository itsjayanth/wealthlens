import { Router } from "express";
import type { Holding, PortfolioSummary } from "@wealthlens/shared";
import { ApiError } from "../lib/errors";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { decrypt } from "../lib/crypto";
import { getBrokerAdapter } from "../broker";
import {
  findActiveLinkedAccountForUser,
  touchLastSynced,
} from "../repositories/accountsRepo";
import { upsertHoldings } from "../repositories/holdingsRepo";

const router = Router();

function buildPortfolioSummary(holdings: Holding[]): PortfolioSummary {
  const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.quantity * h.avgBuyPrice, 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct = totalInvested !== 0 ? (totalPnl / totalInvested) * 100 : 0;

  const sectorValues = new Map<string, number>();
  for (const h of holdings) {
    const sector = h.sector ?? "Unclassified";
    sectorValues.set(sector, (sectorValues.get(sector) ?? 0) + h.currentValue);
  }

  const allocation = Array.from(sectorValues.entries()).map(([sector, value]) => ({
    sector,
    valuePct: totalCurrentValue !== 0 ? Math.round((value / totalCurrentValue) * 10000) / 100 : 0,
  }));

  return {
    totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    totalPnlPct: Math.round(totalPnlPct * 100) / 100,
    holdings,
    allocation,
  };
}

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const linkedAccount = await findActiveLinkedAccountForUser(userId);
    if (!linkedAccount) {
      throw new ApiError(
        404,
        "NO_LINKED_ACCOUNT",
        "No active linked broker account found. Link a Sharekhan account first."
      );
    }

    const adapter = getBrokerAdapter();
    const credentials = {
      apiKey: decrypt(linkedAccount.encryptedApiKey),
      secureKey: decrypt(linkedAccount.encryptedSecureKey),
      clientCode: linkedAccount.clientCode,
    };

    const brokerHoldings = await adapter.fetchHoldings(credentials);

    // Enrich with live day-change % from quotes, then upsert into the cache table.
    const holdings = await upsertHoldings(userId, brokerHoldings);
    const withDayChange = await Promise.all(
      holdings.map(async (h) => {
        const quote = await adapter.fetchQuote(h.ticker);
        return { ...h, dayChangePct: quote.dayChangePct };
      })
    );

    await touchLastSynced(linkedAccount.id);

    const portfolio = buildPortfolioSummary(withDayChange);

    res.status(200).json({ portfolio });
  })
);

export default router;
