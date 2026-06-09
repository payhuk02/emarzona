import { describe, expect, it } from 'vitest';
import { mapMyBookingRows } from '@/hooks/service/useBookings';

describe('mapMyBookingRows', () => {
  it('flattens service details from nested product.service', () => {
    const rows = mapMyBookingRows([
      {
        id: 'b1',
        product_id: 'p1',
        user_id: 'u1',
        status: 'confirmed',
        scheduled_date: '2026-06-10',
        scheduled_start_time: '10:00:00',
        scheduled_end_time: '11:00:00',
        participants_count: 1,
        total_price: 0,
        deposit_paid: 0,
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
        product: {
          id: 'p1',
          name: 'Coaching',
          image_url: null,
          service: {
            location_type: 'online',
            location_address: 'Paris',
            meeting_url: 'https://meet.example.com',
          },
        },
      },
    ]);

    expect(rows[0].product?.name).toBe('Coaching');
    expect((rows[0] as { service?: { meeting_url?: string } }).service?.meeting_url).toBe(
      'https://meet.example.com'
    );
  });
});
