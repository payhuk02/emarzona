/**
 * PayPal Commerce Platform — API partenaire (sandbox / live)
 */

export function getPayPalBaseUrl(): string {
  const mode = (Deno.env.get('PAYPAL_MODE') || 'sandbox').toLowerCase();
  return mode === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
}

export function getPayPalClientId(): string {
  const id = Deno.env.get('PAYPAL_PARTNER_CLIENT_ID') || Deno.env.get('PAYPAL_CLIENT_ID');
  if (!id) throw new Error('PAYPAL_CLIENT_ID is not configured');
  return id;
}

export function getPayPalClientSecret(): string {
  const secret = Deno.env.get('PAYPAL_PARTNER_SECRET') || Deno.env.get('PAYPAL_CLIENT_SECRET');
  if (!secret) throw new Error('PAYPAL_CLIENT_SECRET is not configured');
  return secret;
}

export function getPayPalPartnerId(): string | null {
  return Deno.env.get('PAYPAL_PARTNER_ID') || null;
}

export function getPayPalBnCode(): string | undefined {
  return Deno.env.get('PAYPAL_BN_CODE') || undefined;
}

export function isPayPalLiveMode(): boolean {
  return (Deno.env.get('PAYPAL_MODE') || 'sandbox').toLowerCase() === 'live';
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const credentials = btoa(`${getPayPalClientId()}:${getPayPalClientSecret()}`);
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `PayPal OAuth error: ${data?.error_description || data?.message || response.statusText}`
    );
  }

  cachedToken = {
    value: data.access_token as string,
    expiresAt: Date.now() + (data.expires_in as number) * 1000,
  };
  return cachedToken.value;
}

export async function paypalRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const token = await getPayPalAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const bn = getPayPalBnCode();
  if (bn) headers['PayPal-Partner-Attribution-Id'] = bn;

  const response = await fetch(`${getPayPalBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      data?.message || data?.details?.[0]?.description || data?.name || response.statusText;
    throw new Error(`PayPal API error: ${detail}`);
  }
  return data as T;
}

export function formatPayPalAmount(amountMajor: number): string {
  return amountMajor.toFixed(2);
}

export function computePayPalPlatformFee(amountMajor: number, feePercent: number): string {
  const fee = Math.max(0, (amountMajor * feePercent) / 100);
  return fee.toFixed(2);
}

export interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

export function findPayPalLink(links: PayPalLink[] | undefined, rel: string): string | null {
  const link = links?.find(l => l.rel === rel);
  return link?.href ?? null;
}

export async function createPartnerReferral(params: {
  storeId: string;
  returnUrl: string;
}): Promise<{ referralId: string; actionUrl: string }> {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';

  const body = {
    tracking_id: params.storeId,
    operations: [
      {
        operation: 'API_INTEGRATION',
        api_integration_preference: {
          rest_api_integration: {
            integration_method: 'PAYPAL',
            integration_type: 'THIRD_PARTY',
            third_party_details: {
              features: ['PAYMENT', 'REFUND'],
            },
          },
        },
      },
    ],
    products: ['EXPRESS_CHECKOUT'],
    legal_consent: {
      type: 'SHARE_DATA_CONSENT',
      granted: true,
    },
    partner_config_override: {
      partner_logo_url: `${siteUrl}/favicon.ico`,
      return_url: params.returnUrl,
      return_url_description: 'Retour vers Emarzona',
      show_add_credit_card: true,
    },
  };

  const result = await paypalRequest<{
    links: PayPalLink[];
  }>('POST', '/v2/customer/partner-referrals', body);

  const actionUrl = findPayPalLink(result.links, 'action_url');
  if (!actionUrl) {
    throw new Error('PayPal partner referral missing action_url');
  }

  return { referralId: params.storeId, actionUrl };
}

export async function getMerchantIntegrationByTrackingId(
  trackingId: string
): Promise<{ merchantId: string; paymentsReceivable: boolean } | null> {
  const partnerId = getPayPalPartnerId();
  if (!partnerId) return null;

  const result = await paypalRequest<{
    merchant_integrations?: Array<{
      merchant_id: string;
      tracking_id?: string;
      payments_receivable?: boolean;
      primary_email_confirmed?: boolean;
    }>;
  }>('GET', `/v1/customer/partners/${partnerId}/merchant-integrations?tracking_id=${trackingId}`);

  const match = result.merchant_integrations?.find(
    m => m.tracking_id === trackingId || m.merchant_id
  );
  if (!match?.merchant_id) return null;

  return {
    merchantId: match.merchant_id,
    paymentsReceivable: match.payments_receivable === true,
  };
}

export async function createPayPalCheckoutOrder(params: {
  amount: number;
  currency: string;
  description: string;
  merchantId: string;
  platformFee: string;
  transactionId: string;
  orderId: string;
  storeId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approveUrl: string }> {
  const currency = params.currency.toUpperCase();

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.transactionId,
        custom_id: params.transactionId,
        description: params.description.slice(0, 127),
        amount: {
          currency_code: currency,
          value: formatPayPalAmount(params.amount),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: formatPayPalAmount(params.amount),
            },
          },
        },
        payee: {
          merchant_id: params.merchantId,
        },
        payment_instruction: {
          disbursement_mode: 'INSTANT',
          platform_fees: [
            {
              amount: {
                currency_code: currency,
                value: params.platformFee,
              },
            },
          ],
        },
      },
    ],
    application_context: {
      brand_name: 'Emarzona',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: params.successUrl,
      cancel_url: params.cancelUrl,
    },
  };

  const order = await paypalRequest<{
    id: string;
    links: PayPalLink[];
  }>('POST', '/v2/checkout/orders', body, {
    'PayPal-Request-Id': `emarzona-${params.transactionId}`,
  });

  const approveUrl =
    findPayPalLink(order.links, 'approve') || findPayPalLink(order.links, 'payer-action');
  if (!approveUrl) {
    throw new Error('PayPal order missing approve link');
  }

  return { id: order.id, approveUrl };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  captureId?: string;
  customId?: string;
}> {
  const result = await paypalRequest<{
    id: string;
    status: string;
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{ id: string; status: string }>;
      };
      custom_id?: string;
    }>;
  }>('POST', `/v2/checkout/orders/${orderId}/capture`);

  const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    id: result.id,
    status: result.status,
    captureId: capture?.id,
    customId: result.purchase_units?.[0]?.custom_id,
  };
}

export async function refundPayPalCapture(
  captureId: string,
  amount?: { currency: string; value: string },
  note?: string
): Promise<{ id: string; status: string; amount?: { currency_code: string; value: string } }> {
  const body: Record<string, unknown> = {};
  if (amount) {
    body.amount = { currency_code: amount.currency, value: amount.value };
  }
  if (note) {
    body.note_to_payer = note.slice(0, 255);
  }

  return paypalRequest('POST', `/v2/payments/captures/${captureId}/refund`, body);
}

export async function verifyPayPalWebhookSignature(
  headers: Headers,
  body: string,
  webhookId: string
): Promise<boolean> {
  const transmissionId = headers.get('paypal-transmission-id');
  const transmissionTime = headers.get('paypal-transmission-time');
  const certUrl = headers.get('paypal-cert-url');
  const authAlgo = headers.get('paypal-auth-algo');
  const transmissionSig = headers.get('paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  try {
    const result = await paypalRequest<{ verification_status: string }>(
      'POST',
      '/v1/notifications/verify-webhook-signature',
      {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }
    );
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal webhook verification failed:', error);
    return false;
  }
}
