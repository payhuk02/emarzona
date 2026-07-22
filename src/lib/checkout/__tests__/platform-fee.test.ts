import { describe, it, expect } from 'vitest';
import {
  applyCheckoutPlatformFee,
  getCheckoutPlatformFee,
  CHECKOUT_PLATFORM_FEE_FIXED_XOF,
} from '../platform-fee';

describe('checkout platform fee', () => {
  it('ajoute 2% + 100 XOF sur un montant XOF', () => {
    // 3500 * 0.02 = 70 ; + 100 = 170 frais ; total 3670
    expect(getCheckoutPlatformFee(3500, 'XOF')).toBe(170);
    expect(applyCheckoutPlatformFee(3500, 'XOF')).toBe(3670);
  });

  it('arrondit correctement pour XOF', () => {
    // 3333 * 0.02 = 66.66 → arrondi avec le fixe
    expect(getCheckoutPlatformFee(3333, 'XOF')).toBe(Math.round(3333 * 0.02 + 100));
  });

  it('retourne 0 si sous-total nul', () => {
    expect(getCheckoutPlatformFee(0, 'XOF')).toBe(0);
    expect(applyCheckoutPlatformFee(0, 'XOF')).toBe(0);
  });

  it('expose le forfait 100 FCFA', () => {
    expect(CHECKOUT_PLATFORM_FEE_FIXED_XOF).toBe(100);
  });
});
