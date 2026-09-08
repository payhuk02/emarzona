/// <reference path="../deno.d.ts" />
/**
 * Alias webhook Paiement Pro.
 * Non déployé si plafond de fonctions atteint — préférer `paiement-pro` (webhook intégré).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  handlePaiementProWebhookRaw,
  paiementProWebhookCors,
} from '../_shared/handle-paiement-pro-webhook.ts';

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: paiementProWebhookCors });
  }
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ success: true, service: 'paiement-pro-webhook' }), {
      headers: { ...paiementProWebhookCors, 'Content-Type': 'application/json' },
    });
  }
  try {
    const raw = await req.text();
    return await handlePaiementProWebhookRaw(raw);
  } catch (err) {
    console.error('[PaiementPro webhook] unhandled', err);
    return new Response(
      JSON.stringify({
        error: 'Erreur interne',
        message: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...paiementProWebhookCors, 'Content-Type': 'application/json' } }
    );
  }
});
