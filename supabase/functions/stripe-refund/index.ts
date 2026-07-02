/**
 * Stripe Connect — remboursement PaymentIntent (vendeur authentifié)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  assertStoreOwner,
  createSupabaseAdmin,
  createSupabaseUserClient,
} from "../_shared/supabase-admin.ts";
import { stripeRequest, toStripeAmount } from "../_shared/stripe-api.ts";
import { applyPaymentRefund } from "../_shared/apply-payment-refund.ts";

interface RefundBody {
  transactionId: string;
  amount?: number;
  reason?: string;
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createSupabaseUserClient(authHeader);
    const supabaseAdmin = createSupabaseAdmin();
    const body = (await req.json()) as RefundBody;

    if (!body.transactionId) {
      return jsonResponse({ error: "transactionId is required" }, 400, origin);
    }

    const { data: transaction, error: txError } = await supabaseAdmin
      .from("transactions")
      .select(
        "id, store_id, status, amount, currency, payment_provider, provider_payment_intent_id",
      )
      .eq("id", body.transactionId)
      .single();

    if (txError || !transaction) {
      return jsonResponse({ error: "Transaction not found" }, 404, origin);
    }

    if (transaction.payment_provider !== "stripe_connect") {
      return jsonResponse(
        { error: "Not a Stripe Connect transaction" },
        400,
        origin,
      );
    }

    await assertStoreOwner(supabaseUser, transaction.store_id);

    const paymentIntentId = transaction.provider_payment_intent_id;
    if (!paymentIntentId) {
      return jsonResponse(
        { error: "Stripe PaymentIntent ID missing" },
        400,
        origin,
      );
    }

    const currency = (transaction.currency || "EUR").toUpperCase();
    const txAmount = Number(transaction.amount ?? 0);
    const refundAmount = body.amount ?? txAmount;

    const params: Record<string, string> = {
      payment_intent: paymentIntentId,
    };
    if (body.amount != null) {
      params.amount = String(toStripeAmount(refundAmount, currency));
    }
    if (body.reason) {
      params.reason = "requested_by_customer";
      params["metadata[reason]"] = body.reason.slice(0, 500);
    }

    const stripeRefund = await stripeRequest<{
      id: string;
      status: string;
      amount: number;
      currency: string;
    }>("/refunds", params);

    const refundedMajor =
      currency.toLowerCase() === "xof" || currency.toLowerCase() === "xaf"
        ? stripeRefund.amount
        : stripeRefund.amount / 100;

    await applyPaymentRefund(supabaseAdmin, body.transactionId, {
      refundId: stripeRefund.id,
      amount: refundedMajor,
      currency: stripeRefund.currency.toUpperCase(),
      reason: body.reason,
      provider: "stripe_connect",
    });

    return jsonResponse(
      {
        success: true,
        refund_id: stripeRefund.id,
        amount: refundedMajor,
        currency: stripeRefund.currency.toUpperCase(),
        status: stripeRefund.status,
      },
      200,
      origin,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("stripe-refund error:", message);
    return jsonResponse({ error: message, success: false }, 500, origin);
  }
});
