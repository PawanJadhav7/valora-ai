export function FinanceAnomaliesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-44 rounded bg-muted/40" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="h-3 w-28 rounded bg-muted/40" />
            <div className="mt-3 h-7 w-40 rounded bg-muted/40" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="h-3 w-44 rounded bg-muted/40" />
        <div className="mt-4 h-56 rounded-xl bg-muted/30" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="h-3 w-44 rounded bg-muted/40" />
        <div className="mt-4 h-40 rounded-xl bg-muted/30" />
      </div>
    </div>
  );
}