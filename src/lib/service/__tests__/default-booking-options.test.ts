import { describe, expect, it } from 'vitest';
import { createDefaultServiceBookingOptions } from '@/lib/service/default-booking-options';

describe('createDefaultServiceBookingOptions', () => {
  it('returns enabled booking defaults aligned with edit wizard', () => {
    expect(createDefaultServiceBookingOptions()).toEqual({
      allow_booking_cancellation: true,
      cancellation_deadline_hours: 24,
      require_approval: false,
      buffer_time_before: 0,
      buffer_time_after: 0,
      advance_booking_days: 30,
    });
  });
});
