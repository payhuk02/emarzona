import { describe, expect, it } from 'vitest';
import {
  canCancelServiceBooking,
  canRescheduleServiceBooking,
} from '../service-booking-cancellation';

describe('canCancelServiceBooking', () => {
  const future = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  })();

  it('allows pending/confirmed by default', () => {
    expect(
      canCancelServiceBooking({
        status: 'confirmed',
        scheduled_date: future,
        scheduled_start_time: '10:00',
      }).allowed
    ).toBe(true);
  });

  it('blocks completed bookings', () => {
    expect(canCancelServiceBooking({ status: 'completed', scheduled_date: future }).allowed).toBe(
      false
    );
  });

  it('blocks when seller disables cancellation', () => {
    const result = canCancelServiceBooking(
      { status: 'confirmed', scheduled_date: future, scheduled_start_time: '10:00' },
      { allow_booking_cancellation: false, cancellation_deadline_hours: 24 }
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/n’autorise pas/i);
  });

  it('blocks inside the deadline window', () => {
    const soon = new Date();
    soon.setHours(soon.getHours() + 2);
    const date = soon.toISOString().slice(0, 10);
    const time = soon.toISOString().slice(11, 16);
    const result = canCancelServiceBooking(
      { status: 'confirmed', scheduled_date: date, scheduled_start_time: time },
      { allow_booking_cancellation: true, cancellation_deadline_hours: 24 }
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/24/);
  });

  it('mirrors cancel rules for reschedule', () => {
    expect(
      canRescheduleServiceBooking(
        { status: 'confirmed', scheduled_date: future, scheduled_start_time: '10:00' },
        { allow_booking_cancellation: true, cancellation_deadline_hours: 1 }
      ).allowed
    ).toBe(true);
  });
});
