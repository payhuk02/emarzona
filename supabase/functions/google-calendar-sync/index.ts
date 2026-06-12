/**
 * Epic 3.3.4 — Sync Google Calendar freebusy → service_calendar_events
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  assertStoreOwner,
  createSupabaseAdmin,
  createSupabaseUserClient,
} from '../_shared/supabase-admin.ts';
import { fetchGoogleFreeBusy, refreshGoogleToken } from '../_shared/google-calendar-api.ts';

interface SyncBody {
  integrationId: string;
  startDate?: string;
  endDate?: string;
}

async function ensureAccessToken(
  supabaseAdmin: ReturnType<typeof createSupabaseAdmin>,
  integration: {
    id: string;
    access_token: string;
    refresh_token: string | null;
    token_expires_at: string | null;
  }
): Promise<string> {
  const expiresAt = integration.token_expires_at
    ? new Date(integration.token_expires_at).getTime()
    : 0;
  const needsRefresh = !integration.access_token || Date.now() > expiresAt - 60_000;

  if (!needsRefresh) {
    return integration.access_token;
  }
  if (!integration.refresh_token) {
    throw new Error('Google Calendar token expired; reconnect OAuth');
  }

  const tokens = await refreshGoogleToken(integration.refresh_token);
  const newExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabaseAdmin
    .from('service_calendar_integrations')
    .update({
      access_token: tokens.access_token,
      token_expires_at: newExpires,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id);

  return tokens.access_token;
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
    const body = (await req.json()) as SyncBody;

    if (!body.integrationId) {
      return jsonResponse({ error: 'integrationId required' }, 400, origin);
    }

    const { data: integration, error } = await supabaseAdmin
      .from('service_calendar_integrations')
      .select(
        'id, store_id, calendar_id, calendar_type, access_token, refresh_token, token_expires_at, is_active'
      )
      .eq('id', body.integrationId)
      .single();

    if (error || !integration) {
      return jsonResponse({ error: 'Integration not found' }, 404, origin);
    }
    if (integration.calendar_type !== 'google_calendar' || !integration.is_active) {
      return jsonResponse({ error: 'Not a Google Calendar integration' }, 400, origin);
    }

    await assertStoreOwner(supabaseUser, integration.store_id);

    const start = body.startDate ? new Date(body.startDate) : new Date();
    const end = body.endDate
      ? new Date(body.endDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const accessToken = await ensureAccessToken(supabaseAdmin, integration);
    const busyBlocks = await fetchGoogleFreeBusy(
      accessToken,
      integration.calendar_id,
      start.toISOString(),
      end.toISOString()
    );

    const { data: count, error: rpcError } = await supabaseAdmin.rpc(
      'upsert_google_calendar_busy_events',
      {
        p_integration_id: integration.id,
        p_busy_blocks: busyBlocks,
      }
    );

    if (rpcError) {
      await supabaseAdmin
        .from('service_calendar_integrations')
        .update({
          last_sync_status: 'error',
          last_sync_error: rpcError.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);
      return jsonResponse({ error: rpcError.message }, 500, origin);
    }

    return jsonResponse(
      { synced: count ?? busyBlocks.length, blocks: busyBlocks.length },
      200,
      origin
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse({ error: message }, 500, origin);
  }
});
