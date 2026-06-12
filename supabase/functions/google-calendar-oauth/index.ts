/**
 * Epic 3.3.4 — Google Calendar OAuth (authorize + callback)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  assertStoreOwner,
  createSupabaseAdmin,
  createSupabaseUserClient,
} from '../_shared/supabase-admin.ts';
import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  fetchGoogleCalendarList,
  getGoogleOAuthConfig,
} from '../_shared/google-calendar-api.ts';

interface AuthorizeBody {
  action: 'authorize';
  storeId: string;
  returnUrl: string;
  serviceId?: string;
}

serve(async req => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(origin) });
  }

  const supabaseAdmin = createSupabaseAdmin();

  try {
    // OAuth callback from Google (GET)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const oauthError = url.searchParams.get('error');

      if (oauthError) {
        return new Response(`OAuth error: ${oauthError}`, { status: 400 });
      }
      if (!code || !state) {
        return new Response('Missing code or state', { status: 400 });
      }

      const { data: oauthState, error: stateError } = await supabaseAdmin
        .from('service_oauth_states')
        .select('*')
        .eq('state_token', state)
        .is('consumed_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (stateError || !oauthState) {
        return new Response('Invalid or expired OAuth state', { status: 400 });
      }

      const tokens = await exchangeGoogleCode(code);
      const calendars = await fetchGoogleCalendarList(tokens.access_token);
      const primary = calendars.find(c => c.primary) ?? calendars[0];
      const calendarId = primary?.id ?? 'primary';
      const calendarName = primary?.summary ?? 'Google Calendar';

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      const { data: existing } = await supabaseAdmin
        .from('service_calendar_integrations')
        .select('id')
        .eq('store_id', oauthState.store_id)
        .eq('calendar_type', 'google_calendar')
        .maybeSingle();

      const integrationPayload = {
        store_id: oauthState.store_id,
        service_id: (oauthState.metadata as { serviceId?: string })?.serviceId ?? null,
        calendar_type: 'google_calendar',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
        calendar_id: calendarId,
        calendar_name: calendarName,
        sync_direction: 'one_way_import',
        auto_sync: true,
        sync_interval_minutes: 15,
        create_events_for_bookings: false,
        create_events_for_availability: false,
        is_active: true,
        metadata: { oauth_connected: true, scopes: tokens.scope },
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        await supabaseAdmin
          .from('service_calendar_integrations')
          .update(integrationPayload)
          .eq('id', existing.id);
      } else {
        await supabaseAdmin.from('service_calendar_integrations').insert(integrationPayload);
      }

      await supabaseAdmin
        .from('service_oauth_states')
        .update({ consumed_at: new Date().toISOString() })
        .eq('state_token', state);

      const redirectTo =
        oauthState.redirect_url || Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
      const successUrl = new URL(redirectTo);
      successUrl.searchParams.set('google_calendar', 'connected');

      return Response.redirect(successUrl.toString(), 302);
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    const authHeader = req.headers.get('Authorization');
    const supabaseUser = createSupabaseUserClient(authHeader);
    const body = (await req.json()) as AuthorizeBody;

    if (body.action !== 'authorize' || !body.storeId || !body.returnUrl) {
      return jsonResponse({ error: 'storeId and returnUrl required' }, 400, origin);
    }

    await assertStoreOwner(supabaseUser, body.storeId);
    getGoogleOAuthConfig(); // fail fast if not configured

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin);
    }

    const stateToken = crypto.randomUUID();
    const { error: insertError } = await supabaseAdmin.from('service_oauth_states').insert({
      state_token: stateToken,
      store_id: body.storeId,
      user_id: user.id,
      provider: 'google_calendar',
      redirect_url: body.returnUrl,
      metadata: body.serviceId ? { serviceId: body.serviceId } : {},
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500, origin);
    }

    const authUrl = buildGoogleAuthUrl(stateToken);
    return jsonResponse({ authUrl, state: stateToken }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse({ error: message }, 500, origin);
  }
});
