import { describe, expect, it } from 'vitest';
import {
  formatPhysicalDimensions,
  formatPhysicalWeight,
  getPhysicalSellableQuantity,
} from '@/lib/physical/physical-product-display';

describe('physical-product-display', () => {
  it('sums sellable quantity from quantity_available', () => {
    const qty = getPhysicalSellableQuantity([
      { variant_id: null, quantity_available: 5 },
      { variant_id: 'v1', quantity_available: 3 },
    ]);
    expect(qty).toBe(5);
  });

  it('derives sellable quantity from quantity minus reserved', () => {
    const qty = getPhysicalSellableQuantity([
      { variant_id: null, quantity: 10, reserved_quantity: 2 },
    ]);
    expect(qty).toBe(8);
  });

  it('formats weight from canonical schema', () => {
    expect(formatPhysicalWeight({ weight: 1.2, weight_unit: 'kg' })).toBe('1.2 kg');
    expect(formatPhysicalWeight({ weight_kg: 2 })).toBe('2 kg');
  });

  it('formats dimensions with cm fallback', () => {
    expect(formatPhysicalDimensions({ length_cm: 10, width_cm: 20, height_cm: 5 })).toBe(
      '10 × 20 × 5 cm'
    );
  });
});
