/**
 * Stripe Connect — Checkout Session (Destination Charge + application fee)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { computeApplicationFee, stripeRequest, toStripeAmount } from '../_shared/stripe-api.ts';
import { resolvePlatformFeePercent } from '../_shared/complete-order-payment.ts';

interface CheckoutBody {
  storeId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName?: string;
  productId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}

serve(async req => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin);
  }

  try {
    const body = (await req.json()) as CheckoutBody;
    const required = [
      'storeId',
      'orderId',
      'amount',
      'currency',
      'customerEmail',
      'successUrl',
      'cancelUrl',
    ] as const;
    for (const key of required) {
      if (body[key] == null || body[key] === '') {
        return jsonResponse({ error: `Missing ${key}` }, 400, origin);
      }
    }

    const supabase = createSupabaseAdmin();
    const currency = body.currency.toUpperCase();
    const amountMinor = toStripeAmount(body.amount, currency);

    const { data: connection, error: connError } = await supabase
      .from('store_payment_connections')
      .select('id, external_account_id, external_account_status')
      .eq('store_id', body.storeId)
      .eq('provider', 'stripe_connect')
      .eq('external_account_status', 'active')
      .maybeSingle();

    if (connError || !connection?.external_account_id) {
      return jsonResponse({ error: 'Stripe Connect is not active for this store' }, 400, origin);
    }

    const feePercent = await resolvePlatformFeePercent(supabase, body.storeId);
    const applicationFee = computeApplicationFee(body.amount, currency, feePercent);

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        store_id: body.storeId,
        order_id: body.orderId,
        product_id: body.productId ?? null,
        amount: body.amount,
        currency,
        status: 'pending',
        customer_email: body.customerEmail,
        customer_name: body.customerName ?? null,
        payment_provider: 'stripe_connect',
        connected_account_id: connection.external_account_id,
        application_fee_amount: Math.round(((body.amount * feePercent) / 100) * 100) / 100,
        metadata: {
          ...body.metadata,
          stripe_connect: true,
          platform_fee_percent: feePercent,
        },
      })
      .select('id')
      .single();

    if (txError || !transaction) {
      return jsonResponse(
        { error: txError?.message ?? 'Failed to create transaction' },
        500,
        origin
      );
    }

    const metadataFlat: Record<string, string> = {
      order_id: body.orderId,
      store_id: body.storeId,
      transaction_id: transaction.id,
      emarzona_platform: 'true',
    };
    if (body.productId) metadataFlat.product_id = body.productId;

    const params: Record<string, string> = {
      mode: 'payment',
      success_url: `${body.successUrl}${body.successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}&order_id=${body.orderId}&transaction_id=${transaction.id}&provider=stripe`,
      cancel_url: body.cancelUrl,
      customer_email: body.customerEmail,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(amountMinor),
      'line_items[0][price_data][product_data][name]': body.description.slice(0, 120),
      'payment_intent_data[transfer_data][destination]': connection.external_account_id,
      'payment_intent_data[application_fee_amount]': String(applicationFee),
    };

    for (const [k, v] of Object.entries(metadataFlat)) {
      params[`metadata[${k}]`] = v;
    }

    const session = await stripeRequest<{ id: string; url: string }>('/checkout/sessions', params);

    await supabase
      .from('transactions')
      .update({
        provider_session_id: session.id,
        provider_checkout_url: session.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    await supabase
      .from('orders')
      .update({
        payment_provider_used: 'stripe_connect',
        payment_connection_id: connection.id,
      })
      .eq('id', body.orderId);

    return jsonResponse(
      {
        success: true,
        transaction_id: transaction.id,
        checkout_url: session.url,
        provider: 'stripe_connect',
        provider_session_id: session.id,
      },
      200,
      origin
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('stripe-create-checkout error:', message);
    return jsonResponse({ error: message }, 500, origin);
  }
});
