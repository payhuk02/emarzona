/**
 * Digital Product Webhooks Service
 * Date: 2025-01-27
 * 
 * Service pour envoyer des webhooks avec retry logic et signature HMAC
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

import type { RecordString } from '@/types/common';

export interface WebhookPayload {
  event: string;
  event_id?: string;
  timestamp: string;
  data: RecordString;
}

export interface SendWebhookResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
  durationMs: number;
}

/**
 * Génère la signature HMAC pour un payload (utilise Web Crypto API côté navigateur)
 */
async function generateHMACSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Envoie un webhook avec retry logic
 */
export async function sendWebhook(
  webhookId: string,
  eventType: string,
  eventData: RecordString,
  eventId?: string
): Promise<SendWebhookResult> {
  const startTime = Date.now();

  try {
    // Récupérer le webhook
    const { data: webhook, error: fetchError } = await supabase
      .from('digital_product_webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (fetchError || !webhook) {
      throw new Error('Webhook non trouvé');
    }

    // Vérifier si le webhook est actif
    if (!webhook.is_active) {
      logger.debug('Webhook is inactive', { webhookId, eventType });
      return {
        success: false,
        error: 'Webhook inactif',
        durationMs: Date.now() - startTime,
      };
    }

    // Vérifier si l'événement est configuré
    if (!webhook.events.includes(eventType)) {
      logger.debug('Event type not configured for webhook', { webhookId, eventType });
      return {
        success: false,
        error: 'Type d\'événement non configuré',
        durationMs: Date.now() - startTime,
      };
    }

    // Construire le payload
    const payload: WebhookPayload = {
      event: eventType,
      event_id: eventId,
      timestamp: new Date().toISOString(),
      data: eventData,
    };

    const payloadString = JSON.stringify(payload);
    const signature = await generateHMACSignature(payloadString, webhook.secret_key);

    // Headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': eventType,
      'User-Agent': 'Emarzona-Webhooks/1.0',
      ...webhook.headers,
    };

    // Envoyer avec retry
    let lastError: Error | null = null;
    let lastResponse: Response | null = null;

    for (let attempt = 1; attempt <= webhook.retry_count + 1; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), webhook.timeout_seconds * 1000);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: payloadString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseBody = await response.text().catch(() => '');
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Enregistrer le log
        await logWebhookResult(
          webhookId,
          eventType,
          eventId,
          payload,
          response.status,
          responseBody,
          responseHeaders,
          attempt,
          response.ok,
          Date.now() - startTime
        );

        // Mettre à jour les statistiques
        if (response.ok || attempt === webhook.retry_count + 1) {
          await supabase.rpc('update_webhook_stats', {
            p_webhook_id: webhookId,
            p_success: response.ok,
          });
        }

        if (response.ok) {
          return {
            success: true,
            statusCode: response.status,
            responseBody,
            durationMs: Date.now() - startTime,
          };
        }

        lastResponse = response;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Si c'est la dernière tentative, enregistrer l'erreur
        if (attempt === webhook.retry_count + 1) {
          await logWebhookResult(
            webhookId,
            eventType,
            eventId,
            payload,
            undefined,
            undefined,
            undefined,
            attempt,
            false,
            Date.now() - startTime,
            error.message || 'Erreur réseau',
            error.code || 'NETWORK_ERROR'
          );

          await supabase.rpc('update_webhook_stats', {
            p_webhook_id: webhookId,
            p_success: false,
          });
        } else {
          // Attendre avant de réessayer (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      statusCode: lastResponse?.status,
      responseBody: lastResponse ? await lastResponse.text().catch(() => '') : undefined,
      error: lastError?.message || 'Échec après toutes les tentatives',
      durationMs: Date.now() - startTime,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error sending webhook', { error, webhookId, eventType });
    return {
      success: false,
      error: errorMessage || 'Erreur inconnue',
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Enregistre le résultat d'un webhook dans les logs
 */
async function logWebhookResult(
  webhookId: string,
  eventType: string,
  eventId: string | undefined,
  payload: WebhookPayload,
  statusCode: number | undefined,
  responseBody: string | undefined,
  responseHeaders: Record<string, string> | undefined,
  attempts: number,
  success: boolean,
  durationMs: number,
  errorMessage?: string,
  errorCode?: string
) {
  try {
    const { error } = await supabase.from('digital_product_webhook_logs').insert({
      webhook_id: webhookId,
      event_type: eventType,
      event_id: eventId,
      payload,
      response_status: statusCode,
      response_body: responseBody,
      response_headers: responseHeaders,
      attempts,
      success,
      duration_ms: durationMs,
      error_message: errorMessage,
      error_code: errorCode,
    });

    if (error) {
      logger.error('Error logging webhook result', { error });
    }
  } catch (error) {
    logger.error('Error in logWebhookResult', { error });
  }
}

/**
 * Envoie des webhooks pour un événement donné
 */
export async function triggerWebhooks(
  storeId: string,
  eventType: string,
  eventData: RecordString,
  eventId?: string
): Promise<void> {
  try {
    // Récupérer tous les webhooks actifs pour ce store et cet événement
    const { data: webhooks, error } = await supabase
      .from('digital_product_webhooks')
      .select('id')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (error) {
      logger.error('Error fetching webhooks', { error, storeId, eventType });
      return;
    }

    if (!webhooks || webhooks.length === 0) {
      logger.debug('No active webhooks found', { storeId, eventType });
      return;
    }

    // Envoyer les webhooks en parallèle (mais limiter à 10 simultanés)
    const batchSize = 10;
    for (let i = 0; i < webhooks.length; i += batchSize) {
      const batch = webhooks.slice(i, i + batchSize);
      await Promise.all(
        batch.map(webhook => sendWebhook(webhook.id, eventType, eventData, eventId))
      );
    }
  } catch (error) {
    logger.error('Error triggering webhooks', { error, storeId, eventType });
  }
}

