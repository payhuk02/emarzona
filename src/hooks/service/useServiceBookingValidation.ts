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
import {
  validateServiceBooking,
  type BookingValidationOptions,
  type BookingValidationResult,
} from '@/lib/service/validate-service-booking';

export type { BookingValidationOptions, BookingValidationResult };

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
    mutationFn: validateServiceBooking,
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
