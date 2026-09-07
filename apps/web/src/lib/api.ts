import type {
  AuditLogEntry,
  AuthTokens,
  LinkAccountRequest,
  LinkedAccountSummary,
  PortfolioSummary,
  Recommendation,
  RecommendationStatus,
  User,
} from "@wealthlens/shared";
import { getToken } from "./auth";
import { loadDB, newId, saveDB, type StoredUser } from "./mock/db";
import { fetchHoldings, fetchQuote, fetchHistorical } from "./mock/marketData";
import { generateRecommendations as runRecommendationEngine } from "./mock/recommendationEngine";

export interface ApiErrorShape {
  message: string;
  code: string;
}

/** Typed error thrown by the mock data layer for any non-2xx-equivalent result. */
export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, error: ApiErrorShape) {
    super(error.message);
    this.name = "ApiError";
    this.status = status;
    this.code = error.code;
  }
}

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 250));
}

function toUser(stored: StoredUser): User {
  const { password: _password, ...user } = stored;
  return user;
}

function currentUserId(): string {
  const id = getToken();
  if (!id) {
    throw new ApiError(401, {
      message: "Missing or invalid Authorization header",
      code: "UNAUTHORIZED",
    });
  }
  return id;
}

function issueTokens(userId: string): AuthTokens {
  return { accessToken: userId, tokenType: "Bearer", expiresIn: 604800 };
}

// ---- Auth ----

export async function signup(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  await delay();
  const db = loadDB();

  if (db.users.some((u) => u.email === input.email)) {
    throw new ApiError(409, {
      message: "An account with this email already exists",
      code: "EMAIL_TAKEN",
    });
  }

  const stored: StoredUser = {
    id: newId(),
    email: input.email,
    password: input.password,
    name: input.name,
    role: "client",
    createdAt: new Date().toISOString(),
  };
  db.users.push(stored);
  saveDB(db);

  return { user: toUser(stored), tokens: issueTokens(stored.id) };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  await delay();
  const db = loadDB();

  const stored = db.users.find((u) => u.email === input.email);
  if (!stored || stored.password !== input.password) {
    throw new ApiError(401, {
      message: "Invalid email or password",
      code: "INVALID_CREDENTIALS",
    });
  }

  return { user: toUser(stored), tokens: issueTokens(stored.id) };
}

export async function me(): Promise<{ user: User }> {
  await delay();
  const uid = currentUserId();
  const db = loadDB();
  const stored = db.users.find((u) => u.id === uid);
  if (!stored) {
    throw new ApiError(404, { message: "User not found", code: "NOT_FOUND" });
  }
  return { user: toUser(stored) };
}

// ---- Linked accounts ----

export async function linkAccount(
  input: LinkAccountRequest
): Promise<{ account: LinkedAccountSummary }> {
  await delay();
  const uid = currentUserId();
  const db = loadDB();

  // apiKey/secureKey are intentionally discarded here - never stored, matching
  // the real app's "never shown again after linking" promise.
  db.accounts = db.accounts.filter((a) => a.userId !== uid);

  const account: LinkedAccountSummary = {
    id: newId(),
    userId: uid,
    broker: "sharekhan",
    status: "active",
    clientCode: input.clientCode,
    linkedAt: new Date().toISOString(),
    lastSyncedAt: null,
  };
  db.accounts.push(account);
  saveDB(db);

  return { account };
}

export async function listAccounts(): Promise<{ accounts: LinkedAccountSummary[] }> {
  await delay();
  const uid = currentUserId();
  const db = loadDB();
  return { accounts: db.accounts.filter((a) => a.userId === uid) };
}

// ---- Portfolio ----

function buildPortfolioSummary(holdings: PortfolioSummary["holdings"]): PortfolioSummary {
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

export async function getPortfolio(): Promise<{ portfolio: PortfolioSummary }> {
  await delay();
  const uid = currentUserId();
  const db = loadDB();

  const account = db.accounts.find((a) => a.userId === uid && a.status === "active");
  if (!account) {
    throw new ApiError(404, {
      message: "No active linked broker account found. Link a Sharekhan account first.",
      code: "NO_LINKED_ACCOUNT",
    });
  }

  let holdings = db.holdings[uid];

  if (account.clientCode === "DEMO001" && holdings?.length) {
    holdings = holdings.map((h) => ({
      ...h,
      dayChangePct: fetchQuote(h.ticker).dayChangePct,
    }));
  } else {
    const brokerHoldings = fetchHoldings(account.clientCode);
    holdings = brokerHoldings.map((h) => {
      const currentValue = h.quantity * h.lastPrice;
      const invested = h.quantity * h.avgBuyPrice;
      const pnl = currentValue - invested;
      const pnlPct = invested !== 0 ? (pnl / invested) * 100 : 0;
      const quote = fetchQuote(h.ticker);

      return {
        id: `${uid}-${h.ticker}`,
        userId: uid,
        ticker: h.ticker,
        exchange: h.exchange,
        quantity: h.quantity,
        avgBuyPrice: h.avgBuyPrice,
        lastPrice: h.lastPrice,
        dayChangePct: quote.dayChangePct,
        currentValue,
        pnl,
        pnlPct,
        sector: h.sector,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  db.holdings[uid] = holdings;
  saveDB(db);

  return { portfolio: buildPortfolioSummary(holdings) };
}

// ---- Recommendations ----

export async function listRecommendations(
  status?: RecommendationStatus
): Promise<{ recommendations: Recommendation[] }> {
  await delay();
  const uid = currentUserId();
  const db = loadDB();

  const recommendations = db.recommendations
    .filter((r) => r.userId === uid && (!status || r.status === status))
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  return { recommendations };
}

export async function generateRecommendations(): Promise<{
  recommendations: Recommendation[];
}> {
  await delay();
  const uid = currentUserId();
  const db = loadDB();

  const holdings = db.holdings[uid] ?? [];
  if (holdings.length === 0) {
    return { recommendations: [] };
  }

  const engineInputs = holdings.map((h) => ({
    ticker: h.ticker,
    quantity: h.quantity,
    avgBuyPrice: h.avgBuyPrice,
    lastPrice: h.lastPrice,
    sector: h.sector,
  }));

  const engineResults = runRecommendationEngine(engineInputs, fetchHistorical);

  const created: Recommendation[] = [];
  for (const result of engineResults) {
    const existingPending = db.recommendations.find(
      (r) => r.userId === uid && r.ticker === result.ticker && r.status === "pending"
    );
    if (existingPending) continue;

    const recommendation: Recommendation = {
      id: newId(),
      userId: uid,
      ticker: result.ticker,
      action: result.action,
      confidence: result.confidence,
      reason: result.reason,
      status: "pending",
      timestamp: new Date().toISOString(),
    };
    db.recommendations.push(recommendation);
    created.push(recommendation);

    db.auditLog.push({
      id: newId(),
      userId: uid,
      recommendationId: recommendation.id,
      action: "recommendation_generated",
      detail: `Generated ${recommendation.action} recommendation for ${recommendation.ticker} (confidence ${recommendation.confidence})`,
      createdAt: new Date().toISOString(),
    });
  }

  saveDB(db);
  return { recommendations: created };
}

function resolveRecommendation(
  id: string,
  nextStatus: "approved" | "rejected"
): { recommendation: Recommendation } {
  const uid = currentUserId();
  const db = loadDB();

  const existing = db.recommendations.find((r) => r.id === id);
  if (!existing || existing.userId !== uid) {
    throw new ApiError(404, { message: "Recommendation not found", code: "NOT_FOUND" });
  }
  if (existing.status !== "pending") {
    throw new ApiError(409, { message: "Recommendation is not pending", code: "INVALID_STATE" });
  }

  existing.status = nextStatus;

  const detail =
    nextStatus === "approved"
      ? `Approved ${existing.action} recommendation for ${existing.ticker}. Trade to be executed manually by the client on Sharekhan (order-routing lands in Phase 3).`
      : `Rejected ${existing.action} recommendation for ${existing.ticker}.`;

  db.auditLog.push({
    id: newId(),
    userId: uid,
    recommendationId: existing.id,
    action: nextStatus === "approved" ? "recommendation_approved" : "recommendation_rejected",
    detail,
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  return { recommendation: existing };
}

export async function approveRecommendation(
  id: string
): Promise<{ recommendation: Recommendation }> {
  await delay();
  return resolveRecommendation(id, "approved");
}

export async function rejectRecommendation(
  id: string
): Promise<{ recommendation: Recommendation }> {
  await delay();
  return resolveRecommendation(id, "rejected");
}

// ---- Audit log ----

export async function getAuditLog(): Promise<{ entries: AuditLogEntry[] }> {
  await delay();
  const uid = currentUserId();
  const db = loadDB();

  const entries = db.auditLog
    .filter((e) => e.userId === uid)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return { entries };
}
