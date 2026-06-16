import { describe, it, expect } from 'vitest';
import { hasCapability, isConnectionActive, normalizeCurrency } from '@/lib/payments/constants';

describe('payments constants helpers', () => {
  it('normalizes currency with default XOF', () => {
    expect(normalizeCurrency(null)).toBe('XOF');
    expect(normalizeCurrency(' eur ')).toBe('EUR');
  });

  it('checks active connection status', () => {
    expect(isConnectionActive({ external_account_status: 'active' })).toBe(true);
    expect(isConnectionActive({ external_account_status: 'pending' })).toBe(false);
  });

  it('checks capabilities map', () => {
    expect(hasCapability(undefined, 'card_payments')).toBe(false);
    expect(hasCapability({ card_payments: true }, 'card_payments')).toBe(true);
    expect(hasCapability({ card_payments: 'active' }, 'card_payments')).toBe(true);
    expect(hasCapability({ card_payments: false }, 'card_payments')).toBe(false);
  });
});
