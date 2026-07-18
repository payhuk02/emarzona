import type { ServiceBookingOptions } from '@/types/service-product';

export function createDefaultServiceBookingOptions(): ServiceBookingOptions {
  return {
    allow_booking_cancellation: true,
    cancellation_deadline_hours: 24,
    require_approval: false,
    buffer_time_before: 0,
    buffer_time_after: 0,
    advance_booking_days: 30,
  };
}
