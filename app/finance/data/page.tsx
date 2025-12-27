export default function FinanceDataSourcesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Data Sources</h1>
        <p className="text-sm text-muted-foreground">
          Configure where Finance data comes from (tables, views, uploads, integrations).
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">Connected (Current)</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium">Source</th>
                <th className="text-left py-2 px-3 font-medium">Type</th>
                <th className="text-left py-2 px-3 font-medium">Object</th>
                <th className="text-left py-2 px-3 font-medium">Used by</th>
                <th className="text-right py-2 pl-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3 text-foreground">Postgres</td>
                <td className="py-2 px-3 text-muted-foreground">Table</td>
                <td className="py-2 px-3 text-muted-foreground">
                  <code className="text-foreground">raw_finance_cashflow</code>
                </td>
                <td className="py-2 px-3 text-muted-foreground">Cashflow, Anomalies, Insights</td>
                <td className="py-2 pl-3 text-right text-foreground">✅ Active</td>
              </tr>

              <tr className="border-b border-border/60">
                <td className="py-2 pr-3 text-foreground">Postgres</td>
                <td className="py-2 px-3 text-muted-foreground">View</td>
                <td className="py-2 px-3 text-muted-foreground">
                  <code className="text-foreground">kpi.v_finance_kpis</code>
                </td>
                <td className="py-2 px-3 text-muted-foreground">Overview, AI Insights</td>
                <td className="py-2 pl-3 text-right text-foreground">✅ Active</td>
              </tr>

              <tr className="border-b border-border/60">
                <td className="py-2 pr-3 text-foreground">Postgres</td>
                <td className="py-2 px-3 text-muted-foreground">View</td>
                <td className="py-2 px-3 text-muted-foreground">
                  <code className="text-foreground">kpi.v_finance_cashflow_daily_30d</code>
                </td>
                <td className="py-2 px-3 text-muted-foreground">Cashflow</td>
                <td className="py-2 pl-3 text-right text-foreground">✅ Active</td>
              </tr>

              <tr className="border-b border-border/60">
                <td className="py-2 pr-3 text-foreground">Postgres</td>
                <td className="py-2 px-3 text-muted-foreground">View</td>
                <td className="py-2 px-3 text-muted-foreground">
                  <code className="text-foreground">kpi.v_finance_top_categories_30d</code>
                </td>
                <td className="py-2 px-3 text-muted-foreground">AI Insights</td>
                <td className="py-2 pl-3 text-right text-foreground">✅ Active</td>
              </tr>

              <tr>
                <td className="py-2 pr-3 text-foreground">Postgres</td>
                <td className="py-2 px-3 text-muted-foreground">View</td>
                <td className="py-2 px-3 text-muted-foreground">
                  <code className="text-foreground">kpi.v_finance_top_counterparties_30d</code>
                </td>
                <td className="py-2 px-3 text-muted-foreground">AI Insights</td>
                <td className="py-2 pl-3 text-right text-foreground">✅ Active</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-[11px] text-muted-foreground">
          Next: add “Test connection”, “Refresh views”, and future integrations (Plaid/CSV).
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">Planned (Later)</div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <div className="font-medium text-foreground">CSV Upload</div>
            <div className="text-muted-foreground">Import transactions manually</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <div className="font-medium text-foreground">Bank Feed</div>
            <div className="text-muted-foreground">Auto-sync inflow/outflow</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <div className="font-medium text-foreground">ERP Connector</div>
            <div className="text-muted-foreground">NetSuite / QuickBooks, etc.</div>
          </div>
        </div>
      </div>
    </div>
  );
}