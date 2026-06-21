import { describe, expect, it } from 'vitest';
import {
  PHYSICAL_PLAN_CARDS,
  PHYSICAL_PLAN_DISPLAY,
  physicalPlanLabel,
} from '@/lib/billing/physical-plan-display';

describe('physical-plan-display', () => {
  it('expose les libellés Starter / Professional / Business', () => {
    expect(PHYSICAL_PLAN_DISPLAY.physical_basic.label).toBe('Starter');
    expect(PHYSICAL_PLAN_DISPLAY.physical_standard.label).toBe('Professional');
    expect(PHYSICAL_PLAN_DISPLAY.physical_premium.label).toBe('Business');
  });

  it('conserve les prix 25 / 49 / 79 USD', () => {
    const prices = PHYSICAL_PLAN_CARDS.map(p => p.priceUsd);
    expect(prices).toEqual([25, 49, 79]);
  });

  it('physicalPlanLabel retourne un libellé lisible', () => {
    expect(physicalPlanLabel('physical_standard')).toBe('Professional');
    expect(physicalPlanLabel(null)).toBe('Physique');
  });
});
