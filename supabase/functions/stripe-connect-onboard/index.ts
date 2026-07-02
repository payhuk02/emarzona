/**
 * Stripe Connect Express — onboarding vendeur (Account + Account Link)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  assertStoreOwner,
  createSupabaseAdmin,
  createSupabaseUserClient,
} from "../_shared/supabase-admin.ts";
import { stripeGet, stripeRequest } from "../_shared/stripe-api.ts";
import { syncStoreEnabledPaymentProviders } from "../_shared/sync-enabled-providers.ts";

interface OnboardBody {
  storeId: string;
  returnUrl: string;
  refreshUrl: string;
  /** Après retour OAuth : synchroniser le statut du compte */
  syncOnly?: boolean;
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
    const body = (await req.json()) as OnboardBody;

    if (!body.storeId || !body.returnUrl || !body.refreshUrl) {
      return jsonResponse(
        { error: "storeId, returnUrl and refreshUrl are required" },
        400,
        origin,
      );
    }

    await assertStoreOwner(supabaseUser, body.storeId);

    const { data: existing } = await supabaseAdmin
      .from("store_payment_connections")
      .select("*")
      .eq("store_id", body.storeId)
      .eq("provider", "stripe_connect")
      .maybeSingle();

    let accountId = existing?.external_account_id as string | null;

    if (!accountId) {
      const account = await stripeRequest<{ id: string }>("/accounts", {
        type: "express",
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
        "metadata[store_id]": body.storeId,
        "metadata[platform]": "emarzona",
      });
      accountId = account.id;

      await supabaseAdmin.from("store_payment_connections").upsert(
        {
          store_id: body.storeId,
          provider: "stripe_connect",
          connection_mode: "oauth_connected",
          external_account_id: accountId,
          external_account_status: "pending",
          capabilities: { card_payments: "pending", transfers: "pending" },
          livemode: !Deno.env.get("STRIPE_SECRET_KEY")?.startsWith("sk_test_"),
          metadata: { created_via: "stripe-connect-onboard" },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id,provider" },
      );
    }

    if (body.syncOnly) {
      const account = await stripeGet<{
        id: string;
        charges_enabled: boolean;
        payouts_enabled: boolean;
        details_submitted: boolean;
      }>(`/accounts/${accountId}`);

      const status = account.charges_enabled && account.details_submitted
        ? "active"
        : "restricted";

      await supabaseAdmin
        .from("store_payment_connections")
        .update({
          external_account_status: status,
          capabilities: {
            card_payments: account.charges_enabled,
            transfers: account.payouts_enabled,
          },
          onboarding_completed_at: account.details_submitted
            ? new Date().toISOString()
            : null,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("store_id", body.storeId)
        .eq("provider", "stripe_connect");

      await syncStoreEnabledPaymentProviders(supabaseAdmin, body.storeId);

      return jsonResponse(
        {
          accountId,
          status,
          charges_enabled: account.charges_enabled,
          details_submitted: account.details_submitted,
        },
        200,
        origin,
      );
    }

    const link = await stripeRequest<{ url: string }>("/account_links", {
      account: accountId,
      refresh_url: body.refreshUrl,
      return_url: body.returnUrl,
      type: "account_onboarding",
    });

    return jsonResponse({ url: link.url, accountId }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("stripe-connect-onboard error:", message);
    return jsonResponse({ error: message }, 500, origin);
  }
});
