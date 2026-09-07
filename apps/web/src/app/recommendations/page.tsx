"use client";

import { useCallback, useEffect, useState } from "react";
import type { Recommendation } from "@wealthlens/shared";
import {
  approveRecommendation,
  generateRecommendations,
  listRecommendations,
  rejectRecommendation,
  ApiError,
} from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ActionBadge, StatusBadge } from "@/components/Badge";

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return ts;
  }
}

function RecommendationCard({
  rec,
  onApprove,
  onReject,
  busy,
}: {
  rec: Recommendation;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busy: boolean;
}) {
  const isPending = rec.status === "pending";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-slate-900">{rec.ticker}</span>
          <ActionBadge action={rec.action} />
        </div>
        <StatusBadge status={rec.status} />
      </div>

      <p className="text-sm text-slate-600">{rec.reason}</p>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Confidence: {Math.round(rec.confidence * 100)}%</span>
        <span>{formatTimestamp(rec.timestamp)}</span>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          variant="primary"
          disabled={!isPending || busy}
          onClick={() => onApprove(rec.id)}
          className="flex-1"
        >
          Approve
        </Button>
        <Button
          variant="danger"
          disabled={!isPending || busy}
          onClick={() => onReject(rec.id)}
          className="flex-1"
        >
          Reject
        </Button>
      </div>
    </Card>
  );
}

function RecommendationsContent() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return listRecommendations()
      .then(({ recommendations }) => setRecs(recommendations))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load recommendations.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      await generateRecommendations();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate recommendations.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    setBusyIds((prev) => new Set(prev).add(id));
    const previous = recs;
    // Optimistic update
    setRecs((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
      )
    );
    try {
      const fn = action === "approve" ? approveRecommendation : rejectRecommendation;
      const { recommendation } = await fn(id);
      setRecs((prev) => prev.map((r) => (r.id === id ? recommendation : r)));
    } catch (err) {
      setRecs(previous);
      setError(err instanceof ApiError ? err.message : `Failed to ${action} recommendation.`);
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Recommendations</h1>
          <p className="text-sm text-slate-500">
            Advisory suggestions generated from your portfolio. Approving does not place a
            live order in Phase 1 — you&apos;ll execute the trade manually on Sharekhan.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating..." : "Generate recommendations"}
        </Button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading recommendations...</p>
      ) : recs.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400">
            No recommendations yet. Click &quot;Generate recommendations&quot; to run the engine.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              busy={busyIds.has(rec.id)}
              onApprove={(id) => handleAction(id, "approve")}
              onReject={(id) => handleAction(id, "reject")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <AuthGuard>
      <RecommendationsContent />
    </AuthGuard>
  );
}
