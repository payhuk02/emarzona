/**
 * Epic 3.3.5 — Create Zoom or Google Meet for confirmed online service bookings
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  assertStoreOwner,
  createSupabaseAdmin,
  createSupabaseUserClient,
} from '../_shared/supabase-admin.ts';
import { createGoogleMeetEvent, refreshGoogleToken } from '../_shared/google-calendar-api.ts';

interface MeetingBody {
  bookingId: string;
  platform?: 'zoom' | 'google_meet';
}

async function getZoomAccessToken(
  apiKey: string,
  apiSecret: string,
  accountId?: string
): Promise<string> {
  if (accountId) {
    const basic = btoa(`${apiKey}:${apiSecret}`);
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${basic}` },
      }
    );
    if (!res.ok) throw new Error(`Zoom OAuth failed: ${await res.text()}`);
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  const basic = btoa(`${apiKey}:${apiSecret}`);
  const res = await fetch('https://zoom.us/oauth/token?grant_type=client_credentials', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) throw new Error(`Zoom token failed: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function createZoomMeeting(
  token: string,
  opts: {
    topic: string;
    startTime: string;
    durationMinutes: number;
    timezone: string;
    agenda?: string;
  }
) {
  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: opts.topic,
      type: 2,
      start_time: opts.startTime,
      duration: opts.durationMinutes,
      timezone: opts.timezone,
      agenda: opts.agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        waiting_room: true,
      },
    }),
  });
  if (!res.ok) throw new Error(`Zoom meeting failed: ${await res.text()}`);
  return (await res.json()) as { id: string; join_url: string; password?: string };
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
    const body = (await req.json()) as MeetingBody;

    if (!body.bookingId) {
      return jsonResponse({ error: 'bookingId required' }, 400, origin);
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('service_bookings')
      .select(
        `
        id, product_id, user_id, scheduled_date, scheduled_start_time, scheduled_end_time,
        timezone, status, meeting_url, meeting_platform,
        product:products!product_id (
          id, name, store_id,
          service:service_products (
            location_type, duration_minutes, preferred_meeting_platform, timezone
          )
        )
      `
      )
      .eq('id', body.bookingId)
      .single();

    if (bookingError || !booking) {
      return jsonResponse({ error: 'Booking not found' }, 404, origin);
    }

    const product = booking.product as {
      id: string;
      name: string;
      store_id: string;
      service?: {
        location_type: string;
        duration_minutes: number;
        preferred_meeting_platform: string | null;
        timezone: string | null;
      } | null;
    };
    const serviceRaw = product.service;
    const service = Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw;
    if (!service) {
      return jsonResponse({ error: 'Service product not found' }, 404, origin);
    }

    if (service.location_type !== 'online') {
      return jsonResponse({ skipped: true, reason: 'not_online_service' }, 200, origin);
    }

    if (booking.meeting_url) {
      return jsonResponse(
        { skipped: true, reason: 'meeting_exists', meeting_url: booking.meeting_url },
        200,
        origin
      );
    }

    await assertStoreOwner(supabaseUser, product.store_id);

    const platform = body.platform ?? service.preferred_meeting_platform ?? 'zoom';

    const tz = booking.timezone || service.timezone || 'UTC';
    const startIso = `${booking.scheduled_date}T${booking.scheduled_start_time}`;
    const startDate = new Date(startIso);
    const endParts = (booking.scheduled_end_time as string).split(':');
    const endDate = new Date(booking.scheduled_date);
    endDate.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
    const durationMinutes =
      service.duration_minutes ||
      Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / 60_000));

    let meetingUrl = '';
    let meetingId = '';
    let meetingPassword: string | null = null;
    let meetingPlatform = platform;

    if (platform === 'zoom') {
      const { data: zoomConfig } = await supabaseAdmin
        .from('store_integrations')
        .select('config')
        .eq('store_id', product.store_id)
        .eq('integration_type', 'zoom')
        .eq('is_active', true)
        .maybeSingle();

      const config = (zoomConfig?.config ?? {}) as {
        api_key?: string;
        api_secret?: string;
        account_id?: string;
      };
      if (!config.api_key || !config.api_secret) {
        return jsonResponse({ error: 'Zoom not configured for this store' }, 400, origin);
      }

      const token = await getZoomAccessToken(config.api_key, config.api_secret, config.account_id);
      const meeting = await createZoomMeeting(token, {
        topic: `${product.name} — réservation`,
        startTime: startDate.toISOString(),
        durationMinutes,
        timezone: tz,
        agenda: `Réservation Emarzona #${booking.id}`,
      });
      meetingUrl = meeting.join_url;
      meetingId = String(meeting.id);
      meetingPassword = meeting.password ?? null;
      meetingPlatform = 'zoom';
    } else {
      const { data: gcal } = await supabaseAdmin
        .from('service_calendar_integrations')
        .select('id, access_token, refresh_token, token_expires_at, calendar_id')
        .eq('store_id', product.store_id)
        .eq('calendar_type', 'google_calendar')
        .eq('is_active', true)
        .maybeSingle();

      if (!gcal?.access_token) {
        return jsonResponse({ error: 'Google Calendar not connected for Meet' }, 400, origin);
      }

      let accessToken = gcal.access_token;
      const expiresAt = gcal.token_expires_at ? new Date(gcal.token_expires_at).getTime() : 0;
      if (Date.now() > expiresAt - 60_000 && gcal.refresh_token) {
        const tokens = await refreshGoogleToken(gcal.refresh_token);
        accessToken = tokens.access_token;
        await supabaseAdmin
          .from('service_calendar_integrations')
          .update({
            access_token: tokens.access_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          })
          .eq('id', gcal.id);
      }

      const endIso = `${booking.scheduled_date}T${booking.scheduled_end_time}`;
      const meet = await createGoogleMeetEvent(accessToken, gcal.calendar_id, {
        summary: `${product.name} — session en ligne`,
        description: `Réservation Emarzona #${booking.id}`,
        startTime: startIso,
        endTime: endIso,
        timeZone: tz,
      });
      meetingUrl = meet.meetingUrl;
      meetingId = meet.eventId;
      meetingPlatform = 'google-meet';
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('service_bookings')
      .update({
        meeting_url: meetingUrl,
        meeting_id: meetingId,
        meeting_password: meetingPassword,
        meeting_platform: meetingPlatform,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.bookingId)
      .select('id, meeting_url, meeting_id, meeting_platform')
      .single();

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500, origin);
    }

    return jsonResponse({ meeting: updated }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse({ error: message }, 500, origin);
  }
});
