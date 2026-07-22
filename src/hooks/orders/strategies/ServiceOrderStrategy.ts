import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import {
  asOptionalString,
  asOrderProduct,
  parsePaymentOptions,
  parseStrategyOptions,
} from '@/lib/orders/order-strategy-utils';
import { OrderStrategy, OrderStrategyContext, OrderCreationResult } from './OrderStrategy';

const SERVICE_PRODUCT_FIELDS =
  'id, duration_minutes, max_participants, advance_booking_days, max_bookings_per_day, timezone, pricing_type, buffer_time_before, buffer_time_after';
const SERVICE_STAFF_FIELDS = 'id, service_product_id, is_active';
const SERVICE_BOOKING_FIELDS =
  'id, scheduled_date, scheduled_start_time, scheduled_end_time, status';

export class ServiceOrderStrategy implements OrderStrategy {
  async createOrder(context: OrderStrategyContext): Promise<OrderCreationResult> {
    const {
      productId,
      storeId,
      customerEmail,
      customerName,
      customerPhone,
      productRecord: product,
      options,
      returnUrl,
      cancelUrl,
      guestCheckout,
    } = context;

    if (!product) {
      throw new Error('Produit non fourni à la stratégie');
    }

    const productData = asOrderProduct(product);
    const opts = parseStrategyOptions(options);
    const {
      bookingDateTime,
      durationMinutes,
      staffId,
      numberOfParticipants = 1,
      notes,
      giftCardId,
      giftCardAmount = 0,
      checkoutMode = 'immediate',
    } = opts;

    if (!bookingDateTime) {
      throw new Error('Date et heure de réservation requises pour un service');
    }

    let resolvedServiceProductId = asOptionalString(opts.serviceProductId);
    if (!resolvedServiceProductId) {
      const { data: serviceRow } = await supabase
        .from('service_products')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      resolvedServiceProductId = serviceRow?.id;
    }

    if (!resolvedServiceProductId) {
      throw new Error('Produit service non trouvé');
    }

    const { payment_type: paymentType, percentage_rate: percentageRate } = parsePaymentOptions(
      productData.payment_options
    );

    // 2. Récupérer les détails du service
    const { data: serviceProduct, error: serviceError } = await supabase
      .from('service_products')
      .select(SERVICE_PRODUCT_FIELDS)
      .eq('id', resolvedServiceProductId)
      .single();

    if (serviceError || !serviceProduct) {
      throw new Error('Service non trouvé');
    }

    // 3. Vérifier capacité max participants
    if (serviceProduct.max_participants && numberOfParticipants > serviceProduct.max_participants) {
      throw new Error(`Nombre maximum de participants: ${serviceProduct.max_participants}`);
    }

    const actualDuration = durationMinutes ?? serviceProduct.duration_minutes ?? 60;
    const bookingStartDateTime = new Date(bookingDateTime);
    const bookingEndDateTime = new Date(bookingStartDateTime.getTime() + actualDuration * 60000);
    const bookingDate = bookingStartDateTime.toISOString().split('T')[0];
    const bookingStartTime = bookingStartDateTime.toTimeString().slice(0, 8);
    const bookingEndTime = bookingEndDateTime.toTimeString().slice(0, 8);

    // 3a. Vérifier advance_booking_days
    if (serviceProduct.advance_booking_days) {
      const { data: advanceCheck, error: advanceError } = await supabase.rpc(
        'check_advance_booking_days',
        { p_product_id: productId, p_scheduled_date: bookingDate }
      );

      if (!advanceError && advanceCheck && advanceCheck.length > 0 && !advanceCheck[0].is_valid) {
        throw new Error(advanceCheck[0].message || 'Date de réservation invalide.');
      }

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
            `Vous ne pouvez réserver que jusqu'à ${serviceProduct.advance_booking_days} jours à l'avance.`
          );
        }
        if (daysDifference < 0) {
          throw new Error('Impossible de réserver une date dans le passé.');
        }
      }
    }

    // 3b. Vérifier max_bookings_per_day
    if (serviceProduct.max_bookings_per_day) {
      const { data: maxBookingsCheck, error: maxBookingsError } = await supabase.rpc(
        'check_max_bookings_per_day',
        { p_product_id: productId, p_scheduled_date: bookingDate }
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

      if (maxBookingsError) {
        const { data: existingBookingsForDay } = await supabase
          .from('service_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', productId)
          .eq('scheduled_date', bookingDate)
          .in('status', ['pending', 'confirmed', 'rescheduled']);

        const currentBookingsCount = existingBookingsForDay?.length || 0;
        if (currentBookingsCount >= serviceProduct.max_bookings_per_day) {
          throw new Error(`Le nombre maximum de réservations pour ce jour est atteint.`);
        }
      }
    }

    // 4. Vérifier la disponibilité du staff
    if (staffId) {
      const { data: staff, error: staffError } = await supabase
        .from('service_staff_members')
        .select(SERVICE_STAFF_FIELDS)
        .eq('id', staffId)
        .eq('service_product_id', resolvedServiceProductId)
        .eq('is_active', true)
        .single();

      if (staffError || !staff) {
        throw new Error('Personnel non disponible');
      }

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

      if (conflictError) {
        const { data: conflictingBookings } = await supabase
          .from('service_bookings')
          .select(SERVICE_BOOKING_FIELDS)
          .eq('product_id', productId)
          .eq('staff_member_id', staffId)
          .eq('scheduled_date', bookingDate)
          .in('status', ['pending', 'confirmed', 'rescheduled']);

        const hasConflict = conflictingBookings?.some(booking => {
          const existingStart = new Date(
            `${booking.scheduled_date}T${booking.scheduled_start_time}`
          ).getTime();
          const existingEnd = new Date(
            `${booking.scheduled_date}T${booking.scheduled_end_time}`
          ).getTime();
          const requestStart = bookingStartDateTime.getTime();
          const requestEnd = bookingEndDateTime.getTime();
          return requestStart < existingEnd && requestEnd > existingStart;
        });

        if (hasConflict) {
          throw new Error('Le membre du personnel est déjà réservé pour ce créneau.');
        }
      }
    }

    // 4c. Vérifier buffer_time global
    if (serviceProduct.buffer_time_before > 0 || serviceProduct.buffer_time_after > 0) {
      const { data: allBookingsForDate } = await supabase
        .from('service_bookings')
        .select(SERVICE_BOOKING_FIELDS)
        .eq('product_id', productId)
        .eq('scheduled_date', bookingDate)
        .in('status', ['pending', 'confirmed', 'rescheduled']);

      if (allBookingsForDate && allBookingsForDate.length > 0) {
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
          return (
            (requestStart < existingEnd && requestEnd > existingStart) ||
            (existingStart < bufferEnd && existingEnd > bufferStart)
          );
        });

        if (hasGlobalBufferConflict) {
          throw new Error(`Ce créneau n'est pas disponible en raison du temps de préparation.`);
        }
      }
    }

    const customerId = await findOrCreateStoreCustomer({
      storeId,
      email: customerEmail,
      name: customerName || customerEmail.split('@')[0],
      phone: customerPhone,
    });

    const { data: authData } = await supabase.auth.getUser();
    const authenticatedUserId = authData?.user?.id ?? null;

    let bookingId: string;
    let userId: string | null = authenticatedUserId;

    if (authenticatedUserId) {
      const rpcPromise = supabase.rpc(
        // @ts-expect-error: RPC type not yet updated in supabase types
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

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Délai dépassé lors de la réservation. Réessayez.')),
          45_000
        );
      });

      const { data: bookingResult, error: bookingError } = await Promise.race([
        rpcPromise,
        timeoutPromise,
      ]);

      if (bookingError) {
        throw new Error(bookingError.message || 'Impossible de finaliser la réservation.');
      }

      const rows = bookingResult as unknown as Array<{
        booking_id: string | null;
        error_message: string | null;
      }> | null;
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row?.error_message) throw new Error(String(row.error_message));
      if (!row?.booking_id) throw new Error('Erreur inattendue lors de la réservation');
      bookingId = row.booking_id;
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

      if (provisionError)
        throw new Error(provisionError.message || 'Impossible de finaliser la réservation.');
      if (provisionData?.error) throw new Error(provisionData.error);
      if (!provisionData?.success || !provisionData?.booking_id)
        throw new Error('Erreur inattendue lors de la réservation');

      bookingId = provisionData.booking_id as string;
      userId = provisionData.user_id ?? null;
    }

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
      };
    }

    import('@/lib/webhooks').then(({ triggerServiceBookingCreatedWebhook }) => {
      triggerServiceBookingCreatedWebhook(
        booking.id,
        {
          product_id: productId,
          user_id: userId,
          scheduled_date: booking.scheduled_date,
          scheduled_start_time: booking.scheduled_start_time,
          scheduled_end_time: booking.scheduled_end_time,
          status: 'pending',
          created_at: booking.created_at,
        },
        storeId
      ).catch(err => logger.error('Error in tracking', { error: err }));
    });

    // 7. Créer la commande via RPC sécurisée (frais 2%+100, booking_id, RLS-safe)
    const affiliateTrackingCookie = getAffiliateTrackingCookie();
    const serviceMetadata = {
      booking_date: bookingDateTime,
      duration_minutes: actualDuration,
      number_of_participants: numberOfParticipants,
      staff_id: staffId,
      notes,
      booking_id: booking.id,
    };

    const { data: rpcResult, error: orderError } = await supabase.rpc(
      // @ts-expect-error: RPC type not yet updated in supabase types
      'create_public_service_order',
      {
        p_product_id: productId,
        p_store_id: storeId,
        p_customer_email: customerEmail,
        p_customer_name: customerName || customerEmail.split('@')[0],
        p_customer_phone: customerPhone ?? null,
        p_service_metadata: serviceMetadata,
        p_gift_card_id: giftCardId ?? null,
        p_gift_card_amount_requested: giftCardAmount || 0,
        p_coupon_code: null,
        p_affiliate_tracking_cookie: affiliateTrackingCookie,
        p_guest_checkout: guestCheckout ?? !authenticatedUserId,
        p_booking_id: booking.id,
      }
    );

    if (orderError || !rpcResult) {
      await supabase.from('service_bookings').update({ status: 'cancelled' }).eq('id', booking.id);
      logger.error('create_public_service_order failed', { error: orderError });
      throw new Error(
        `Erreur lors de la création de la commande: ${orderError?.message || 'Inconnue'}`
      );
    }

    const orderData = rpcResult as unknown as {
      order_id: string;
      order_item_id: string;
      order_number: string;
      customer_id: string;
      total_amount: number;
    };

    const orderId = orderData.order_id;
    const orderItemId = orderData.order_item_id;
    const rpcCustomerId = orderData.customer_id || customerId;
    const finalAmountToPay = Number(orderData.total_amount) || 0;

    const { data: invoiceId, error: invoiceError } = await supabase.rpc(
      'create_invoice_from_order',
      { p_order_id: orderId }
    );
    if (invoiceError) {
      logger.error('Error creating invoice for service order', { error: invoiceError, orderId });
    } else {
      logger.info(`Invoice created: ${invoiceId}`);
    }

    import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
      triggerOrderCreatedWebhook(orderId, {
        store_id: storeId,
        customer_id: rpcCustomerId,
        order_number: orderData.order_number,
        status: 'pending',
        total_amount: finalAmountToPay,
        currency: productData.currency,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
      }).catch(() => {});
    });

    if (paymentType === 'delivery_secured') {
      await supabase.from('secured_payments').insert({
        order_id: orderId,
        total_amount: finalAmountToPay,
        held_amount: finalAmountToPay,
        status: 'held',
        hold_reason: 'service_completion',
        release_conditions: { requires_service_completion: true, auto_release_days: 3 },
      });
    }

    const formattedBookingDate = new Date(bookingDateTime).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const paymentDescription =
      paymentType === 'percentage'
        ? `Acompte ${percentageRate}%: ${productData.name} - ${formattedBookingDate}`
        : paymentType === 'delivery_secured'
          ? `Paiement sécurisé: ${productData.name} - ${formattedBookingDate}`
          : `Réservation: ${productData.name} - ${formattedBookingDate}`;

    const paymentResult = await initiatePayment({
      storeId,
      productId,
      orderId,
      customerId: rpcCustomerId,
      amount: finalAmountToPay,
      currency: product.currency,
      description: paymentDescription,
      customerEmail,
      customerName: customerName || customerEmail.split('@')[0],
      customerPhone,
      returnUrl,
      cancelUrl,
      metadata: {
        product_type: 'service',
        service_product_id: resolvedServiceProductId,
        booking_id: booking.id,
        booking_date: bookingDateTime,
        duration_minutes: actualDuration,
        number_of_participants: numberOfParticipants,
        order_item_id: orderItemId,
        payment_type: paymentType,
        percentage_rate: paymentType === 'percentage' ? percentageRate : null,
        total_price: finalAmountToPay,
        amount_paid: finalAmountToPay,
        remaining_amount: 0,
        ...(guestCheckout ? { guest_checkout: true } : {}),
      },
    });

    if (!paymentResult.success || !paymentResult.checkout_url) {
      await supabase.from('service_bookings').update({ status: 'cancelled' }).eq('id', booking.id);
      throw new Error("Erreur lors de l'initialisation du paiement");
    }

    return {
      orderId,
      orderItemId,
      bookingId: booking.id,
      checkoutUrl: paymentResult.checkout_url,
      transactionId: paymentResult.transaction_id,
    };
  }
}
