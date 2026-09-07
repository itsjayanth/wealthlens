export type RecommendationAction = "BUY" | "SELL" | "HOLD";

export type RecommendationStatus = "pending" | "approved" | "rejected";

export interface Recommendation {
  id: string;
  userId: string;
  ticker: string;
  action: RecommendationAction;
  confidence: number;
  reason: string;
  status: RecommendationStatus;
  timestamp: string;
}

export type AuditAction =
  | "recommendation_generated"
  | "recommendation_approved"
  | "recommendation_rejected";

export interface AuditLogEntry {
  id: string;
  userId: string;
  recommendationId: string | null;
  action: AuditAction;
  detail: string;
  createdAt: string;
}
