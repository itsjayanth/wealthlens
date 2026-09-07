"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signup, ApiError } from "@/lib/api";
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
          Advisor-grade intelligence, built around your Sharekhan account.
        </p>
        <p className="mt-5 text-sm leading-relaxed text-parchment-muted">
          Create an account, link your Sharekhan holdings, and get plain-language
          Buy / Sell / Hold guidance you approve before anything happens.
        </p>
      </div>

      <p className="relative z-10 text-xs uppercase tracking-[0.2em] text-parchment-dim">
        Private &amp; Encrypted
      </p>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { tokens } = await signup({ email, password, name });
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
            <h1 className="font-display text-2xl text-parchment">Create your account</h1>
            <p className="mb-7 mt-1.5 text-sm text-parchment-muted">
              Set up WealthLens to link your Sharekhan account.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="name"
                label="Full name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
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
                autoComplete="new-password"
                required
                minLength={8}
                hint="At least 8 characters."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <p className="text-sm text-rose-soft">{error}</p>}

              <Button type="submit" disabled={loading} className="mt-2 w-full">
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-sm text-parchment-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-gold-light hover:text-gold">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
