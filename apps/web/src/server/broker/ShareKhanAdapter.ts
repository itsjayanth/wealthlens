/**
 * Broker-agnostic interface. This is the seam a real Sharekhan SDK
 * integration plugs into later (see PRD section 8) - route handlers and the
 * recommendation engine depend only on this shape, never on a specific
 * broker's raw payload format.
 */
export interface BrokerHolding {
  ticker: string;
  exchange: "NSE" | "BSE";
  quantity: number;
  avgBuyPrice: number;
  lastPrice: number;
  sector: string | null;
}

export interface BrokerQuote {
  ticker: string;
  lastPrice: number;
  dayChangePct: number;
}

export interface BrokerHistoricalPoint {
  date: string;
  close: number;
}

export interface BrokerCredentials {
  apiKey: string;
  secureKey: string;
  clientCode: string;
}

export interface ShareKhanAdapter {
  fetchHoldings(credentials: BrokerCredentials): Promise<BrokerHolding[]>;
  fetchQuote(ticker: string): Promise<BrokerQuote>;
  fetchHistorical(
    ticker: string,
    days: number
  ): Promise<BrokerHistoricalPoint[]>;
}
