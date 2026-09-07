"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { login, ApiError } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

function BrandPanel() {
  return (
    <div className="relative hidden flex-1 flex-col justify-between overflow-hidden px-14 py-16 lg:flex">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-gold/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-gold/[0.07] blur-[90px]" />

      <Link href="/" className="relative z-10 font-display text-2xl tracking-tight text-parchment">
        Wealth<span className="gold-text italic">Lens</span>
      </Link>

      <div className="relative z-10 max-w-sm">
        <p className="font-display text-3xl italic leading-snug text-parchment">
          Your portfolio, read with the same discipline as your advisor.
        </p>
        <p className="mt-5 text-sm leading-relaxed text-parchment-muted">
          Sign in to view your linked Sharekhan holdings and the Buy / Sell / Hold
          guidance generated from your advisor&apos;s strategy — every call explained,
          nothing executed without your approval.
        </p>
      </div>

      <p className="relative z-10 text-xs uppercase tracking-[0.2em] text-parchment-dim">
        Private &amp; Encrypted
      </p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { tokens } = await login({ email, password });
      saveToken(tokens.accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen bg-ink">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <BrandPanel />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <Link href="/" className="mb-8 block font-display text-xl tracking-tight text-parchment lg:hidden">
            Wealth<span className="gold-text italic">Lens</span>
          </Link>

          <Card className="p-7">
            <h1 className="font-display text-2xl text-parchment">Welcome back</h1>
            <p className="mt-1.5 text-sm text-parchment-muted">
              Log in to view your portfolio and recommendations.
            </p>

            <button
              type="button"
              onClick={() => {
                setEmail("demo@wealthlens.app");
                setPassword("Demo@1234");
              }}
              className="mt-5 w-full rounded-full border border-gold/30 bg-gold/[0.06] px-4 py-2 text-sm font-medium text-gold-light transition-colors hover:bg-gold/[0.12]"
            >
              Try the live demo
            </button>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-parchment-dim">
              <span className="h-px flex-1 bg-white/10" />
              or log in
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <p className="text-sm text-rose-soft">{error}</p>}

              <Button type="submit" disabled={loading} className="mt-2 w-full">
                {loading ? "Logging in…" : "Log in"}
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-sm text-parchment-muted">
            New to WealthLens?{" "}
            <Link href="/signup" className="font-medium text-gold-light hover:text-gold">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
