export function FinanceInsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 animate-pulse">
        <div className="h-4 w-32 bg-muted/50 rounded" />
        <div className="mt-3 h-3 w-3/4 bg-muted/40 rounded" />
        <div className="mt-2 h-3 w-2/3 bg-muted/40 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
            <div className="h-4 w-48 bg-muted/50 rounded" />
            <div className="mt-3 h-3 w-full bg-muted/40 rounded" />
            <div className="mt-2 h-3 w-5/6 bg-muted/40 rounded" />
            <div className="mt-4 h-3 w-2/3 bg-muted/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}