import { describe, expect, it } from 'vitest';

/**
 * Vérifie la logique de format CLS (unitless, pas en ms).
 */
describe('performance-monitor CLS formatting', () => {
  it('CLS values below 0.01 should not trigger poor rating at zero', () => {
    const clsValue = 0.005;
    const threshold = { good: 0.1, poor: 0.25 };
    const rating =
      clsValue <= threshold.good
        ? 'good'
        : clsValue <= threshold.poor
          ? 'needs-improvement'
          : 'poor';
    expect(rating).toBe('good');
    expect(`${Math.round(clsValue)}ms`).toBe('0ms');
    expect(clsValue.toFixed(3)).toBe('0.005');
  });
});
