/**
 * Edge Function : suivi de colis FedEx
 * Clés API côté serveur uniquement. Fallback mock si credentials absents.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const MOCK_STATUSES = [
  'LABEL_CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

interface TrackingEvent {
  timestamp: string;
  status: string;
  status_code: string;
  location: { city: string; state?: string; country: string };
  description: string;
}

interface TrackResponse {
  success: boolean;
  tracking_number: string;
  status: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  events: TrackingEvent[];
  current_location?: { city: string; state?: string; country: string };
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

function statusDescription(status: string): string {
  const map: Record<string, string> = {
    LABEL_CREATED: 'Étiquette créée',
    PICKED_UP: 'Colis pris en charge',
    IN_TRANSIT: 'En transit',
    OUT_FOR_DELIVERY: 'En cours de livraison',
    DELIVERED: 'Livré',
  };
  return map[status] || status;
}

function mockTracking(trackingNumber: string): TrackResponse {
  const seed = trackingNumber.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const statusIndex = seed % MOCK_STATUSES.length;
  const now = new Date();
  const events: TrackingEvent[] = [];

  for (let i = 0; i <= statusIndex; i++) {
    const status = MOCK_STATUSES[i];
    const eventDate = new Date(now);
    eventDate.setHours(eventDate.getHours() - (statusIndex - i) * 12);
    events.push({
      timestamp: eventDate.toISOString(),
      status,
      status_code: `FX_${status}`,
      location: { city: `City-${i + 1}`, country: 'BF' },
      description: statusDescription(status),
    });
  }

  const currentStatus = MOCK_STATUSES[statusIndex];
  const isDelivered = currentStatus === 'DELIVERED';
  const sorted = [...events].reverse();

  const delivery = new Date();
  delivery.setDate(delivery.getDate() + 3);

  return {
    success: true,
    tracking_number: trackingNumber,
    status: currentStatus,
    estimated_delivery: !isDelivered ? delivery.toISOString() : undefined,
    actual_delivery: isDelivered ? sorted[0]?.timestamp : undefined,
    events: sorted,
    current_location: sorted[0]?.location,
    source: 'mock',
  };
}

async function fetchFedExTracking(trackingNumber: string): Promise<TrackResponse> {
  const apiKey = Deno.env.get('FEDEX_API_KEY') || '';
  const apiSecret = Deno.env.get('FEDEX_API_SECRET') || '';
  const testMode = (Deno.env.get('FEDEX_TEST_MODE') || 'true').toLowerCase() !== 'false';

  if (!apiKey || !apiSecret) {
    return mockTracking(trackingNumber);
  }

  const accessToken = await getFedExAccessToken(apiKey, apiSecret, testMode);
  const apiUrl = testMode ? 'https://apis-sandbox.fedex.com' : 'https://apis.fedex.com';
  const trackUrl = `${apiUrl}/track/v1/trackingnumbers`;

  const response = await fetch(trackUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-locale': 'fr_FR',
    },
    body: JSON.stringify({
      includeDetailedScans: true,
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.warn('FedEx track API failed, using mock:', err);
    return mockTracking(trackingNumber);
  }

  const data = await response.json();
  const output = data?.output || {};
  const completeTrackResults = output.completeTrackResults || [];
  const events: TrackingEvent[] = [];

  let latestStatus = 'IN_TRANSIT';
  let estimatedDelivery: string | undefined;
  let actualDelivery: string | undefined;

  for (const result of completeTrackResults) {
    for (const trackResult of result.trackResults || []) {
      latestStatus =
        trackResult.latestStatusDetail?.code ||
        trackResult.latestStatusDetail?.statusByLocale ||
        latestStatus;

      if (trackResult.dateAndTimes) {
        for (const dt of trackResult.dateAndTimes) {
          if (dt.type === 'ESTIMATED_DELIVERY') estimatedDelivery = dt.dateTime;
          if (dt.type === 'ACTUAL_DELIVERY') actualDelivery = dt.dateTime;
        }
      }

      for (const scan of trackResult.scanEvents || []) {
        const loc = scan.scanLocation || {};
        events.push({
          timestamp: scan.date || new Date().toISOString(),
          status: scan.eventType || 'IN_TRANSIT',
          status_code: scan.derivedStatusCode || scan.eventType || 'UNKNOWN',
          location: {
            city: loc.city || loc.postalCode || '—',
            state: loc.stateOrProvinceCode,
            country: loc.countryCode || '—',
          },
          description: scan.eventDescription || statusDescription(scan.eventType || ''),
        });
      }
    }
  }

  if (events.length === 0) {
    return mockTracking(trackingNumber);
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    success: true,
    tracking_number: trackingNumber,
    status: latestStatus,
    estimated_delivery: estimatedDelivery,
    actual_delivery: actualDelivery,
    events,
    current_location: events[0]?.location,
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
    const body = (await req.json()) as { tracking_number?: string };

    if (!body?.tracking_number?.trim()) {
      return new Response(JSON.stringify({ error: 'tracking_number requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trackingNumber = body.tracking_number.trim();
    const hasCredentials = Boolean(
      Deno.env.get('FEDEX_API_KEY') && Deno.env.get('FEDEX_API_SECRET')
    );

    const result = await fetchFedExTracking(trackingNumber);

    if (!hasCredentials && result.source !== 'mock') {
      result.source = 'mock';
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('fedex-track error:', error);
    const message = error instanceof Error ? error.message : 'Erreur FedEx track';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
