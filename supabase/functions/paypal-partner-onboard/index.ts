/**
 * PayPal Commerce — onboarding vendeur (Partner Referrals)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  assertStoreOwner,
  createSupabaseAdmin,
  createSupabaseUserClient,
} from '../_shared/supabase-admin.ts';
import {
  createPartnerReferral,
  getMerchantIntegrationByTrackingId,
  isPayPalLiveMode,
} from '../_shared/paypal-api.ts';
import { syncStoreEnabledPaymentProviders } from '../_shared/sync-enabled-providers.ts';

interface OnboardBody {
  storeId: string;
  returnUrl: string;
  syncOnly?: boolean;
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
    const authHeader = req.headers.get('Authorization');
    const supabaseUser = createSupabaseUserClient(authHeader);
    const supabaseAdmin = createSupabaseAdmin();
    const body = (await req.json()) as OnboardBody;

    if (!body.storeId || !body.returnUrl) {
      return jsonResponse({ error: 'storeId and returnUrl are required' }, 400, origin);
    }

    await assertStoreOwner(supabaseUser, body.storeId);

    const { data: existing } = await supabaseAdmin
      .from('store_payment_connections')
      .select('*')
      .eq('store_id', body.storeId)
      .eq('provider', 'paypal_commerce')
      .maybeSingle();

    if (body.syncOnly) {
      const integration = await getMerchantIntegrationByTrackingId(body.storeId);
      const merchantId = integration?.merchantId ?? existing?.external_account_id;
      const status = integration?.paymentsReceivable && merchantId ? 'active' : 'restricted';

      if (merchantId) {
        await supabaseAdmin.from('store_payment_connections').upsert(
          {
            store_id: body.storeId,
            provider: 'paypal_commerce',
            connection_mode: 'oauth_connected',
            external_account_id: merchantId,
            external_account_status: status,
            capabilities: { express_checkout: status === 'active' },
            livemode: isPayPalLiveMode(),
            onboarding_completed_at: status === 'active' ? new Date().toISOString() : null,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'store_id,provider' }
        );

        if (status === 'active') {
          await syncStoreEnabledPaymentProviders(supabaseAdmin, body.storeId);
        }
      }

      return jsonResponse(
        {
          merchantId: merchantId ?? null,
          status,
          payments_receivable: integration?.paymentsReceivable ?? false,
        },
        200,
        origin
      );
    }

    const { actionUrl } = await createPartnerReferral({
      storeId: body.storeId,
      returnUrl: body.returnUrl,
    });

    await supabaseAdmin.from('store_payment_connections').upsert(
      {
        store_id: body.storeId,
        provider: 'paypal_commerce',
        connection_mode: 'oauth_connected',
        external_account_status: 'pending',
        capabilities: { express_checkout: 'pending' },
        livemode: isPayPalLiveMode(),
        metadata: {
          created_via: 'paypal-partner-onboard',
          tracking_id: body.storeId,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'store_id,provider' }
    );

    return jsonResponse({ url: actionUrl }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('paypal-partner-onboard error:', message);
    return jsonResponse({ error: message }, 500, origin);
  }
});
