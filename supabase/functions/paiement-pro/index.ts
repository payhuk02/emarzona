/// <reference path="../deno.d.ts" />
/**
 * Edge Function Paiement Pro — rail plateforme
 * Init: POST JSON → hosted checkout URL
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import {
  currencyToPaiementProCode,
  getPaiementProCredentials,
  getPaiementProInitUrl,
} from '../_shared/paiement-pro-hash.ts';
import {
  handlePaiementProWebhookRaw,
  looksLikePaiementProWebhook,
  paiementProWebhookCors,
} from '../_shared/handle-paiement-pro-webhook.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || 'https://www.emarzona.com',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-checkout-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function splitName(full?: string): { first: string; last: string } {
  const parts = String(full || 'Client Emarzona')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { first: 'Client', last: 'Emarzona' };
  if (parts.length === 1) return { first: parts[0], last: 'Emarzona' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health / ping GET (notificationURL may probe)
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ success: true, provider: 'paiement_pro' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawText = await req.text();
    let body: Record<string, unknown> = {};
    try {
      body = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
    } catch {
      body = {};
      // form-urlencoded webhook
      const params = new URLSearchParams(rawText);
      for (const [k, v] of params.entries()) body[k] = v;
    }

    // Webhook intégré (plafond fonctions Edge — pas de slug dédié)
    if (
      looksLikePaiementProWebhook(body) ||
      new URL(req.url).searchParams.get('webhook') === '1'
    ) {
      try {
        return await handlePaiementProWebhookRaw(rawText, paiementProWebhookCors);
      } catch (err) {
        console.error('[PaiementPro webhook] unhandled', err);
        return new Response(
          JSON.stringify({
            error: 'Erreur interne',
            message: err instanceof Error ? err.message : String(err),
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const action = String(body.action || 'create_checkout');
    const data = (body.data || body) as Record<string, unknown>;

    if (action === 'ping') {
      return new Response(JSON.stringify({ success: true, provider: 'paiement_pro' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action !== 'create_checkout') {
      return new Response(JSON.stringify({ error: 'Action non supportée', action }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { merchantId, secretKey } = getPaiementProCredentials();
    if (!merchantId || !secretKey) {
      return new Response(
        JSON.stringify({
          error: 'Configuration manquante',
          message: 'PAIEMENT_PRO_MERCHANT_ID / PAIEMENT_PRO_SECRET_KEY non configurés',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amount = Math.round(
      typeof data.amount === 'number' ? data.amount : parseFloat(String(data.amount || 0))
    );
    const currency = String(data.currency || 'XOF').toUpperCase();
    const customerEmail = String(data.customer_email || '').trim();
    const customerPhone = String(data.customer_phone || '').trim();
    const storeId = data.storeId ? String(data.storeId) : undefined;
    const productId = data.productId ? String(data.productId) : undefined;
    const orderId = data.orderId ? String(data.orderId) : undefined;
    const returnUrl = data.return_url ? String(data.return_url) : undefined;
    const description = String(data.description || 'Paiement Emarzona').slice(0, 200);
    const metadata =
      data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, unknown>)
        : {};
    const channel = String(metadata.channel || data.channel || 'CARD').toUpperCase();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Montant invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!isValidEmail(customerEmail)) {
      return new Response(JSON.stringify({ error: 'Email client invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 8) {
      return new Response(
        JSON.stringify({ error: 'Un numéro de téléphone est requis pour Paiement Pro' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!storeId || !isValidUUID(storeId)) {
      return new Response(JSON.stringify({ error: 'storeId invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!returnUrl) {
      return new Response(JSON.stringify({ error: 'return_url requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Autoriser montant commande si orderId fourni
    let authorizedAmount = amount;
    let authorizedCurrency = currency;
    if (orderId && isValidUUID(orderId)) {
      const { resolveOrderExpectedPayableAmount } = await import(
        '../_shared/complete-order-payment.ts'
      );
      const payable = await resolveOrderExpectedPayableAmount(supabase, orderId);
      if (!payable.valid || payable.expectedAmount == null) {
        return new Response(JSON.stringify({ error: 'Commande introuvable' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (Math.round(amount) !== Math.round(payable.expectedAmount)) {
        return new Response(JSON.stringify({ error: 'Montant invalide pour cette commande' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      authorizedAmount = Math.round(payable.expectedAmount);
      authorizedCurrency = (payable.currency || currency).toUpperCase();
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
        /* guest */
      }
    }

    const { data: insertedTx, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          store_id: storeId,
          product_id: productId || null,
          order_id: orderId || null,
          user_id: userId || metadata.userId || null,
          amount: authorizedAmount,
          currency: authorizedCurrency,
          payment_provider: 'paiement_pro',
          status: 'pending',
          customer_email: customerEmail,
          customer_name: data.customer_name ? String(data.customer_name) : null,
          customer_phone: customerPhone,
          metadata: {
            ...metadata,
            payment_provider: 'paiement_pro',
            channel,
          },
        },
      ])
      .select('id')
      .single();

    if (txError || !insertedTx) {
      console.error('[PaiementPro] tx insert failed', txError);
      return new Response(JSON.stringify({ error: 'Impossible de créer la transaction locale' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const localTxId = insertedTx.id as string;
    const referenceNumber = `EMZ-${localTxId.replace(/-/g, '').slice(0, 20)}-${Date.now()
      .toString(36)
      .toUpperCase()}`;

    let returnUrlStr = returnUrl;
    try {
      const u = new URL(returnUrlStr);
      u.searchParams.set('order_id', orderId || '');
      u.searchParams.set('transaction_id', localTxId);
      u.searchParams.set('provider', 'paiement_pro');
      returnUrlStr = u.toString();
    } catch {
      /* keep */
    }

    // Même fonction = create + webhook (limite plan Supabase)
    const webhookUrl = `${supabaseUrl}/functions/v1/paiement-pro`;
    const { first, last } = splitName(
      data.customer_name ? String(data.customer_name) : customerEmail.split('@')[0]
    );

    const returnContext = JSON.stringify({
      transaction_id: localTxId,
      order_id: orderId || null,
      store_id: storeId,
    });

    const payload = {
      merchantId,
      amount: authorizedAmount,
      description,
      channel,
      countryCurrencyCode: currencyToPaiementProCode(authorizedCurrency),
      referenceNumber,
      customerEmail,
      customerFirstName: first,
      customerLastname: last,
      customerPhoneNumber: customerPhone.replace(/\s+/g, ''),
      notificationURL: webhookUrl,
      returnURL: returnUrlStr,
      returnContext,
    };

    const initUrl = getPaiementProInitUrl();
    const ppRes = await fetch(initUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const ppText = await ppRes.text();
    let ppJson: Record<string, unknown> = {};
    try {
      ppJson = ppText ? (JSON.parse(ppText) as Record<string, unknown>) : {};
    } catch {
      console.error('[PaiementPro] non-JSON init response', ppText.slice(0, 500));
      await supabase.from('transactions').update({ status: 'failed' }).eq('id', localTxId);
      return new Response(JSON.stringify({ error: 'Réponse Paiement Pro invalide' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ppJson.success || !ppJson.url) {
      console.error('[PaiementPro] init failed', ppJson);
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          metadata: {
            ...metadata,
            paiement_pro_error: ppJson.message || ppJson,
          },
        })
        .eq('id', localTxId);
      return new Response(
        JSON.stringify({
          error: 'Initialisation Paiement Pro échouée',
          message: String(ppJson.message || 'Échec init'),
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutUrl = String(ppJson.url);
    await supabase
      .from('transactions')
      .update({
        status: 'processing',
        payment_id: referenceNumber,
        provider_payment_intent_id: referenceNumber,
        metadata: {
          ...metadata,
          payment_provider: 'paiement_pro',
          channel,
          referenceNumber,
          paiement_pro_session_url: checkoutUrl,
        },
      })
      .eq('id', localTxId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          checkout_url: checkoutUrl,
          url: checkoutUrl,
          referenceNumber,
          _local_transaction_id: localTxId,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[PaiementPro] unhandled', err);
    return new Response(
      JSON.stringify({
        error: 'Erreur interne',
        message: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
