// app/finance/finance-nav.ts
export type FinanceNavItem = { label: string; href: string };
export type FinanceNavSection = { section: string; items: FinanceNavItem[] };


export const financeNav: FinanceNavSection[] = [
  {
    section: "Executive",
    items: [
      { label: "Overview", href: "/finance" },
      { label: "AI Insights", href: "/finance/insights" },
    ],
  },
  {
    section: "Core",
    items: [
      { label: "Cash Flow", href: "/finance/cashflow" },
      { label: "Expenses", href: "/finance/expenses" },
      { label: "Revenue", href: "/finance/revenue" },
    ],
  },
  {
    section: "Planning",
    items: [
      { label: "Budget", href: "/finance/budget" },
      { label: "Forecast", href: "/finance/forecast" },
    ],
  },
  {
    section: "Risk & Controls",
    items: [
      { label: "Liquidity", href: "/finance/liquidity" },
      { label: "Exposure", href: "/finance/exposure" },
      { label: "Anomalies", href: "/finance/anomalies" },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "Data Sources", href: "/finance/data" },
      { label: "Settings", href: "/finance/settings" },
    ],
  },
];