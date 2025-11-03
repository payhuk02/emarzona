/**
 * Webhook Trigger Utility
 * 
 * Utilitaire pour déclencher des webhooks de manière asynchrone
 * depuis les événements clés de l'application.
 */

import { supabase } from '@/integrations/supabase/client';
import type { WebhookEventType } from '@/types/webhooks';

/**
 * Déclenche un webhook pour un événement donné
 * 
 * @param eventType - Type d'événement (ex: 'order.created')
 * @param eventId - ID de l'entité qui a déclenché l'événement
 * @param eventData - Données de l'événement (sera envoyé dans le payload)
 * @param storeId - ID du store (optionnel, peut être extrait de eventData)
 */
export async function triggerWebhook(
  eventType: WebhookEventType,
  eventId: string,
  eventData: Record<string, any> = {},
  storeId?: string
): Promise<void> {
  try {
    // Appeler la fonction RPC qui créera les deliveries
    const { data, error } = await supabase.rpc('trigger_webhook', {
      p_event_type: eventType,
      p_event_id: eventId,
      p_event_data: eventData,
      p_store_id: storeId || null,
    });

    if (error) {
      console.error(`[Webhook] Erreur lors du déclenchement de ${eventType}:`, error);
      // Ne pas throw pour éviter de bloquer le flux principal
      return;
    }

    if (data && data.length > 0) {
      // Les deliveries ont été créées avec succès
      // L'Edge Function se chargera de les envoyer de manière asynchrone
      console.log(`[Webhook] ${data.length} webhook(s) déclenché(s) pour ${eventType}`);
      
      // Optionnel: Appeler l'Edge Function immédiatement pour traitement synchrone
      // Note: Ceci peut être fait via un trigger PostgreSQL ou un cron job
      // Pour l'instant, on laisse l'Edge Function être appelée par un cron ou manuellement
    }
  } catch (error: any) {
    console.error(`[Webhook] Exception lors du déclenchement de ${eventType}:`, error);
    // Ne pas throw pour éviter de bloquer le flux principal
  }
}

/**
 * Déclenche un webhook pour une commande créée
 */
export async function triggerOrderCreatedWebhook(
  orderId: string,
  orderData: {
    store_id: string;
    customer_id: string;
    order_number: string;
    status: string;
    total_amount: number;
    currency: string;
    payment_status: string;
    created_at: string;
    order_items?: any[];
  }
): Promise<void> {
  await triggerWebhook(
    'order.created',
    orderId,
    {
      order: orderData,
    },
    orderData.store_id
  );
}

/**
 * Déclenche un webhook pour une commande mise à jour
 */
export async function triggerOrderUpdatedWebhook(
  orderId: string,
  orderData: Record<string, any>,
  storeId?: string
): Promise<void> {
  await triggerWebhook(
    'order.updated',
    orderId,
    {
      order: orderData,
    },
    storeId
  );
}

/**
 * Déclenche un webhook pour une commande complétée
 */
export async function triggerOrderCompletedWebhook(
  orderId: string,
  orderData: Record<string, any>,
  storeId?: string
): Promise<void> {
  await triggerWebhook(
    'order.completed',
    orderId,
    {
      order: orderData,
    },
    storeId
  );
}

/**
 * Déclenche un webhook pour un paiement complété
 */
export async function triggerPaymentCompletedWebhook(
  paymentId: string,
  paymentData: {
    order_id: string;
    transaction_id: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    created_at: string;
    order?: Record<string, any>;
  },
  storeId?: string
): Promise<void> {
  await triggerWebhook(
    'payment.completed',
    paymentId,
    {
      payment: paymentData,
    },
    storeId
  );
}

/**
 * Déclenche un webhook pour un produit créé
 */
export async function triggerProductCreatedWebhook(
  productId: string,
  productData: Record<string, any>,
  storeId?: string
): Promise<void> {
  await triggerWebhook(
    'product.created',
    productId,
    {
      product: productData,
    },
    storeId
  );
}

/**
 * Déclenche un webhook pour une inscription à un cours
 */
export async function triggerCourseEnrolledWebhook(
  enrollmentId: string,
  enrollmentData: {
    course_id: string;
    user_id: string;
    progress_percentage: number;
    status: string;
    enrolled_at: string;
    course?: Record<string, any>;
  },
  storeId?: string
): Promise<void> {
  await triggerWebhook(
    'course.enrolled',
    enrollmentId,
    {
      enrollment: enrollmentData,
    },
    storeId
  );
}

/**
 * Déclenche un webhook pour une réservation de service créée
 */
export async function triggerServiceBookingCreatedWebhook(
  bookingId: string,
  bookingData: {
    product_id: string;
    user_id: string;
    scheduled_date: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    status: string;
    meeting_url?: string;
    created_at: string;
    service?: Record<string, any>;
  },
  storeId?: string
): Promise<void> {
  await triggerWebhook(
    'service.booking_created',
    bookingId,
    {
      booking: bookingData,
    },
    storeId
  );
}

/**
 * Déclenche un webhook pour un retour créé
 */
export async function triggerReturnCreatedWebhook(
  returnId: string,
  returnData: {
    order_item_id: string;
    customer_id: string;
    store_id: string;
    return_number: string;
    return_reason: string;
    status: string;
    refund_amount: number;
    created_at: string;
  }
): Promise<void> {
  await triggerWebhook(
    'return.created',
    returnId,
    {
      return: returnData,
    },
    returnData.store_id
  );
}

