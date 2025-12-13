/**
 * Physical Products Webhooks Service
 * Date: 2025-01-27
 * 
 * Service pour envoyer des webhooks pour les événements de produits physiques
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface PhysicalProductWebhook {
  id: string;
  store_id: string;
  event_type: string;
  target_url: string;
  secret_key: string;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
  max_attempts?: number;
}

import type { RecordString } from '@/types/common';

export interface PhysicalProductWebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  event_id: string | null;
  payload: RecordString;
  response_status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  duration_ms: number | null;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string | null;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  created_at: string;
}

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
  webhook: PhysicalProductWebhook,
  payload: WebhookPayload,
  logId: string,
  attempt: number = 1
): Promise<SendWebhookResult> {
  const startTime = Date.now();
  let success = false;
  let statusCode: number | undefined;
  let responseBody: string | undefined;
  let error: string | undefined;

  try {
    const payloadString = JSON.stringify(payload);
    const signature = await generateHMACSignature(payloadString, webhook.secret_key);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'User-Agent': 'Emarzona-Webhook-Client',
      'X-Emarzona-Event': payload.event,
      'X-Emarzona-Event-ID': payload.event_id || '',
    };

    const response = await fetch(webhook.target_url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    });

    statusCode = response.status;
    responseBody = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${statusCode}, body: ${responseBody}`);
    }
    success = true;
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
    logger.error(`Webhook send failed for ${webhook.id} (attempt ${attempt}): ${error}`, {
      webhookId: webhook.id,
      targetUrl: webhook.target_url,
      event: payload.event,
      attempt,
      error,
      statusCode,
      responseBody,
    });
  } finally {
    const durationMs = Date.now() - startTime;
    const maxAttempts = webhook.max_attempts || 3;
    const status = success ? 'success' : (attempt < maxAttempts ? 'retrying' : 'failed');
    const nextAttemptAt = !success && attempt < maxAttempts
      ? new Date(Date.now() + Math.pow(2, attempt) * 1000).toISOString() // Exponential backoff
      : null;

    // Update log entry
    await supabase
      .from('physical_product_webhook_logs')
      .update({
        response_status_code: statusCode,
        response_body: responseBody,
        error_message: error,
        duration_ms: durationMs,
        attempt_count: attempt,
        next_attempt_at: nextAttemptAt,
        status: status,
      })
      .eq('id', logId);

    // Update webhook counters and last triggered time
    await supabase.rpc('update_physical_webhook_counters', {
      webhook_id_param: webhook.id,
      success: success,
    });

    // Update webhook last triggered time
    if (success) {
      await supabase
        .from('physical_product_webhooks')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', webhook.id);
    }

    return { success, statusCode, responseBody, error, durationMs };
  }
}

/**
 * Déclenche tous les webhooks actifs pour un événement donné et un store_id
 */
export async function triggerWebhooks(
  storeId: string,
  eventType: string,
  eventData: RecordString,
  eventId: string // ID de l'entité qui a déclenché l'événement
) {
  const { data: webhooks, error: fetchError } = await supabase
    .from('physical_product_webhooks')
    .select('*')
    .eq('store_id', storeId)
    .eq('event_type', eventType)
    .eq('is_active', true);

  if (fetchError) {
    logger.error('Error fetching webhooks to trigger', { fetchError, storeId, eventType });
    return { success: false, error: fetchError.message };
  }

  if (!webhooks || webhooks.length === 0) {
    logger.debug(`No active webhooks found for event ${eventType} in store ${storeId}`);
    return { success: true, message: 'No webhooks to trigger' };
  }

  const results = await Promise.all(
    webhooks.map(async (webhook) => {
      const payload: WebhookPayload = {
        event: eventType,
        event_id: eventId,
        timestamp: new Date().toISOString(),
        data: eventData,
      };

      // Create initial log entry
      const { data: log, error: logError } = await supabase
        .from('physical_product_webhook_logs')
        .insert({
          webhook_id: webhook.id,
          event_type: eventType,
          event_id: eventId,
          payload: payload,
          status: 'pending',
          max_attempts: 3, // Default max attempts
        })
        .select('id')
        .single();

      if (logError || !log) {
        logger.error('Error creating webhook log entry', { logError, webhookId: webhook.id });
        return { success: false, error: logError?.message || 'Failed to create log entry' };
      }

      // Send webhook with retry logic
      return sendWebhook(webhook as PhysicalProductWebhook, payload, log.id);
    })
  );

  return { success: results.every(r => r.success), results };
}

