import { describe, it, expect } from 'vitest';
import { buildOrderTimeline } from '../order-timeline';

describe('buildOrderTimeline', () => {
  it('pending payment shows current payment step', () => {
    const steps = buildOrderTimeline({
      orderStatus: 'pending',
      paymentStatus: 'pending',
      productTypes: ['digital'],
    });
    expect(steps.find(s => s.id === 'payment')?.status).toBe('current');
    expect(steps.some(s => s.id === 'complete')).toBe(false);
  });

  it('paid digital order reaches fulfillment', () => {
    const steps = buildOrderTimeline({
      orderStatus: 'completed',
      paymentStatus: 'paid',
      productTypes: ['digital', 'course'],
    });
    expect(steps.find(s => s.id === 'payment')?.status).toBe('done');
    expect(steps.find(s => s.id === 'fulfill-digital')?.label).toMatch(/Téléchargement/);
    expect(steps.find(s => s.id === 'fulfill-course')?.label).toMatch(/cours/);
    expect(steps.find(s => s.id === 'complete')?.status).toBe('done');
  });

  it('cancelled order stops at cancelled step', () => {
    const steps = buildOrderTimeline({
      orderStatus: 'cancelled',
      paymentStatus: 'refunded',
      productTypes: ['physical'],
    });
    expect(steps.some(s => s.id === 'cancelled')).toBe(true);
    expect(steps.some(s => s.id === 'complete')).toBe(false);
  });
});
