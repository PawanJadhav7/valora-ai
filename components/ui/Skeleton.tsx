// components/ui/Skeleton.tsx
import * as React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-lg bg-muted/60",
        "ring-1 ring-border/60",
        className,
      ].join(" ")}
    />
  );
}