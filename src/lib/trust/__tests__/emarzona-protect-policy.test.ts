import { describe, expect, it } from 'vitest';
import {
  assessCartProtectEligibility,
  cartHasProtectCoveredItems,
  isServiceOnlyCart,
  mapProtectStatusPayload,
  protectStatusLabel,
} from '@/lib/trust/emarzona-protect-policy';
import type { CartItem } from '@/types/cart';

const physicalItem: CartItem = {
  product_id: 'p1',
  product_name: 'T-shirt',
  product_type: 'physical',
  quantity: 1,
  unit_price: 5000,
  currency: 'XOF',
};

const serviceItem: CartItem = {
  product_id: 's1',
  product_name: 'Coiffure',
  product_type: 'service',
  quantity: 1,
  unit_price: 3000,
  currency: 'XOF',
};

describe('emarzona-protect-policy', () => {
  it('detects covered cart items', () => {
    expect(cartHasProtectCoveredItems([physicalItem])).toBe(true);
    expect(cartHasProtectCoveredItems([serviceItem])).toBe(false);
  });

  it('rejects service-only carts', () => {
    expect(isServiceOnlyCart([serviceItem])).toBe(true);
    expect(isServiceOnlyCart([serviceItem, physicalItem])).toBe(false);
  });

  it('assesses cart eligibility by amount and types', () => {
    expect(assessCartProtectEligibility([physicalItem], 5000).eligible).toBe(true);
    expect(assessCartProtectEligibility([physicalItem], 500).eligible).toBe(false);
    expect(assessCartProtectEligibility([serviceItem], 5000).eligible).toBe(false);
  });

  it('maps protect status payload', () => {
    const status = mapProtectStatusPayload('order-1', {
      version: 'v1',
      status: 'active',
      can_claim: true,
      eligible_on_paid: true,
      claim_window_days: 30,
    });
    expect(status.canClaim).toBe(true);
    expect(protectStatusLabel(status.status)).toMatch(/active/i);
  });
});

describe('protectStatusLabel', () => {
  it('labels claimed status', () => {
    expect(protectStatusLabel('claimed')).toMatch(/réclamation/i);
  });
});
