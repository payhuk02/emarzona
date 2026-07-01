import { describe, expect, it } from 'vitest';
import { shouldUseStripeTax, UEMOA_TAX_COUNTRIES } from '@/lib/checkout/tax-zones';

describe('tax-zones', () => {
  it('UEMOA uses local RPC not Stripe Tax', () => {
    for (const cc of UEMOA_TAX_COUNTRIES) {
      expect(shouldUseStripeTax(cc)).toBe(false);
    }
  });

  it('EU/US routes to Stripe Tax', () => {
    expect(shouldUseStripeTax('FR')).toBe(true);
    expect(shouldUseStripeTax('US')).toBe(true);
    expect(shouldUseStripeTax('DE')).toBe(true);
    expect(shouldUseStripeTax('GB')).toBe(true);
  });

  it('unknown country does not use Stripe Tax', () => {
    expect(shouldUseStripeTax('ZZ')).toBe(false);
  });
});
