import { describe, it, expect } from 'vitest';
import { buildPspFallbackUserMessage } from '@/lib/payments/psp-fallback-messages';

describe('buildPspFallbackUserMessage', () => {
  it('explains provider_not_ready fallback to MoneyFusion', () => {
    const msg = buildPspFallbackUserMessage('stripe_connect', 'provider_not_ready');
    expect(msg.title).toBe('Changement de moyen de paiement');
    expect(msg.description).toContain("Stripe n'est pas disponible");
    expect(msg.description).toContain('MoneyFusion');
  });

  it('explains provider_error fallback to MoneyFusion', () => {
    const msg = buildPspFallbackUserMessage('paypal_commerce', 'provider_error');
    expect(msg.description).toContain('PayPal');
    expect(msg.description).toContain('MoneyFusion');
  });

  it('falls back to generic message', () => {
    const msg = buildPspFallbackUserMessage('geniuspay_platform');
    expect(msg.description).toContain('MoneyFusion');
  });
});
