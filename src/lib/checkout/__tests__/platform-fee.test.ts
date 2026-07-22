import {
  applyCheckoutPlatformFee,
  getCheckoutPlatformFee,
  CHECKOUT_PLATFORM_FEE_FIXED_XOF,
  CHECKOUT_PLATFORM_FEE_RATE,
} from '@/lib/checkout/platform-fee';

describe('checkout platform fee', () => {
  it('ajoute 2% + 100 XOF sur un montant XOF', () => {
    expect(getCheckoutPlatformFee(3500, 'XOF')).toBe(170);
    expect(applyCheckoutPlatformFee(3500, 'XOF')).toBe(3670);
  });

  it('arrondit correctement le pourcentage', () => {
    expect(getCheckoutPlatformFee(3333, 'XOF')).toBe(Math.round(3333 * 0.02 + 100));
  });

  it('retourne 0 pour un sous-total nul', () => {
    expect(getCheckoutPlatformFee(0, 'XOF')).toBe(0);
    expect(applyCheckoutPlatformFee(0, 'XOF')).toBe(0);
  });

  it('expose les constantes de tarification', () => {
    expect(CHECKOUT_PLATFORM_FEE_FIXED_XOF).toBe(100);
    expect(CHECKOUT_PLATFORM_FEE_RATE).toBe(0.02);
  });
});
