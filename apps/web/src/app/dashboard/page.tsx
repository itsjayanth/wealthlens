"use client";

import { useEffect, useState } from "react";
import type { PortfolioSummary } from "@wealthlens/shared";
import { getPortfolio, ApiError } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";

const SECTOR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatMoney(value: number): string {
  return currency.format(value);
}

function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function pnlClass(value: number): string {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-600";
  return "text-slate-500";
}

function DashboardContent() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPortfolio()
      .then(({ portfolio }) => {
        if (!cancelled) setPortfolio(portfolio);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load portfolio.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading portfolio...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Portfolio Dashboard</h1>
        <p className="text-sm text-slate-500">A read-only view of your linked holdings.</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Total Value
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {formatMoney(portfolio.totalCurrentValue)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Total Invested
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {formatMoney(portfolio.totalInvested)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Total P&amp;L
          </p>
          <p className={`mt-1 text-2xl font-semibold ${pnlClass(portfolio.totalPnl)}`}>
            {formatMoney(portfolio.totalPnl)}{" "}
            <span className="text-base font-medium">
              ({formatPct(portfolio.totalPnlPct)})
            </span>
          </p>
        </Card>
      </div>

      {/* Allocation by sector */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Allocation by Sector</h2>
        {portfolio.allocation.length === 0 ? (
          <p className="text-sm text-slate-400">No allocation data available.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
              {portfolio.allocation.map((slice, i) => (
                <div
                  key={slice.sector}
                  className={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                  style={{ width: `${slice.valuePct}%` }}
                  title={`${slice.sector}: ${slice.valuePct.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {portfolio.allocation.map((slice, i) => (
                <div key={slice.sector} className="flex items-center gap-2 text-sm">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${SECTOR_COLORS[i % SECTOR_COLORS.length]}`}
                  />
                  <span className="text-slate-600">{slice.sector}</span>
                  <span className="font-medium text-slate-900">
                    {slice.valuePct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Holdings table */}
      <Card className="p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-700">Holdings</h2>
        </div>
        {portfolio.holdings.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">
            No holdings yet. Link your Sharekhan account to see your portfolio.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Ticker</th>
                  <th className="px-5 py-3">Exchange</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Avg Buy</th>
                  <th className="px-5 py-3 text-right">Last Price</th>
                  <th className="px-5 py-3 text-right">Current Value</th>
                  <th className="px-5 py-3 text-right">P&amp;L</th>
                  <th className="px-5 py-3 text-right">P&amp;L %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {portfolio.holdings.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">
                      {h.ticker}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">{h.exchange}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-slate-700">
                      {h.quantity}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-slate-700">
                      {formatMoney(h.avgBuyPrice)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-slate-700">
                      <span>{formatMoney(h.lastPrice)}</span>{" "}
                      <span className={`text-xs ${pnlClass(h.dayChangePct)}`}>
                        ({formatPct(h.dayChangePct)})
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-slate-700">
                      {formatMoney(h.currentValue)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-3 text-right font-medium ${pnlClass(h.pnl)}`}
                    >
                      {formatMoney(h.pnl)}
                    </td>
                    <td className={`whitespace-nowrap px-5 py-3 text-right ${pnlClass(h.pnlPct)}`}>
                      {formatPct(h.pnlPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
