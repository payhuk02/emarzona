/**
 * Edge Function : devis FedEx (tarifs livraison)
 * Clés API côté serveur uniquement. Fallback mock si credentials absents.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  allowFedexMockResponses,
  fedexMockDisabledError,
  resolveFedexTestMode,
} from '../_shared/fedex-policy.ts';
import { requireAuthenticatedUser } from '../_shared/edge-auth-utils.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

interface AddressInput {
  country: string;
  postal_code: string;
  city?: string;
}

interface RateRequestBody {
  ship_from: AddressInput;
  ship_to: AddressInput;
  weight_kg: number;
  dimensions?: { length: number; width: number; height: number };
}

interface RateQuote {
  service_type: string;
  service_name: string;
  total_cost: number;
  currency: string;
  estimated_days: number;
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

function mockRates(weightKg: number, toCountry: string): RateQuote[] {
  const base = toCountry === 'BF' ? 5000 : 15000;
  const weightFactor = Math.max(1, weightKg);
  return [
    {
      service_type: 'FEDEX_GROUND',
      service_name: 'FedEx Ground (estimation)',
      total_cost: Math.round(base * weightFactor),
      currency: 'XOF',
      estimated_days: 5,
    },
    {
      service_type: 'FEDEX_EXPRESS',
      service_name: 'FedEx Express (estimation)',
      total_cost: Math.round(base * weightFactor * 2.2),
      currency: 'XOF',
      estimated_days: 2,
    },
  ];
}

type FedexRatesResult = { rates: RateQuote[]; source: 'fedex_api' | 'mock' };

async function fetchFedExRates(body: RateRequestBody): Promise<FedexRatesResult> {
  const apiKey = Deno.env.get('FEDEX_API_KEY') || '';
  const apiSecret = Deno.env.get('FEDEX_API_SECRET') || '';
  const accountNumber = Deno.env.get('FEDEX_ACCOUNT_NUMBER') || '';
  const testMode = resolveFedexTestMode();

  if (!apiKey || !apiSecret || !accountNumber) {
    if (!allowFedexMockResponses()) {
      throw fedexMockDisabledError();
    }
    return { rates: mockRates(body.weight_kg, body.ship_to.country), source: 'mock' };
  }

  const accessToken = await getFedExAccessToken(apiKey, apiSecret, testMode);
  const apiUrl = testMode ? 'https://apis-sandbox.fedex.com' : 'https://apis.fedex.com';
  const rateUrl = `${apiUrl}/rate/v1/rates/quotes`;

  const response = await fetch(rateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-locale': 'fr_FR',
    },
    body: JSON.stringify({
      accountNumber: { value: accountNumber },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: body.ship_from.postal_code,
            countryCode: body.ship_from.country,
            city: body.ship_from.city,
          },
        },
        recipients: [
          {
            address: {
              postalCode: body.ship_to.postal_code,
              countryCode: body.ship_to.country,
              city: body.ship_to.city,
            },
          },
        ],
        rateRequestType: ['ACCOUNT', 'LIST'],
        requestedPackageLineItems: [
          {
            weight: { value: body.weight_kg, units: 'KG' },
            dimensions: body.dimensions
              ? {
                  length: body.dimensions.length,
                  width: body.dimensions.width,
                  height: body.dimensions.height,
                  units: 'CM',
                }
              : undefined,
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.warn('FedEx rates API failed:', err);
    if (!allowFedexMockResponses()) {
      throw new Error('FEDEX_API_FAILED');
    }
    return { rates: mockRates(body.weight_kg, body.ship_to.country), source: 'mock' };
  }

  const data = await response.json();
  const rateReplyDetails = data?.output?.rateReplyDetails || [];

  if (!Array.isArray(rateReplyDetails) || rateReplyDetails.length === 0) {
    if (!allowFedexMockResponses()) {
      throw new Error('FEDEX_API_EMPTY');
    }
    return { rates: mockRates(body.weight_kg, body.ship_to.country), source: 'mock' };
  }

  const rates = rateReplyDetails.map((rate: Record<string, unknown>) => {
    const totalNetCharge = rate.totalNetCharge as
      | { amount?: string; currency?: string }
      | undefined;
    const commit = rate.commit as { daysInTransit?: number } | undefined;
    const amount = parseFloat(totalNetCharge?.amount || '0');
    return {
      service_type: String(rate.serviceType || 'STANDARD'),
      service_name: String(rate.serviceName || 'FedEx'),
      total_cost: Math.round(amount > 0 ? amount : amount * 100),
      currency: totalNetCharge?.currency || 'XOF',
      estimated_days: commit?.daysInTransit || 5,
    };
  });

  return { rates, source: 'fedex_api' };
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

  const authResult = await requireAuthenticatedUser(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const body = (await req.json()) as RateRequestBody;

    if (!body?.ship_from?.country || !body?.ship_to?.country || !body?.ship_to?.postal_code) {
      return new Response(
        JSON.stringify({ error: 'ship_from, ship_to.country et ship_to.postal_code requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weightKg =
      typeof body.weight_kg === 'number' && body.weight_kg > 0 ? body.weight_kg : 0.5;

    const { rates, source } = await fetchFedExRates({ ...body, weight_kg: weightKg });

    return new Response(
      JSON.stringify({
        rates,
        source,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('fedex-rates error:', error);
    const message = error instanceof Error ? error.message : 'Erreur FedEx';
    const status =
      message === 'FEDEX_NOT_CONFIGURED' ? 503 : message.startsWith('FEDEX_API') ? 502 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
