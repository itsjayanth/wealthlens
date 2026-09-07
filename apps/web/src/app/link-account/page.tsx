"use client";

import { FormEvent, useState } from "react";
import type { LinkedAccountSummary } from "@wealthlens/shared";
import { linkAccount, ApiError } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

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
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Link Sharekhan account</h1>
      <p className="mb-6 text-sm text-slate-500">
        Your API Key and Secure Key are encrypted at rest and are never shown again after
        linking.
      </p>

      <Card>
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
          />

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Linking..." : "Link account"}
          </Button>
        </form>
      </Card>

      {account && (
        <Card className="mt-6 border-emerald-200 bg-emerald-50">
          <h2 className="mb-3 text-sm font-semibold text-emerald-800">Account linked</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Broker</dt>
            <dd className="text-slate-900 capitalize">{account.broker}</dd>
            <dt className="text-slate-500">Client code</dt>
            <dd className="text-slate-900">{account.clientCode}</dd>
            <dt className="text-slate-500">Status</dt>
            <dd className="capitalize text-slate-900">{account.status}</dd>
            <dt className="text-slate-500">Linked at</dt>
            <dd className="text-slate-900">
              {new Date(account.linkedAt).toLocaleString()}
            </dd>
          </dl>
        </Card>
      )}
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
