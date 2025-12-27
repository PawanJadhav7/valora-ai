// components/FinanceSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { financeNav } from "@/app/finance/finance-nav";

export function FinanceSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-2xl border border-border bg-card p-4 space-y-6 h-fit md:text-sm h-9 shadow-lg shadow-cyan-500/25 hover:from-cyan-300 hover:to-blue-400">
      <div className="text-sm font-semibold text-foreground">Finance</div>

      {financeNav.map((group) => (
        <div key={group.section} className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {group.section}
          </div>

          {group.items.map((item) => {
            const active =
              item.href === "/finance"
                ? pathname === "/finance"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "block rounded-md px-2 py-1.5 text-sm transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}