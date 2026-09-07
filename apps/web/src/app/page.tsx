"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getToken } from "@/lib/auth";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const steps = [
  {
    n: "01",
    title: "Connect your account",
    body: "Link your own Sharekhan account with your API Key, Secure Key, and Client Code. Credentials are encrypted at rest — WealthLens never sees them in the clear.",
  },
  {
    n: "02",
    title: "Get scored recommendations",
    body: "A rule-based engine — moving-average crossovers, RSI, sector concentration — scores every holding and produces a Buy, Sell, or Hold call with a confidence score and a plain-language reason.",
  },
  {
    n: "03",
    title: "Approve or reject",
    body: "Nothing trades on its own. You review each recommendation and decide — every action is written to an immutable audit log.",
  },
];

const features = [
  {
    title: "Explainable, not opaque",
    body: "Every signal traces back to a named rule — moving average, RSI, sector cap — with a plain-language reason, not a black-box score.",
  },
  {
    title: "You're always in control",
    body: "Recommendations are advisory by default. Trades only happen after you approve them, one at a time.",
  },
  {
    title: "Bank-grade encryption",
    body: "Your Sharekhan API Key and Secure Key are encrypted at rest with AES-256-GCM the moment you link your account.",
  },
  {
    title: "A full audit trail",
    body: "Every recommendation generated, approved, or rejected is logged permanently — a clean record if you ever need one.",
  },
];

const surfaces = [
  {
    title: "Portfolio Dashboard",
    body: "Total value, total invested, and total P&L at a glance, plus a sector allocation breakdown across every holding you carry.",
  },
  {
    title: "Recommendations Feed",
    body: "Every Buy, Sell, or Hold call shows a confidence score and the exact rule that fired — ticker, action, and reason, side by side.",
  },
  {
    title: "Approve or Reject",
    body: "One tap to act on a recommendation, or dismiss it. Every decision is timestamped and written to your audit log.",
  },
];

const rules = [
  {
    title: "50-Day Moving Average",
    body: "Flags a Buy or Sell when price crosses meaningfully above or below its 50-day average — a classic signal of a shifting trend.",
  },
  {
    title: "RSI (14-Period)",
    body: "Flags oversold conditions under 30 and overbought conditions over 70, using the standard 14-period Relative Strength Index.",
  },
  {
    title: "Sector Concentration Cap",
    body: "Flags a Sell when any single sector grows past 30% of your portfolio, nudging your holdings back toward balance.",
  },
];

const faqs = [
  {
    q: "Will WealthLens ever place a trade for me automatically?",
    a: "No. Every recommendation is advisory only. Nothing executes until you personally tap Approve.",
  },
  {
    q: "Is my Sharekhan API key safe?",
    a: "Yes — it's encrypted at rest with AES-256-GCM the moment you link your account, and it's never shown again afterward.",
  },
];

function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-radial-fade"
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/20 blur-[100px]"
          animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="shell relative flex flex-col items-center gap-6 py-24 text-center sm:py-32">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold-light"
          >
            Private Wealth Intelligence
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl font-display text-4xl leading-[1.1] text-parchment sm:text-5xl md:text-6xl"
          >
            Your portfolio,{" "}
            <span className="gold-text italic">seen through an advisor&apos;s lens</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl text-base text-parchment-muted sm:text-lg"
          >
            Link your Sharekhan account and get explainable Buy, Sell, and
            Hold recommendations — reviewed and approved by you, always.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3 pt-2 sm:flex-row"
          >
            <Button variant="primary" onClick={() => (window.location.href = "/signup")}>
              Get started
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/login")}>
              Log in
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="pt-1 text-xs text-parchment-dim"
          >
            Built for clients of an independent wealth advisor who trade through Sharekhan —
            not a generic multi-broker platform.
          </motion.p>
        </div>
      </section>

      <section className="shell py-16 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mb-12 text-center"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl text-parchment sm:text-4xl"
          >
            How it <span className="gold-text italic">works</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {steps.map((step) => (
            <motion.div
              key={step.n}
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="h-full">
                <span className="font-display text-3xl text-gold/70">{step.n}</span>
                <h3 className="mt-3 text-lg font-semibold text-parchment">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-parchment-muted">{step.body}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="shell py-16 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mb-12 text-center"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl text-parchment sm:text-4xl"
          >
            A closer look at <span className="gold-text italic">what&apos;s inside</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {surfaces.map((surface) => (
            <motion.div
              key={surface.title}
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="h-full">
                <h3 className="text-lg font-semibold text-parchment">{surface.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-parchment-muted">
                  {surface.body}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="shell py-16 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mb-12 text-center"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl text-parchment sm:text-4xl"
          >
            The rules behind <span className="gold-text italic">every call</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-3 max-w-xl text-sm text-parchment-muted"
          >
            Three named, well-understood rules combine into a single confidence score —
            no machine-learning black box, just logic you can check yourself.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {rules.map((rule) => (
            <motion.div
              key={rule.title}
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="h-full">
                <h3 className="text-lg font-semibold text-parchment">{rule.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-parchment-muted">{rule.body}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="shell py-16 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mb-12 text-center"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl text-parchment sm:text-4xl"
          >
            Built for <span className="gold-text italic">trust</span>, not hype
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
            >
              <Card className="h-full transition-shadow hover:shadow-glow-sm">
                <h3 className="text-lg font-semibold text-parchment">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-parchment-muted">
                  {feature.body}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="shell py-16 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mb-12 text-center"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl text-parchment sm:text-4xl"
          >
            A few things people <span className="gold-text italic">ask</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto flex max-w-2xl flex-col gap-4"
        >
          {faqs.map((faq) => (
            <motion.div
              key={faq.q}
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card>
                <h3 className="text-base font-semibold text-parchment">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-parchment-muted">{faq.a}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="relative overflow-hidden border-t border-white/[0.06]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-radial-fade" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="shell relative flex flex-col items-center gap-6 py-20 text-center sm:py-28"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl font-display text-3xl text-parchment sm:text-4xl"
          >
            Ready to see your portfolio through an{" "}
            <span className="gold-text italic">advisor&apos;s lens</span>?
          </motion.h2>
          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <Button variant="primary" onClick={() => (window.location.href = "/signup")}>
              Get started
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <footer className="shell flex flex-col items-center gap-1 border-t border-white/[0.06] py-8 text-center text-xs text-parchment-dim">
        <p>© 2026 WealthLens. Advisory recommendations only — not a substitute for financial advice.</p>
      </footer>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
      setAuthed(true);
    }
    setChecked(true);
  }, [router]);

  if (!checked || authed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-parchment-dim">
        Loading WealthLens...
      </div>
    );
  }

  return <LandingPage />;
}
