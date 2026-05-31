/**
 * Setup email infrastructure (one-shot / idempotent)
 * - Cron pg_cron → process-scheduled-campaigns
 * - Webhook Resend → resend-webhook-handler (si RESEND_API_KEY configurée)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PROJECT_REF = 'hbdnzajbyjakdhuavrvb';
const RESEND_EVENTS = [
  'email.sent',
  'email.delivered',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'email.complained',
];

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isServiceRoleJwt(token: string, projectRef: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      role?: string;
      ref?: string;
      iss?: string;
    };
    if (payload.role !== 'service_role') return false;
    if (payload.ref === projectRef) return true;
    return (payload.iss ?? '').includes(projectRef);
  } catch {
    return false;
  }
}

async function setupCronJobs(
  supabase: ReturnType<typeof createClient>,
  cronSecret: string,
  anonKey: string
): Promise<Record<string, unknown>> {
  const campaigns = await supabase.rpc('setup_email_campaigns_cron_job', {
    p_project_ref: PROJECT_REF,
    p_cron_secret: cronSecret,
    p_anon_key: anonKey,
  });
  if (campaigns.error) {
    throw new Error(`Campaigns cron setup failed: ${campaigns.error.message}`);
  }

  const sequences = await supabase.rpc('setup_email_sequences_cron_job', {
    p_project_ref: PROJECT_REF,
    p_cron_secret: cronSecret,
    p_anon_key: anonKey,
  });
  if (sequences.error) {
    throw new Error(`Sequences cron setup failed: ${sequences.error.message}`);
  }

  const abandonedCart = await supabase.rpc('setup_abandoned_cart_recovery_cron_job', {
    p_project_ref: PROJECT_REF,
    p_cron_secret: cronSecret,
    p_anon_key: anonKey,
  });
  if (abandonedCart.error) {
    throw new Error(`Abandoned cart cron setup failed: ${abandonedCart.error.message}`);
  }

  const adminBroadcasts = await supabase.rpc('setup_scheduled_admin_broadcasts_cron_job', {
    p_project_ref: PROJECT_REF,
    p_cron_secret: cronSecret,
    p_anon_key: anonKey,
  });
  if (adminBroadcasts.error) {
    throw new Error(`Admin broadcasts cron setup failed: ${adminBroadcasts.error.message}`);
  }

  return {
    campaigns: campaigns.data,
    sequences: sequences.data,
    abandoned_cart: abandonedCart.data,
    admin_broadcasts: adminBroadcasts.data,
  };
}

async function setupResendWebhook(
  resendApiKey: string,
  webhookSecretAlreadySet: boolean
): Promise<Record<string, unknown>> {
  const endpoint = `https://${PROJECT_REF}.supabase.co/functions/v1/resend-webhook-handler`;

  const listResponse = await fetch('https://api.resend.com/webhooks', {
    headers: { Authorization: `Bearer ${resendApiKey}` },
  });

  if (listResponse.ok) {
    const listBody = await listResponse.json();
    const existing = (listBody.data || []).find(
      (w: { endpoint?: string; status?: string }) =>
        w.endpoint === endpoint && w.status !== 'disabled'
    );
    if (existing) {
      return {
        action: 'existing',
        webhook_id: existing.id,
        endpoint,
        message: webhookSecretAlreadySet
          ? 'Webhook Resend déjà configuré'
          : 'Webhook existant — configurez RESEND_WEBHOOK_SECRET (signing secret whsec_...) dans Supabase Secrets',
      };
    }
  }

  const createResponse = await fetch('https://api.resend.com/webhooks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ endpoint, events: RESEND_EVENTS }),
  });

  const createBody = await createResponse.json();

  if (!createResponse.ok) {
    throw new Error(
      `Resend webhook creation failed: ${createResponse.status} ${JSON.stringify(createBody)}`
    );
  }

  const signingSecret = createBody.signing_secret as string | undefined;

  return {
    action: 'created',
    webhook_id: createBody.id,
    endpoint,
    signing_secret_configured: webhookSecretAlreadySet,
    next_step: webhookSecretAlreadySet
      ? null
      : signingSecret
        ? `npx supabase secrets set RESEND_WEBHOOK_SECRET=${signingSecret} --project-ref ${PROJECT_REF}`
        : 'Configurez RESEND_WEBHOOK_SECRET avec le signing secret (whsec_...) depuis le dashboard Resend',
    note: 'Le signing_secret Resend (whsec_...) n’est affiché qu’une fois à la création.',
  };
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    let body: { cron_secret?: string; anon_key?: string } = {};
    try {
      body = await req.json();
    } catch {
      // corps vide accepté
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const cronSecret = (body.cron_secret ?? Deno.env.get('CRON_SECRET') ?? '').trim();
    const anonKey = (
      body.anon_key ??
      Deno.env.get('SUPABASE_ANON_KEY') ??
      Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY') ??
      ''
    ).trim();
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
    const resendWebhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? '';
    const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET') ?? '';

    const headerInternal = req.headers.get('x-internal-secret');
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    const authorized =
      (internalSecret && headerInternal?.trim() === internalSecret.trim()) ||
      (serviceKey && token === serviceKey) ||
      isServiceRoleJwt(token, PROJECT_REF);

    if (!authorized) {
      return json(401, { error: 'Unauthorized — service role or x-internal-secret required' });
    }

    if (!supabaseUrl || !serviceKey) {
      return json(500, { error: 'Supabase configuration missing' });
    }

    if (!cronSecret) {
      return json(500, {
        error:
          'CRON_SECRET not configured — définissez le secret Edge ou passez cron_secret dans le body',
      });
    }

    if (cronSecret.length < 16) {
      return json(400, {
        error: 'cron_secret must be at least 16 characters',
        hint: 'npx supabase secrets set CRON_SECRET=<secret-32-chars-min> --project-ref hbdnzajbyjakdhuavrvb',
      });
    }

    if (!anonKey) {
      return json(500, {
        error: 'SUPABASE_ANON_KEY not configured — required for pg_cron → Edge gateway auth',
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const result: Record<string, unknown> = { project_ref: PROJECT_REF };

    result.cron = await setupCronJobs(supabase, cronSecret, anonKey);

    if (resendApiKey) {
      result.resend_webhook = await setupResendWebhook(resendApiKey, !!resendWebhookSecret);
    } else {
      result.resend_webhook = {
        skipped: true,
        reason: 'RESEND_API_KEY not set in Supabase secrets',
        next_step: `npx supabase secrets set RESEND_API_KEY=re_xxx RESEND_WEBHOOK_SECRET=whsec_xxx --project-ref ${PROJECT_REF}`,
      };
    }

    result.ok = true;
    return json(200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('setup-email-infrastructure error:', message);
    return json(500, { error: message });
  }
});
