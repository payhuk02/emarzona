/**
 * Règles d’annulation / replanification côté client (allow_booking_cancellation + délai).
 */

export type ServiceCancellationPolicyFields = {
  allow_booking_cancellation?: boolean | null;
  cancellation_deadline_hours?: number | null;
};

export type BookingScheduleFields = {
  status?: string | null;
  scheduled_date?: string | null;
  booking_date?: string | null;
  scheduled_start_time?: string | null;
  booking_time?: string | null;
};

export type BookingActionEligibility = {
  allowed: boolean;
  reason?: string;
};

function parseBookingStart(booking: BookingScheduleFields): Date | null {
  const dateStr = booking.scheduled_date ?? booking.booking_date;
  if (!dateStr) return null;
  const timeRaw = booking.scheduled_start_time ?? booking.booking_time;
  const timeStr = timeRaw ? String(timeRaw).slice(0, 8) : '00:00:00';
  const iso =
    dateStr.length > 10
      ? dateStr
      : `${dateStr}T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function canCancelServiceBooking(
  booking: BookingScheduleFields,
  policy?: ServiceCancellationPolicyFields | null
): BookingActionEligibility {
  const status = booking.status || '';
  if (!['pending', 'confirmed'].includes(status)) {
    return { allowed: false, reason: 'Cette réservation ne peut plus être annulée.' };
  }

  if (policy && policy.allow_booking_cancellation === false) {
    return {
      allowed: false,
      reason: 'Le prestataire n’autorise pas l’annulation en ligne. Contactez-le directement.',
    };
  }

  const deadlineHours = Number(policy?.cancellation_deadline_hours);
  if (Number.isFinite(deadlineHours) && deadlineHours > 0) {
    const start = parseBookingStart(booking);
    if (start) {
      const msLeft = start.getTime() - Date.now();
      const hoursLeft = msLeft / (1000 * 60 * 60);
      if (hoursLeft < deadlineHours) {
        return {
          allowed: false,
          reason: `Annulation impossible à moins de ${deadlineHours} h du rendez-vous.`,
        };
      }
    }
  }

  return { allowed: true };
}

/** Même fenêtre que l’annulation : replanifier tant que le RDV est encore annulable. */
export function canRescheduleServiceBooking(
  booking: BookingScheduleFields,
  policy?: ServiceCancellationPolicyFields | null
): BookingActionEligibility {
  const status = booking.status || '';
  if (!['pending', 'confirmed'].includes(status)) {
    return { allowed: false, reason: 'Cette réservation ne peut plus être replanifiée.' };
  }

  if (policy && policy.allow_booking_cancellation === false) {
    return {
      allowed: false,
      reason:
        'Le prestataire n’autorise pas la replanification en ligne. Contactez-le directement.',
    };
  }

  const deadlineHours = Number(policy?.cancellation_deadline_hours);
  if (Number.isFinite(deadlineHours) && deadlineHours > 0) {
    const start = parseBookingStart(booking);
    if (start) {
      const hoursLeft = (start.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursLeft < deadlineHours) {
        return {
          allowed: false,
          reason: `Replanification impossible à moins de ${deadlineHours} h du rendez-vous.`,
        };
      }
    }
  }

  return { allowed: true };
}
