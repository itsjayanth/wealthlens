import type { RecommendationAction, RecommendationStatus } from "@wealthlens/shared";

const actionClasses: Record<RecommendationAction, string> = {
  BUY: "bg-emerald-100 text-emerald-800",
  SELL: "bg-rose-100 text-rose-800",
  HOLD: "bg-slate-200 text-slate-700",
};

export function ActionBadge({ action }: { action: RecommendationAction }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionClasses[action]}`}
    >
      {action}
    </span>
  );
}

const statusClasses: Record<RecommendationStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ status }: { status: RecommendationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}
