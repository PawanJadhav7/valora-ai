export const money = (n: number, currency = "USD") =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });