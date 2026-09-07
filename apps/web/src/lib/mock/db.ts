import type {
  AuditLogEntry,
  Holding,
  LinkedAccountSummary,
  Recommendation,
} from "@wealthlens/shared";

const STORAGE_KEY = "wealthlens_mock_db_v1";

export interface StoredUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "client";
  createdAt: string;
}

export interface DB {
  users: StoredUser[];
  accounts: LinkedAccountSummary[];
  holdings: Record<string, Holding[]>;
  recommendations: Recommendation[];
  auditLog: AuditLogEntry[];
}

export function newId(): string {
  return crypto.randomUUID();
}

const DEMO_USER_ID = "demo-user";
const DEMO_ACCOUNT_ID = "demo-account";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function seedHoldings(): Holding[] {
  const raw: Array<{
    ticker: string;
    exchange: "NSE";
    sector: string;
    quantity: number;
    avgBuyPrice: number;
    lastPrice: number;
    dayChangePct: number;
  }> = [
    { ticker: "TCS", exchange: "NSE", sector: "IT", quantity: 70, avgBuyPrice: 3550, lastPrice: 4020, dayChangePct: 1.8 },
    { ticker: "INFY", exchange: "NSE", sector: "IT", quantity: 100, avgBuyPrice: 1480, lastPrice: 1610, dayChangePct: 0.9 },
    { ticker: "RELIANCE", exchange: "NSE", sector: "Energy", quantity: 80, avgBuyPrice: 2750, lastPrice: 2980, dayChangePct: 1.2 },
    { ticker: "HDFCBANK", exchange: "NSE", sector: "Financials", quantity: 110, avgBuyPrice: 1720, lastPrice: 1630, dayChangePct: -0.6 },
    { ticker: "ICICIBANK", exchange: "NSE", sector: "Financials", quantity: 140, avgBuyPrice: 1080, lastPrice: 1195, dayChangePct: 2.1 },
  ];

  return raw.map((h) => {
    const currentValue = h.quantity * h.lastPrice;
    const invested = h.quantity * h.avgBuyPrice;
    const pnl = currentValue - invested;
    const pnlPct = invested !== 0 ? (pnl / invested) * 100 : 0;

    return {
      id: `demo-holding-${h.ticker.toLowerCase()}`,
      userId: DEMO_USER_ID,
      ticker: h.ticker,
      exchange: h.exchange,
      quantity: h.quantity,
      avgBuyPrice: h.avgBuyPrice,
      lastPrice: h.lastPrice,
      dayChangePct: h.dayChangePct,
      currentValue,
      pnl,
      pnlPct,
      sector: h.sector,
      updatedAt: daysAgo(0),
    };
  });
}

function seedRecommendationsAndAudit(): {
  recommendations: Recommendation[];
  auditLog: AuditLogEntry[];
} {
  const specs: Array<{
    ticker: string;
    action: Recommendation["action"];
    confidence: number;
    reason: string;
    status: Recommendation["status"];
    generatedDaysAgo: number;
    resolvedDaysAgo?: number;
  }> = [
    {
      ticker: "TCS",
      action: "BUY",
      confidence: 0.82,
      reason: "Price crossed above 50-day MA (5.8% above); IT sector allocation within target range",
      status: "pending",
      generatedDaysAgo: 1,
    },
    {
      ticker: "INFY",
      action: "BUY",
      confidence: 0.65,
      reason: "RSI at 28, below 30 (oversold signal); IT sector allocation within target range",
      status: "pending",
      generatedDaysAgo: 1.5,
    },
    {
      ticker: "RELIANCE",
      action: "BUY",
      confidence: 0.71,
      reason: "Price crossed above 50-day MA (6.1% above); Energy sector allocation within target range",
      status: "approved",
      generatedDaysAgo: 4,
      resolvedDaysAgo: 3,
    },
    {
      ticker: "HDFCBANK",
      action: "SELL",
      confidence: 0.58,
      reason: "Price fell below 50-day MA (3.4% below); Financials sector at 33.7% of portfolio, above 30% target cap",
      status: "pending",
      generatedDaysAgo: 2,
    },
    {
      ticker: "ICICIBANK",
      action: "SELL",
      confidence: 0.44,
      reason: "Financials sector at 33.7% of portfolio, above 30% target cap",
      status: "rejected",
      generatedDaysAgo: 5,
      resolvedDaysAgo: 4,
    },
  ];

  const recommendations: Recommendation[] = [];
  const auditLog: AuditLogEntry[] = [];

  specs.forEach((spec, i) => {
    const recommendationId = `demo-rec-${spec.ticker.toLowerCase()}`;
    recommendations.push({
      id: recommendationId,
      userId: DEMO_USER_ID,
      ticker: spec.ticker,
      action: spec.action,
      confidence: spec.confidence,
      reason: spec.reason,
      status: spec.status,
      timestamp: daysAgo(spec.generatedDaysAgo),
    });

    auditLog.push({
      id: `demo-audit-${i}-generated`,
      userId: DEMO_USER_ID,
      recommendationId,
      action: "recommendation_generated",
      detail: `Generated ${spec.action} recommendation for ${spec.ticker} (confidence ${spec.confidence})`,
      createdAt: daysAgo(spec.generatedDaysAgo),
    });

    if (spec.status === "approved") {
      auditLog.push({
        id: `demo-audit-${i}-approved`,
        userId: DEMO_USER_ID,
        recommendationId,
        action: "recommendation_approved",
        detail: `Approved ${spec.action} recommendation for ${spec.ticker}. Trade to be executed manually by the client on Sharekhan (order-routing lands in Phase 3).`,
        createdAt: daysAgo(spec.resolvedDaysAgo ?? spec.generatedDaysAgo),
      });
    } else if (spec.status === "rejected") {
      auditLog.push({
        id: `demo-audit-${i}-rejected`,
        userId: DEMO_USER_ID,
        recommendationId,
        action: "recommendation_rejected",
        detail: `Rejected ${spec.action} recommendation for ${spec.ticker}.`,
        createdAt: daysAgo(spec.resolvedDaysAgo ?? spec.generatedDaysAgo),
      });
    }
  });

  return { recommendations, auditLog };
}

export function seedDB(): DB {
  const demoUser: StoredUser = {
    id: DEMO_USER_ID,
    email: "demo@wealthlens.app",
    password: "Demo@1234",
    name: "Demo Investor",
    role: "client",
    createdAt: daysAgo(14),
  };

  const demoAccount: LinkedAccountSummary = {
    id: DEMO_ACCOUNT_ID,
    userId: DEMO_USER_ID,
    broker: "sharekhan",
    status: "active",
    clientCode: "DEMO001",
    linkedAt: daysAgo(6),
    lastSyncedAt: daysAgo(0),
  };

  const { recommendations, auditLog } = seedRecommendationsAndAudit();

  return {
    users: [demoUser],
    accounts: [demoAccount],
    holdings: { [DEMO_USER_ID]: seedHoldings() },
    recommendations,
    auditLog,
  };
}

export function loadDB(): DB {
  if (typeof window === "undefined") {
    return seedDB();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedDB();
      saveDB(seeded);
      return seeded;
    }
    return JSON.parse(raw) as DB;
  } catch {
    const seeded = seedDB();
    saveDB(seeded);
    return seeded;
  }
}

export function saveDB(db: DB): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - ignore.
  }
}
