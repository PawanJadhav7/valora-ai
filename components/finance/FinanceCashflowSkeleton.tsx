export function FinanceCashflowSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-44 rounded bg-muted/50 animate-pulse" />
      <div className="h-4 w-72 rounded bg-muted/40 animate-pulse" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="h-3 w-24 rounded bg-muted/40 animate-pulse" />
            <div className="mt-2 h-7 w-32 rounded bg-muted/50 animate-pulse" />
            <div className="mt-2 h-3 w-20 rounded bg-muted/30 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="h-4 w-40 rounded bg-muted/40 animate-pulse" />
        <div className="mt-3 h-48 w-full rounded-xl bg-muted/30 animate-pulse" />
      </div>
    </div>
  );
}