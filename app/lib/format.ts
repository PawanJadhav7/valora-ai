// lib/format.ts
export const money = (n: number) =>
  Number(n || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export const pct = (n: number) =>
  `${Number(n || 0).toFixed(2)}%`;