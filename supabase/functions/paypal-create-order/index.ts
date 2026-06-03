/**
 * PayPal Commerce — création commande checkout (platform fee + payee vendeur)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { computePayPalPlatformFee, createPayPalCheckoutOrder } from '../_shared/paypal-api.ts';
import { resolvePlatformFeePercent } from '../_shared/complete-order-payment.ts';

interface CreateOrderBody {
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
    const body = (await req.json()) as CreateOrderBody;
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

    const { data: connection, error: connError } = await supabase
      .from('store_payment_connections')
      .select('id, external_account_id, external_account_status')
      .eq('store_id', body.storeId)
      .eq('provider', 'paypal_commerce')
      .eq('external_account_status', 'active')
      .maybeSingle();

    if (connError || !connection?.external_account_id) {
      return jsonResponse({ error: 'PayPal Commerce is not active for this store' }, 400, origin);
    }

    const feePercent = await resolvePlatformFeePercent(supabase, body.storeId);
    const platformFee = computePayPalPlatformFee(body.amount, feePercent);
    const applicationFeeAmount = parseFloat(platformFee);

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
        payment_provider: 'paypal_commerce',
        connected_account_id: connection.external_account_id,
        application_fee_amount: applicationFeeAmount,
        metadata: {
          ...body.metadata,
          paypal_commerce: true,
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

    const successSep = body.successUrl.includes('?') ? '&' : '?';
    const successWithParams = `${body.successUrl}${successSep}order_id=${body.orderId}&transaction_id=${transaction.id}&provider=paypal`;

    const paypalOrder = await createPayPalCheckoutOrder({
      amount: body.amount,
      currency,
      description: body.description,
      merchantId: connection.external_account_id,
      platformFee,
      transactionId: transaction.id,
      orderId: body.orderId,
      storeId: body.storeId,
      successUrl: successWithParams,
      cancelUrl: body.cancelUrl,
    });

    const checkoutUrl = paypalOrder.approveUrl;

    await supabase
      .from('transactions')
      .update({
        provider_session_id: paypalOrder.id,
        provider_checkout_url: checkoutUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    await supabase
      .from('orders')
      .update({
        payment_provider_used: 'paypal_commerce',
        payment_connection_id: connection.id,
      })
      .eq('id', body.orderId);

    return jsonResponse(
      {
        success: true,
        transaction_id: transaction.id,
        checkout_url: checkoutUrl,
        provider: 'paypal_commerce',
        provider_session_id: paypalOrder.id,
      },
      200,
      origin
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('paypal-create-order error:', message);
    return jsonResponse({ error: message }, 500, origin);
  }
});
