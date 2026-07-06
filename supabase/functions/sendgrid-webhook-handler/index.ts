/**
 * @deprecated DECOMMISSIONED — SendGrid is no longer the production email provider.
 * All email webhooks are now handled by resend-webhook-handler.
 *
 * This handler returns 410 Gone for any request to prevent silent failures
 * and clearly signal to any legacy integrations that SendGrid support has ended.
 *
 * Date de décommission: 4 Juillet 2026
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve((_req) => {
  console.warn(
    JSON.stringify({
      level: 'warn',
      message: 'Deprecated sendgrid-webhook-handler called — returning 410 Gone',
      timestamp: new Date().toISOString(),
    })
  );

  return new Response(
    JSON.stringify({
      error: 'Gone',
      message:
        'SendGrid webhook handler has been decommissioned. The email provider is now Resend. Use resend-webhook-handler instead.',
      migrated_to: 'resend-webhook-handler',
      deprecated_since: '2026-07-04',
    }),
    {
      status: 410,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
