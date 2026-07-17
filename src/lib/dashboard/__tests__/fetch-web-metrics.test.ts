import { describe, expect, it } from 'vitest';
import { parseWebMetricsPayload, calcPageViewGrowth } from '@/lib/dashboard/fetch-web-metrics';

describe('parseWebMetricsPayload', () => {
  it('maps RPC web metrics JSON', () => {
    const parsed = parseWebMetricsPayload({
      pageViews: 50,
      previousPeriodPageViews: 25,
      bounceRate: 33.3,
      sessionDuration: 120,
    });

    expect(parsed.pageViews).toBe(50);
    expect(parsed.previousPeriodPageViews).toBe(25);
    expect(parsed.bounceRate).toBe(33.3);
    expect(parsed.sessionDuration).toBe(120);
  });
});

describe('calcPageViewGrowth', () => {
  it('computes growth vs previous period', () => {
    expect(calcPageViewGrowth(150, 100)).toBe(50);
    expect(calcPageViewGrowth(10, 0)).toBe(100);
    expect(calcPageViewGrowth(0, 0)).toBe(0);
  });
});
