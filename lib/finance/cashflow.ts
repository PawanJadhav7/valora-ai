export type CashflowDailyPoint = {
  date: string;   // YYYY-MM-DD
  inflow: number;
  outflow: number;
  net: number;
};

export function buildFallbackCashflowSeries(params: {
  inflow30d: number;
  outflow30d: number;
  days?: number;
}): CashflowDailyPoint[] {
  const days = params.days ?? 30;

  // simple deterministic-ish pattern so it looks stable on refresh
  const inflowBase = params.inflow30d / days;
  const outflowBase = params.outflow30d / days;

  const today = new Date();
  const series: CashflowDailyPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    // small wave: -10%..+10%
    const wave = Math.sin((i / days) * Math.PI * 2) * 0.1;

    const inflow = Math.max(0, inflowBase * (1 + wave));
    const outflow = Math.max(0, outflowBase * (1 - wave * 0.8));
    const net = inflow - outflow;

    series.push({
      date: d.toISOString().slice(0, 10),
      inflow,
      outflow,
      net,
    });
  }

  return series;
}