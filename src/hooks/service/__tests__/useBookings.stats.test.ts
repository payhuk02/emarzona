import { describe, expect, it } from 'vitest';
import { mapServiceBookingRow } from '@/hooks/service/useBookings';

describe('mapServiceBookingRow', () => {
  it('maps scheduled_date and amount_paid to UI aliases', () => {
    const row = mapServiceBookingRow({
      id: 'b1',
      product_id: 'p1',
      status: 'completed',
      scheduled_date: '2026-06-15',
      scheduled_start_time: '14:30:00',
      amount_paid: 12500,
      participants_count: 1,
      total_price: 0,
      deposit_paid: 0,
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
      product: { price: 15000 },
    });

    expect(row.booking_date).toBe('2026-06-15');
    expect(row.booking_time).toBe('14:30:00');
    expect(row.total_price).toBe(12500);
  });

  it('falls back to product price when amount_paid is null', () => {
    const row = mapServiceBookingRow({
      id: 'b2',
      product_id: 'p2',
      status: 'confirmed',
      scheduled_date: '2026-06-16',
      scheduled_start_time: '09:00:00',
      amount_paid: null,
      participants_count: 1,
      total_price: 0,
      deposit_paid: 0,
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
      product: { price: 8000 },
    });

    expect(row.total_price).toBe(8000);
  });
});
