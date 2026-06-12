/**
 * Validation réservation service (RPC Supabase) — testable sans React Query.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BookingValidationOptions {
  productId: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  staffMemberId?: string;
  excludeBookingId?: string;
}

export async function validateServiceBooking(
  options: BookingValidationOptions
): Promise<BookingValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const { data: advanceCheck, error: advanceError } = await supabase.rpc(
      'check_advance_booking_days',
      {
        p_product_id: options.productId,
        p_scheduled_date: options.scheduledDate,
      }
    );

    if (!advanceError && advanceCheck && advanceCheck.length > 0 && !advanceCheck[0].is_valid) {
      errors.push(advanceCheck[0].message || 'Date de réservation invalide');
    }

    const { data: maxBookingsCheck, error: maxBookingsError } = await supabase.rpc(
      'check_max_bookings_per_day',
      {
        p_product_id: options.productId,
        p_scheduled_date: options.scheduledDate,
        p_exclude_booking_id: options.excludeBookingId || null,
      }
    );

    if (
      !maxBookingsError &&
      maxBookingsCheck &&
      maxBookingsCheck.length > 0 &&
      !maxBookingsCheck[0].is_within_limit
    ) {
      errors.push(maxBookingsCheck[0].message || 'Limite quotidienne atteinte');
    }

    const { data: conflictCheck, error: conflictError } = await supabase.rpc(
      'check_booking_conflicts',
      {
        p_product_id: options.productId,
        p_scheduled_date: options.scheduledDate,
        p_scheduled_start_time: options.scheduledStartTime,
        p_scheduled_end_time: options.scheduledEndTime,
        p_staff_member_id: options.staffMemberId || null,
        p_exclude_booking_id: options.excludeBookingId || null,
      }
    );

    if (
      !conflictError &&
      conflictCheck &&
      conflictCheck.length > 0 &&
      conflictCheck[0].has_conflict
    ) {
      errors.push(conflictCheck[0].conflict_message || 'Conflit de réservation détecté');
    }

    // Epic 3.3.4 — conflits calendrier externe (Google Calendar busy)
    const startIso = `${options.scheduledDate}T${options.scheduledStartTime}`;
    const endIso = `${options.scheduledDate}T${options.scheduledEndTime}`;
    const { data: calendarConflicts, error: calendarError } = await supabase.rpc(
      'detect_calendar_conflicts',
      {
        p_service_id: options.productId,
        p_start_time: startIso,
        p_end_time: endIso,
        p_exclude_booking_id: options.excludeBookingId || null,
      }
    );

    if (!calendarError && calendarConflicts && calendarConflicts.length > 0) {
      const external = calendarConflicts.find(
        (c: { conflict_type: string }) => c.conflict_type === 'calendar_event'
      );
      if (external) {
        errors.push('Créneau occupé sur votre calendrier Google connecté');
      }
    }

    if (errors.length > 0) {
      logger.warn('Validation de réservation échouée', { options, errors });
    }

    return { isValid: errors.length === 0, errors, warnings };
  } catch (error) {
    logger.error('Erreur lors de la validation de réservation', error);
    return {
      isValid: false,
      errors: ['Erreur lors de la validation. Veuillez réessayer.'],
      warnings: [],
    };
  }
}
