/**
 * Edge Function: process-subscription-renewals
 *
 * GeniusPay retiré temporairement (mode MoneyFusion uniquement) :
 * plus aucun checkout GeniusPay n'est pré-créé pour les renouvellements.
 * Les vendeurs renouvellent manuellement via MoneyFusion depuis
 * /dashboard/billing/physical (les emails de dunning pointent vers cette page).
 *
 * L'ancienne implémentation GeniusPay (mandats + checkouts pré-créés) est
 * disponible dans l'historique git si le rail doit être réactivé.
 *
 * Cron: daily (configure in Supabase Dashboard with x-cron-secret header)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SITE_URL = (Deno.env.get('SITE_URL') || 'https://www.emarzona.com').replace(/\/$/, '');

function buildCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': SITE_URL,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async req => {
  const corsHeaders = buildCorsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

  return new Response(
    JSON.stringify({
      success: true,
      message:
        'MoneyFusion-only mode: GeniusPay auto-renew checkouts disabled (manual MoneyFusion renewal)',
      processed: 0,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
