/**
 * Webhook System
 * Date: 28 Janvier 2025
 *
 * Système de webhooks pour tous les événements
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type WebhookEvent =
  // Commandes
  | 'order.created'
  | 'order.completed'
  | 'order.cancelled'
  | 'order.payment_received'
  | 'order.payment_failed'
  | 'order.refunded'

  // Produits
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.stock_low'
  | 'product.out_of_stock'

  // Clients
  | 'customer.created'
  | 'customer.updated'

  // Paiements
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.refunded'

  // Services
  | 'service.booking_confirmed'
  | 'service.booking_cancelled'

  // Cours
  | 'course.enrollment'
  | 'course.completed';

export interface Webhook {
  id: string;
  store_id: string;
  url: string;
  secret: string;
  description?: string;
  events: WebhookEvent[];
  is_active: boolean;
  last_triggered_at?: string;
  failure_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: WebhookEvent;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  status_code?: number;
  response_body?: string;
  error_message?: string;
  attempt_number: number;
  max_attempts: number;
  triggered_at: string;
  completed_at?: string;
}

/**
 * Créer un webhook
 */
/**
 * Créer un webhook
 *
 * @deprecated Utilisez useCreateWebhook() hook depuis useWebhooks.ts à la place
 * Cette fonction est maintenue pour compatibilité
 */
export async function createWebhook(
  storeId: string,
  url: string,
  events: WebhookEvent[],
  secret?: string
): Promise<{ success: boolean; webhook?: Webhook; error?: string }> {
  try {
    // Générer un secret si non fourni
    let  webhookSecret= secret;
    if (!webhookSecret) {
      const { data: secretData, error: secretError } =
        await supabase.rpc('generate_webhook_secret');
      if (secretError) throw secretError;
      webhookSecret = secretData;
    }

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        store_id: storeId,
        url,
        secret: webhookSecret,
        events: events as unknown as Array<
          | 'order.created'
          | 'order.completed'
          | 'order.cancelled'
          | 'order.refunded'
          | 'product.created'
          | 'product.updated'
          | 'product.deleted'
          | 'customer.created'
          | 'customer.updated'
          | 'payment.completed'
          | 'payment.failed'
          | 'payment.refunded'
          | 'service.booking_confirmed'
          | 'service.booking_cancelled'
          | 'course.enrolled'
          | 'course.completed'
          | 'subscription.expired'
        >, // Type assertion pour compatibilité
        status: 'active',
        name: `Webhook - ${url}`,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Webhook created', { webhookId: data.id, storeId, events });

    // Convertir au format Webhook pour compatibilité
    const  webhook: Webhook = {
      id: data.id,
      store_id: data.store_id,
      url: data.url,
      secret: data.secret || '',
      description: data.description || undefined,
      events: (data.events || []) as WebhookEvent[],
      is_active: data.status === 'active',
      last_triggered_at: data.last_triggered_at || undefined,
      failure_count: data.failed_deliveries || 0,
      last_error: undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { success: true, webhook };
  } catch ( _error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error creating webhook', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Déclencher un webhook
 *
 * @deprecated Utilisez triggerUnifiedWebhook() de unified-webhook-service.ts à la place
 * Cette fonction est maintenue pour compatibilité et utilise le service unifié en interne
 */
export async function triggerWebhook(
  storeId: string,
  eventType: WebhookEvent,
  payload: Record<string, unknown>,
  eventId?: string
): Promise<void> {
  try {
    // Mapper les anciens types d'événements vers les nouveaux
    const  eventTypeMap: Record<string, string> = {
      'order.payment_received': 'payment.completed',
      'order.payment_failed': 'payment.failed',
      'product.stock_low': 'product.updated',
      'product.out_of_stock': 'product.updated',
      'service.booking_confirmed': 'service.booking_confirmed',
      'service.booking_cancelled': 'service.booking_cancelled',
      'course.enrollment': 'course.enrolled',
    };

    const normalizedEventType = eventTypeMap[eventType] || eventType;

    // Utiliser le service unifié en interne
    const { triggerUnifiedWebhook } = await import('./unified-webhook-service');
    await triggerUnifiedWebhook(storeId, normalizedEventType, payload, eventId);
  } catch ( _error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Exception triggering webhook', { error: errorMessage, storeId, eventType });
  }
}

/**
 * Envoyer un webhook (appelé par un worker/Edge Function  _uniquement)
 *
 * ⚠️ SÉCURITÉ: Cette fonction ne devrait JAMAIS être appelée depuis le client
 * car elle expose le secret du webhook. Utilisez uniquement depuis:
 * - Edge Functions (supabase/functions/webhook-delivery)
 * - Workers backend
 *
 * Pour déclencher un webhook depuis le client, utilisez triggerWebhook() qui
 * crée uniquement une delivery, et l'Edge Function s'en charge.
 */
export async function sendWebhook(
  webhook: Webhook,
  eventType: WebhookEvent,
  payload: Record<string, unknown>
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  // Avertissement en développement si appelé depuis le client
  if (typeof window !== 'undefined') {
    logger.warn(
      'sendWebhook called from client! This exposes webhook secrets. ' +
        'Use triggerWebhook() instead and let the Edge Function handle delivery.'
    );
  }
  try {
    // Signer le payload avec HMAC-SHA256 sécurisé
    const payloadString = JSON.stringify(payload);
    const signature = await signPayload(payloadString, webhook.secret);
    const timestamp = Date.now();

    // Envoyer la requête
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emarzona-Signature': signature,
        'X-Emarzona-Timestamp': timestamp.toString(),
        'X-Emarzona-Event': eventType,
      },
      body: payloadString,
    });

    const success = response.ok;
    const responseBody = await response.text().catch(() => '');

    // Mettre à jour le log
    await updateWebhookLog(webhook.id, eventType, {
      success,
      statusCode: response.status,
      responseBody,
      errorMessage: success ? undefined : responseBody,
    });

    // Mettre à jour le webhook (statistiques)
    if (success) {
      await supabase
        .from('webhooks')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_successful_delivery_at: new Date().toISOString(),
        })
        .eq('id', webhook.id);
    } else {
      await supabase
        .from('webhooks')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_failed_delivery_at: new Date().toISOString(),
        })
        .eq('id', webhook.id);
    }

    return { success, statusCode: response.status };
  } catch ( _error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error sending webhook', { error: errorMessage, webhookId: webhook.id });

    // Mettre à jour le log
    await updateWebhookLog(webhook.id, eventType, {
      success: false,
      errorMessage,
    });

    // Mettre à jour le webhook (statistiques)
    await supabase
      .from('webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        last_failed_delivery_at: new Date().toISOString(),
      })
      .eq('id', webhook.id);

    return { success: false, error: errorMessage };
  }
}

/**
 * Signer un payload avec le secret en utilisant HMAC-SHA256
 * Utilise Web Crypto API pour une sécurité maximale
 * Compatible navigateur et Node.js
 */
async function signPayload(payload: string, secret: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    // Importer la clé pour HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Générer la signature HMAC
    const signature = await crypto.subtle.sign('HMAC', key, messageData);

    // Convertir en hexadécimal
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch ( _error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error signing payload', { error: errorMessage });
    throw new Error('Failed to sign webhook payload');
  }
}

/**
 * Vérifier la signature d'un webhook
 * Utilise une comparaison constante dans le temps pour éviter les attaques par timing
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const expectedSignature = await signPayload(payload, secret);
    return constantTimeEquals(signature, expectedSignature);
  } catch ( _error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error verifying webhook signature', { error: errorMessage });
    return false;
  }
}

/**
 * Compare deux strings de manière constante dans le temps
 * Pour éviter les attaques par timing
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let  result= 0;
  for (let  i= 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Mettre à jour un log de webhook
 */
async function updateWebhookLog(
  webhookId: string,
  eventType: WebhookEvent,
  result: {
    success: boolean;
    statusCode?: number;
    responseBody?: string;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    // Mapper le type d'événement vers le format unifié
    const  eventTypeMap: Record<string, string> = {
      'order.payment_received': 'payment.completed',
      'order.payment_failed': 'payment.failed',
      'product.stock_low': 'product.updated',
      'product.out_of_stock': 'product.updated',
      'service.booking_confirmed': 'service.booking_confirmed',
      'service.booking_cancelled': 'service.booking_cancelled',
      'course.enrollment': 'course.enrolled',
    };
    const normalizedEventType = eventTypeMap[eventType] || eventType;

    // Utiliser la table webhook_deliveries (nouveau système unifié)
    const { data: deliveries } = await supabase
      .from('webhook_deliveries')
      .select('id, attempt_number, max_attempts')
      .eq('webhook_id', webhookId)
      .eq(
        'event_type',
        normalizedEventType as unknown as
          | 'order.created'
          | 'order.completed'
          | 'order.cancelled'
          | 'order.refunded'
          | 'product.created'
          | 'product.updated'
          | 'product.deleted'
          | 'customer.created'
          | 'customer.updated'
          | 'payment.completed'
          | 'payment.failed'
          | 'payment.refunded'
          | 'service.booking_confirmed'
          | 'service.booking_cancelled'
          | 'course.enrolled'
          | 'course.completed'
          | 'subscription.expired'
      ) // Type assertion pour compatibilité
      .eq('status', 'pending')
      .order('triggered_at', { ascending: false })
      .limit(1);

    if (deliveries && deliveries.length > 0) {
      const delivery = deliveries[0];
      const attemptNumber = delivery.attempt_number || 0;
      const maxAttempts = delivery.max_attempts || 3;

      const status = result.success
        ? 'delivered'
        : attemptNumber < maxAttempts
          ? 'retrying'
          : 'failed';

      await supabase.rpc('update_webhook_delivery_status', {
        p_delivery_id: delivery.id as string,
        p_status: status as 'pending' | 'delivered' | 'failed' | 'retrying',
        p_response_status_code: result.statusCode || undefined,
        p_response_body: result.responseBody || undefined,
        p_error_message: result.errorMessage || undefined,
      } as {
        p_delivery_id: string;
        p_status: 'pending' | 'delivered' | 'failed' | 'retrying';
        p_response_status_code?: number;
        p_response_body?: string;
        p_error_message?: string;
      }); // Type assertion nécessaire pour compatibilité
    }
  } catch ( _error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error updating webhook log', { error: errorMessage });
  }
}

/**
 * Récupérer les webhooks d'une boutique
 *
 * @deprecated Utilisez useWebhooks() hook depuis useWebhooks.ts à la place
 * Cette fonction est maintenue pour compatibilité
 */
export async function getWebhooks(storeId: string): Promise<Webhook[]> {
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching webhooks', { error: error.message });
    return [];
  }

  // Convertir au format Webhook pour compatibilité
  return (data || []).map((w: Record<string, unknown>) => ({
    id: w.id,
    store_id: w.store_id,
    url: w.url,
    secret: w.secret || '',
    description: w.description || undefined,
    events: (w.events || []) as WebhookEvent[],
    is_active: w.status === 'active',
    last_triggered_at: w.last_triggered_at || undefined,
    failure_count: w.failed_deliveries || 0,
    last_error: undefined,
    created_at: w.created_at,
    updated_at: w.updated_at,
  })) as Webhook[];
}

/**
 * Récupérer les logs d'un webhook
 *
 * @deprecated Utilisez useWebhookDeliveries() hook depuis useWebhooks.ts à la place
 * Cette fonction est maintenue pour compatibilité
 */
export async function getWebhookLogs(webhookId: string, limit: number = 50): Promise<WebhookLog[]> {
  const { data, error } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('triggered_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching webhook logs', { error: error.message });
    return [];
  }

  // Convertir les deliveries au format WebhookLog pour compatibilité
  return (data || []).map((delivery: Record<string, unknown>) => ({
    id: delivery.id,
    webhook_id: delivery.webhook_id,
    event_type: delivery.event_type as WebhookEvent,
    payload: delivery.event_data || {},
    status:
      delivery.status === 'delivered'
        ? 'success'
        : delivery.status === 'failed'
          ? 'failed'
          : delivery.status === 'retrying'
            ? 'retrying'
            : 'pending',
    status_code: delivery.response_status_code || undefined,
    response_body: delivery.response_body || undefined,
    error_message: delivery.error_message || undefined,
    attempt_number: delivery.attempt_number || 0,
    max_attempts: delivery.max_attempts || 3,
    triggered_at: delivery.triggered_at,
    completed_at: delivery.delivered_at || delivery.failed_at || undefined,
  })) as WebhookLog[];
}






