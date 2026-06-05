/**
 * Alerte sécurité admin — email + webhook sur actions sensibles (KYC reject, RBAC, etc.)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mail.emarzona.com';
const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Emarzona';
const DEFAULT_ALERT_EMAIL = 'contact@edigit-agence.com';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowOrigin =
    ALLOWED_ORIGINS.length === 0
      ? '*'
      : ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
}

type SecurityAlertsConfig = {
  enabled?: boolean;
  emails?: string[];
  webhook_url?: string;
};

async function verifyPlatformAdmin(supabase: ReturnType<typeof createClient>, userId: string) {
  const [{ data: profile }, { data: isAdminRpc }] = await Promise.all([
    supabase.from('profiles').select('role, is_super_admin').eq('id', userId).maybeSingle(),
    supabase.rpc('has_role', { _user_id: userId, _role: 'admin' }),
  ]);

  if (profile?.is_super_admin || isAdminRpc) return true;
  const roles = ['admin', 'manager', 'moderator', 'support', 'viewer', 'staff'];
  return roles.includes(profile?.role ?? '');
}

async function getSecurityAlertsConfig(
  supabase: ReturnType<typeof createClient>
): Promise<SecurityAlertsConfig> {
  const { data } = await supabase
    .from('admin_config')
    .select('settings')
    .eq('key', 'admin')
    .maybeSingle();

  const cfg = (data?.settings as Record<string, unknown> | null)?.security_alerts;
  if (cfg && typeof cfg === 'object') {
    return cfg as SecurityAlertsConfig;
  }
  return { enabled: true, emails: [DEFAULT_ALERT_EMAIL] };
}

async function sendAlertEmail(to: string[], subject: string, html: string) {
  if (!RESEND_API_KEY || to.length === 0) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html,
    }),
  });
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isAdmin = await verifyPlatformAdmin(supabase, userData.user.id);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const action = String(body.action ?? '');
    if (!action) {
      return new Response(JSON.stringify({ error: 'action is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = await getSecurityAlertsConfig(supabase);
    if (config.enabled === false) {
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emails = Array.isArray(config.emails)
      ? config.emails.filter((e): e is string => typeof e === 'string' && e.includes('@'))
      : [DEFAULT_ALERT_EMAIL];

    const actorEmail = body.actorEmail ?? userData.user.email ?? 'unknown';
    const targetType = body.targetType ?? '—';
    const targetId = body.targetId ?? '—';
    const metadata = body.metadata ?? {};

    const subject = `[Emarzona Admin] Action sensible : ${action}`;
    const html = `
      <h2>Alerte sécurité administrateur</h2>
      <p><strong>Action :</strong> ${action}</p>
      <p><strong>Acteur :</strong> ${actorEmail}</p>
      <p><strong>Cible :</strong> ${targetType} / ${targetId}</p>
      <pre style="background:#f4f4f5;padding:12px;border-radius:8px;">${JSON.stringify(metadata, null, 2)}</pre>
      <p><em>${new Date().toISOString()}</em></p>
    `;

    await sendAlertEmail(emails, subject, html);

    if (config.webhook_url) {
      try {
        await fetch(config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'admin.security_alert',
            action,
            actorEmail,
            targetType,
            targetId,
            metadata,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookErr) {
        console.error('Webhook alert failed:', webhookErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('admin-security-alert error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
