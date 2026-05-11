import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

async function createHmacSignature(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(
  corsHeaders: Record<string, string>,
  status: number,
  body: Record<string, unknown>,
  requestId: string,
  requestStart: number
) {
  return new Response(
    JSON.stringify({
      ...body,
      requestId,
      durationMs: Date.now() - requestStart,
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  event_id: string;
  event_data: any;
  status: string;
  url: string;
  request_headers: Record<string, string>;
  request_body: string | null;
  attempt_number: number;
  max_attempts: number;
  next_retry_at: string | null;
}

interface Webhook {
  id: string;
  status: string;
  url: string;
  secret: string | null;
  custom_headers: Record<string, string>;
  verify_ssl: boolean;
  timeout_seconds: number;
}

function logEvent(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown>) {
  const payload = JSON.stringify({ level, message, ...context });
  if (level === 'error') {
    console.error(payload);
    return;
  }
  if (level === 'warn') {
    console.warn(payload);
    return;
  }
  console.log(payload);
}

/**
 * Génère une signature HMAC-SHA256 pour le payload
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(payload);
  
  const hashBuffer = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", hashBuffer, data);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Prépare le payload du webhook
 */
function preparePayload(delivery: WebhookDelivery): any {
  return {
    id: delivery.id,
    event: delivery.event_type,
    timestamp: new Date().toISOString(),
    data: delivery.event_data,
    metadata: {
      version: '1.0',
    },
  };
}

/**
 * Envoie un webhook
 */
async function deliverWebhook(
  delivery: WebhookDelivery,
  webhook: Webhook
): Promise<{
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
  durationMs: number;
}> {
  const startTime = Date.now();
  
  try {
    const payload = preparePayload(delivery);
    const payloadString = JSON.stringify(payload);
    
    // Préparer les headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Emarzona-Webhooks/1.0',
      'X-Emarzona-Event': delivery.event_type,
      'X-Emarzona-Delivery-Id': delivery.id,
      ...webhook.custom_headers,
    };
    
    // Ajouter signature HMAC si secret disponible
    if (webhook.secret) {
      const signature = await generateSignature(payloadString, webhook.secret);
      headers['X-Emarzona-Signature'] = `sha256=${signature}`;
    }
    
    // Configuration fetch
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers,
      body: payloadString,
    };
    
    // Désactiver vérification SSL si demandé (non recommandé en production)
    if (!webhook.verify_ssl && Deno.env.get('DENO_ENV') !== 'production') {
      // Note: Deno fetch ne supporte pas l'option rejectUnauthorized
      // Cette fonctionnalité serait mieux gérée avec un agent HTTP custom
      console.warn('SSL verification disabled (non-production only)');
    }
    
    // Contrôle de timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      webhook.timeout_seconds * 1000
    );
    
    try {
      const response = await fetch(webhook.url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      
      // Lire le body de la réponse (limité à 10KB pour éviter la mémoire)
      const responseBody = await response.text();
      const truncatedBody = responseBody.length > 10000 
        ? responseBody.substring(0, 10000) + '...[truncated]'
        : responseBody;
      
      return {
        success: response.ok,
        statusCode: response.status,
        responseBody: truncatedBody,
        durationMs,
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
          durationMs,
        };
      }
      
      throw fetchError;
    }
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      error: error.message || 'Unknown error',
      durationMs,
    };
  }
}

/**
 * Calcule la date de la prochaine tentative (exponential backoff)
 */
function calculateNextRetry(attemptNumber: number): Date {
  const delayMinutes = Math.min(Math.pow(2, attemptNumber), 60); // Max 60 minutes
  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);
  return nextRetry;
}

/**
 * Traite une livraison webhook
 */
async function processDelivery(
  supabase: any,
  delivery: WebhookDelivery
): Promise<void> {
  // Récupérer le webhook
  const { data: webhook, error: webhookError } = await supabase
    .from('webhooks')
    .select('id,status,url,secret,custom_headers,verify_ssl,timeout_seconds')
    .eq('id', delivery.webhook_id)
    .single();
  
  if (webhookError || !webhook) {
    console.error('Webhook not found:', webhookError);
    await supabase.rpc('update_webhook_delivery_status', {
      p_delivery_id: delivery.id,
      p_status: 'failed',
      p_error_message: 'Webhook not found',
      p_error_type: 'configuration_error',
    });
    return;
  }
  
  // Vérifier si le webhook est actif
  if (webhook.status !== 'active') {
    console.log('Webhook is not active, skipping');
    await supabase.rpc('update_webhook_delivery_status', {
      p_delivery_id: delivery.id,
      p_status: 'failed',
      p_error_message: 'Webhook is not active',
      p_error_type: 'configuration_error',
    });
    return;
  }
  
  // Envoyer le webhook
  const result = await deliverWebhook(delivery, webhook);
  
  // Mettre à jour le statut
  if (result.success) {
    await supabase.rpc('update_webhook_delivery_status', {
      p_delivery_id: delivery.id,
      p_status: 'delivered',
      p_response_status_code: result.statusCode,
      p_response_body: result.responseBody,
      p_duration_ms: result.durationMs,
    });
  } else {
    // Vérifier si on peut retry
    if (delivery.attempt_number < delivery.max_attempts) {
      const nextRetry = calculateNextRetry(delivery.attempt_number);
      
      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'retrying',
          attempt_number: delivery.attempt_number + 1,
          next_retry_at: nextRetry.toISOString(),
          error_message: result.error,
          error_type: result.statusCode ? 'http_error' : 'network_error',
        })
        .eq('id', delivery.id);
    } else {
      await supabase.rpc('update_webhook_delivery_status', {
        p_delivery_id: delivery.id,
        p_status: 'failed',
        p_response_status_code: result.statusCode,
        p_response_body: result.responseBody,
        p_error_message: result.error || 'Max attempts reached',
        p_error_type: result.statusCode ? 'http_error' : 'network_error',
        p_duration_ms: result.durationMs,
      });
    }
  }
}

serve(async (req) => {
  const requestStart = Date.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const expectedInternalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');
    const internalSecret = req.headers.get('x-internal-secret');

    if (!expectedInternalSecret) {
      logEvent('error', 'Missing internal secret configuration', { requestId });
      return jsonResponse(
        corsHeaders,
        500,
        { error: 'EDGE_INTERNAL_SECRET is not configured' },
        requestId,
        requestStart
      );
    }

    if (!internalSecret || internalSecret.trim() !== expectedInternalSecret.trim()) {
      logEvent('warn', 'Unauthorized webhook-delivery call', { requestId });
      return jsonResponse(corsHeaders, 401, { error: 'Unauthorized' }, requestId, requestStart);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer le delivery_id depuis la requête (optionnel)
    const { delivery_id } = await req.json().catch(() => ({}));

    let deliveries: WebhookDelivery[];

    if (delivery_id) {
      // Traiter un delivery spécifique
      const { data: delivery, error } = await supabase
        .from('webhook_deliveries')
        .select('id,webhook_id,event_type,event_id,event_data,status,attempt_number,max_attempts,next_retry_at')
        .eq('id', delivery_id)
        .eq('status', 'pending')
        .single();

      if (error || !delivery) {
        return jsonResponse(
          corsHeaders,
          404,
          { error: 'Delivery not found or not pending' },
          requestId,
          requestStart
        );
      }

      deliveries = [delivery];
    } else {
      // Traiter tous les deliveries en attente (pending ou retrying)
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('id,webhook_id,event_type,event_id,event_data,status,attempt_number,max_attempts,next_retry_at')
        .in('status', ['pending', 'retrying'])
        .or('next_retry_at.is.null,next_retry_at.lte.' + new Date().toISOString())
        .limit(50) // Limiter pour éviter la surcharge
        .order('triggered_at', { ascending: true });

      if (error) {
        throw error;
      }

      deliveries = (data || []) as WebhookDelivery[];
    }

    // Traiter chaque delivery
    const results = await Promise.allSettled(
      deliveries.map((delivery) => processDelivery(supabase, delivery))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return jsonResponse(
      corsHeaders,
      200,
      {
        success: true,
        processed: deliveries.length,
        successful,
        failed,
      },
      requestId,
      requestStart
    );
  } catch (error: any) {
    logEvent('error', 'Webhook delivery error', {
      requestId,
      durationMs: Date.now() - requestStart,
      error: error?.message || 'Internal server error',
    });
    return jsonResponse(
      corsHeaders,
      500,
      { error: error.message || 'Internal server error' },
      requestId,
      requestStart
    );
  }
});

