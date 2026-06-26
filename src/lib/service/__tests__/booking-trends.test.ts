import { describe, expect, it } from 'vitest';
import {
  computePercentChange,
  computeTrendFromDailyAmounts,
  computeTrendFromDailyCounts,
} from '@/lib/service/booking-trends';

describe('booking-trends', () => {
  it('computePercentChange handles zero base', () => {
    expect(computePercentChange(0, 0)).toBe(0);
    expect(computePercentChange(10, 0)).toBe(100);
    expect(computePercentChange(15, 10)).toBe(50);
    expect(computePercentChange(5, 10)).toBe(-50);
  });

  it('computeTrendFromDailyCounts compares halves', () => {
    const trend = computeTrendFromDailyCounts([
      { date: '2026-01-01', count: 2 },
      { date: '2026-01-02', count: 2 },
      { date: '2026-01-03', count: 4 },
      { date: '2026-01-04', count: 4 },
    ]);
    expect(trend).toBe(100);
  });

  it('computeTrendFromDailyAmounts compares revenue halves', () => {
    const trend = computeTrendFromDailyAmounts([
      { date: '2026-01-01', amount: 100 },
      { date: '2026-01-02', amount: 100 },
      { date: '2026-01-03', amount: 50 },
      { date: '2026-01-04', amount: 50 },
    ]);
    expect(trend).toBe(-50);
  });
});
