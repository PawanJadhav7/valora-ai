import Link from "next/link";

import { FinanceSidebar } from "@/components/FinanceSidebar";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center font-semibold text-slate-950 text-sm">
              V
            </div>
            <div className="text-sm font-semibold">Valora AI</div>

            {/* domain context indicator */}
            <span className="ml-2 text-[11px] px-2 py-1 rounded-full border border-slate-800 bg-slate-950/80 text-slate-300">
              Finance
            </span>
          </div>

          {/* keep “Manage Domain” as config entry point */}
          <Link
            href="/managedomain"
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50"
          >
            Manage Domain
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <FinanceSidebar />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}