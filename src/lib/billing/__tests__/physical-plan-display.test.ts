import { describe, expect, it } from 'vitest';
import {
  PHYSICAL_PLAN_CARDS,
  PHYSICAL_PLAN_DISPLAY,
  physicalPlanLabel,
} from '@/lib/billing/physical-plan-display';

describe('physical-plan-display', () => {
  it('expose les libellés Starter / Professional / Enterprise', () => {
    expect(PHYSICAL_PLAN_DISPLAY.physical_basic.label).toBe('Starter');
    expect(PHYSICAL_PLAN_DISPLAY.physical_standard.label).toBe('Professional');
    expect(PHYSICAL_PLAN_DISPLAY.physical_premium.label).toBe('Enterprise');
  });

  it('conserve les prix 7500 / 12500 / 15000', () => {
    const prices = PHYSICAL_PLAN_CARDS.map(p => p.price);
    expect(prices).toEqual([7500, 12500, 15000]);
  });

  it('physicalPlanLabel retourne un libellé lisible', () => {
    expect(physicalPlanLabel('physical_standard')).toBe('Professional');
    expect(physicalPlanLabel(null)).toBe('Physique');
  });
});
