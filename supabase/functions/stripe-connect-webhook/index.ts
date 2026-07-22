/**
 * Stripe Connect — Webhooks (checkout.session.completed, charge.refunded, account.updated)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseAdmin } from "../_shared/supabase-admin.ts";
import {
  assertOrderPaymentBeforeComplete,
  completeTransactionAndOrder,
  markWebhookProcessed,
  recordWebhookEvent,
} from "../_shared/complete-order-payment.ts";
import { applyPaymentRefund } from "../_shared/apply-payment-refund.ts";
import { runPostOrderPaymentFulfillment } from "../_shared/post-order-payment-fulfillment.ts";
import { fromStripeAmount, stripeGet } from "../_shared/stripe-api.ts";

async function insertWebhookEventDLQ(
  supabase: any,
  provider: string,
  eventId: string,
  eventType: string,
  payload: any,
): Promise<{ success: boolean; id?: string }> {
  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      provider,
      provider_event_id: eventId,
      event_type: eventType,
      payload,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique violation (already ingested)
      return { success: false };
    }
    console.error("Failed to insert DLQ event", error);
    throw error;
  }
  return { success: true, id: data.id };
}

async function updateWebhookEventDLQStatus(
  supabase: any,
  id: string,
  status: "completed" | "failed",
  errorMessage?: string,
) {
  await supabase
    .from("webhook_events")
    .update({
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;
  const parts = signatureHeader.split(",").reduce(
    (acc, part) => {
      const [k, v] = part.split("=");
      if (!k || !v) return acc;
      const key = k.trim();
      const value = v.trim();
      if (key === "v1") {
        acc.v1.push(value);
        return acc;
      }
      if (key === "t") {
        acc.t = value;
        return acc;
      }
      return acc;
    },
    { t: null as string | null, v1: [] as string[] },
  );
  const timestamp = parts.t;
  const signatures = parts.v1;
  if (!timestamp || signatures.length === 0) return false;

  // Replay protection: reject if timestamp is too far from now.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  const toleranceSec = 5 * 60;
  if (Math.abs(nowSec - ts) > toleranceSec) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${payload}`),
  );
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return signatures.some((sig) => constantTimeEquals(expected, sig));
}

async function resolveStripeRefundIdFromCharge(charge: {
  id?: string;
  refunds?: { data?: Array<{ id?: string }> };
}): Promise<string | null> {
  const embedded = charge.refunds?.data?.[0]?.id;
  if (embedded) return embedded;

  if (!charge.id) return null;

  const list = await stripeGet<{ data: Array<{ id: string }> }>(
    `/refunds?charge=${encodeURIComponent(charge.id)}&limit=1`,
  );
  return list.data[0]?.id ?? null;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET missing");
    return new Response("Webhook not configured", { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  const valid = await verifyStripeSignature(payload, signature, webhookSecret);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(payload) as {
    id: string;
    type: string;
    data: { object: Record<string, unknown> };
  };

  const supabase = createSupabaseAdmin();

  try {
    const isAtomicCheckoutCompletion =
      event.type === "checkout.session.completed";

    // 1. Insertion Idempotente dans la DLQ (webhook_events)
    const { success: inserted, id: dlqEventId } = await insertWebhookEventDLQ(
      supabase,
      "stripe_connect",
      event.id,
      event.type,
      event,
    );

    if (!inserted) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
      });
    }

    // On stocke aussi dans l'ancien système d'audit par sécurité transitoire
    if (!isAtomicCheckoutCompletion) {
      await recordWebhookEvent(
        supabase,
        "stripe_connect",
        event.id,
        event.type,
        event as unknown as Record<string, unknown>,
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id: string;
        payment_status?: string;
        payment_intent?: string;
        amount_total?: number | null;
        currency?: string | null;
        metadata?: Record<string, string>;
      };

      if (session.payment_status !== "paid") {
        await recordWebhookEvent(
          supabase,
          "stripe_connect",
          event.id,
          event.type,
          event as unknown as Record<string, unknown>,
        );
        await markWebhookProcessed(supabase, "stripe_connect", event.id);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
        });
      }

      const transactionId = session.metadata?.transaction_id;
      if (transactionId) {
        if (session.amount_total != null && session.currency) {
          const paidAmount = fromStripeAmount(
            session.amount_total,
            session.currency,
          );
          try {
            await assertOrderPaymentBeforeComplete(
              supabase,
              transactionId,
              paidAmount,
              session.currency,
            );
          } catch (validationError) {
            const reason = validationError instanceof Error
              ? validationError.message
              : "payment_validation_failed";
            console.error("SECURITY: Stripe payment validation failed", {
              transactionId,
              reason,
            });
            await supabase.from("payment_webhook_events").insert({
              provider: "stripe_connect",
              external_event_id: event.id,
              event_type: event.type,
              payload: session as unknown as Record<string, unknown>,
              processing_error: reason,
              transaction_id: transactionId,
            });
            return new Response(
              JSON.stringify({ error: "Payment validation failed" }),
              {
                status: 400,
              },
            );
          }
        }

        try {
          const { orderId, alreadyCompleted } =
            await completeTransactionAndOrder(
              supabase,
              transactionId,
              {
                provider_session_id: session.id,
                provider_payment_intent_id:
                  typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : undefined,
                webhookPayload: session as unknown as Record<string, unknown>,
                paymentProviderUsed: "stripe_connect",
                externalEventId: event.id,
                eventType: event.type,
              },
            );

          if (orderId) {
            await runPostOrderPaymentFulfillment(
              supabase,
              orderId,
              transactionId,
            );
          } else if (alreadyCompleted) {
            console.log(
              "Stripe checkout.session.completed replay ignored (idempotent)",
              {
                transactionId,
                eventId: event.id,
              },
            );
          }

          if (dlqEventId) {
            await updateWebhookEventDLQStatus(
              supabase,
              dlqEventId,
              "completed",
            );
          }
        } catch (syncError) {
          console.error(
            "Hybrid sync processing failed, falling back to DLQ worker",
            syncError,
          );
          const errorMsg = syncError instanceof Error
            ? syncError.message
            : String(syncError);
          if (dlqEventId) {
            await updateWebhookEventDLQStatus(
              supabase,
              dlqEventId,
              "failed",
              errorMsg,
            );
          }
          // On renvoie quand même 200 à Stripe car l'événement est sauvegardé pour retry
        }
      } else {
        if (dlqEventId) {
          await updateWebhookEventDLQStatus(
            supabase,
            dlqEventId,
            "completed",
            "No transaction ID",
          );
        }
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as {
        id?: string;
        payment_intent?: string | { id?: string };
        amount_refunded?: number;
        currency?: string;
        metadata?: Record<string, string>;
        refunds?: { data?: Array<{ id?: string }> };
      };

      const paymentIntentId = typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;

      let transactionId = charge.metadata?.transaction_id;

      if (!transactionId && paymentIntentId) {
        const { data: tx } = await supabase
          .from("transactions")
          .select("id")
          .eq("provider_payment_intent_id", paymentIntentId)
          .maybeSingle();
        transactionId = tx?.id;
      }

      if (transactionId && charge.amount_refunded != null && charge.currency) {
        const { data: txStatus } = await supabase
          .from("transactions")
          .select("status")
          .eq("id", transactionId)
          .maybeSingle();

        if (txStatus?.status === "refunded") {
          console.log("charge.refunded skipped: transaction already refunded", {
            transactionId,
            eventId: event.id,
          });
        } else {
          const refundAmount = fromStripeAmount(
            charge.amount_refunded,
            charge.currency,
          );
          const refundId = (await resolveStripeRefundIdFromCharge(charge)) ??
            charge.id ?? event.id;

          await applyPaymentRefund(supabase, transactionId, {
            refundId,
            amount: refundAmount,
            currency: charge.currency.toUpperCase(),
            provider: "stripe_connect",
          });
        }
        if (dlqEventId) {
          await updateWebhookEventDLQStatus(supabase, dlqEventId, "completed");
        }
      } else {
        if (dlqEventId) {
          await updateWebhookEventDLQStatus(supabase, dlqEventId, "completed");
        }
      }
    }

    if (event.type === "account.updated") {
      const account = event.data.object as {
        id: string;
        charges_enabled?: boolean;
        payouts_enabled?: boolean;
        details_submitted?: boolean;
      };
      const status = account.charges_enabled && account.details_submitted
        ? "active"
        : "restricted";

      await supabase
        .from("store_payment_connections")
        .update({
          external_account_status: status,
          capabilities: {
            card_payments: account.charges_enabled ?? false,
            transfers: account.payouts_enabled ?? false,
          },
          onboarding_completed_at: account.details_submitted
            ? new Date().toISOString()
            : null,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("external_account_id", account.id)
        .eq("provider", "stripe_connect");

      if (dlqEventId) {
        await updateWebhookEventDLQStatus(supabase, dlqEventId, "completed");
      }
    }

    await markWebhookProcessed(supabase, "stripe_connect", event.id);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("stripe-connect-webhook error:", message);
    await supabase
      .from("payment_webhook_events")
      .update({ processing_error: message })
      .eq("provider", "stripe_connect")
      .eq("external_event_id", event.id);

    // Le 500 informera Stripe de re-tenter si l'insertion DB n'a même pas pu se faire.
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
