export function CashflowPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="h-5 w-44 bg-muted/60 rounded mb-2" />
        <div className="h-4 w-72 bg-muted/40 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="h-4 w-24 bg-muted/50 rounded mb-3" />
            <div className="h-7 w-32 bg-muted/40 rounded" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="h-4 w-40 bg-muted/50 rounded mb-3" />
        <div className="h-56 bg-muted/30 rounded-xl" />
      </div>
    </div>
  );
}