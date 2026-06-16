import { describe, it, expect } from 'vitest';
import { buildPspFallbackUserMessage } from '@/lib/payments/psp-fallback-messages';

describe('buildPspFallbackUserMessage', () => {
  it('explains provider_not_ready fallback to Moneroo', () => {
    const msg = buildPspFallbackUserMessage('stripe_connect', 'provider_not_ready');
    expect(msg.title).toBe('Changement de moyen de paiement');
    expect(msg.description).toContain("Stripe n'est pas disponible");
    expect(msg.description).toContain('Moneroo');
  });

  it('explains provider_error fallback to Moneroo', () => {
    const msg = buildPspFallbackUserMessage('paypal_commerce', 'provider_error');
    expect(msg.description).toContain('PayPal');
    expect(msg.description).toContain('Moneroo');
  });

  it('falls back to generic message', () => {
    const msg = buildPspFallbackUserMessage('moneroo_platform');
    expect(msg.description).toContain('Moneroo');
  });
});
