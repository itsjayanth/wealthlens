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

// The API now lives at /api/... in this same Next.js app (both in dev and
// prod), so same-origin (empty base URL) is the correct default. The env var
// remains as an optional override for pointing at an external API later.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export interface ApiErrorShape {
  message: string;
  code: string;
}

/** Typed error thrown by the fetch client for any non-2xx response. */
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

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE" | "PATCH" | "PUT";
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(0, {
      message: "Could not reach the WealthLens server. Please try again.",
      code: "network_error",
    });
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const parsed = json as { error?: ApiErrorShape } | undefined;
    const errorShape: ApiErrorShape = parsed?.error ?? {
      message: `Request failed with status ${res.status}`,
      code: "unknown_error",
    };
    throw new ApiError(res.status, errorShape);
  }

  return json as T;
}

// ---- Auth ----

export function signup(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  return request("/api/auth/signup", { method: "POST", body: input, auth: false });
}

export function login(input: {
  email: string;
  password: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  return request("/api/auth/login", { method: "POST", body: input, auth: false });
}

export function me(): Promise<{ user: User }> {
  return request("/api/auth/me");
}

// ---- Linked accounts ----

export function linkAccount(
  input: LinkAccountRequest
): Promise<{ account: LinkedAccountSummary }> {
  return request("/api/accounts/link", { method: "POST", body: input });
}

export function listAccounts(): Promise<{ accounts: LinkedAccountSummary[] }> {
  return request("/api/accounts");
}

// ---- Portfolio ----

export function getPortfolio(): Promise<{ portfolio: PortfolioSummary }> {
  return request("/api/portfolio");
}

// ---- Recommendations ----

export function listRecommendations(
  status?: RecommendationStatus
): Promise<{ recommendations: Recommendation[] }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return request(`/api/recommendations${qs}`);
}

export function generateRecommendations(): Promise<{
  recommendations: Recommendation[];
}> {
  return request("/api/recommendations/generate", { method: "POST" });
}

export function approveRecommendation(
  id: string
): Promise<{ recommendation: Recommendation }> {
  return request(`/api/recommendations/${id}/approve`, { method: "POST" });
}

export function rejectRecommendation(
  id: string
): Promise<{ recommendation: Recommendation }> {
  return request(`/api/recommendations/${id}/reject`, { method: "POST" });
}

// ---- Audit log ----

export function getAuditLog(): Promise<{ entries: AuditLogEntry[] }> {
  return request("/api/audit-log");
}
