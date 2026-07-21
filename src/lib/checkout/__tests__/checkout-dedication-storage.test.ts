import { describe, it, expect, beforeEach } from 'vitest';
import {
  storeCheckoutDedication,
  readCheckoutDedication,
  clearCheckoutDedication,
} from '../checkout-dedication-storage';

describe('checkout-dedication-storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stores and reads dedication for a product', () => {
    storeCheckoutDedication('prod-1', {
      dedication_text: 'Pour Marie',
      recipient_name: 'Marie',
    });
    expect(readCheckoutDedication('prod-1')?.dedication_text).toBe('Pour Marie');
    clearCheckoutDedication('prod-1');
    expect(readCheckoutDedication('prod-1')).toBeNull();
  });
});
