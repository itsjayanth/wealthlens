import type { RecommendationAction, RecommendationStatus } from "@wealthlens/shared";

const actionClasses: Record<RecommendationAction, string> = {
  BUY: "bg-emerald-soft/15 text-emerald-soft border border-emerald-soft/25",
  SELL: "bg-rose-soft/15 text-rose-soft border border-rose-soft/25",
  HOLD: "bg-white/5 text-parchment-muted border border-white/10",
};

export function ActionBadge({ action }: { action: RecommendationAction }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${actionClasses[action]}`}
    >
      {action}
    </span>
  );
}

const statusClasses: Record<RecommendationStatus, string> = {
  pending: "bg-gold/15 text-gold-light border border-gold/25",
  approved: "bg-emerald-soft/15 text-emerald-soft border border-emerald-soft/25",
  rejected: "bg-rose-soft/15 text-rose-soft border border-rose-soft/25",
};

export function StatusBadge({ status }: { status: RecommendationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}
