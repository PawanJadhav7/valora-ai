"use client";

import React from "react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-slate-800 bg-slate-950/80">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center font-bold text-slate-950 text-lg">
            V
          </div>
          <div>
            <div className="text-sm font-semibold">Valora AI</div>
            <div className="text-[11px] text-slate-400">Analytics workspace</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 text-sm space-y-1">
          <SidebarItem label="Overview" active />
          <SidebarItem label="Revenue" />
          <SidebarItem label="Customers" />
          <SidebarItem label="Products" />
          <SidebarItem label="Reports" />
        </nav>

        <div className="px-4 py-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span>Usage</span>
            <span className="text-slate-200 font-medium">68%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-900">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
          </div>
          <div className="flex items-center justify-between">
            <span>10 of 15 reports used</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="border-b border-slate-800 bg-slate-950/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">
                Client insights overview
              </h1>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                A snapshot of revenue, customers, and product performance for your business.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg text-xs md:text-sm border border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800">
                Export
              </button>
              <button className="px-3 py-1.5 rounded-lg text-xs md:text-sm bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-semibold hover:from-cyan-300 hover:to-emerald-300">
                Generate report
              </button>
            </div>
          </div>
        </header>

        {/* Content area */}
        <section className="flex-1 bg-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select className="bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200">
                <option>All clients</option>
                <option>Demo store A</option>
                <option>Demo store B</option>
              </select>
              <select className="bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 12 months</option>
              </select>
              <input
                type="text"
                placeholder="Search by product, region, customer..."
                className="flex-1 min-w-[180px] bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 placeholder:text-slate-500"
              />
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total revenue"
                value="$182,430"
                delta="+14.2% vs last period"
                positive
              />
              <KpiCard
                label="Gross margin"
                value="39.4%"
                delta="+2.1 pts"
                positive
              />
              <KpiCard
                label="Repeat customers"
                value="46%"
                delta="+5.3 pts"
                positive
              />
              <KpiCard
                label="At-risk revenue"
                value="$12,900"
                delta="-8.1% vs last period"
                positive={false}
              />
            </div>

            {/* Chart + insights row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/90 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-medium text-slate-100">
                    Revenue & margin trend
                  </span>
                  <span>Last 6 months</span>
                </div>
                <div className="h-48 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-500">
                  Chart placeholder — connect to real data later.
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs space-y-2">
                <div className="font-medium text-slate-100 mb-1">
                  AI-generated insights (demo)
                </div>
                <InsightItem
                  title="Revenue concentration"
                  body="Top 3 products contribute 57% of total revenue. Consider adding similar SKUs or bundles."
                />
                <InsightItem
                  title="Margin leakage"
                  body="Discounts in the last 30 days reduced margin by ~3.2 pts without improving conversion."
                />
                <InsightItem
                  title="Churn risk"
                  body="5 high-value customers reduced order frequency by >40% compared to last quarter."
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="font-medium text-slate-100">
                  Segment performance snapshot
                </span>
                <button className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-900/80 text-[11px] text-slate-200 hover:bg-slate-800">
                  Download CSV
                </button>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                      <th className="text-left px-2 py-2">Segment</th>
                      <th className="text-right px-2 py-2">Revenue</th>
                      <th className="text-right px-2 py-2">Margin</th>
                      <th className="text-right px-2 py-2">YoY growth</th>
                      <th className="text-right px-2 py-2">Customers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        segment: "Enterprise",
                        revenue: "$95,200",
                        margin: "44%",
                        growth: "+18%",
                        customers: "24",
                        positive: true,
                      },
                      {
                        segment: "Mid-market",
                        revenue: "$58,400",
                        margin: "35%",
                        growth: "+9%",
                        customers: "62",
                        positive: true,
                      },
                      {
                        segment: "SMB",
                        revenue: "$28,830",
                        margin: "27%",
                        growth: "-4%",
                        customers: "87",
                        positive: false,
                      },
                    ].map((row) => (
                      <tr
                        key={row.segment}
                        className="border-t border-slate-900/70 hover:bg-slate-900/60"
                      >
                        <td className="px-2 py-2 text-slate-100">
                          {row.segment}
                        </td>
                        <td className="px-2 py-2 text-right text-slate-200">
                          {row.revenue}
                        </td>
                        <td className="px-2 py-2 text-right text-slate-200">
                          {row.margin}
                        </td>
                        <td
                          className={`px-2 py-2 text-right font-medium ${
                            row.positive ? "text-emerald-300" : "text-rose-300"
                          }`}
                        >
                          {row.growth}
                        </td>
                        <td className="px-2 py-2 text-right text-slate-300">
                          {row.customers}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---- Small helper components below ---- */

interface SidebarItemProps {
  label: string;
  active?: boolean;
}

function SidebarItem({ label, active }: SidebarItemProps) {
  return (
    <button
      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition ${
        active
          ? "bg-slate-800 text-slate-50"
          : "text-slate-300 hover:bg-slate-900 hover:text-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
}

function KpiCard({ label, value, delta, positive = true }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-1">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-semibold text-slate-50">{value}</span>
        <span
          className={`text-[11px] font-medium ${
            positive ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {positive ? "▲" : "▼"} {delta}
        </span>
      </div>
      <div className="text-[10px] text-slate-500">
        Auto-updated from your latest data sync (demo values).
      </div>
    </div>
  );
}

interface InsightItemProps {
  title: string;
  body: string;
}

function InsightItem({ title, body }: InsightItemProps) {
  return (
    <div className="border border-slate-800 rounded-lg p-2.5 bg-slate-950/80">
      <div className="text-[11px] font-semibold text-slate-100 mb-1">
        {title}
      </div>
      <div className="text-[11px] text-slate-400 leading-snug">{body}</div>
    </div>
  );
}