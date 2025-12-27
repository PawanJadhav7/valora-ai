export function FinanceOverviewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-40 bg-muted rounded" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-muted"
          />
        ))}
      </div>

      <div className="h-40 rounded-2xl bg-muted" />
    </div>
  );
}