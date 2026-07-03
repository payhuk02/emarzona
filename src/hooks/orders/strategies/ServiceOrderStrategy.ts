import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';
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
    } = context;

    if (!product) {
      throw new Error('Produit non fourni à la stratégie');
    }

    const {
      serviceProductId,
      bookingDateTime,
      durationMinutes,
      staffId,
      numberOfParticipants = 1,
      notes,
      giftCardId,
      giftCardAmount = 0,
      checkoutMode = 'immediate',
    } = options || {};

    if (!bookingDateTime) {
      throw new Error('Date et heure de réservation requises pour un service');
    }

    // Récupérer le service_product_id si non fourni
    let resolvedServiceProductId = serviceProductId;
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

    const paymentOptions = (product.payment_options as Record<string, unknown>) || { payment_type: 'full', percentage_rate: 30 };
    const paymentType = paymentOptions.payment_type || 'full';
    const percentageRate = paymentOptions.percentage_rate || 30;

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

    const actualDuration = durationMinutes || serviceProduct.duration_minutes;
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
        const daysDifference = Math.floor((bookingDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDifference > serviceProduct.advance_booking_days) {
          throw new Error(`Vous ne pouvez réserver que jusqu'à ${serviceProduct.advance_booking_days} jours à l'avance.`);
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

      if (!maxBookingsError && maxBookingsCheck && maxBookingsCheck.length > 0 && !maxBookingsCheck[0].is_within_limit) {
        throw new Error(maxBookingsCheck[0].message || 'Limite quotidienne de réservations atteinte.');
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

      if (!conflictError && conflictCheck && conflictCheck.length > 0 && conflictCheck[0].has_conflict) {
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
          const existingStart = new Date(`${booking.scheduled_date}T${booking.scheduled_start_time}`).getTime();
          const existingEnd = new Date(`${booking.scheduled_date}T${booking.scheduled_end_time}`).getTime();
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
        const bufferStart = bookingStartDateTime.getTime() - serviceProduct.buffer_time_before * 60000;
        const bufferEnd = bookingEndDateTime.getTime() + serviceProduct.buffer_time_after * 60000;

        const hasGlobalBufferConflict = allBookingsForDate.some(booking => {
          const existingStart = new Date(`${booking.scheduled_date}T${booking.scheduled_start_time}`).getTime();
          const existingEnd = new Date(`${booking.scheduled_date}T${booking.scheduled_end_time}`).getTime();
          const requestStart = bookingStartDateTime.getTime();
          const requestEnd = bookingEndDateTime.getTime();
          return (requestStart < existingEnd && requestEnd > existingStart) ||
                 (existingStart < bufferEnd && existingEnd > bufferStart);
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

    const { data: provisionData, error: provisionError } = await supabase.functions.invoke(
      'service-checkout-provisioning',
      {
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
          userId: authData?.user?.id || null,
        },
      }
    );

    if (provisionError) throw new Error(provisionError.message || 'Impossible de finaliser la réservation.');
    if (provisionData?.error) throw new Error(provisionData.error);
    if (!provisionData?.success || !provisionData?.booking_id) throw new Error('Erreur inattendue lors de la réservation');

    const userId = provisionData.user_id;

    const booking = {
      id: provisionData.booking_id,
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

    // 7. Calculer le prix
    let totalPrice = product.promotional_price || product.price;
    if (serviceProduct.pricing_type === 'per_participant') totalPrice *= numberOfParticipants;
    if (serviceProduct.pricing_type === 'per_hour') {
      const hours = actualDuration / 60;
      totalPrice *= hours;
    }

    let amountToPay = totalPrice;
    let percentagePaid = 0;
    let remainingAmount = 0;

    if (paymentType === 'percentage') {
      amountToPay = Math.round((totalPrice * percentageRate) / 100);
      percentagePaid = amountToPay;
      remainingAmount = totalPrice - amountToPay;
    } else if (paymentType === 'delivery_secured') {
      amountToPay = totalPrice;
    }

    const finalAmountToPay = Math.max(0, amountToPay - (giftCardAmount || 0));
    const orderNumber = await generateOrderNumber();
    const affiliateTrackingCookie = getAffiliateTrackingCookie();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        customer_id: customerId,
        order_number: orderNumber,
        total_amount: totalPrice - (giftCardAmount || 0),
        currency: product.currency,
        payment_status: 'pending',
        status: 'pending',
        payment_type: paymentType,
        percentage_paid: percentagePaid,
        remaining_amount: remainingAmount,
        affiliate_tracking_cookie: affiliateTrackingCookie,
      })
      .select('id, store_id, customer_id, order_number, total_amount, currency, status, payment_status, created_at')
      .single();

    if (orderError || !order) {
      await supabase.from('service_bookings').update({ status: 'cancelled' }).eq('id', booking.id);
      throw new Error('Erreur lors de la création de la commande');
    }

    // Rédimer la carte cadeau
    if (giftCardId && giftCardAmount && giftCardAmount > 0) {
      try {
        await supabase.rpc('redeem_gift_card', {
          p_gift_card_id: giftCardId,
          p_order_id: order.id,
          p_amount: giftCardAmount,
        });
      } catch (giftCardError) {
        logger.error('Error in gift card redemption:', giftCardError);
      }
    }

    // Créer la facture
    try {
      await supabase.rpc('create_invoice_from_order', { p_order_id: order.id });
    } catch (_invoiceErr) { /* ignore */ }

    import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
      triggerOrderCreatedWebhook(order.id, order).catch(() => {});
    });

    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: productId,
        product_type: 'service',
        service_product_id: resolvedServiceProductId,
        booking_id: booking.id,
        product_name: product.name,
        quantity: 1,
        unit_price: totalPrice,
        total_price: totalPrice,
        item_metadata: {
          booking_date: bookingDateTime,
          duration_minutes: actualDuration,
          number_of_participants: numberOfParticipants,
          staff_id: staffId,
          notes,
        },
      })
      .select('id')
      .single();

    if (orderItemError || !orderItem) {
      await supabase.from('service_bookings').update({ status: 'cancelled' }).eq('id', booking.id);
      throw new Error("Erreur lors de la création de l'élément de commande");
    }

    if (paymentType === 'delivery_secured') {
      await supabase.from('secured_payments').insert({
        order_id: order.id,
        total_amount: totalPrice,
        held_amount: amountToPay,
        status: 'held',
        hold_reason: 'service_completion',
        release_conditions: { requires_service_completion: true, auto_release_days: 3 },
      });
    }

    const formattedBookingDate = new Date(bookingDateTime).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const paymentDescription = paymentType === 'percentage'
        ? `Acompte ${percentageRate}%: ${product.name} - ${formattedBookingDate}`
        : paymentType === 'delivery_secured'
          ? `Paiement sécurisé: ${product.name} - ${formattedBookingDate}`
          : `Réservation: ${product.name} - ${formattedBookingDate}`;

    const paymentResult = await initiatePayment({
      storeId,
      productId,
      orderId: order.id,
      customerId,
      amount: finalAmountToPay,
      currency: product.currency,
      description: paymentDescription,
      customerEmail,
      customerName: customerName || customerEmail.split('@')[0],
      customerPhone,
      metadata: {
        product_type: 'service',
        service_product_id: resolvedServiceProductId,
        booking_id: booking.id,
        booking_date: bookingDateTime,
        duration_minutes: actualDuration,
        number_of_participants: numberOfParticipants,
        order_item_id: orderItem.id,
        payment_type: paymentType,
        percentage_rate: paymentType === 'percentage' ? percentageRate : null,
        total_price: totalPrice,
        amount_paid: amountToPay,
        remaining_amount: remainingAmount,
      },
    });

    if (!paymentResult.success || !paymentResult.checkout_url) {
      await supabase.from('service_bookings').update({ status: 'cancelled' }).eq('id', booking.id);
      throw new Error("Erreur lors de l'initialisation du paiement");
    }

    return {
      orderId: order.id,
      orderItemId: orderItem.id,
      bookingId: booking.id,
      checkoutUrl: paymentResult.checkout_url,
      transactionId: paymentResult.transaction_id,
    };
  }
}
