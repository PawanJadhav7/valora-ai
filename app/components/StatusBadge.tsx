// app/components/StatusBadge.tsx
// Comment: Reusable status badge for domain diagnostics (Healthcare, Finance, Insurance).

export function StatusBadge({
  label,
  cls,
}: {
  label: string;
  cls: "emerald" | "amber" | "rose" | "slate";
}) {
  const styles = {
    emerald: "border-emerald-400/40 text-emerald-200 bg-emerald-500/10",
    amber: "border-amber-400/40 text-amber-200 bg-amber-500/10",
    rose: "border-rose-400/40 text-rose-200 bg-rose-500/10",
    slate: "border-slate-700 text-slate-300 bg-slate-900/50",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] ${styles[cls]}`}
    >
      {label}
    </span>
  );
}