export type LinkedAccountStatus = "active" | "paused" | "error";

/**
 * Client-facing view of a linked broker account. The raw API Key / Secure
 * Key are never returned by the API after creation - only this metadata.
 */
export interface LinkedAccountSummary {
  id: string;
  userId: string;
  broker: "sharekhan";
  status: LinkedAccountStatus;
  clientCode: string;
  linkedAt: string;
  lastSyncedAt: string | null;
}

export interface LinkAccountRequest {
  apiKey: string;
  secureKey: string;
  clientCode: string;
}
