/**
 * Edge Function: process-subscription-renewals
 *
 * Cron job — initiates GeniusPay checkout for due physical vendor subscriptions
 * using stored billing mandate profiles (auto-renew).
 *
 * GeniusPay has no native recurring API: we pre-create checkout URLs server-side
 * and notify store owners (one-tap mobile money confirmation).
 *
 * Cron: daily (configure in Supabase Dashboard with x-cron-secret header)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { initializeGeniusPayPayment } from '../_shared/geniuspay-init-payment.ts';

const SITE_URL = (Deno.env.get('SITE_URL') || 'https://www.emarzona.com').replace(/\/$/, '');
const GENIUSPAY_API_URL = Deno.env.get('GENIUSPAY_API_URL') || 'https://geniuspay.ci/api/v1/merchant';

/**
 * Mode temporaire MoneyFusion uniquement (GeniusPay retiré) : actif par défaut.
 * Ne pré-créer aucun checkout GeniusPay — le vendeur renouvelle manuellement
 * via MoneyFusion depuis /dashboard/billing/physical.
 * Opt-out explicite : MONEYFUSION_ONLY=false.
 */
function isMoneyFusionOnly(): boolean {
  const env = (Deno.env.get('MONEYFUSION_ONLY') || '').toLowerCase();
  if (['false', '0', 'no'].includes(env)) return false;
  return true;
}

interface AutoRenewalRow {
  subscription_id: string;
  store_id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  mandate_id: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_country: string | null;
  plan_slug: string;
  monthly_price: number | string;
  yearly_price: number | string | null;
  currency: string;
  owner_user_id: string;
  pending_invoice_id: string | null;
  pending_invoice_amount: number | string | null;
  existing_checkout_url: string | null;
}

function buildCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': SITE_URL,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function resolveInvoiceAmount(row: AutoRenewalRow): number {
  if (row.pending_invoice_amount != null) {
    return Number(row.pending_invoice_amount);
  }
  if (row.billing_cycle === 'yearly') {
    const yearly = row.yearly_price != null ? Number(row.yearly_price) : null;
    if (yearly != null && yearly > 0) return yearly;
    return Number(row.monthly_price) * 12;
  }
  return Number(row.monthly_price);
}

serve(async req => {
  const corsHeaders = buildCorsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');

    if (!expectedCronSecret) {
      return new Response(JSON.stringify({ error: 'CRON_SECRET is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!cronSecret || cronSecret.trim() !== expectedCronSecret.trim()) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (isMoneyFusionOnly()) {
      return new Response(
        JSON.stringify({
          success: true,
          message:
            'MoneyFusion-only mode: GeniusPay auto-renew checkouts disabled (manual MoneyFusion renewal)',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const geniuspayApiKey = Deno.env.get('GENIUSPAY_API_KEY') ?? '';

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!geniuspayApiKey) {
      return new Response(JSON.stringify({ error: 'GENIUSPAY_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: rawList, error: listError } = await supabase.rpc(
      'list_subscriptions_for_auto_renewal'
    );

    if (listError) {
      throw new Error(`list_subscriptions_for_auto_renewal failed: ${listError.message}`);
    }

    const rows = (rawList ?? []) as AutoRenewalRow[];

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No subscriptions due for auto-renewal',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Array<{
      store_id: string;
      subscription_id: string;
      invoice_id: string;
      status: string;
      checkout_url?: string;
      error?: string;
    }> = [];

    for (const row of rows) {
      try {
        if (row.existing_checkout_url) {
          results.push({
            store_id: row.store_id,
            subscription_id: row.subscription_id,
            invoice_id: row.pending_invoice_id ?? '',
            status: 'skipped_existing_checkout',
            checkout_url: row.existing_checkout_url,
          });
          continue;
        }

        let invoiceId = row.pending_invoice_id;

        if (!invoiceId) {
          const { data: createdInvoiceId, error: invoiceError } = await supabase.rpc(
            'get_or_create_renewal_invoice',
            { p_store_id: row.store_id }
          );

          if (invoiceError || !createdInvoiceId) {
            throw new Error(invoiceError?.message ?? 'Failed to create renewal invoice');
          }

          invoiceId = String(createdInvoiceId);
        }

        const { data: invoice, error: fetchInvoiceError } = await supabase
          .from('subscription_invoices')
          .select('id, amount, currency, metadata')
          .eq('id', invoiceId)
          .single();

        if (fetchInvoiceError || !invoice) {
          throw new Error('Invoice not found after creation');
        }

        const amount = Number(invoice.amount);
        const currency = String(invoice.currency || row.currency || 'XOF');

        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            store_id: row.store_id,
            amount,
            currency,
            status: 'pending',
            customer_email: row.customer_email,
            customer_name: row.customer_name,
            customer_phone: row.customer_phone,
            payment_provider: 'geniuspay',
            metadata: {
              purpose: 'physical_subscription_renewal',
              plan_slug: row.plan_slug,
              invoice_id: invoiceId,
              product_type: 'physical',
              auto_renew: true,
            },
          })
          .select('id')
          .single();

        if (txError || !transaction?.id) {
          throw new Error(txError?.message ?? 'Failed to create transaction');
        }

        const geniuspayResult = await initializeGeniusPayPayment(geniuspayApiKey, GENIUSPAY_API_URL, {
          amount,
          currency,
          description: 'Renouvellement automatique abonnement produits physiques',
          customerEmail: row.customer_email,
          customerName: row.customer_name,
          customerPhone: row.customer_phone,
          customerCountry: row.customer_country,
          returnUrl: `${SITE_URL}/dashboard/billing/physical?success=1&auto=1`,
          cancelUrl: `${SITE_URL}/dashboard/billing/physical?cancel=1&auto=1`,
          metadata: {
            purpose: 'physical_subscription_renewal',
            plan_slug: row.plan_slug,
            invoice_id: invoiceId,
            store_id: row.store_id,
            transaction_id: transaction.id,
            auto_renew: 'true',
          },
        });

        await supabase
          .from('transactions')
          .update({
            geniuspay_transaction_id: geniuspayResult.geniuspayPaymentId,
            geniuspay_checkout_url: geniuspayResult.checkoutUrl,
            status: 'processing',
          })
          .eq('id', transaction.id);

        const { data: attempt, error: attemptError } = await supabase
          .from('subscription_payment_attempts')
          .insert({
            invoice_id: invoiceId,
            status: 'processing',
            provider: 'geniuspay_platform',
            external_transaction_id: geniuspayResult.geniuspayPaymentId,
            metadata: {
              checkout_url: geniuspayResult.checkoutUrl,
              transaction_id: transaction.id,
              auto_renew: true,
              initiated_at: new Date().toISOString(),
            },
          })
          .select('id')
          .single();

        if (attemptError) {
          console.warn('Failed to record payment attempt:', attemptError.message);
        }

        await supabase
          .from('subscription_invoices')
          .update({
            metadata: {
              ...((invoice.metadata as Record<string, unknown> | null) ?? {}),
              auto_renew_checkout_url: geniuspayResult.checkoutUrl,
              auto_renew_transaction_id: transaction.id,
              auto_renew_initiated_at: new Date().toISOString(),
            },
          })
          .eq('id', invoiceId);

        const { data: subRow } = await supabase
          .from('store_platform_subscriptions')
          .select('metadata')
          .eq('id', row.subscription_id)
          .single();

        await supabase
          .from('store_platform_subscriptions')
          .update({
            metadata: {
              ...((subRow?.metadata as Record<string, unknown> | null) ?? {}),
              auto_renew_last_checkout_at: new Date().toISOString(),
              auto_renew_last_checkout_url: geniuspayResult.checkoutUrl,
            },
          })
          .eq('id', row.subscription_id);

        await supabase.from('notifications').insert({
          user_id: row.owner_user_id,
          type: 'system',
          title: 'Renouvellement automatique — confirmez le paiement',
          message:
            'Votre abonnement produits physiques est à renouveler. Cliquez pour confirmer le paiement GeniusPay.',
          metadata: {
            store_id: row.store_id,
            category: 'subscription_auto_renew',
            checkout_url: geniuspayResult.checkoutUrl,
            invoice_id: invoiceId,
            attempt_id: attempt?.id ?? null,
          },
        });

        results.push({
          store_id: row.store_id,
          subscription_id: row.subscription_id,
          invoice_id: invoiceId,
          status: 'checkout_initiated',
          checkout_url: geniuspayResult.checkoutUrl,
        });
      } catch (rowError: unknown) {
        const message = rowError instanceof Error ? rowError.message : String(rowError);
        console.error('Auto-renewal failed for store', row.store_id, message);

        if (row.pending_invoice_id) {
          await supabase.from('subscription_payment_attempts').insert({
            invoice_id: row.pending_invoice_id,
            status: 'failed',
            provider: 'geniuspay_platform',
            failure_reason: message.slice(0, 500),
            metadata: { auto_renew: true },
          });
        }

        results.push({
          store_id: row.store_id,
          subscription_id: row.subscription_id,
          invoice_id: row.pending_invoice_id ?? '',
          status: 'failed',
          error: message,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const summary = {
      success: true,
      message: 'Subscription auto-renewal job completed',
      total_eligible: rows.length,
      initiated: results.filter(r => r.status === 'checkout_initiated').length,
      skipped: results.filter(r => r.status === 'skipped_existing_checkout').length,
      failed: results.filter(r => r.status === 'failed').length,
      results: results.slice(0, 20),
      processed_at: new Date().toISOString(),
    };

    console.log('Subscription auto-renewal job completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('process-subscription-renewals error:', message);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
