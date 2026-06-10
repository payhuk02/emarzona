import { describe, expect, it } from 'vitest';
import { extractCheckoutToken, withCheckoutTokenMetadata } from '@/lib/checkout/checkout-access';

describe('checkout-access', () => {
  it('extracts checkout_token from metadata', () => {
    expect(extractCheckoutToken({ checkout_token: 'abc123' })).toBe('abc123');
  });

  it('returns undefined for invalid metadata', () => {
    expect(extractCheckoutToken(null)).toBeUndefined();
    expect(extractCheckoutToken({ checkout_token: '' })).toBeUndefined();
  });

  it('merges checkout token into metadata', () => {
    expect(withCheckoutTokenMetadata({ foo: 'bar' }, 'tok')).toEqual({
      foo: 'bar',
      checkout_token: 'tok',
    });
  });
});
