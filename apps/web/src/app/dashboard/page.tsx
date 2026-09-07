"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, animate } from "framer-motion";
import type { PortfolioSummary } from "@wealthlens/shared";
import { getPortfolio, ApiError } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";

const SECTOR_COLORS = [
  "bg-gold",
  "bg-emerald-soft",
  "bg-sky-400",
  "bg-violet-400",
  "bg-rose-soft",
  "bg-amber-400",
  "bg-teal-400",
  "bg-fuchsia-400",
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
  if (value > 0) return "text-emerald-soft";
  if (value < 0) return "text-rose-soft";
  return "text-parchment-muted";
}

/** Animates a number from 0 to `target` once, formatting each frame with `format`. */
function useCountUp(target: number, duration = 1.1) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function PortfolioStats({ portfolio }: { portfolio: PortfolioSummary }) {
  const animatedValue = useCountUp(portfolio.totalCurrentValue);
  const animatedInvested = useCountUp(portfolio.totalInvested);
  const animatedPnl = useCountUp(portfolio.totalPnl);

  return (
    <motion.div
      variants={container}
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <motion.div variants={item}>
        <Card className="h-full">
          <p className="text-xs font-medium uppercase tracking-wider text-gold-muted">
            Total Value
          </p>
          <p className="mt-2 font-display text-3xl text-parchment">
            {formatMoney(animatedValue)}
          </p>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="h-full">
          <p className="text-xs font-medium uppercase tracking-wider text-gold-muted">
            Total Invested
          </p>
          <p className="mt-2 font-display text-3xl text-parchment">
            {formatMoney(animatedInvested)}
          </p>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="h-full">
          <p className="text-xs font-medium uppercase tracking-wider text-gold-muted">
            Total P&amp;L
          </p>
          <p className={`mt-2 font-display text-3xl ${pnlClass(portfolio.totalPnl)}`}>
            {formatMoney(animatedPnl)}
          </p>
          <span
            className={`mt-2 inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-semibold ${pnlClass(
              portfolio.totalPnl
            )}`}
          >
            {formatPct(portfolio.totalPnlPct)}
          </span>
        </Card>
      </motion.div>
    </motion.div>
  );
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
    return (
      <div className="shell flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-parchment-dim">Loading portfolio…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-rose-soft">{error}</p>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="shell py-8 sm:py-10">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6"
      >
        <motion.div variants={item}>
          <h1 className="font-display text-2xl text-parchment sm:text-3xl">Portfolio</h1>
          <p className="mt-1 text-sm text-parchment-muted">
            A read-only view of your linked holdings.
          </p>
        </motion.div>

        <PortfolioStats portfolio={portfolio} />

        {/* Allocation by sector */}
        <motion.div variants={item}>
          <Card>
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-parchment">
              Allocation by Sector
            </h2>
            {portfolio.allocation.length === 0 ? (
              <p className="text-sm text-parchment-dim">No allocation data available.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
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
                      <span className="text-parchment-muted">{slice.sector}</span>
                      <span className="font-medium text-parchment">
                        {slice.valuePct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Holdings table */}
        <motion.div variants={item}>
          <Card className="p-0">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold tracking-wide text-parchment">Holdings</h2>
            </div>
            {portfolio.holdings.length === 0 ? (
              <p className="px-5 py-6 text-sm text-parchment-dim">
                No holdings yet.{" "}
                <Link
                  href="/link-account"
                  className="font-medium text-gold-light hover:underline"
                >
                  Connect your Sharekhan account
                </Link>{" "}
                to see your portfolio here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/5 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-parchment-muted">
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
                  <tbody className="divide-y divide-white/5">
                    {portfolio.holdings.map((h) => (
                      <tr key={h.id} className="transition-colors hover:bg-white/[0.03]">
                        <td className="whitespace-nowrap px-5 py-3 font-medium text-parchment">
                          {h.ticker}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-parchment-muted">
                          {h.exchange}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-parchment-muted">
                          {h.quantity}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-parchment-muted">
                          {formatMoney(h.avgBuyPrice)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-parchment-muted">
                          <span>{formatMoney(h.lastPrice)}</span>{" "}
                          <span className={`text-xs ${pnlClass(h.dayChangePct)}`}>
                            ({formatPct(h.dayChangePct)})
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-parchment-muted">
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
        </motion.div>
      </motion.div>
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
