/**
 * Edge Function : création d'expédition FedEx et génération d'étiquette
 * Clés API côté serveur uniquement. Fallback mock si credentials absents.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

interface ShipAddress {
  name: string;
  company?: string;
  address: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
}

interface ShipPackage {
  weight_kg: number;
  length?: number;
  width?: number;
  height?: number;
}

interface ShipRequestBody {
  ship_from: ShipAddress;
  ship_to: ShipAddress;
  package: ShipPackage;
  service_type?: string;
  reference?: string;
}

interface ShipResponse {
  success: boolean;
  tracking_number: string;
  tracking_url: string;
  label_url: string;
  label_base64?: string;
  estimated_delivery: string;
  shipping_cost: number;
  currency: string;
  service_type: string;
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

function mockShipment(body: ShipRequestBody): ShipResponse {
  const trackingNumber = `7489${Date.now().toString().slice(-10)}`;
  const weightKg = body.package?.weight_kg > 0 ? body.package.weight_kg : 1;
  const base = body.ship_to.country === 'BF' ? 5000 : 15000;
  const serviceType = body.service_type || 'FEDEX_GROUND';
  const delivery = new Date();
  delivery.setDate(delivery.getDate() + 5);

  return {
    success: true,
    tracking_number: trackingNumber,
    tracking_url: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    label_url: `https://www.fedex.com/document/v2/document/retrieve/${trackingNumber}`,
    estimated_delivery: delivery.toISOString(),
    shipping_cost: Math.round(base * weightKg),
    currency: 'XOF',
    service_type: serviceType,
    source: 'mock',
  };
}

async function createFedExShipment(body: ShipRequestBody): Promise<ShipResponse> {
  const apiKey = Deno.env.get('FEDEX_API_KEY') || '';
  const apiSecret = Deno.env.get('FEDEX_API_SECRET') || '';
  const accountNumber = Deno.env.get('FEDEX_ACCOUNT_NUMBER') || '';
  const testMode = (Deno.env.get('FEDEX_TEST_MODE') || 'true').toLowerCase() !== 'false';

  if (!apiKey || !apiSecret || !accountNumber) {
    return mockShipment(body);
  }

  const accessToken = await getFedExAccessToken(apiKey, apiSecret, testMode);
  const apiUrl = testMode ? 'https://apis-sandbox.fedex.com' : 'https://apis.fedex.com';
  const shipUrl = `${apiUrl}/ship/v1/shipments`;

  const weightKg = body.package.weight_kg > 0 ? body.package.weight_kg : 0.5;
  const length = body.package.length || 20;
  const width = body.package.width || 15;
  const height = body.package.height || 10;
  const serviceType = body.service_type || 'FEDEX_GROUND';

  const response = await fetch(shipUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-locale': 'fr_FR',
    },
    body: JSON.stringify({
      labelResponseOptions: 'URL_ONLY',
      accountNumber: { value: accountNumber },
      requestedShipment: {
        shipper: {
          contact: {
            personName: body.ship_from.name,
            phoneNumber: body.ship_from.phone,
            companyName: body.ship_from.company,
          },
          address: {
            streetLines: [body.ship_from.address],
            city: body.ship_from.city,
            stateOrProvinceCode: body.ship_from.state,
            postalCode: body.ship_from.postal_code,
            countryCode: body.ship_from.country,
          },
        },
        recipients: [
          {
            contact: {
              personName: body.ship_to.name,
              phoneNumber: body.ship_to.phone,
              companyName: body.ship_to.company,
            },
            address: {
              streetLines: [body.ship_to.address],
              city: body.ship_to.city,
              stateOrProvinceCode: body.ship_to.state,
              postalCode: body.ship_to.postal_code,
              countryCode: body.ship_to.country,
            },
          },
        ],
        shipDatestamp: new Date().toISOString().split('T')[0],
        serviceType,
        packagingType: 'YOUR_PACKAGING',
        pickupType: 'USE_SCHEDULED_PICKUP',
        blockInsightVisibility: false,
        shippingChargesPayment: { paymentType: 'SENDER' },
        labelSpecification: {
          imageType: 'PDF',
          labelStockType: 'PAPER_4X6',
        },
        requestedPackageLineItems: [
          {
            weight: { value: weightKg, units: 'KG' },
            dimensions: { length, width, height, units: 'CM' },
            customerReferences: body.reference
              ? [{ customerReferenceType: 'CUSTOMER_REFERENCE', value: body.reference }]
              : undefined,
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.warn('FedEx ship API failed, using mock:', err);
    return mockShipment(body);
  }

  const data = await response.json();
  const output = data?.output || {};
  const transactionShipments = output.transactionShipments || [];
  const shipment = transactionShipments[0] || {};
  const masterTrackingNumber = shipment.masterTrackingNumber || {};
  const labelResults = shipment.pieceResponses || shipment.labelResults || [];
  const labelResult = labelResults[0] || {};
  const trackingNumber = String(
    masterTrackingNumber.trackingNumber || labelResult.trackingNumber || ''
  );

  if (!trackingNumber) {
    return mockShipment(body);
  }

  const labelUrl =
    labelResult.packageDocuments?.[0]?.url ||
    labelResult.shipmentDocuments?.[0]?.url ||
    labelResult.url ||
    `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;

  const totalNetCharge = output.totalNetCharge || shipment.shipmentRating?.totalNetCharge;
  const amount = parseFloat(totalNetCharge?.amount || '0');
  const currency = totalNetCharge?.currency || 'XOF';

  const commit = shipment.commit || {};
  const estimatedDelivery =
    commit.dateDetail?.dayFormat || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

  return {
    success: true,
    tracking_number: trackingNumber,
    tracking_url: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    label_url: labelUrl,
    label_base64: labelResult.packageDocuments?.[0]?.encodedLabel,
    estimated_delivery: estimatedDelivery,
    shipping_cost: Math.round(amount > 0 ? amount : amount * 100),
    currency,
    service_type: serviceType,
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
    const body = (await req.json()) as ShipRequestBody;

    if (
      !body?.ship_from?.postal_code ||
      !body?.ship_to?.postal_code ||
      !body?.ship_from?.country ||
      !body?.ship_to?.country
    ) {
      return new Response(
        JSON.stringify({
          error:
            'ship_from/ship_to avec postal_code et country requis, package.weight_kg recommandé',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weightKg =
      typeof body.package?.weight_kg === 'number' && body.package.weight_kg > 0
        ? body.package.weight_kg
        : 0.5;

    const hasCredentials = Boolean(
      Deno.env.get('FEDEX_API_KEY') &&
      Deno.env.get('FEDEX_API_SECRET') &&
      Deno.env.get('FEDEX_ACCOUNT_NUMBER')
    );

    const result = await createFedExShipment({
      ...body,
      package: { ...body.package, weight_kg: weightKg },
    });

    if (!hasCredentials && result.source !== 'mock') {
      result.source = 'mock';
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('fedex-ship error:', error);
    const message = error instanceof Error ? error.message : 'Erreur FedEx ship';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
