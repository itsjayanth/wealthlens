export interface Holding {
  id: string;
  userId: string;
  ticker: string;
  exchange: "NSE" | "BSE";
  quantity: number;
  avgBuyPrice: number;
  lastPrice: number;
  dayChangePct: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  sector: string | null;
  updatedAt: string;
}

export interface PortfolioSummary {
  totalCurrentValue: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPct: number;
  holdings: Holding[];
  allocation: { sector: string; valuePct: number }[];
}
