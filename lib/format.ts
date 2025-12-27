export const money = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export const pct = (n: number, digits = 2) => `${Number(n ?? 0).toFixed(digits)}%`;
export const int = (n: number) => `${Math.round(Number(n ?? 0))}`;