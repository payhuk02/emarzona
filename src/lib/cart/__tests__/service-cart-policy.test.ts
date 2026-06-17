import { describe, expect, it } from 'vitest';
import {
  assertCanAddServiceToCart,
  buildServiceCartMetadata,
  formatServiceCartSlotLabel,
  hasServiceBookingMetadata,
} from '@/lib/cart/service-cart-policy';

describe('service-cart-policy', () => {
  it('detects booking metadata', () => {
    expect(hasServiceBookingMetadata({ booking_id: 'bk-1' })).toBe(true);
    expect(hasServiceBookingMetadata({ scheduled_at: '2026-06-15T14:00:00Z' })).toBe(true);
    expect(hasServiceBookingMetadata({ store_id: 'store-1' })).toBe(false);
  });

  it('rejects service add without reservation', () => {
    expect(() => assertCanAddServiceToCart({ store_id: 'store-1' })).toThrow(/réservés/i);
  });

  it('builds cart metadata for mixed checkout', () => {
    expect(
      buildServiceCartMetadata({
        storeId: 'store-1',
        bookingId: 'bk-1',
        serviceProductId: 'svc-1',
        scheduledAt: '2026-06-15T14:00:00Z',
        numberOfParticipants: 2,
      })
    ).toEqual({
      store_id: 'store-1',
      booking_id: 'bk-1',
      service_product_id: 'svc-1',
      scheduled_at: '2026-06-15T14:00:00Z',
      number_of_participants: 2,
    });
  });

  it('formats scheduled slot for cart display', () => {
    const label = formatServiceCartSlotLabel({ scheduled_at: '2026-06-15T14:00:00Z' });
    expect(label).toBeTruthy();
  });
});
