import type { ShareKhanAdapter } from "./ShareKhanAdapter";
import { MockShareKhanAdapter } from "./mockAdapter";

export type {
  BrokerCredentials,
  BrokerHistoricalPoint,
  BrokerHolding,
  BrokerQuote,
  ShareKhanAdapter,
} from "./ShareKhanAdapter";

let cachedAdapter: ShareKhanAdapter | null = null;

/**
 * Returns the configured broker adapter instance based on SHAREKHAN_ADAPTER
 * (defaults to "mock"). This is the only place route handlers / the
 * recommendation engine should obtain an adapter from - swapping in a real
 * Sharekhan SDK-backed implementation later is a config-only change plus a
 * new branch here, with no changes required elsewhere.
 */
export function getBrokerAdapter(): ShareKhanAdapter {
  if (cachedAdapter) return cachedAdapter;

  const kind = (process.env.SHAREKHAN_ADAPTER || "mock").toLowerCase();

  switch (kind) {
    case "mock":
      cachedAdapter = new MockShareKhanAdapter();
      break;
    default:
      // Future: case "sharekhan": cachedAdapter = new RealShareKhanAdapter(...)
      throw new Error(
        `Unknown SHAREKHAN_ADAPTER "${kind}". Only "mock" is implemented in Phase 1.`
      );
  }

  return cachedAdapter;
}
