/**
 * Create Daily.co (default), Zoom, or Google Meet for confirmed online service bookings.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  assertStoreOwner,
  createSupabaseAdmin,
  createSupabaseUserClient,
} from '../_shared/supabase-admin.ts';
import {
  authorizeEdgeCronOrService,
  getProjectRefFromSupabaseUrl,
} from '../_shared/edge-auth-utils.ts';
import { createGoogleMeetEvent, refreshGoogleToken } from '../_shared/google-calendar-api.ts';
import {
  createDailyBookingRoom,
  isDailyConfigured,
  mintDailyJoinUrl,
  resolveServiceMeetingPlatform,
  zonedLocalDateTimeToUtc,
} from '../_shared/daily-api.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';

interface MeetingBody {
  bookingId: string;
  platform?: 'daily' | 'zoom' | 'google_meet';
  action?: 'create' | 'join';
  role?: 'host' | 'guest';
}

type ServiceRow = {
  location_type: string;
  duration_minutes: number;
  preferred_meeting_platform: string | null;
  timezone: string | null;
  meeting_url: string | null;
  max_participants: number | null;
  fulfillment_mode?: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  store_id: string;
  service?: ServiceRow | ServiceRow[] | null;
};

function firstRel<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeWallTime(value: string | null | undefined): string {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return '00:00:00';
  return `${match[1].padStart(2, '0')}:${match[2]}:${(match[3] || '00').padStart(2, '0')}`;
}

function bookingWindow(
  booking: { scheduled_date: string; scheduled_start_time: string; scheduled_end_time: string; timezone?: string | null },
  service: ServiceRow
) {
  const tz = booking.timezone || service.timezone || 'UTC';
  const date = String(booking.scheduled_date).slice(0, 10);
  const startTime = normalizeWallTime(booking.scheduled_start_time);
  const endTime = normalizeWallTime(booking.scheduled_end_time);
  const startAt = zonedLocalDateTimeToUtc(date, startTime, tz);
  let endAt = zonedLocalDateTimeToUtc(date, endTime, tz);
  const durationMinutes =
    service.duration_minutes ||
    Math.max(15, Math.round((endAt.getTime() - startAt.getTime()) / 60_000));
  if (!Number.isFinite(endAt.getTime()) || endAt.getTime() <= startAt.getTime()) {
    endAt = new Date(startAt.getTime() + durationMinutes * 60_000);
  }
  return { tz, startAt, endAt, durationMinutes, wallStart: `${date}T${startTime}`, wallEnd: `${date}T${endTime}` };
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

function isProjectFulfillment(
  service: ServiceRow,
  customerNotes?: string | null
): boolean {
  if (service.fulfillment_mode === 'project') return true;
  const raw = typeof customerNotes === 'string' ? customerNotes.trim() : '';
  if (!raw.startsWith('{')) return false;
  try {
    const parsed = JSON.parse(raw) as { fulfillment_mode?: string };
    return parsed?.fulfillment_mode === 'project';
  } catch {
    return false;
  }
}

async function userCanHostMeeting(
  supabaseAdmin: SupabaseClient,
  opts: {
    storeId: string;
    userId: string;
    providerId: string | null;
    staffMemberId?: string | null;
    userEmail?: string | null;
  }
): Promise<{ isHost: boolean; storeName: string | null }> {
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('id, user_id, name')
    .eq('id', opts.storeId)
    .maybeSingle();
  if (store?.user_id === opts.userId) {
    return { isHost: true, storeName: store.name ?? null };
  }
  if (opts.providerId && opts.providerId === opts.userId) {
    return { isHost: true, storeName: store?.name ?? null };
  }
  const { data: member } = await supabaseAdmin
    .from('store_members')
    .select('id')
    .eq('store_id', opts.storeId)
    .eq('user_id', opts.userId)
    .eq('status', 'active')
    .maybeSingle();
  if (member) {
    return { isHost: true, storeName: store?.name ?? null };
  }
  if (opts.staffMemberId && opts.userEmail) {
    const { data: staff } = await supabaseAdmin
      .from('service_staff_members')
      .select('email')
      .eq('id', opts.staffMemberId)
      .maybeSingle();
    const staffEmail = typeof staff?.email === 'string' ? staff.email.trim().toLowerCase() : '';
    if (staffEmail && staffEmail === opts.userEmail.trim().toLowerCase()) {
      return { isHost: true, storeName: store?.name ?? null };
    }
  }
  return { isHost: false, storeName: store?.name ?? null };
}

async function persistBookingMeeting(
  supabaseAdmin: SupabaseClient,
  bookingId: string,
  payload: {
    meeting_url: string;
    meeting_id: string;
    meeting_password?: string | null;
    meeting_platform: string;
  }
) {
  const { data, error } = await supabaseAdmin
    .from('service_bookings')
    .update({
      meeting_url: payload.meeting_url,
      meeting_id: payload.meeting_id || null,
      meeting_password: payload.meeting_password ?? null,
      meeting_platform: payload.meeting_platform,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select('id, meeting_url, meeting_id, meeting_platform')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function ensureDailyRoom(
  opts: {
    bookingId: string;
    productName: string;
    service: ServiceRow;
    booking: {
      scheduled_date: string;
      scheduled_start_time: string;
      scheduled_end_time: string;
      timezone?: string | null;
    };
  }
) {
  const window = bookingWindow(opts.booking, opts.service);
  return createDailyBookingRoom({
    bookingId: opts.bookingId,
    topic: `${opts.productName} — session Emarzona`,
    startAt: window.startAt,
    endAt: window.endAt,
    maxParticipants: Number(opts.service.max_participants) || 2,
    guestName: 'Client',
    hostName: 'Prestataire',
  });
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
    const supabaseAdmin = createSupabaseAdmin();
    const body = (await req.json()) as MeetingBody;

    if (!body.bookingId) {
      return jsonResponse({ error: 'bookingId required' }, 400, origin);
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('service_bookings')
      .select(
        `
        id, product_id, user_id, provider_id, staff_member_id, scheduled_date, scheduled_start_time, scheduled_end_time,
        timezone, status, meeting_url, meeting_id, meeting_platform, customer_notes,
        product:products!product_id (
          id, name, store_id,
          service:service_products (
            location_type, duration_minutes, preferred_meeting_platform, timezone,
            meeting_url, max_participants, fulfillment_mode
          )
        )
      `
      )
      .eq('id', body.bookingId)
      .single();

    if (bookingError || !booking) {
      return jsonResponse({ error: 'Booking not found' }, 404, origin);
    }

    const product = firstRel(booking.product as ProductRow | ProductRow[] | null);
    if (!product) {
      return jsonResponse({ error: 'Product not found' }, 404, origin);
    }
    const service = firstRel(product.service);
    if (!service) {
      return jsonResponse({ error: 'Service product not found' }, 404, origin);
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const internalAuth = authorizeEdgeCronOrService(req, {
      internalSecret: Deno.env.get('EDGE_INTERNAL_SECRET') ?? '',
      serviceRoleKey,
      projectRef: getProjectRefFromSupabaseUrl(Deno.env.get('SUPABASE_URL') ?? ''),
    });

    if (body.action === 'join') {
      let isHost = false;
      let storeName: string | null = null;
      if (!internalAuth.isInternalCall) {
        const supabaseUser = createSupabaseUserClient(authHeader);
        const {
          data: { user },
        } = await supabaseUser.auth.getUser();
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, origin);
        const host = await userCanHostMeeting(supabaseAdmin, {
          storeId: product.store_id,
          userId: user.id,
          providerId: (booking.provider_id as string | null) ?? null,
          staffMemberId: (booking.staff_member_id as string | null) ?? null,
          userEmail: user.email ?? null,
        });
        isHost = host.isHost;
        storeName = host.storeName;
        const isCustomer = booking.user_id === user.id;
        if (!isHost && !isCustomer) return jsonResponse({ error: 'Forbidden' }, 403, origin);
        if (body.role === 'guest') isHost = false;
      }

      const existingPlatform = String(booking.meeting_platform || '');
      const existingRoom = typeof booking.meeting_id === 'string' ? booking.meeting_id : '';
      const isDailyBooking =
        existingPlatform === 'daily' || existingRoom.startsWith('emz-');

      if (booking.meeting_url && !isDailyBooking) {
        return jsonResponse(
          { url: booking.meeting_url, platform: existingPlatform || 'custom' },
          200,
          origin
        );
      }

      const staticMeetingUrl = typeof service.meeting_url === 'string' ? service.meeting_url.trim() : '';
      if (staticMeetingUrl && !booking.meeting_id) {
        await persistBookingMeeting(supabaseAdmin, body.bookingId, {
          meeting_url: staticMeetingUrl,
          meeting_id: '',
          meeting_platform: 'custom',
        });
        return jsonResponse({ url: staticMeetingUrl, platform: 'custom' }, 200, origin);
      }

      if (!isDailyConfigured()) {
        if (booking.meeting_url) {
          return jsonResponse({ url: booking.meeting_url, platform: existingPlatform || 'daily' }, 200, origin);
        }
        return jsonResponse({ error: 'Daily.co is not configured' }, 400, origin);
      }

      let roomName = isDailyBooking ? existingRoom : '';
      if (!roomName) {
        if (
          service.location_type !== 'online' ||
          isProjectFulfillment(service, (booking.customer_notes as string | null) ?? null)
        ) {
          return jsonResponse({ error: 'Daily room not ready yet' }, 409, origin);
        }
        const room = await ensureDailyRoom({
          bookingId: body.bookingId,
          productName: product.name,
          service,
          booking: booking as {
            scheduled_date: string;
            scheduled_start_time: string;
            scheduled_end_time: string;
            timezone?: string | null;
          },
        });
        await persistBookingMeeting(supabaseAdmin, body.bookingId, {
          meeting_url: room.guestUrl,
          meeting_id: room.roomName,
          meeting_platform: 'daily',
        });
        roomName = room.roomName;
      }

      const url = await mintDailyJoinUrl({
        roomName,
        isOwner: isHost,
        userName: isHost ? storeName || 'Prestataire' : 'Client',
      });
      return jsonResponse({ url, platform: 'daily', role: isHost ? 'host' : 'guest' }, 200, origin);
    }

    if (service.location_type !== 'online') {
      return jsonResponse({ skipped: true, reason: 'not_online_service' }, 200, origin);
    }

    if (isProjectFulfillment(service, (booking.customer_notes as string | null) ?? null)) {
      return jsonResponse({ skipped: true, reason: 'project_fulfillment' }, 200, origin);
    }

    if (booking.meeting_url) {
      return jsonResponse(
        { skipped: true, reason: 'meeting_exists', meeting_url: booking.meeting_url },
        200,
        origin
      );
    }

    const staticMeetingUrl = typeof service.meeting_url === 'string' ? service.meeting_url.trim() : '';
    if (staticMeetingUrl) {
      const updatedCustom = await persistBookingMeeting(supabaseAdmin, body.bookingId, {
        meeting_url: staticMeetingUrl,
        meeting_id: '',
        meeting_platform: 'custom',
      });
      return jsonResponse({ meeting: updatedCustom, skipped: false }, 200, origin);
    }

    if (!internalAuth.isInternalCall) {
      const supabaseUser = createSupabaseUserClient(authHeader);
      await assertStoreOwner(supabaseUser, product.store_id);
    }

    const dailyConfigured = isDailyConfigured();
    const platform = resolveServiceMeetingPlatform({
      requested: body.platform,
      preferred: service.preferred_meeting_platform,
      dailyConfigured,
    });

    const window = bookingWindow(
      booking as {
        scheduled_date: string;
        scheduled_start_time: string;
        scheduled_end_time: string;
        timezone?: string | null;
      },
      service
    );

    let meetingUrl = '';
    let meetingId = '';
    let meetingPassword: string | null = null;
    let meetingPlatform: string = platform;

    if (platform === 'daily') {
      if (!dailyConfigured) {
        if (internalAuth.isInternalCall) {
          return jsonResponse({ skipped: true, reason: 'daily_not_configured' }, 200, origin);
        }
        return jsonResponse({ error: 'Daily.co is not configured' }, 400, origin);
      }
      const room = await ensureDailyRoom({
        bookingId: body.bookingId,
        productName: product.name,
        service,
        booking: booking as {
          scheduled_date: string;
          scheduled_start_time: string;
          scheduled_end_time: string;
          timezone?: string | null;
        },
      });
      meetingUrl = room.guestUrl;
      meetingId = room.roomName;
      meetingPassword = null;
      meetingPlatform = 'daily';
    } else if (platform === 'zoom') {
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
        if (dailyConfigured) {
          const room = await ensureDailyRoom({
            bookingId: body.bookingId,
            productName: product.name,
            service,
            booking: booking as {
              scheduled_date: string;
              scheduled_start_time: string;
              scheduled_end_time: string;
              timezone?: string | null;
            },
          });
          meetingUrl = room.guestUrl;
          meetingId = room.roomName;
          meetingPassword = null;
          meetingPlatform = 'daily';
        } else if (internalAuth.isInternalCall) {
          return jsonResponse({ skipped: true, reason: 'zoom_not_configured' }, 200, origin);
        } else {
          return jsonResponse({ error: 'Zoom not configured for this store' }, 400, origin);
        }
      } else {
        const token = await getZoomAccessToken(config.api_key, config.api_secret, config.account_id);
        const meeting = await createZoomMeeting(token, {
          topic: `${product.name} — réservation`,
          startTime: window.wallStart,
          durationMinutes: window.durationMinutes,
          timezone: window.tz,
          agenda: `Réservation Emarzona #${booking.id}`,
        });
        meetingUrl = meeting.join_url;
        meetingId = String(meeting.id);
        meetingPassword = meeting.password ?? null;
        meetingPlatform = 'zoom';
      }
    } else {
      const { data: gcal } = await supabaseAdmin
        .from('service_calendar_integrations')
        .select('id, access_token, refresh_token, token_expires_at, calendar_id')
        .eq('store_id', product.store_id)
        .eq('calendar_type', 'google_calendar')
        .eq('is_active', true)
        .maybeSingle();

      if (!gcal?.access_token) {
        if (dailyConfigured) {
          const room = await ensureDailyRoom({
            bookingId: body.bookingId,
            productName: product.name,
            service,
            booking: booking as {
              scheduled_date: string;
              scheduled_start_time: string;
              scheduled_end_time: string;
              timezone?: string | null;
            },
          });
          meetingUrl = room.guestUrl;
          meetingId = room.roomName;
          meetingPassword = null;
          meetingPlatform = 'daily';
        } else if (internalAuth.isInternalCall) {
          return jsonResponse({ skipped: true, reason: 'google_meet_not_configured' }, 200, origin);
        } else {
          return jsonResponse({ error: 'Google Calendar not connected for Meet' }, 400, origin);
        }
      } else {
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

        const meet = await createGoogleMeetEvent(accessToken, gcal.calendar_id, {
          summary: `${product.name} — session en ligne`,
          description: `Réservation Emarzona #${booking.id}`,
          startTime: window.wallStart,
          endTime: window.wallEnd,
          timeZone: window.tz,
        });
        meetingUrl = meet.meetingUrl;
        meetingId = meet.eventId;
        meetingPlatform = 'google-meet';
      }
    }

    const updated = await persistBookingMeeting(supabaseAdmin, body.bookingId, {
      meeting_url: meetingUrl,
      meeting_id: meetingId,
      meeting_password: meetingPassword,
      meeting_platform: meetingPlatform,
    });

    return jsonResponse({ meeting: updated }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse({ error: message }, 500, origin);
  }
});
