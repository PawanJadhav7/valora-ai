"use client";

import Link from "next/link";
import React from "react";



const ValoraLandingPage: React.FC = () => {

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
             Turn business data into value — instantly.
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
            onClick={() => setIsDemoOpen(true)}
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
                  Turn your business data into{" "}
                  <span className="text-cyan-300">value</span> — instantly.
                </h1>
                <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                  Valora AI connects to your sales, marketing, and finance
                  tools to auto-generate dashboards, reports, and growth
                  recommendations — so you can make better decisions without a
                  data team.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                
                <div className="flex-1 flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5">
                  <input type="email"
                    placeholder="Enter your work email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="h-9 w-full text-xs sm:text-sm bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-500"
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    onClick={handleEarlyAccessSubmit}
                    className="h-9 px-3 inline-flex items-center justify-center text-xs sm:text-sm rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-semibold hover:from-cyan-300 hover:to-emerald-300 whitespace-nowrap"
                    >
                    Get early access →
                    </button>
                </div>
                
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
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Executive overview • Demo client
                  </span>
                  <span>Last updated: 2 min ago</span>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <MetricTile
                      label="Monthly revenue"
                      value="$182,430"
                      delta="+14.2%"
                      positive
                    />
                    <MetricTile
                      label="Gross margin"
                      value="39.4%"
                      delta="+2.1 pts"
                      positive
                    />
                    <MetricTile
                      label="Repeat customers"
                      value="46%"
                      delta="+5.3 pts"
                      positive
                    />
                    <MetricTile
                      label="At-risk revenue"
                      value="$12,900"
                      delta="-8.1%"
                      positive={false}
                    />
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Revenue & margin (last 6 months)</span>
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-4 rounded-full bg-slate-100" />
                          Revenue
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-4 rounded-full bg-cyan-400" />
                          Margin
                        </span>
                      </span>
                    </div>
                    <div className="h-32 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-[11px] text-slate-500">
                      Chart placeholder — plug in your real data.
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
            Valora AI learns each industry’s structure and metrics, using domain-aware
            models to auto-generate dashboards, KPIs, forecasts, and insight narratives —
            without custom pipelines or a full data team.
            </p>

            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">

            {/* E-commerce (active) */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-2 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
                <div className="text-[11px] font-semibold text-cyan-300">
                E-COMMERCE & DTC 🛒
                </div>
                <div className="text-[13px] font-semibold text-slate-100">
                Products, customers, repeat orders
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                Upload your orders export and get instant visibility into revenue,
                cohorts, and product performance — without spreadsheets.
                </p>
                <div className="mt-1 text-[11px] text-slate-500">
                Metrics: AOV, repeat rate, top SKUs, at-risk revenue.
                </div>
            </div>

            {/* Insurance */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-2 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
                <div className="text-[11px] font-semibold text-emerald-300">
                INSURANCE 🛡️(COMING SOON)
                </div>
                <div className="text-[13px] font-semibold text-slate-100">
                Policies, claims, loss ratios
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                Analytics pack for underwriting, claims, and actuarial insights —
                powered by Valora’s core modeling engine.
                </p>
                <div className="mt-1 text-[11px] text-slate-500">
                Metrics: written premium, earned premium, claim severity, loss ratio.
                </div>
            </div>

            {/* Supply chain */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-2 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
                <div className="text-[11px] font-semibold text-sky-300">
                SUPPLY CHAIN 📦(COMING SOON)
                </div>
                <div className="text-[13px] font-semibold text-slate-100">
                Shipments, inventory, on-time %
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                Transform shipment logs and SKU data into a live operations
                dashboard — without needing a BI team.
                </p>
                <div className="mt-1 text-[11px] text-slate-500">
                Metrics: OTIF, stockouts, warehouse turns.
                </div>
            </div>

            {/* Healthcare */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-2 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
                <div className="text-[11px] font-semibold text-rose-300">
                HEALTHCARE 🏥(COMING SOON)
                </div>
                <div className="text-[13px] font-semibold text-slate-100">
                Claims, utilization, outcomes
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                A healthcare analytics pack for providers and payers — powered by
                automated cleaning, mapping, and cost modeling.
                </p>
                <div className="mt-1 text-[11px] text-slate-500">
                Metrics: claim cost, utilization rate, patient churn.
                </div>
            </div>

            {/* Finance */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-2 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
                <div className="text-[11px] font-semibold text-purple-300">
                FINANCE & BANKING 💳(COMING SOON)
                </div>
                <div className="text-[13px] font-semibold text-slate-100">
                Cashflow, risk, portfolio insights
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                A domain pack for financial analytics focused on cashflow modeling,
                portfolio performance, and policy risk insights.
                </p>
                <div className="mt-1 text-[11px] text-slate-500">
                Metrics: NPV, IRR, liquidity, customer segments, risk scoring.
                </div>
            </div>

            {/* SaaS & Subscriptions */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-2 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
            <div className="text-[11px] font-semibold text-indigo-300">
                SAAS & SUBSCRIPTIONS ☁️(COMING SOON)
            </div>
            <div className="text-[13px] font-semibold text-slate-100">
                MRR, churn, retention & expansions
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
                A domain pack for subscription-based businesses with automated MRR tracking,
                retention cohorts, churn detection, and revenue forecasting.
            </p>
            <div className="mt-1 text-[11px] text-slate-500">
                Metrics: MRR, ARR, churn, LTV, ARPU, cohort heatmaps.
            </div>
            </div>

            </div>
        </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-slate-900/80 bg-slate-950">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-2 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
              <FeatureCard 
                title="Automated dashboards"
                body="Stay on top of revenue, margin, repeat customers, and marketing ROI — without building a single report manually."
              /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard
                title="AI-generated insights"
                body="Let Valora AI scan your data for anomalies, trends, and opportunities, and summarize them in plain language."
              />
              <FeatureCard
                title="One-click reports"
                body="Generate monthly, quarterly, or investor-ready PDFs with a single click — branded with your logo."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard
                title="Ecommerce intelligence"
                body="Track SKU performance, margin by product, cart behavior, and repeat order trends to grow smarter."
              />
              <FeatureCard
                title="Secure & private"
                body="Your data is encrypted at rest and in transit. You stay in control of who sees what, across your team."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-b border-slate-900/80 bg-slate-950/95"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  From raw data to decisions in minutes.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                  Valora AI is built so that founders and operators — not just
                  data teams — can get to answers quickly.
                </p>
              </div>
              <div className="inline-flex items-center bg-slate-900/80 border border-slate-700 text-[11px] px-3 py-1 rounded-full text-slate-300">
                No implementation team required
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StepCard
                step="1"
                title="Connect your tools"
                body="Link Shopify, Stripe, payment processors, ads platforms, or CSV exports. Start with whatever you have today."
              />
              <StepCard
                step="2"
                title="Let AI map your data"
                body="Valora cleans, joins, and models your data behind the scenes to create a unified view of your business."
              />
              <StepCard
                step="3"
                title="Get insights & reports"
                body="Use pre-built dashboards and AI-generated narratives to make confident decisions every week."
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="border-b border-slate-900/80 bg-slate-950"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Simple pricing for growing businesses.
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                Start free, then upgrade only when Valora AI becomes a relied-on
                part of your weekly decision-making.
              </p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Frequently asked questions.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 max-w-lg">
                  If you&apos;re wondering whether Valora AI is the right fit,
                  here are answers to common questions from founders and
                  operators like you.
                </p>
              </div>

              <div className="space-y-3 text-sm text-slate-200">
                <FaqItem
                  question="Do I need a data team or engineer to get value from Valora AI?"
                  answer="No. Valora AI is designed for non-technical founders and operators. If you can connect tools like Shopify or Stripe, you can use Valora."
                />
                <FaqItem
                  question="Which tools can I connect?"
                  answer="In the early versions, you'll be able to connect Shopify, Stripe, CSV exports, and selected ad platforms. More integrations will be added based on demand."
                />
                <FaqItem
                  question="Can I use Valora AI just for reporting?"
                  answer="Yes. Many teams start by using Valora as their reporting layer and then begin using the AI insights once they trust the numbers."
                />
                <FaqItem
                  question="Is my data secure?"
                  answer="Yes. Your data is encrypted in transit and at rest. You remain the owner of your data, and you can disconnect integrations at any time."
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-100">
            Request a Valora AI demo
            </h3>
            <button
            onClick={() => setIsDemoOpen(false)}
            className="text-slate-400 hover:text-slate-200"
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
            className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-2 text-xs text-slate-200">
            <option>E-commerce</option>
            <option>SaaS</option>
            <option>Insurance</option>
            <option>Healthcare</option>
            <option>Supply Chain</option>
            <option>Finance / Banking</option>
            </select>
        </div>

        <button
        onClick={handleDemoSubmit}
        className="mt-4 w-full h-9 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-semibold hover:from-cyan-300 hover:to-emerald-300">
        Submit request
        </button>
        {demoSubmitted && (
        <div className="mt-3 text-[11px] text-emerald-300">
            Request received — we’ll email you shortly.
        </div>
        )}
        {demoError && (
        <div className="mt-3 text-[11px] text-rose-300">
            {demoError}
        </div>
        )}
        <div className="mt-3 text-[11px] text-slate-500 text-center">
            We typically respond within 24 hours.
        </div>
        </div>
    </div>
    )}


      </main>
    </div>
  );
};




interface MetricTileProps {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
}

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
  step: string;
  title: string;
  body: string;
}

const StepCard: React.FC<StepCardProps> = ({ step, title, body }) => (
  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
    <div className="h-7 w-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[11px] text-slate-300 mb-2">
      {step}
    </div>
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