/**
 * Hook pour valider les réservations de services
 * Date: 1 Février 2025
 *
 * Utilise les fonctions SQL de validation pour vérifier
 * les règles métier avant création de réservation
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BookingValidationOptions {
  productId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledStartTime: string; // HH:MM:SS
  scheduledEndTime: string; // HH:MM:SS
  staffMemberId?: string;
  excludeBookingId?: string;
}

/**
 * Hook pour valider une réservation avant création
 *
 * Vérifie :
 * - Conflits de temps (staff et global)
 * - Buffer_time
 * - max_bookings_per_day
 * - advance_booking_days
 *
 * @example
 * ```typescript
 * const { mutateAsync: validateBooking } = useValidateServiceBooking();
 *
 * const result = await validateBooking({
 *   productId: 'prod-123',
 *   scheduledDate: '2025-03-01',
 *   scheduledStartTime: '10:00:00',
 *   scheduledEndTime: '11:00:00',
 *   staffMemberId: 'staff-456',
 * });
 *
 * if (!result.isValid) {
 *   logger.error('Erreurs de validation', { errors: result.errors });
 * }
 * ```
 */
export const useValidateServiceBooking = () => {
  return useMutation({
    mutationFn: async (options: BookingValidationOptions): Promise<BookingValidationResult> => {
      const  errors: string[] = [];
      const  warnings: string[] = [];

      try {
        // 1. Vérifier advance_booking_days
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

        // 2. Vérifier max_bookings_per_day
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

        // 3. Vérifier conflits de réservation
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

        // Logger les erreurs si présentes
        if (errors.length > 0) {
          logger.warn('Validation de réservation échouée', {
            options,
            errors,
          });
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      } catch (error) {
        logger.error('Erreur lors de la validation de réservation', error);
        return {
          isValid: false,
          errors: ['Erreur lors de la validation. Veuillez réessayer.'],
          warnings: [],
        };
      }
    },
  });
};

/**
 * Hook pour vérifier rapidement la disponibilité d'un créneau
 * (version simplifiée pour affichage UI)
 */
export const useQuickAvailabilityCheck = () => {
  return useMutation({
    mutationFn: async (
      options: BookingValidationOptions
    ): Promise<{ available: boolean; reason?: string }> => {
      try {
        // Vérifier seulement les conflits (plus rapide)
        const { data: conflictCheck, error: conflictError } = await supabase.rpc(
          'check_booking_conflicts',
          {
            p_product_id: options.productId,
            p_scheduled_date: options.scheduledDate,
            p_scheduled_start_time: options.scheduledStartTime,
            p_scheduled_end_time: options.scheduledEndTime,
            p_staff_member_id: options.staffMemberId || null,
          }
        );

        if (conflictError) {
          return { available: false, reason: 'Erreur de vérification' };
        }

        if (conflictCheck && conflictCheck.length > 0 && conflictCheck[0].has_conflict) {
          return {
            available: false,
            reason: conflictCheck[0].conflict_message || 'Créneau non disponible',
          };
        }

        return { available: true };
      } catch (error) {
        logger.error('Erreur vérification disponibilité rapide', error);
        return { available: false, reason: 'Erreur de vérification' };
      }
    },
  });
};







