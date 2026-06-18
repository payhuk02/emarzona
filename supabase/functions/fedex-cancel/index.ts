/**
 * Edge Function : annulation d'expédition FedEx
 * Clés API côté serveur uniquement. Fallback mock si credentials absents.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  allowFedexMockResponses,
  fedexMockDisabledError,
  hasFedexApiCredentials,
  resolveFedexTestMode,
} from '../_shared/fedex-policy.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

interface CancelRequestBody {
  tracking_number: string;
}

interface CancelResponse {
  success: boolean;
  tracking_number: string;
  message?: string;
  source: 'fedex_api' | 'mock';
}

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

async function getFedExAccessToken(
  apiKey: string,
  apiSecret: string,
  testMode: boolean
): Promise<string> {
  const tokenUrl = testMode
    ? 'https://apis-sandbox.fedex.com/oauth/token'
    : 'https://apis.fedex.com/oauth/token';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FedEx OAuth error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

function mockCancel(trackingNumber: string): CancelResponse {
  return {
    success: true,
    tracking_number: trackingNumber,
    message: 'Expédition annulée (simulation)',
    source: 'mock',
  };
}

async function cancelFedExShipment(trackingNumber: string): Promise<CancelResponse> {
  const apiKey = Deno.env.get('FEDEX_API_KEY') || '';
  const apiSecret = Deno.env.get('FEDEX_API_SECRET') || '';
  const accountNumber = Deno.env.get('FEDEX_ACCOUNT_NUMBER') || '';
  const testMode = resolveFedexTestMode();

  if (!apiKey || !apiSecret || !accountNumber) {
    if (!allowFedexMockResponses()) {
      throw fedexMockDisabledError();
    }
    return mockCancel(trackingNumber);
  }

  const accessToken = await getFedExAccessToken(apiKey, apiSecret, testMode);
  const apiUrl = testMode ? 'https://apis-sandbox.fedex.com' : 'https://apis.fedex.com';
  const cancelUrl = `${apiUrl}/ship/v1/shipments/cancel`;

  const response = await fetch(cancelUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-locale': 'fr_FR',
    },
    body: JSON.stringify({
      accountNumber: { value: accountNumber },
      trackingNumber,
      deletionControl: 'DELETE_ALL_PACKAGES',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.warn('FedEx cancel API failed:', err);
    if (!allowFedexMockResponses()) {
      throw new Error('FEDEX_API_FAILED');
    }
    return mockCancel(trackingNumber);
  }

  const data = await response.json().catch(() => ({}));
  const output = data?.output || {};
  const cancelled =
    output.cancelledShipment === true ||
    output.cancelledShipment?.cancelled === true ||
    output.success === true;

  if (!cancelled && !output.message) {
    if (!allowFedexMockResponses()) {
      throw new Error('FEDEX_API_EMPTY');
    }
    return mockCancel(trackingNumber);
  }

  return {
    success: true,
    tracking_number: trackingNumber,
    message: output.message || 'Expédition annulée chez FedEx',
    source: 'fedex_api',
  };
}

serve(async req => {
  const origin = req.headers.get('Origin');
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as CancelRequestBody;

    if (!body?.tracking_number?.trim()) {
      return new Response(JSON.stringify({ error: 'tracking_number requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trackingNumber = body.tracking_number.trim();
    const result = await cancelFedExShipment(trackingNumber);

    if (!hasFedexApiCredentials() && result.source !== 'mock') {
      result.source = 'mock';
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('fedex-cancel error:', error);
    const message = error instanceof Error ? error.message : 'Erreur FedEx cancel';
    const status =
      message === 'FEDEX_NOT_CONFIGURED' ? 503 : message.startsWith('FEDEX_API') ? 502 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
