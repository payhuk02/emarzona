import { describe, expect, it } from 'vitest';
import { validateBuyNowForm } from '../checkout-buy-now-validation';
import type { CheckoutFormData } from '../checkout-buy-now-types';

const baseForm = (): CheckoutFormData => ({
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '+22670123456',
  address: '',
  city: '',
  country: '',
  postalCode: '',
});

describe('validateBuyNowForm', () => {
  it('allows digital checkout without shipping address', () => {
    const errors = validateBuyNowForm(baseForm());
    expect(errors).toEqual({});
  });

  it('requires shipping fields for physical / COD orders', () => {
    const errors = validateBuyNowForm(baseForm(), { requireShippingAddress: true });
    expect(errors.address).toBeTruthy();
    expect(errors.city).toBeTruthy();
    expect(errors.country).toBeTruthy();
  });

  it('accepts complete shipping address for physical', () => {
    const errors = validateBuyNowForm(
      {
        ...baseForm(),
        address: '123 Rue Test',
        city: 'Ouagadougou',
        country: 'Burkina Faso',
      },
      { requireShippingAddress: true }
    );
    expect(errors).toEqual({});
  });
});
