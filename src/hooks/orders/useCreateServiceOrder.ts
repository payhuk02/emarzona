/**
 * Hook pour créer des commandes de services
 * Date: 28 octobre 2025
 * Dernière mise à jour: 1 Février 2025
 *
 * Workflow complet:
 * 1. Récupérer produit et service
 * 2. Vérifier capacité max participants
 * 3. Vérifier advance_booking_days (limite réservation à l'avance)
 * 4. Vérifier max_bookings_per_day (limite quotidienne)
 * 5. Vérifier disponibilité staff (si spécifié) avec conflits temps
 * 6. Vérifier buffer_time (staff et global)
 * 7. Créer/récupérer customer
 * 8. Créer booking (réservation) avec statut 'pending'
 * 9. Créer order + order_item
 * 10. Initier paiement GeniusPay
 * 11. Confirmer booking automatiquement si paiement réussi (via webhook payment.completed)
 *
 * Validations implémentées:
 * - ✅ max_participants: Vérifie que le nombre de participants ne dépasse pas la limite
 * - ✅ advance_booking_days: Vérifie que la date n'excède pas la limite configurée
 * - ✅ max_bookings_per_day: Vérifie la limite quotidienne de réservations
 * - ✅ Staff conflicts: Vérifie les chevauchements de créneaux pour le staff
 * - ✅ buffer_time: Vérifie les temps de préparation (avant/après) pour staff et bookings globaux
 *
 * @see {@link useCheckTimeSlotAvailability} Pour vérifier la disponibilité d'un créneau
 * @see {@link https://docs.emarzona.com/services/bookings} Documentation complète des réservations
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';
import { insertOrderItem } from '@/lib/orders/order-items-client';

const PRODUCT_FIELDS = 'id, name, price, promotional_price, currency, payment_options';
const SERVICE_PRODUCT_FIELDS =
  'id, duration_minutes, max_participants, advance_booking_days, max_bookings_per_day, timezone, pricing_type, buffer_time_before, buffer_time_after';
const SERVICE_STAFF_FIELDS = 'id, service_product_id, is_active';
const SERVICE_BOOKING_FIELDS =
  'id, scheduled_date, scheduled_start_time, scheduled_end_time, status';

/**
 * Options pour créer une commande service
 *
 * @interface CreateServiceOrderOptions
 * @property {string} serviceProductId - ID du service product (table service_products)
 * @property {string} productId - ID du produit de base (table products, pour price, etc.)
 * @property {string} storeId - ID du store (table stores)
 * @property {string} customerEmail - Email du client (requis pour création/récupération)
 * @property {string} [customerName] - Nom du client (optionnel, généré depuis email si absent)
 * @property {string} [customerPhone] - Téléphone du client (optionnel)
 * @property {string} bookingDateTime - Date et heure de réservation (ISO 8601, ex: "2025-03-01T10:00:00Z")
 * @property {number} [durationMinutes] - Durée en minutes (optionnel, utilise serviceProduct.duration_minutes si absent)
 * @property {string} [staffId] - ID du staff member (optionnel, vérifie disponibilité si fourni)
 * @property {number} [numberOfParticipants=1] - Nombre de participants (défaut: 1)
 * @property {string} [notes] - Notes de réservation du client (stockées dans customer_notes)
 * @property {string} [giftCardId] - ID de la carte cadeau à utiliser (optionnel)
 * @property {number} [giftCardAmount] - Montant de la carte cadeau à utiliser (optionnel)
 *
 * @example
 * ```typescript
 * const { mutateAsync: createServiceOrder } = useCreateServiceOrder();
 *
 * await createServiceOrder({
 *   serviceProductId: 'svc-123',
 *   productId: 'prod-123',
 *   storeId: 'store-123',
 *   customerEmail: 'client@example.com',
 *   bookingDateTime: '2025-03-01T10:00:00Z',
 *   numberOfParticipants: 2,
 *   staffId: 'staff-456',
 *   notes: 'Consultation urgente',
 * });
 * ```
 */
export interface CreateServiceOrderOptions {
  /** ID du service product */
  serviceProductId: string;

  /** ID du produit de base (pour price, etc.) */
  productId: string;

  /** ID du store */
  storeId: string;

  /** Email du client */
  customerEmail: string;

  /** Nom du client (optionnel) */
  customerName?: string;

  /** Téléphone du client (optionnel) */
  customerPhone?: string;

  /** Date et heure de réservation */
  bookingDateTime: string; // ISO 8601

  /** Durée en minutes (optionnel, sinon prend celle du service) */
  durationMinutes?: number;

  /** ID du staff member (optionnel) */
  staffId?: string;

  /** Nombre de participants */
  numberOfParticipants?: number;

  /** Notes de réservation */
  notes?: string;

  /** ID de la carte cadeau à utiliser (optionnel) */
  giftCardId?: string;

  /** Montant de la carte cadeau à utiliser (optionnel) */
  giftCardAmount?: number;

  /** `cart` = réserve le créneau sans paiement immédiat (panier mixte) */
  checkoutMode?: 'immediate' | 'cart';
}

/**
 * Résultat de la création de commande
 *
 * @interface CreateServiceOrderResult
 * @property {string} orderId - ID de la commande créée (table orders)
 * @property {string} orderItemId - ID de l'order_item créé (table order_items)
 * @property {string} bookingId - ID de la réservation créée (table service_bookings, statut 'pending')
 * @property {string} checkoutUrl - URL de checkout GeniusPay pour effectuer le paiement
 * @property {string} transactionId - ID de transaction GeniusPay (pour suivi)
 *
 * @remarks
 * Le booking sera automatiquement confirmé (statut 'confirmed') après paiement réussi
 * via le webhook payment.completed dans geniuspay-webhook/index.ts
 */
export interface CreateServiceOrderResult {
  /** ID de la commande créée */
  orderId: string;

  /** ID de l'order_item */
  orderItemId: string;

  /** ID de la réservation */
  bookingId: string;

  /** URL de checkout GeniusPay */
  checkoutUrl: string;

  /** ID de transaction GeniusPay */
  transactionId: string;
}

/**
 * Hook pour créer une commande de service avec toutes les validations
 *
 * @returns {UseMutationResult<CreateServiceOrderResult, Error, CreateServiceOrderOptions>}
 * Mutation React Query pour créer une commande de service
 *
 * @example
 * ```typescript
 * const { mutateAsync: createServiceOrder, isPending, error } = useCreateServiceOrder();
 *
 * const handleBook = async () => {
 *   try {
 *     const result = await createServiceOrder({
 *       serviceProductId: 'svc-123',
 *       productId: 'prod-123',
 *       storeId: 'store-123',
 *       customerEmail: 'user@example.com',
 *       bookingDateTime: '2025-03-01T10:00:00Z',
 *       numberOfParticipants: 2,
 *       staffId: 'staff-456',
 *       notes: 'Consultation urgente',
 *     });
 *
 *     // Rediriger vers GeniusPay pour paiement
 *     window.location.href = result.checkoutUrl;
 *   } catch (err) {
 *     // Gérer les erreurs de validation (max_bookings_per_day, buffer_time, etc.)
 *     logger.error('Erreur de réservation', { error: err });
 *   }
 * };
 * ```
 *
 * @throws {Error} Si validation échoue (max_bookings_per_day, advance_booking_days, buffer_time, conflits staff)
 * @see {@link CreateServiceOrderOptions} Pour la liste complète des options
 */
export const useCreateServiceOrder = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (options: CreateServiceOrderOptions): Promise<CreateServiceOrderResult> => {
      const {
        serviceProductId,
        productId,
        storeId,
        customerEmail,
        customerName,
        customerPhone,
        bookingDateTime,
        durationMinutes,
        staffId,
        numberOfParticipants = 1,
        notes,
        giftCardId,
        giftCardAmount = 0,
        checkoutMode = 'immediate',
      } = options;

      // 1. Récupérer les détails du produit (avec payment_options)
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      // Récupérer les options de paiement configurées
      const paymentOptions = (product.payment_options as {
        payment_type?: string;
        percentage_rate?: number;
      } | null) || { payment_type: 'full', percentage_rate: 30 };
      const paymentType = paymentOptions.payment_type || 'full';
      const percentageRate = paymentOptions.percentage_rate || 30;

      // 2. Récupérer les détails du service
      const { data: serviceProduct, error: serviceError } = await supabase
        .from('service_products')
        .select(SERVICE_PRODUCT_FIELDS)
        .eq('id', serviceProductId)
        .single();

      if (serviceError || !serviceProduct) {
        throw new Error('Service non trouvé');
      }

      // 3. Vérifier capacité max participants
      if (
        serviceProduct.max_participants &&
        numberOfParticipants > serviceProduct.max_participants
      ) {
        throw new Error(`Nombre maximum de participants: ${serviceProduct.max_participants}`);
      }

      // Calculer la durée maintenant pour l'utiliser partout
      const actualDuration = durationMinutes || serviceProduct.duration_minutes;
      const bookingStartDateTime = new Date(bookingDateTime);
      const bookingEndDateTime = new Date(bookingStartDateTime.getTime() + actualDuration * 60000);
      const bookingDate = bookingStartDateTime.toISOString().split('T')[0];
      const bookingStartTime = bookingStartDateTime.toTimeString().slice(0, 8); // HH:MM:SS
      const bookingEndTime = bookingEndDateTime.toTimeString().slice(0, 8);

      // 3a. Vérifier advance_booking_days (réservation à l'avance maximum)
      // Utilisation de la fonction SQL pour validation côté serveur (plus fiable)
      if (serviceProduct.advance_booking_days) {
        const { data: advanceCheck, error: advanceError } = await supabase.rpc(
          'check_advance_booking_days',
          {
            p_product_id: productId,
            p_scheduled_date: bookingDate,
          }
        );

        if (!advanceError && advanceCheck && advanceCheck.length > 0 && !advanceCheck[0].is_valid) {
          throw new Error(advanceCheck[0].message || 'Date de réservation invalide.');
        }

        // Fallback côté client si la fonction SQL n'est pas disponible
        if (advanceError) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const bookingDateObj = new Date(bookingDate);
          bookingDateObj.setHours(0, 0, 0, 0);
          const daysDifference = Math.floor(
            (bookingDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDifference > serviceProduct.advance_booking_days) {
            throw new Error(
              `Vous ne pouvez réserver que jusqu'à ${serviceProduct.advance_booking_days} jours à l'avance. La date demandée est dans ${daysDifference} jours.`
            );
          }

          if (daysDifference < 0) {
            throw new Error('Impossible de réserver une date dans le passé.');
          }
        }
      }

      // 3b. Vérifier max_bookings_per_day (limite quotidienne de réservations)
      // Utilisation de la fonction SQL pour validation côté serveur (plus fiable)
      if (serviceProduct.max_bookings_per_day) {
        const { data: maxBookingsCheck, error: maxBookingsError } = await supabase.rpc(
          'check_max_bookings_per_day',
          {
            p_product_id: productId,
            p_scheduled_date: bookingDate,
          }
        );

        if (
          !maxBookingsError &&
          maxBookingsCheck &&
          maxBookingsCheck.length > 0 &&
          !maxBookingsCheck[0].is_within_limit
        ) {
          throw new Error(
            maxBookingsCheck[0].message || 'Limite quotidienne de réservations atteinte.'
          );
        }

        // Fallback côté client si la fonction SQL n'est pas disponible
        if (maxBookingsError) {
          const { data: existingBookingsForDay, error: bookingsCountError } = await supabase
            .from('service_bookings')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', productId)
            .eq('scheduled_date', bookingDate)
            .in('status', ['pending', 'confirmed', 'rescheduled']);

          if (bookingsCountError) {
            logger.error('Erreur lors de la vérification max_bookings_per_day', {
              error: bookingsCountError,
            });
            // Ne pas bloquer si erreur de comptage, mais logger
          } else {
            const currentBookingsCount = existingBookingsForDay?.length || 0;
            if (currentBookingsCount >= serviceProduct.max_bookings_per_day) {
              throw new Error(
                `Le nombre maximum de réservations pour ce jour (${serviceProduct.max_bookings_per_day}) est atteint. Veuillez choisir une autre date.`
              );
            }
          }
        }
      }

      // 4. Vérifier la disponibilité du staff si requis et spécifié
      if (staffId) {
        const { data: staff, error: staffError } = await supabase
          .from('service_staff_members')
          .select(SERVICE_STAFF_FIELDS)
          .eq('id', staffId)
          .eq('service_product_id', serviceProductId)
          .eq('is_active', true)
          .single();

        if (staffError || !staff) {
          throw new Error('Personnel non disponible');
        }

        // 4a. Vérifier si le staff est déjà réservé pour ce créneau (CRITIQUE)
        // Utilisation de la fonction SQL pour validation côté serveur (plus fiable)
        const { data: conflictCheck, error: conflictError } = await supabase.rpc(
          'check_booking_conflicts',
          {
            p_product_id: productId,
            p_scheduled_date: bookingDate,
            p_scheduled_start_time: bookingStartTime,
            p_scheduled_end_time: bookingEndTime,
            p_staff_member_id: staffId,
          }
        );

        if (
          !conflictError &&
          conflictCheck &&
          conflictCheck.length > 0 &&
          conflictCheck[0].has_conflict
        ) {
          throw new Error(conflictCheck[0].conflict_message || 'Conflit de réservation détecté.');
        }

        // Fallback côté client si la fonction SQL n'est pas disponible
        if (conflictError) {
          logger.warn(
            'Fonction SQL check_booking_conflicts non disponible, utilisation fallback client',
            conflictError
          );

          // Vérifier les conflits avec les réservations existantes du staff
          const { data: conflictingBookings, error: fallbackConflictError } = await supabase
            .from('service_bookings')
            .select(SERVICE_BOOKING_FIELDS)
            .eq('product_id', productId)
            .eq('staff_member_id', staffId)
            .eq('scheduled_date', bookingDate)
            .in('status', ['pending', 'confirmed', 'rescheduled']);

          if (fallbackConflictError) {
            logger.error(
              'Erreur lors de la vérification des conflits staff',
              fallbackConflictError
            );
            throw new Error('Erreur lors de la vérification de la disponibilité du personnel');
          }

          // Vérifier les chevauchements de temps
          const hasConflict = conflictingBookings?.some(booking => {
            const existingStart = new Date(
              `${booking.scheduled_date}T${booking.scheduled_start_time}`
            ).getTime();
            const existingEnd = new Date(
              `${booking.scheduled_date}T${booking.scheduled_end_time}`
            ).getTime();
            const requestStart = bookingStartDateTime.getTime();
            const requestEnd = bookingEndDateTime.getTime();

            // Il y a conflit si les périodes se chevauchent
            return requestStart < existingEnd && requestEnd > existingStart;
          });

          if (hasConflict) {
            throw new Error(
              'Le membre du personnel est déjà réservé pour ce créneau. Veuillez choisir un autre horaire.'
            );
          }
        }

        // 4b. buffer_time : couvert par la vérification globale (4c) ci-dessous
      }

      // 4c. Vérifier buffer_time pour TOUS les bookings (même sans staff spécifique)
      // Cette vérification s'applique à toutes les réservations du service
      if (serviceProduct.buffer_time_before > 0 || serviceProduct.buffer_time_after > 0) {
        // Récupérer toutes les réservations du service pour cette date
        const { data: allBookingsForDate, error: allBookingsError } = await supabase
          .from('service_bookings')
          .select(SERVICE_BOOKING_FIELDS)
          .eq('product_id', productId)
          .eq('scheduled_date', bookingDate)
          .in('status', ['pending', 'confirmed', 'rescheduled']);

        if (!allBookingsError && allBookingsForDate && allBookingsForDate.length > 0) {
          const bufferStart =
            bookingStartDateTime.getTime() - serviceProduct.buffer_time_before * 60000;
          const bufferEnd = bookingEndDateTime.getTime() + serviceProduct.buffer_time_after * 60000;

          const hasGlobalBufferConflict = allBookingsForDate.some(booking => {
            const existingStart = new Date(
              `${booking.scheduled_date}T${booking.scheduled_start_time}`
            ).getTime();
            const existingEnd = new Date(
              `${booking.scheduled_date}T${booking.scheduled_end_time}`
            ).getTime();
            const requestStart = bookingStartDateTime.getTime();
            const requestEnd = bookingEndDateTime.getTime();

            // Vérifier chevauchement direct ou avec buffer
            return (
              (requestStart < existingEnd && requestEnd > existingStart) ||
              (existingStart < bufferEnd && existingEnd > bufferStart)
            );
          });

          if (hasGlobalBufferConflict) {
            throw new Error(
              `Ce créneau n'est pas disponible en raison du temps de préparation nécessaire entre les réservations (${serviceProduct.buffer_time_before} min avant, ${serviceProduct.buffer_time_after} min après). Veuillez choisir un autre créneau.`
            );
          }
        }
      }

      // 6. Créer le booking — RPC directe si connecté (évite edge function auth/hang) ;
      //    edge function réservée au guest checkout.
      const { data: authData } = await supabase.auth.getUser();
      const authenticatedUserId = authData?.user?.id ?? null;

      let bookingId: string;
      let userId: string | null = authenticatedUserId;

      if (authenticatedUserId) {
        const { data: bookingResult, error: bookingError } = await supabase.rpc(
          'reserve_service_booking',
          {
            p_product_id: productId,
            p_user_id: authenticatedUserId,
            p_staff_member_id: staffId ?? null,
            p_scheduled_date: bookingDate,
            p_scheduled_start_time: bookingStartTime,
            p_scheduled_end_time: bookingEndTime,
            p_timezone: serviceProduct.timezone || 'UTC',
            p_duration_minutes: actualDuration,
            p_participants_count: numberOfParticipants,
            p_customer_notes: notes ?? null,
          }
        );

        if (bookingError) {
          logger.error('reserve_service_booking RPC error', { error: bookingError });
          throw new Error(bookingError.message || 'Impossible de finaliser la réservation.');
        }

        const row = Array.isArray(bookingResult) ? bookingResult[0] : bookingResult;
        if (row?.error_message) {
          throw new Error(String(row.error_message));
        }
        if (!row?.booking_id) {
          throw new Error('Erreur inattendue lors de la réservation');
        }
        bookingId = row.booking_id as string;
      } else {
        const invokePromise = supabase.functions.invoke('service-checkout-provisioning', {
          body: {
            email: customerEmail,
            customerName: customerName,
            productId: productId,
            staffId: staffId,
            bookingDate: bookingDate,
            bookingStartTime: bookingStartTime,
            bookingEndTime: bookingEndTime,
            durationMinutes: actualDuration,
            timezone: serviceProduct.timezone || 'UTC',
            numberOfParticipants: numberOfParticipants,
            notes: notes,
            userId: null,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Délai dépassé lors de la réservation. Réessayez.')),
            45_000
          );
        });

        const { data: provisionData, error: provisionError } = await Promise.race([
          invokePromise,
          timeoutPromise,
        ]);

        if (provisionError) {
          logger.error('Service checkout provisioning error', { error: provisionError });
          throw new Error(provisionError.message || 'Impossible de finaliser la réservation.');
        }

        if (provisionData?.error) {
          throw new Error(provisionData.error);
        }

        if (!provisionData?.success || !provisionData?.booking_id) {
          throw new Error('Erreur inattendue lors de la réservation');
        }

        bookingId = provisionData.booking_id as string;
        userId = provisionData.user_id ?? null;
      }

      // On simule l'objet booking pour la suite du flux (webhooks)
      const booking = {
        id: bookingId,
        scheduled_date: bookingDate,
        scheduled_start_time: bookingStartTime,
        scheduled_end_time: bookingEndTime,
        created_at: new Date().toISOString(),
      };

      if (checkoutMode === 'cart') {
        return {
          orderId: '',
          orderItemId: '',
          bookingId: booking.id,
          checkoutUrl: '',
          transactionId: '',
        };
      }

      // Déclencher webhook service.booking_created (asynchrone, ne bloque pas)
      import('@/lib/webhooks').then(({ triggerServiceBookingCreatedWebhook }) => {
        triggerServiceBookingCreatedWebhook(
          booking.id,
          {
            product_id: productId,
            user_id: userId,
            scheduled_date: booking.scheduled_date || bookingDate,
            scheduled_start_time: booking.scheduled_start_time || bookingStartTime,
            scheduled_end_time: booking.scheduled_end_time || bookingEndTime,
            status: 'pending',
            created_at: booking.created_at || new Date().toISOString(),
          },
          storeId
        ).catch(err => {
          logger.error('Error in analytics tracking for booking', {
            error: err,
            bookingId: booking.id,
          });
        });
      });

      // 7. Créer la commande via RPC sécurisée
      const affiliateTrackingCookie = getAffiliateTrackingCookie();

      const serviceMetadata = {
        booking_date: bookingDateTime,
        duration_minutes: actualDuration,
        number_of_participants: numberOfParticipants,
        staff_id: staffId,
        notes,
      };

      const { data: rpcResult, error: orderError } = await supabase.rpc(
        // @ts-expect-error: RPC type not yet updated in supabase types
        'create_public_service_order',
        {
          p_product_id: productId,
          p_store_id: storeId,
          p_customer_email: customerEmail,
          p_customer_name: customerName || customerEmail.split('@')[0],
          p_customer_phone: customerPhone,
          p_service_metadata: serviceMetadata,
          p_gift_card_id: giftCardId,
          p_gift_card_amount_requested: giftCardAmount || 0,
          p_coupon_code: undefined, // Pas de support couponCode direct dans les options
          p_affiliate_tracking_cookie: affiliateTrackingCookie,
          p_guest_checkout: !authData?.user?.id,
        }
      );

      if (orderError || !rpcResult) {
        // Annuler le booking en cas d'erreur
        await supabase
          .from('service_bookings')
          .update({ status: 'cancelled' })
          .eq('id', booking.id);

        throw new Error('Erreur lors de la création de la commande');
      }

      const orderData = rpcResult as unknown as {
        order_id: string;
        order_item_id: string;
        order_number: string;
        customer_id: string;
        total_amount: number;
      };

      const finalAmountToPay = orderData.total_amount;
      const orderId = orderData.order_id;
      const orderNumber = orderData.order_number;
      const customerId = orderData.customer_id;
      const orderItemId = orderData.order_item_id;

      // 9b. Créer automatiquement la facture
      try {
        const { data: invoiceId, error: invoiceError } = await supabase.rpc(
          'create_invoice_from_order',
          {
            p_order_id: orderId,
          }
        );

        if (invoiceError) {
          logger.error('Error creating invoice:', invoiceError);
          // Ne pas bloquer la commande si la facture échoue
        } else {
          logger.info(`Invoice created: ${invoiceId}`);
        }
      } catch (invoiceErr) {
        logger.error('Error in invoice creation:', invoiceErr);
        // Ne pas bloquer la commande
      }

      // 10. Déclencher webhook order.created (asynchrone, ne bloque pas)
      import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
        triggerOrderCreatedWebhook(orderId, {
          store_id: storeId,
          customer_id: customerId,
          order_number: orderNumber,
          status: 'pending',
          total_amount: finalAmountToPay,
          currency: product.currency,
          payment_status: 'pending',
          created_at: new Date().toISOString(),
        }).catch(err => {
          logger.error('Error in analytics tracking for order', { error: err, orderId: orderId });
        });
      });

      const calcTotalPrice = product.price * numberOfParticipants;
      const calcAmountToPay = finalAmountToPay;
      const calcRemainingAmount = calcTotalPrice - calcAmountToPay;

      // 11. Créer un secured_payment si paiement escrow
      if (paymentType === 'delivery_secured') {
        await supabase.from('secured_payments').insert({
          order_id: orderId,
          total_amount: calcTotalPrice,
          held_amount: calcAmountToPay,
          status: 'held',
          hold_reason: 'service_completion',
          release_conditions: {
            requires_service_completion: true,
            auto_release_days: 3,
          },
        });
      }

      // 12. Initier le paiement GeniusPay (avec amountToPay adapté)
      const formattedBookingDate = new Date(bookingDateTime).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const paymentDescription =
        paymentType === 'percentage'
          ? `Acompte ${percentageRate}%: ${product.name} - ${formattedBookingDate}`
          : paymentType === 'delivery_secured'
            ? `Paiement sécurisé: ${product.name} - ${formattedBookingDate}`
            : `Réservation: ${product.name} - ${formattedBookingDate}`;

      const paymentResult = await initiatePayment({
        storeId,
        productId,
        orderId: orderId,
        customerId,
        amount: finalAmountToPay,
        currency: product.currency,
        description: paymentDescription,
        customerEmail,
        customerName: customerName || customerEmail.split('@')[0],
        customerPhone,
        metadata: {
          product_type: 'service',
          service_product_id: serviceProductId,
          booking_id: booking.id,
          booking_date: bookingDateTime,
          duration_minutes: actualDuration,
          number_of_participants: numberOfParticipants,
          order_item_id: orderItemId,
          payment_type: paymentType,
          percentage_rate: paymentType === 'percentage' ? percentageRate : null,
          total_price: calcTotalPrice,
          amount_paid: calcAmountToPay,
          remaining_amount: calcRemainingAmount,
        },
      });

      if (!paymentResult.success || !paymentResult.checkout_url) {
        // Annuler le booking
        await supabase
          .from('service_bookings')
          .update({ status: 'cancelled' })
          .eq('id', booking.id);

        throw new Error("Erreur lors de l'initialisation du paiement");
      }

      // 13. Retourner le résultat
      return {
        orderId: orderId,
        orderItemId: orderItemId,
        bookingId: booking.id,
        checkoutUrl: paymentResult.checkout_url,
        transactionId: paymentResult.transaction_id,
      };
    },

    onSuccess: data => {
      if (data.bookingId && !data.orderId) {
        return;
      }
      toast({
        title: '✅ Réservation créée',
        description: 'Créneau réservé. Redirection vers le paiement...',
      });
    },

    onError: (error: Error) => {
      logger.error('Service order creation error', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la réservation',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour vérifier la disponibilité d'un créneau avant réservation
 *
 * @returns {UseMutationResult<{available: boolean, conflictingBookings: number}, Error, CheckTimeSlotAvailabilityOptions>}
 * Mutation React Query pour vérifier la disponibilité
 *
 * @example
 * ```typescript
 * const { mutateAsync: checkAvailability } = useCheckTimeSlotAvailability();
 *
 * const result = await checkAvailability({
 *   serviceProductId: 'svc-123',
 *   startTime: '2025-03-01T10:00:00Z',
 *   durationMinutes: 60,
 *   staffId: 'staff-456', // Optionnel
 * });
 *
 * if (result.available) {
 *   // Créneau disponible
 * } else {
 *   // Créneau occupé, result.conflictingBookings indique le nombre de conflits
 * }
 * ```
 *
 * @remarks
 * Cette vérification est également effectuée automatiquement dans useCreateServiceOrder,
 * mais peut être utilisée pour vérifier la disponibilité avant d'afficher un créneau
 * comme disponible dans l'UI.
 */
export const useCheckTimeSlotAvailability = () => {
  return useMutation({
    mutationFn: async ({
      serviceProductId,
      startTime,
      durationMinutes,
      staffId,
    }: {
      serviceProductId: string;
      startTime: string;
      durationMinutes: number;
      staffId?: string;
    }): Promise<{ available: boolean; conflictingBookings: number }> => {
      const endTime = new Date(
        new Date(startTime).getTime() + durationMinutes * 60000
      ).toISOString();

      // Parser les dates pour obtenir date et heure séparées
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000);
      const checkDate = startDateTime.toISOString().split('T')[0];
      const checkStartTime = startDateTime.toTimeString().slice(0, 8);
      const checkEndTime = endDateTime.toTimeString().slice(0, 8);

      // Chercher les bookings qui se chevauchent
      let query = supabase
        .from('service_bookings')
        .select('id, scheduled_date, scheduled_start_time, scheduled_end_time')
        .eq('product_id', serviceProductId)
        .eq('scheduled_date', checkDate)
        .in('status', ['pending', 'confirmed', 'rescheduled']);

      if (staffId) {
        query = query.eq('staff_member_id', staffId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Vérifier les conflits réels (chevauchement de temps)
      const conflicts =
        data?.filter(booking => {
          const bookingStart = new Date(
            `${booking.scheduled_date}T${booking.scheduled_start_time}`
          ).getTime();
          const bookingEnd = new Date(
            `${booking.scheduled_date}T${booking.scheduled_end_time}`
          ).getTime();
          const requestStart = startDateTime.getTime();
          const requestEnd = endDateTime.getTime();

          // Il y a conflit si les périodes se chevauchent
          return requestStart < bookingEnd && requestEnd > bookingStart;
        }) || [];

      return {
        available: conflicts.length === 0,
        conflictingBookings: conflicts.length,
      };
    },
  });
};
