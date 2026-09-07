"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LinkedAccountSummary } from "@wealthlens/shared";
import { linkAccount, ApiError } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkAccountForm() {
  const [apiKey, setApiKey] = useState("");
  const [secureKey, setSecureKey] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<LinkedAccountSummary | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { account } = await linkAccount({ apiKey, secureKey, clientCode });
      setAccount(account);
      setApiKey("");
      setSecureKey("");
      setClientCode("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell py-10 sm:py-14">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-2xl text-parchment">
            Connect your <span className="gold-text">Sharekhan</span> account
          </h1>
          <p className="mt-2 text-sm text-parchment-muted">
            Link your account once — WealthLens reads your holdings and live prices to
            generate advisory recommendations. We never place a trade without your approval.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 text-xs text-parchment-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="text-gold">
                <LockIcon />
              </span>
              Encrypted at rest (AES-256-GCM)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="text-gold">
                <LockIcon />
              </span>
              Never shown again after linking
            </span>
          </div>

          <Card className="mt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="clientCode"
                label="Client code"
                type="text"
                required
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
              />
              <Input
                id="apiKey"
                label="API key"
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Input
                id="secureKey"
                label="Secure key"
                type="password"
                required
                value={secureKey}
                onChange={(e) => setSecureKey(e.target.value)}
                hint="Found in your Sharekhan Trade API settings."
              />

              {error && <p className="text-sm text-rose-soft">{error}</p>}

              <Button type="submit" disabled={loading} className="mt-2 w-full">
                {loading ? "Linking..." : "Link account"}
              </Button>
            </form>
          </Card>
        </motion.div>

        <AnimatePresence>
          {account && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="mt-6 border border-emerald-soft/25 bg-emerald-soft/[0.06]">
                <div className="mb-3 flex items-center gap-2 text-emerald-soft">
                  <CheckIcon />
                  <h2 className="text-sm font-semibold">Account linked</h2>
                </div>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-parchment-muted">Broker</dt>
                  <dd className="capitalize text-parchment">{account.broker}</dd>
                  <dt className="text-parchment-muted">Client code</dt>
                  <dd className="text-parchment">{account.clientCode}</dd>
                  <dt className="text-parchment-muted">Status</dt>
                  <dd className="capitalize text-parchment">{account.status}</dd>
                  <dt className="text-parchment-muted">Linked at</dt>
                  <dd className="text-parchment">
                    {new Date(account.linkedAt).toLocaleString()}
                  </dd>
                </dl>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LinkAccountPage() {
  return (
    <AuthGuard>
      <LinkAccountForm />
    </AuthGuard>
  );
}
