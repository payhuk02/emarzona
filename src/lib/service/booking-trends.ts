/**
 * Tendances période — comparaison moitié récente vs moitié antérieure (données journalières).
 */

export type DailyCountPoint = { date: string; count: number };
export type DailyAmountPoint = { date: string; amount: number };

function sumCounts(points: DailyCountPoint[]): number {
  return points.reduce((sum, p) => sum + p.count, 0);
}

function sumAmounts(points: DailyAmountPoint[]): number {
  return points.reduce((sum, p) => sum + p.amount, 0);
}

/** Variation en % entre deux totaux (0 si base nulle et courant nul). */
export function computePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/** Tendance à partir de séries journalières (2e moitié vs 1re moitié). */
export function computeTrendFromDailyCounts(points: DailyCountPoint[]): number {
  if (points.length < 2) return 0;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const mid = Math.floor(sorted.length / 2);
  const previous = sumCounts(sorted.slice(0, mid));
  const current = sumCounts(sorted.slice(mid));
  return computePercentChange(current, previous);
}

export function computeTrendFromDailyAmounts(points: DailyAmountPoint[]): number {
  if (points.length < 2) return 0;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const mid = Math.floor(sorted.length / 2);
  const previous = sumAmounts(sorted.slice(0, mid));
  const current = sumAmounts(sorted.slice(mid));
  return computePercentChange(current, previous);
}

/** Map bookingsByDay du dashboard vers points journaliers. */
export function mapBookingsByDayToTrendPoints(
  bookingsByDay: { date: string; count: number }[]
): DailyCountPoint[] {
  return bookingsByDay.map(d => ({ date: d.date, count: d.count }));
}
