/// <reference path="../deno.d.ts" />
/**
 * Edge Function MoneyFusion (FusionPay) — initiation et vérification de paiement.
 * Doc: https://docs.moneyfusion.net/fr/webapi
 *
 * Secrets requis:
 * - MONEYFUSION_API_URL : lien API unique (ex. https://pay.moneyfusion.net/App/xxx/pay/)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { resolveOrderExpectedPayableAmount } from '../_shared/complete-order-payment.ts';
import { authorizeCheckoutOrder } from '../_shared/order-checkout-auth.ts';
import { enforceRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '../_shared/rate-limit.ts';

const MONEYFUSION_STATUS_URL = 'https://www.pay.moneyfusion.net/paiementNotif';
const SITE_URL = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin');
  if (
    origin &&
    (origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.includes('localhost'))
  ) {
    return origin;
  }
  if (origin) {
    try {
      const host = new URL(origin).hostname;
      if (
        host === 'www.emarzona.com' ||
        host === 'emarzona.com' ||
        host.endsWith('.emarzona.com') ||
        host.endsWith('.myemarzona.shop')
      ) {
        return origin;
      }
    } catch {
      /* ignore */
    }
  }
  return SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;
}

function getCorsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-checkout-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

interface CreateCheckoutInput {
  amount: number;
  currency: string;
  description?: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  return_url?: string;
  cancel_url?: string;
  productId?: string;
  storeId?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
}

function validateCreateCheckout(data: unknown): {
  valid: boolean;
  error?: string;
  validated?: CreateCheckoutInput;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Les données sont requises' };
  }
  const d = data as Record<string, unknown>;
  const amount = typeof d.amount === 'number' ? d.amount : parseFloat(String(d.amount || 0));
  if (!amount || amount <= 0 || !isFinite(amount)) {
    return { valid: false, error: 'Le montant est requis et doit être positif' };
  }
  const currency = String(d.currency || 'XOF').toUpperCase();
  if (currency.length !== 3) {
    return { valid: false, error: `Devise invalide: ${currency}` };
  }
  const customerEmail = String(d.customer_email || '').trim();
  if (!customerEmail || !isValidEmail(customerEmail)) {
    return { valid: false, error: "Email client invalide" };
  }
  if (d.return_url && typeof d.return_url === 'string' && !isValidUrl(d.return_url)) {
    return { valid: false, error: 'URL de retour invalide' };
  }
  if (d.productId && typeof d.productId === 'string' && !isValidUUID(d.productId)) {
    return { valid: false, error: 'productId invalide' };
  }
  if (d.storeId && typeof d.storeId === 'string' && !isValidUUID(d.storeId)) {
    return { valid: false, error: 'storeId invalide' };
  }
  if (d.orderId && typeof d.orderId === 'string' && !isValidUUID(d.orderId)) {
    return { valid: false, error: 'orderId invalide' };
  }

  return {
    valid: true,
    validated: {
      amount: Math.round(amount),
      currency,
      description: d.description ? String(d.description).substring(0, 500) : undefined,
      customer_email: customerEmail,
      customer_name: d.customer_name ? String(d.customer_name).substring(0, 200) : undefined,
      customer_phone: d.customer_phone ? String(d.customer_phone).substring(0, 50) : undefined,
      return_url: d.return_url ? String(d.return_url) : undefined,
      cancel_url: d.cancel_url ? String(d.cancel_url) : undefined,
      productId: d.productId ? String(d.productId) : undefined,
      storeId: d.storeId ? String(d.storeId) : undefined,
      orderId: d.orderId ? String(d.orderId) : undefined,
      metadata: (d.metadata as Record<string, unknown>) || undefined,
    },
  };
}

async function resolveAuthorizedAmount(
  supabase: ReturnType<typeof createClient>,
  validated: CreateCheckoutInput
): Promise<{ valid: boolean; error?: string; amount?: number; currency?: string }> {
  const orderId =
    validated.orderId ||
    (validated.metadata?.order_id as string | undefined) ||
    (validated.metadata?.orderId as string | undefined);

  if (orderId && isValidUUID(orderId)) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, currency, store_id')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return { valid: false, error: 'Commande introuvable' };
    }
    if (validated.storeId && order.store_id !== validated.storeId) {
      return { valid: false, error: 'La boutique ne correspond pas à la commande' };
    }
    const payable = await resolveOrderExpectedPayableAmount(supabase, orderId);
    if (!payable.valid || payable.expectedAmount == null) {
      return { valid: false, error: 'Commande introuvable' };
    }
    const expected = Math.round(payable.expectedAmount);
    if (Math.round(validated.amount) !== expected) {
      return { valid: false, error: 'Montant invalide pour cette commande' };
    }
    return {
      valid: true,
      amount: expected,
      currency: (order.currency as string) || payable.currency || validated.currency,
    };
  }

  if (validated.productId) {
    const { data: product, error } = await supabase
      .from('products')
      .select('id, store_id, price, promotional_price, currency, is_active, is_draft')
      .eq('id', validated.productId)
      .single();

    if (error || !product) {
      return { valid: false, error: 'Produit introuvable' };
    }
    if (!product.is_active || product.is_draft) {
      return { valid: false, error: 'Produit non disponible' };
    }
    if (validated.storeId && product.store_id !== validated.storeId) {
      return { valid: false, error: 'La boutique ne correspond pas au produit' };
    }
    const base = Number(product.price);
    const promo =
      product.promotional_price != null ? Number(product.promotional_price) : null;
    const expected =
      promo != null && !Number.isNaN(promo) && promo >= 0 && promo < base
        ? Math.round(promo)
        : Math.round(base);
    if (Math.round(validated.amount) !== expected) {
      return { valid: false, error: 'Montant invalide pour ce produit' };
    }
    return {
      valid: true,
      amount: expected,
      currency: (product.currency as string) || validated.currency,
    };
  }

  return { valid: true, amount: validated.amount, currency: validated.currency };
}

function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const cleaned = phone.trim().replace(/\s/g, '');
  // MoneyFusion attend un numéro national (ex. 75591378), pas +226...
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return cleaned;
  // Burkina Faso / WAEMU courants : retirer l'indicatif pays
  if (digits.startsWith('226') && digits.length >= 11) {
    return digits.slice(3);
  }
  if (digits.startsWith('225') && digits.length >= 12) {
    return digits.slice(3);
  }
  if (digits.startsWith('221') && digits.length >= 12) {
    return digits.slice(3);
  }
  return digits;
}

function sanitizeArticleLabel(label: string): string {
  const cleaned = label
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 60);
  return cleaned || 'Produit';
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiUrl = (Deno.env.get('MONEYFUSION_API_URL') || '').trim();
    if (!apiUrl || !apiUrl.startsWith('https://')) {
      return new Response(
        JSON.stringify({
          error: 'Configuration manquante',
          message: 'MONEYFUSION_API_URL n\'est pas configuré dans les secrets Edge Functions',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration serveur incomplète' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action, data } = body as { action?: string; data?: unknown };

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action manquante' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify_payment') {
      const d = (data || {}) as Record<string, unknown>;
      const token = String(d.paymentId || d.token || '').trim();
      if (!token) {
        return new Response(JSON.stringify({ error: 'token requis' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const statusRes = await fetch(`${MONEYFUSION_STATUS_URL}/${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const statusText = await statusRes.text();
      let statusData: unknown = {};
      try {
        statusData = statusText ? JSON.parse(statusText) : {};
      } catch {
        statusData = { raw: statusText.slice(0, 200) };
      }

      if (!statusRes.ok) {
        return new Response(
          JSON.stringify({
            error: 'Erreur MoneyFusion',
            message: 'Impossible de vérifier le statut',
            details: statusData,
          }),
          {
            status: statusRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ success: true, data: statusData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action !== 'create_checkout') {
      return new Response(JSON.stringify({ error: 'Action non supportée' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validation = validateCreateCheckout(data);
    if (!validation.valid || !validation.validated) {
      return new Response(
        JSON.stringify({ error: 'Validation échouée', message: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validated = validation.validated;
    const orderIdForAuth =
      validated.orderId ||
      (validated.metadata?.order_id as string | undefined) ||
      (validated.metadata?.orderId as string | undefined);

    if (orderIdForAuth && validated.storeId) {
      const rateLimit = await enforceRateLimit(
        supabase,
        getClientIp(req),
        'checkout',
        RATE_LIMIT_PRESETS.checkout
      );
      if (!rateLimit.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Trop de tentatives de paiement',
            message: 'Veuillez patienter avant de réessayer.',
          }),
          {
            status: rateLimit.degraded ? 503 : 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const checkoutToken =
        (validated.metadata?.checkout_token as string | undefined) ||
        req.headers.get('x-checkout-token') ||
        undefined;

      const checkoutAuth = await authorizeCheckoutOrder(
        supabase,
        req,
        orderIdForAuth,
        validated.storeId,
        validated.amount,
        checkoutToken
      );
      if (checkoutAuth.ok === false) {
        return new Response(
          JSON.stringify({ error: 'Accès checkout refusé', message: checkoutAuth.error }),
          {
            status: checkoutAuth.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const amountResolution = await resolveAuthorizedAmount(supabase, validated);
    if (!amountResolution.valid) {
      return new Response(
        JSON.stringify({
          error: 'Montant non autorisé',
          message: amountResolution.error || 'Montant invalide',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    validated.amount = amountResolution.amount ?? validated.amount;
    validated.currency = amountResolution.currency ?? validated.currency;

    if (!validated.return_url) {
      return new Response(
        JSON.stringify({
          error: 'Validation échouée',
          message: 'return_url est requis',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validated.customer_phone || normalizePhone(validated.customer_phone).length < 8) {
      return new Response(
        JSON.stringify({
          error: 'Validation échouée',
          message: 'Un numéro de téléphone est requis pour MoneyFusion',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MoneyFusion refuse les montants ≤ 200 F (XOF/XAF)
    const currencyUpper = validated.currency.toUpperCase();
    if (
      (currencyUpper === 'XOF' || currencyUpper === 'XAF') &&
      validated.amount <= 200
    ) {
      return new Response(
        JSON.stringify({
          error: 'Montant trop bas',
          message:
            'Le montant minimum pour MoneyFusion est de 201 XOF. Augmentez le prix du produit (le total inclut déjà les frais de service).',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id ?? null;
      } catch {
        /* guest ok */
      }
    }

    const rawMetadata = validated.metadata || {};
    const { data: insertedTx, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          store_id: validated.storeId,
          product_id: validated.productId || null,
          order_id: validated.orderId || orderIdForAuth || null,
          user_id: userId || rawMetadata.userId || null,
          amount: validated.amount,
          currency: validated.currency,
          payment_provider: 'moneyfusion',
          status: 'pending',
          customer_email: validated.customer_email,
          customer_name: validated.customer_name || null,
          customer_phone: validated.customer_phone || null,
          metadata: {
            ...rawMetadata,
            payment_provider: 'moneyfusion',
          },
        },
      ])
      .select('id')
      .single();

    if (txError || !insertedTx) {
      console.error('[MoneyFusion] Failed to create local transaction', txError);
      return new Response(
        JSON.stringify({
          error: 'Erreur interne',
          message: 'Impossible de créer la transaction locale',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const localTxId = insertedTx.id as string;
    let returnUrlStr = validated.return_url;
    try {
      const returnUrl = new URL(validated.return_url);
      returnUrl.searchParams.set('transaction_id', localTxId);
      returnUrl.searchParams.set('provider', 'moneyfusion');
      returnUrlStr = returnUrl.toString();
    } catch {
      returnUrlStr =
        validated.return_url +
        (validated.return_url.includes('?') ? '&' : '?') +
        `transaction_id=${localTxId}&provider=moneyfusion`;
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/moneyfusion-webhook`;
    const customerName =
      (validated.customer_name || '').trim() ||
      validated.customer_email.split('@')[0] ||
      'Client';
    const phone = normalizePhone(validated.customer_phone);
    const description = sanitizeArticleLabel(
      validated.description?.trim() || 'Paiement Emarzona'
    );

    const mfPayload = {
      totalPrice: validated.amount,
      article: [{ [description]: validated.amount }],
      numeroSend: phone,
      nomclient: customerName,
      personal_Info: [
        {
          userId: userId || validated.customer_email,
          orderId: validated.orderId || orderIdForAuth || localTxId,
          transaction_id: localTxId,
          store_id: validated.storeId,
        },
      ],
      return_url: returnUrlStr,
      webhook_url: webhookUrl,
    };

    console.log('[MoneyFusion] Initiating payment', {
      amount: validated.amount,
      currency: validated.currency,
      localTxId,
      phoneLen: phone.length,
      articleKey: description,
    });

    let mfResponse: Response;
    try {
      mfResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(mfPayload),
      });
    } catch (fetchError) {
      await supabase.from('transactions').update({ status: 'failed' }).eq('id', localTxId);
      return new Response(
        JSON.stringify({
          error: 'Erreur de connexion MoneyFusion',
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mfText = await mfResponse.text();
    let mfData: Record<string, unknown> = {};
    try {
      mfData = mfText ? (JSON.parse(mfText) as Record<string, unknown>) : {};
    } catch {
      mfData = { raw: mfText.slice(0, 300) };
    }

    if (!mfResponse.ok || mfData.statut === false) {
      const message =
        (typeof mfData.message === 'string' && mfData.message) ||
        (typeof mfData.error === 'string' && mfData.error) ||
        'Échec initialisation MoneyFusion';
      console.error('[MoneyFusion] API error', { status: mfResponse.status, message, mfData });
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          metadata: {
            ...rawMetadata,
            payment_provider: 'moneyfusion',
            moneyfusion_error: {
              http_status: mfResponse.status,
              message,
              response: mfData,
            },
          },
        })
        .eq('id', localTxId);
      return new Response(
        JSON.stringify({
          error: 'Erreur MoneyFusion API',
          message,
          details: mfData,
          status: mfResponse.status,
        }),
        {
          status: mfResponse.status >= 400 ? mfResponse.status : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = String(mfData.token || mfData.tokenPay || '');
    const checkoutUrl = String(mfData.url || '');
    if (!checkoutUrl) {
      await supabase.from('transactions').update({ status: 'failed' }).eq('id', localTxId);
      return new Response(
        JSON.stringify({
          error: 'Réponse MoneyFusion invalide',
          message: "Pas d'URL de paiement dans la réponse",
          details: mfData,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: persistError } = await supabase
      .from('transactions')
      .update({
        payment_id: token || null,
        provider_payment_intent_id: token || null,
        reference: token || null,
        status: 'processing',
        metadata: {
          ...rawMetadata,
          payment_provider: 'moneyfusion',
          moneyfusion_token: token,
          moneyfusion_checkout_url: checkoutUrl,
          moneyfusion_response: {
            statut: mfData.statut,
            message: mfData.message,
            hasUrl: true,
          },
        },
      })
      .eq('id', localTxId);

    if (persistError) {
      console.error('[MoneyFusion] Failed to persist PSP token on transaction', {
        localTxId,
        message: persistError.message,
        code: persistError.code,
      });
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          metadata: {
            ...rawMetadata,
            payment_provider: 'moneyfusion',
            moneyfusion_error: {
              message: 'persist_payment_id_failed',
              detail: persistError.message,
              token_prefix: token ? token.slice(0, 8) : null,
              checkout_url: checkoutUrl,
            },
          },
        })
        .eq('id', localTxId);
      return new Response(
        JSON.stringify({
          error: 'Erreur persistance transaction',
          message:
            'Le paiement MoneyFusion a été initié mais la transaction locale n’a pas pu être synchronisée. Réessayez.',
          details: { code: persistError.code, message: persistError.message },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: token,
          token,
          checkout_url: checkoutUrl,
          payment_url: checkoutUrl,
          url: checkoutUrl,
          status: 'pending',
          _local_transaction_id: localTxId,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    console.error('[MoneyFusion] Unhandled error', { message });
    return new Response(
      JSON.stringify({ error: 'Erreur interne Edge Function', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
