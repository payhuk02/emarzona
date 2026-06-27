import { describe, expect, it } from 'vitest';
import {
  assessCartProtectEligibility,
  cartHasProtectCoveredItems,
  EMARZONA_PROTECT_CLAIM_WINDOW_DAYS,
  EMARZONA_PROTECT_MAX_AMOUNT_XOF,
  EMARZONA_PROTECT_VERSION,
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

const artistItem: CartItem = {
  product_id: 'a1',
  product_name: 'Enchère',
  product_type: 'artist',
  quantity: 1,
  unit_price: 50_000,
  currency: 'XOF',
};

describe('emarzona-protect-policy v2', () => {
  it('covers all marketplace verticals including service and artist', () => {
    expect(cartHasProtectCoveredItems([physicalItem])).toBe(true);
    expect(cartHasProtectCoveredItems([serviceItem])).toBe(true);
    expect(cartHasProtectCoveredItems([artistItem])).toBe(true);
  });

  it('assesses cart eligibility by amount and types (v2 limits)', () => {
    expect(assessCartProtectEligibility([physicalItem], 5000).eligible).toBe(true);
    expect(assessCartProtectEligibility([serviceItem], 5000).eligible).toBe(true);
    expect(assessCartProtectEligibility([physicalItem], 500).eligible).toBe(false);
    expect(
      assessCartProtectEligibility([physicalItem], EMARZONA_PROTECT_MAX_AMOUNT_XOF + 1).eligible
    ).toBe(false);
  });

  it('maps protect status payload with v2 defaults', () => {
    const status = mapProtectStatusPayload('order-1', {
      version: EMARZONA_PROTECT_VERSION,
      status: 'active',
      can_claim: true,
      eligible_on_paid: true,
      claim_window_days: EMARZONA_PROTECT_CLAIM_WINDOW_DAYS,
    });
    expect(status.canClaim).toBe(true);
    expect(status.claimWindowDays).toBe(45);
    expect(protectStatusLabel(status.status)).toMatch(/active/i);
  });
});

describe('protectStatusLabel', () => {
  it('labels claimed status', () => {
    expect(protectStatusLabel('claimed')).toMatch(/réclamation/i);
  });
});
