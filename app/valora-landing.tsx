"use client";
import React from "react";
import Link from "next/link";


import { motion, useInView } from "framer-motion";
import type { Variants } from "framer-motion";
import { money } from "@/app/lib/formatters";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

function HowItWorksFlow() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" })


const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.05,
    },
  },
};



// --- KPI bundle---//


const card: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

const arrow: Variants = {
  hidden: { opacity: 0, x: -6 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch"
    >
      <motion.div variants={card} className="relative">
        <StepCard icon="→" title="Add your data" body="Upload reports or connect Shopify, Stripe, or CSV exports." />
        {/* desktop arrow connector */}
        <motion.div
          variants={arrow}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 text-slate-500"
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
        >
          <motion.span
            animate={inView ? { opacity: [0.4, 1, 0.4] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            →
          </motion.span>
        </motion.div>
      </motion.div>

      <motion.div variants={card} className="relative">
        <StepCard icon="⇢" title="Valora models it" body="Automatic cleaning, mapping, and KPI computation across domains." />
        <motion.div
          variants={arrow}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 text-slate-500"
        >
          <motion.span
            animate={inView ? { opacity: [0.4, 1, 0.4] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
          >
            →
          </motion.span>
        </motion.div>
      </motion.div>

      <motion.div variants={card}>
        <StepCard icon="✓" title="Act on insights" body="Diagnostics + cross-domain signals show what to fix or double down on." />
      </motion.div>
    </motion.div>
  );
}

// // utils (local)
// const money = (n: number) =>
//   n.toLocaleString(undefined, {
//     style: "currency",
//     currency: "USD",
//     minimumFractionDigits: 2,
//   });

const ValoraLandingPage: React.FC = () => {


  // KPI state (Phase 3)
  const [kpis, setKpis] = React.useState<KpiBundle | null>(null);
  const [kpisLoading, setKpisLoading] = React.useState(true);
  const [kpisError, setKpisError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setKpisLoading(true);
        setKpisError(null);

        console.log("➡️ fetching /api/kpis...");
        const res = await fetch("/api/kpis", { cache: "no-store", signal: ac.signal });
        console.log("⬅️ status:", res.status);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as KpiBundle;
        console.log("✅ KPIs:", data);

        setKpis(data);
      } catch (e: any) {
        if (e?.name !== "AbortError") setKpisError(e?.message ?? "Failed to load KPIs");
      } finally {
        setKpisLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);



const [email, setEmail] = React.useState("");
const [submitted, setSubmitted] = React.useState(false);
const [error, setError] = React.useState<string | null>(null);
const [isDemoOpen, setIsDemoOpen] = React.useState(false);

const [demoEmail, setDemoEmail] = React.useState("");
const [demoCompany, setDemoCompany] = React.useState("");
const [demoDomain, setDemoDomain] = React.useState("E-commerce");
const [demoSubmitted, setDemoSubmitted] = React.useState(false);
const [demoError, setDemoError] = React.useState<string | null>(null);


function handleDemoSubmit() {
  setDemoError(null);

  const emailTrimmed = demoEmail.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  if (!isValidEmail) return setDemoError("Please enter a valid email.");
  if (!demoCompany.trim()) return setDemoError("Please enter your company name.");

  const payload = {
    email: emailTrimmed,
    company: demoCompany.trim(),
    domain: demoDomain,
    createdAt: new Date().toISOString(),
  };

  try {
    const key = "valoraDemoRequestsV1";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(payload);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {}

  setDemoSubmitted(true);
}


  function handleEarlyAccessSubmit() {
  setError(null);

  const trimmed = email.trim().toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

  if (!isValid) {
    setError("Please enter a valid email address.");
    return;
  }

  // store locally for now (later we wire to backend)
  try {
    const key = "valoraEarlyAccessEmailsV1";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const next = Array.from(new Set([...existing, trimmed]));
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}

  setSubmitted(true);
  setEmail("");

  }
  
const demoRevenue = [120, 132, 125, 148, 160, 182];
const demoMargin  = [28, 31, 29, 34, 37, 39];

function MiniDualLineChart({ a, b }: { a: number[]; b: number[] }) {
  const w = 520, h = 120, pad = 10;
  const max = Math.max(...a, ...b);
  const min = Math.min(...a, ...b);

  const x = (i: number) => pad + (i * (w - pad * 2)) / (a.length - 1);
  const y = (v: number) => h - pad - ((v - min) * (h - pad * 2)) / (max - min || 1);

  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <path d={path(a)} fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200" />
      <path d={path(b)} fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-300" />
    </svg>
  );
}


  
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center font-semibold text-slate-950 text-sm">
                  V
                </div>
            <div className="leading-tight">
            <div className="font-semibold tracking-tight text-sm sm:text-base">
            Valora AI
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
             Turn business data into decision making — instantly.
            </div>
        </div>
        </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#features" className="hover:text-slate-50 transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-50 transition">
              How it works
            </a>
            <a href="#pricing" className="hover:text-slate-50 transition">
              Pricing
            </a>
            <a href="#faq" className="hover:text-slate-50 transition">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/signin" className="hidden sm:inline-flex text-xs sm:text-sm text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-900/80 border border-transparent hover:border-slate-700">
            Sign in
            </Link>
            <Link href="/register" className="px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-300 hover:to-emerald-300">
              Start free
            </Link>
            <button
            onClick={() => {setIsDemoOpen(true);setDemoSubmitted(false);setDemoError(null);}}
            className="px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-300 hover:to-emerald-300"
            >
            Request demo
            </button>
         </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-900/80 bg-[radial-gradient(circle_at_top,_#38bdf833,_#020617_60%)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1 bg-slate-900/80 border border-cyan-500/40 text-cyan-300 rounded-full px-3 py-1 text-[11px]">
                <span className="h-3 w-3 rounded-full bg-cyan-400/80 mr-1" />
                AI analytics for small business & ecommerce
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                  Executive-grade analytics from your{" "}
                  <span className="text-cyan-300">business data</span> — in minutes.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                  AI analytics across Ecommerce, SaaS, Finance & Ops
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center ">
                
              <form
                className="flex-1 flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition"
                onSubmit={(e) => { e.preventDefault(); handleEarlyAccessSubmit();}} >
                  <input
                      type="email"
                      placeholder="Enter your work email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (submitted) setSubmitted(false); // unlock after success
                        if (error) setError(null);          // clear error while typing
                      }}
                      className="h-9 w-full text-xs sm:text-sm bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-500"
                      suppressHydrationWarning
                    />

                  <button
                      type="submit"
                      
                      disabled={submitted}
                      className="h-9 px-3 inline-flex items-center justify-center text-xs sm:text-sm rounded-lg
                                bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-semibold
                                hover:from-cyan-300 hover:to-emerald-300 whitespace-nowrap
                                disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {submitted ? "Added ✓" : "Get early access →"}
                   </button>
              </form>
                
              </div>
                {submitted && (
                <div className="text-[11px] text-emerald-300">
                    Thanks — you’re on the early access list.
                </div>
                )}
                {error && (
                <div className="text-[11px] text-rose-300">
                    {error}
                </div>
                )}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-center">
                    <span className="text-emerald-300 text-xs">✓</span>
                  </div>
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                    <span className="text-slate-300 text-xs">●</span>
                  </div>
                  Your data stays encrypted & private
                </div>
              </div>
            </div>

            {/* Right: simple product preview */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-cyan-500/10 via-emerald-500/5 to-transparent blur-3xl" />
              <div className="relative rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl shadow-cyan-500/20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/80">
                  <span className="inline-flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                        Executive overview
                    </span>
                  <span className="text-slate-500">Last updated: 2m ago</span>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <MetricTile
                      label="Monthly revenue"
                      value={kpisLoading ? "—" : money(Number(kpis?.ecommerceKPIs?.revenue_30d ?? 0))}
                      delta="(30d)"
                      positive
                    />

                    <MetricTile
                      label="Gross margin"
                      value={
                        kpisLoading ? "—" : `${Number(kpis?.ecommerceKPIs?.gross_margin_pct_30d ?? 0).toFixed(2)}%`
                      }
                      delta="(30d)"
                      positive
                    />

                    <MetricTile
                      label="Customers"
                      value={kpisLoading ? "—" : `${Number(kpis?.ecommerceKPIs?.customers_30d ?? 0)}`}
                      delta="(30d)"
                      positive
                    />

                    <MetricTile
                      label="Orders"
                      value={kpisLoading ? "—" : `${Number(kpis?.ecommerceKPIs?.orders_30d ?? 0)}`}
                      delta="(30d)"
                      positive
                    />
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Revenue & margin (last 30 days)
                      </span>

                      <span className="inline-flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-4 rounded-full bg-slate-200" />
                          Revenue
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-4 rounded-full bg-cyan-400" />
                          Margin
                        </span>
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/80 overflow-hidden">
                      <MiniDualLineChart a={demoRevenue} b={demoMargin} />
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Live preview . Plug in real data after onboarding.
                    </div>
                  </div>

                  <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/90 p-3">
                    <div className="text-[11px] text-slate-400 mb-1">
                      AI insight
                    </div>
                    <p className="text-xs text-slate-200 leading-snug">
                      “Your top 5 SKUs generated 61% of revenue and 72% of profit
                      last month. Increasing ad spend by 10–15% on these
                      products could drive ~19% uplift in net profit.”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Works with strip */}
        {/* ================= Why Valora ================= */}
        <section className="border-b border-slate-900/80 bg-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className=" rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900/60 p-5 sm:p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">

              {/* Left: positioning */}
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-sm sm:text-base font-semibold text-slate-100">
                  Why Valora AI?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Most tools show <span className="text-slate-100">what happened</span>. Valora AI explains{" "}
                  <span className="text-cyan-300">why it happened</span> — by connecting finance, operations,
                  customers, and growth signals into one executive narrative.
                </p>
              </div>

              {/* Right: outcomes (3 cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] w-full lg:w-auto ">
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
                  <div className="text-sm font-semibold text-slate-100">
                    Dashboards in minutes
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Domain KPIs and diagnostics auto-generated from your exports.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
                  <div className="text-sm font-semibold text-slate-100">
                    Revenue leaks detected early
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Flags churn risk, denial pressure, delays, and concentration risk.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
                  <div className="text-sm font-semibold text-slate-100">
                    Cause → impact insights
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Cross-domain engine links signals (e.g. delays → churn, denials → cash stress).
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Who Valora is for */}
        <section
        id="who-for"
        className="border-b border-slate-900/80 bg-slate-950"
        >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
            
            <div className="space-y-3 max-w-2xl">
            <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan-300">
                Everything you need to understand your business.
            </h2>

            {/* Gradient single-line domains (A + B) */}
            <p className="text-[12px] font-semibold tracking-wide bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                E-commerce • SaaS • Insurance • Healthcare • Supply Chain • Finance & Banking
            </p>

            <p className="text-xs sm:text-sm text-slate-400">
              Valora AI turns raw business data into executive-ready dashboards and insights —
              instantly, across every domain you operate in.
            </p>

            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">

            {/* E-commerce (active) */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-1 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
                <div className="text-[11px] font-semibold text-cyan-300">
                E-COMMERCE & DTC 🛒
                </div>
                <div className="text-[13px] font-semibold text-slate-100">
                  Revenue, cohorts, and SKU performance
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Upload orders → get instant visibility into growth, repeat behavior, and product winners.
                </p>
                <div className="mt-1 text-[11px] text-slate-500">
                  Metrics: revenue, AOV, repeat rate, top SKUs, at-risk revenue.
                </div>
            </div>

            {/* Insurance */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-1
                hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">

              <div className="text-[11px] font-semibold text-emerald-300">
                INSURANCE 🛡️
              </div>
              <div className="text-[13px] font-semibold text-slate-100">
                Claims health and loss drivers
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Track claim volume, severity, fraud signals, and concentration risk from raw claims exports.
              </p>
              <div className="mt-1 text-[11px] text-slate-500">
                Metrics: loss ratio, open rate, fraud rate, high-severity share, top-10 policy share.
              </div>
              
            </div>

            {/* Supply chain */}
            <div
                className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-1 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
            
                <div className="text-[11px] font-semibold text-sky-300">
                  SUPPLY CHAIN 📦
                </div>
                <div className="text-[13px] font-semibold text-slate-100">
                  Delivery reliability at a glance
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Turn shipment logs into on-time, delay, and network coverage insights in minutes.
                </p>
                <div className="mt-1 text-[11px] text-slate-500">
                  Metrics: on-time %, delay rate, avg delay, shipments, unique SKUs, unique locations.
                </div>
                
            </div>

            {/* Healthcare */}
            <div
                className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-1
                          hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition"
              >
                <div className="text-[11px] font-semibold text-rose-300">
                  HEALTHCARE 🏥
                </div>

                <div className="text-[13px] font-semibold text-slate-100">
                  Denials, cost intensity, provider concentration
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Understand revenue leakage and high-cost drivers from claims data—fast.
                </p>
                <div className="mt-1 text-[11px] text-slate-500">
                  Metrics: denial rate, avg paid/claim, high-cost share, top-10 provider share, claims/patient.
                </div>
              </div>

            {/* Finance */}
            <div
              className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-1
                        hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition"
            >
              <div className="text-[11px] font-semibold text-purple-300">
                FINANCE & BANKING 💳
              </div>
              
              <div className="text-[13px] font-semibold text-slate-100">
                Liquidity and risk signals in one view
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Convert transactions + financials into clear signals on cash, exposure, and concentration.
              </p>
              <div className="mt-1 text-[11px] text-slate-500">
                Metrics: net cash flow, liquidity ratios, exposure metrics, concentration indicators.
              </div>
              
            </div>

            {/* SaaS & Subscriptions */}
            <div
              className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-1
                        hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
              <div className="text-[11px] font-semibold text-indigo-300">
                SAAS & SUBSCRIPTIONS ☁️
              </div>

              <div className="text-[13px] font-semibold text-slate-100">
                MRR, churn, and retention clarity
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Turn subscription events into growth, churn risk, and expansion signals automatically.
              </p>
              <div className="mt-1 text-[11px] text-slate-500">
                Metrics: MRR, churn, ARPU, expansion/contraction, revenue churn, NRR.
              </div>
            </div>

            </div>
        </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-slate-900/80 bg-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan-300">
                Features
              </div>
              <div className="text-sm text-slate-400 max-w-2xl">
                Built for founders and operators: instant KPIs, clear diagnostics, and cross-domain signals — without a data team.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard
                title="Dashboards in minutes"
                body="Upload CSVs (or connect sources later). Valora auto-builds domain KPIs + diagnostics instantly."
              />
              <FeatureCard
                title="Explained insights"
                body="Not just charts — plain-English narratives that highlight what changed, why it matters, and what to check next."
              />
              <FeatureCard
                title="Cross-domain signals"
                body="Connect Finance + Ops + Customer health to catch second-order risk (e.g., delays → churn, denials → cash stress)."
              />
              <FeatureCard
                title="Secure by default"
                body="Encrypted in transit and at rest. You control access. No training on your private data."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-b border-slate-900/80 bg-slate-950/95">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
             <div className="space-y-2">
                <div className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan-300">
                  How it works
                </div>
                <div className="text-sm text-slate-400 max-w-2xl">
                  Upload exports or connect tools. Valora auto-models your data into domain KPIs,
                  diagnostics, and executive-ready insights — in minutes.
                </div>
              </div>
              {/* <div className="inline-flex items-center bg-slate-900/80 border border-slate-700 text-[11px] px-3 py-1 rounded-full text-slate-300">
                Start with CSVs today
              </div> */}
            </div>
            <HowItWorksFlow />
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <StepCard
                icon="→"
                title="Add your data"
                body="Upload reports or connect Shopify, Stripe, or CSV exports."
              />

              <StepCard
                icon="⇢"
                title="Valora models it"
                body="Automatic cleaning, mapping, and KPI computation across domains."
              />

              <StepCard
                icon="✓"
                title="Act on insights"
                body="Diagnostics + cross-domain signals show what to fix or double down on."
              />
            </div> */}

          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="border-b border-slate-900/80 bg-slate-950"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan-300">
                Pricing
              </div>
              <div className="text-sm text-slate-400">
                Start free, then upgrade only when Valora AI becomes a core part of your
                weekly decision-making.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PricingCard
                name="Starter"
                price="$19"
                cadence="/month"
                blurb="For solo founders and very small teams getting started with analytics."
                features={[
                  "Up to 3 data sources",
                  "Standard dashboards",
                  "Monthly AI summary",
                  "Email support",
                ]}
              />
              <PricingCard
                name="Growth"
                price="$79"
                cadence="/month"
                blurb="For growing ecommerce and small businesses that need weekly visibility."
                features={[
                  "Up to 8 data sources",
                  "Advanced dashboards",
                  "Weekly AI insights",
                  "Branded PDF reports",
                  "Priority support",
                ]}
                highlight
              />
              <PricingCard
                name="Scale"
                price="$149"
                cadence="/month"
                blurb="For agencies and teams managing multiple brands or stores."
                features={[
                  "Up to 20 data sources",
                  "Multi-brand workspaces",
                  "Daily AI insights",
                  "API access",
                  "Dedicated onboarding",
                ]}
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Need a custom plan for more data sources or a larger team?{" "}
              <span className="text-cyan-300">
                Contact us for enterprise pricing.
              </span>
            </p>
          </div>
        </section>

        {/* FAQ + footer */}
        <section id="faq" className="bg-slate-950/95">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">

            <div className="space-y-6 max-w-3xl">
              {/* FAQ header */}
              <div className="space-y-3">
                <div className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan-300">
                  FAQ
                </div>
                <div className="text-sm text-slate-400 max-w-xl">
                  Answers to common questions from founders and operators evaluating Valora AI.
                </div>
              </div>

              {/* FAQ items */}
              <div className="space-y-3 text-sm text-slate-200">
                <FaqItem
                  question="Do I need a data team or engineer to get value from Valora AI?"
                  answer="No. Valora AI is built for founders and operators. If you can upload exports or connect tools like Shopify or Stripe, you can get value immediately."
                />

                <FaqItem
                  question="Which tools can I connect?"
                  answer="You can start with CSV exports and connect Shopify, Stripe, and selected ad platforms. More integrations will be added based on demand."
                />

                <FaqItem
                  question="Is my data secure?"
                  answer="Yes. Your data is encrypted in transit and at rest. You remain the owner of your data and can disconnect integrations at any time."
                />
              </div>
            </div>

            <footer className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center font-semibold text-slate-950 text-sm">
                  V
                </div>
                <span>© {new Date().getFullYear()} Valora AI. All rights reserved.</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <a href="#" className="hover:text-slate-300">
                  Privacy
                </a>
                <a href="#" className="hover:text-slate-300">
                  Terms
                </a>
                <a href="#" className="hover:text-slate-300">
                  Contact
                </a>
              </div>
            </footer>
          </div>
        </section>

        {isDemoOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onMouseDown={(e) => {
                if (e.currentTarget === e.target) setIsDemoOpen(false); // click outside closes
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsDemoOpen(false);
              }}
              tabIndex={-1}
            >
              <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-100">Request a Valora AI demo</h3>
                  <button
                    type="button"
                    onClick={() => setIsDemoOpen(false)}
                    className="text-slate-400 hover:text-slate-200"
                    aria-label="Close demo modal"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-4">
                  Tell us a bit about your business. We’ll reach out with a tailored demo.
                </p>

                <div className="space-y-3">
                  <input
                    placeholder="Work email"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-200 placeholder:text-slate-500"
                  />

                  <input
                    placeholder="Company name"
                    value={demoCompany}
                    onChange={(e) => setDemoCompany(e.target.value)}
                    className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-200 placeholder:text-slate-500"
                  />

                  <select
                    value={demoDomain}
                    onChange={(e) => setDemoDomain(e.target.value)}
                    className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-2 text-xs text-slate-200"
                  >
                    <option>E-commerce</option>
                    <option>SaaS</option>
                    <option>Insurance</option>
                    <option>Healthcare</option>
                    <option>Supply Chain</option>
                    <option>Finance / Banking</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleDemoSubmit}
                  className="mt-4 w-full h-9 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-semibold hover:from-cyan-300 hover:to-emerald-300"
                >
                  Submit request
                </button>

                {demoSubmitted && (
                  <div className="mt-3 text-[11px] text-emerald-300">
                    Request received — we’ll email you soon.
                  </div>
                )}
                {demoError && <div className="mt-3 text-[11px] text-rose-300">{demoError}</div>}

                <div className="mt-3 text-[11px] text-slate-500 text-center">
                  No spam. One follow-up email.
                </div>
              </div>
            </div>
          )}    


      </main>
    </div>
  );
};



// ======================
// KPI TYPES (API CONTRACT)
// ======================

interface EcommerceKPIs {
  revenue_30d: number;
  cogs_30d: number;
  gross_margin_pct_30d: number;
  customers_30d: number;
  orders_30d: number;
}

interface FinanceKPIs {
  inflow_30d: number;
  outflow_30d: number;
  net_cash_flow_30d: number;
}

interface SaasKPIs {
  mrr_delta_30d: number;
  churn_events_30d: number;
  churn_rate_pct_30d: number;
  active_customers_30d: number;
}

interface SupplyKPIs {
  on_time_rate_pct_30d: number;
  avg_delay_days_30d: number;
  shipments_30d: number;
}

interface HealthcareKPIs {
  claims_30d: number;
  denied_30d: number;
  denial_rate_pct_30d: number;
  avg_paid_per_claim_30d: number;
}

interface InsuranceKPIs {
  written_premium_30d: number;
  incurred_loss_30d: number;
  loss_ratio_pct_30d: number;
  claims_30d: number;
  suspected_fraud_30d: number;
  suspected_fraud_rate_pct_30d: number;
}

export interface KpiBundle {
  ecommerceKPIs: EcommerceKPIs;
  financeKPIs: FinanceKPIs;
  saasKPIs: SaasKPIs;
  supplyKPIs: SupplyKPIs;
  healthcareKPIs: HealthcareKPIs;
  insuranceKPIs: InsuranceKPIs;
}


interface MetricTileProps {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
}

// ======================
// KPI TYPES (API CONTRACT)
// ======================

const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  delta,
  positive = true,
}) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-1">
    <div className="text-[11px] text-slate-400">{label}</div>
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-semibold text-slate-50">{value}</span>
      <span
        className={`text-[11px] font-medium ${
          positive ? "text-emerald-300" : "text-rose-300"
        }`}
      >
        {positive ? "▲" : "▼"} {delta}
      </span>
    </div>
  </div>
);

interface FeatureCardProps {
  title: string;
  body: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, body }) => (
  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
    <h3 className="text-sm font-medium text-slate-100 mb-1">{title}</h3>
    <p className="text-xs text-slate-300 flex-1">{body}</p>
  </div>
);

interface StepCardProps {
  icon: string;
  title: string;
  body: string;
}

const StepCard: React.FC<StepCardProps> = ({ icon, title, body }) => (
  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
    <div className="text-lg text-cyan-300 mb-2">{icon}</div>
    <h3 className="text-sm font-medium text-slate-100 mb-1">{title}</h3>
    <p className="text-xs text-slate-300 flex-1">{body}</p>
  </div>
);

interface PricingCardProps {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  cadence,
  blurb,
  features,
  highlight,
}) => (
  <div
    className={`h-full flex flex-col rounded-xl bg-slate-950/90 border ${
      highlight
        ? "border-cyan-500/70 shadow-lg shadow-cyan-500/20"
        : "border-slate-800"
    } p-4`}
  >
    <div className="flex items-center justify-between gap-2 mb-1">
      <h3 className="text-sm font-semibold text-slate-50">{name}</h3>
      {highlight && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/60 text-cyan-300">
          Most popular
        </span>
      )}
    </div>
    <p className="text-[11px] text-slate-400 mb-3">{blurb}</p>

    <div className="flex items-baseline gap-1 mb-3">
      <span className="text-2xl font-semibold text-slate-50">{price}</span>
      <span className="text-[11px] text-slate-400">{cadence}</span>
    </div>

    <ul className="space-y-2 text-[11px] text-slate-300 mb-4 flex-1">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <span className="text-emerald-300 mt-0.5">✓</span>
          <span>{f}</span>
        </li>
      ))}
    </ul>

    <button
      className={`w-full h-9 text-xs font-semibold rounded-lg mt-auto ${
        highlight
          ? "bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 hover:from-cyan-300 hover:to-emerald-300"
          : "bg-slate-900/80 text-slate-100 hover:bg-slate-800"
      }`}
    >
      Start with {name}
    </button>
  </div>
);

interface FaqItemProps {
  question: string;
  answer: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => (
  <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/80">
    <div className="text-[11px] font-semibold text-slate-100 mb-1">
      {question}
    </div>
    <div className="text-[11px] text-slate-400 leading-snug">{answer}</div>
  </div>
);


function ValoraLogo() {
  const uid = React.useId(); // prevents gradient ID collisions

  const bgId = `valoraBg-${uid}`;
  const vId = `valoraV-${uid}`;
  const glowId = `valoraGlow-${uid}`;

  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-xl"
      role="img"
      aria-label="Valora AI"
    >
      <defs>
        {/* Deep background */}
        <linearGradient id={bgId} x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0B1220" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>

        {/* V stroke gradient */}
        <linearGradient id={vId} x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#24E4FF" />
          <stop offset="0.55" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#2DD4BF" />
        </linearGradient>

        {/* Subtle outer glow */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              0 0 0 0 0.13
              0 0 0 0 0.83
              0 0 0 0 0.93
              0 0 0 0.55 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Rounded square */}
      <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${bgId})`} />

      {/* Subtle glass highlight */}
      <path
        d="M14 16c6-7 16-10 26-7 4 1 7 3 10 6"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* V mark with glow */}
      <g filter={`url(#${glowId})`}>
        <path
          d="M18 20L30.5 46L46 22"
          stroke={`url(#${vId})`}
          strokeWidth="4.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Accent node */}
        <circle cx="46" cy="22" r="3.2" fill="#24E4FF" opacity="0.95" />
      </g>
    </svg>
  );
}

export default ValoraLandingPage;