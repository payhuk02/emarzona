/**
 * Envoie l'email welcome-user via send-email après confirmation d'adresse (auth.users).
 * Appelé par le trigger SQL ou en interne (service role / EDGE_INTERNAL_SECRET).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { getProjectRefFromSupabaseUrl, isServiceRoleJwt } from '../_shared/edge-auth-utils.ts';

const EDGE_INTERNAL_SECRET = Deno.env.get('EDGE_INTERNAL_SECRET');
const SITE_URL = (Deno.env.get('SITE_URL') || 'https://emarzona.com').replace(/\/$/, '');

interface WelcomeEmailRequest {
  user_id: string;
  email?: string;
  full_name?: string;
}

async function invokeSendEmail(
  supabase: ReturnType<typeof createClient>,
  body: Record<string, unknown>
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const headers: Record<string, string> = {};
  if (EDGE_INTERNAL_SECRET) {
    headers['x-internal-secret'] = EDGE_INTERNAL_SECRET;
  }

  const { data, error } = await supabase.functions.invoke('send-email', { body, headers });

  if (error) {
    console.error('send-email invoke error:', error);
    return { ok: false, error: error.message };
  }

  const result = data as { success?: boolean; error?: string; messageId?: string } | null;
  if (result?.success === false || result?.error) {
    return { ok: false, error: result.error || 'send-email failed' };
  }

  return { ok: true, messageId: result?.messageId };
}

function authorizeRequest(
  req: Request,
  supabaseServiceKey: string,
  projectRef: string | null
): boolean {
  const internalSecret = req.headers.get('x-internal-secret');
  if (EDGE_INTERNAL_SECRET && internalSecret?.trim() === EDGE_INTERNAL_SECRET.trim()) {
    return true;
  }

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (token && token === supabaseServiceKey) return true;
  if (token && isServiceRoleJwt(token, projectRef)) return true;

  return false;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const projectRef = getProjectRefFromSupabaseUrl(supabaseUrl);
    if (!authorizeRequest(req, supabaseServiceKey, projectRef)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as WelcomeEmailRequest;
    const userId = payload.user_id?.trim();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name, first_name, last_name, welcome_email_sent_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('profiles lookup error:', profileError);
      return new Response(JSON.stringify({ error: 'Profile lookup failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (profile?.welcome_email_sent_at) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'already_sent' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let email = payload.email?.trim().toLowerCase();
    let fullName = payload.full_name?.trim();

    if (!email) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authError || !authUser.user?.email) {
        return new Response(JSON.stringify({ error: 'User email not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      email = authUser.user.email.toLowerCase();
      const meta = authUser.user.user_metadata as Record<string, unknown> | undefined;
      if (!fullName) {
        fullName =
          (typeof meta?.full_name === 'string' && meta.full_name) ||
          (typeof meta?.name === 'string' && meta.name) ||
          undefined;
      }
    }

    const userName =
      fullName ||
      profile?.display_name ||
      profile?.first_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      email.split('@')[0];

    const sendResult = await invokeSendEmail(supabase, {
      to: email,
      toName: userName,
      templateSlug: 'welcome-user',
      userId,
      language: 'fr',
      variables: {
        user_name: userName,
        user_email: email,
        dashboard_url: `${SITE_URL}/dashboard`,
      },
    });

    if (!sendResult.ok) {
      return new Response(JSON.stringify({ success: false, error: sendResult.error }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.warn('welcome_email_sent_at update failed:', updateError);
    }

    return new Response(JSON.stringify({ success: true, messageId: sendResult.messageId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-welcome-email error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
