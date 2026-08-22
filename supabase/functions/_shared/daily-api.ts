/**
 * Daily.co REST client for Emarzona visio (platform-level).
 * Secrets: DAILY_API_KEY, DAILY_DOMAIN (e.g. emarzona or emarzona.daily.co).
 */

const DAILY_API = 'https://api.daily.co/v1';
const DAILY_HOST_SUFFIX = '.daily.co';

export type DailyDomain = { subdomain: string; host: string };

export function parseDailyDomain(raw: string | null | undefined): DailyDomain | null {
  if (!raw) return null;
  let value = raw.trim().toLowerCase();
  if (!value) return null;
  value = value.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (value.endsWith(DAILY_HOST_SUFFIX)) {
    const subdomain = value.slice(0, -DAILY_HOST_SUFFIX.length);
    if (!subdomain || !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain)) return null;
    return { subdomain, host: `${subdomain}${DAILY_HOST_SUFFIX}` };
  }
  if (/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) {
    return { subdomain: value, host: `${value}${DAILY_HOST_SUFFIX}` };
  }
  return null;
}

export function buildDailyRoomUrl(host: string, roomName: string, token?: string | null): string {
  const base = `https://${host.replace(/^https?:\/\//, '').replace(/\/$/, '')}/${roomName}`;
  if (!token) return base;
  return `${base}?t=${encodeURIComponent(token)}`;
}

export function dailyRoomNameForBooking(bookingId: string): string {
  const compact = bookingId.replace(/-/g, '').toLowerCase();
  return `emz-${compact.slice(0, 32)}`;
}

export function normalizeServiceMeetingPlatform(
  raw: string | null | undefined
): 'daily' | 'zoom' | 'google_meet' | 'custom' | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase().replace(/-/g, '_');
  if (value === 'daily' || value === 'emarzona' || value === 'emarzona_visio') return 'daily';
  if (value === 'zoom') return 'zoom';
  if (value === 'google_meet' || value === 'googlemeet' || value === 'meet') return 'google_meet';
  if (value === 'custom') return 'custom';
  return null;
}

export function resolveServiceMeetingPlatform(input: {
  requested?: string | null;
  preferred?: string | null;
  dailyConfigured: boolean;
}): 'daily' | 'zoom' | 'google_meet' | 'custom' {
  const requested = normalizeServiceMeetingPlatform(input.requested);
  const preferred = normalizeServiceMeetingPlatform(input.preferred);

  if (requested && requested !== 'custom') {
    if (requested === 'daily' && !input.dailyConfigured) return 'zoom';
    return requested;
  }

  if (input.dailyConfigured) return 'daily';
  if (preferred === 'zoom' || preferred === 'google_meet') return preferred;
  return 'zoom';
}

/** Wall time `YYYY-MM-DD` + `HH:MM[:SS]` in an IANA zone → UTC Date. Keep in sync with src/lib/service/daily-meeting.ts. */
export function zonedLocalDateTimeToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string
): Date {
  const date = String(dateStr || '').slice(0, 10);
  const timeMatch = String(timeStr || '').match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !timeMatch) {
    const fallback = new Date(`${date}T${String(timeStr || '00:00:00').slice(0, 8)}Z`);
    return Number.isFinite(fallback.getTime()) ? fallback : new Date(NaN);
  }

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] || 0);
  const tz = timeZone?.trim() || 'UTC';
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

  const wallAsUtcMs = (ms: number, zone: string): number => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(new Date(ms));
      const get = (type: string) => Number(parts.find(part => part.type === type)?.value ?? '0');
      return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    } catch {
      return ms;
    }
  };

  const zoned = wallAsUtcMs(utcGuess, tz);
  const adjusted = utcGuess - (zoned - utcGuess);
  const zonedAgain = wallAsUtcMs(adjusted, tz);
  return new Date(adjusted - (zonedAgain - utcGuess));
}

export function isDailyMeetingLink(
  meetingUrl?: string | null,
  meetingPlatform?: string | null
): boolean {
  const platform = String(meetingPlatform || '').toLowerCase();
  if (platform === 'daily') return true;
  return Boolean(meetingUrl && /daily\.co/i.test(meetingUrl));
}

export function resolveServiceBookingEmailJoinUrl(input: {
  meetingUrl?: string | null;
  meetingPlatform?: string | null;
  portalUrl: string;
}): string {
  const url = input.meetingUrl?.trim() || '';
  if (!url || isDailyMeetingLink(url, input.meetingPlatform)) {
    return input.portalUrl.replace(/\/$/, '');
  }
  return url;
}

export function isDailyConfigured(): boolean {
  return Boolean(Deno.env.get('DAILY_API_KEY')?.trim()) && Boolean(parseDailyDomain(Deno.env.get('DAILY_DOMAIN')));
}

function apiKey(): string {
  const key = Deno.env.get('DAILY_API_KEY')?.trim();
  if (!key) throw new Error('DAILY_API_KEY is not configured');
  return key;
}

function domain(): DailyDomain {
  const parsed = parseDailyDomain(Deno.env.get('DAILY_DOMAIN'));
  if (!parsed) throw new Error('DAILY_DOMAIN is not configured');
  return parsed;
}

async function dailyFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${DAILY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Daily API ${path} failed (${res.status}): ${text.slice(0, 400)}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export async function createDailyMeetingToken(opts: {
  roomName: string;
  isOwner: boolean;
  userName: string;
  nbf: number;
  exp: number;
}): Promise<string> {
  const data = await dailyFetch<{ token: string }>('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        room_name: opts.roomName,
        is_owner: opts.isOwner,
        user_name: opts.userName.slice(0, 80),
        nbf: opts.nbf,
        exp: opts.exp,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });
  if (!data.token) throw new Error('Daily meeting token missing');
  return data.token;
}

export type DailyBookingRoom = {
  roomName: string;
  roomUrl: string;
  guestUrl: string;
  hostUrl: string;
  nbf: number;
  exp: number;
};

export async function createDailyBookingRoom(opts: {
  bookingId: string;
  topic: string;
  startAt: Date;
  endAt: Date;
  maxParticipants: number;
  guestName?: string;
  hostName?: string;
}): Promise<DailyBookingRoom> {
  const { host } = domain();
  const roomName = dailyRoomNameForBooking(opts.bookingId);
  const startMs = opts.startAt.getTime();
  const endMs = opts.endAt.getTime();
  const nbf = Math.floor((Number.isFinite(startMs) ? startMs : Date.now()) / 1000) - 15 * 60;
  const exp = Math.floor((Number.isFinite(endMs) ? endMs : Date.now() + 60 * 60 * 1000) / 1000) + 60 * 60;
  const maxParticipants = Math.min(50, Math.max(2, Math.round(opts.maxParticipants) || 2));

  try {
    await dailyFetch('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          exp,
          nbf,
          max_participants: maxParticipants,
          enable_chat: true,
          enable_screenshare: true,
          enable_knocking: false,
          enable_prejoin_ui: true,
          start_video_off: false,
          eject_at_room_exp: true,
          lang: 'fr',
        },
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/already exists|409/i.test(message)) throw err;
  }

  const [guestToken, hostToken] = await Promise.all([
    createDailyMeetingToken({
      roomName,
      isOwner: false,
      userName: opts.guestName || 'Client',
      nbf,
      exp,
    }),
    createDailyMeetingToken({
      roomName,
      isOwner: true,
      userName: opts.hostName || 'Prestataire',
      nbf,
      exp,
    }),
  ]);

  return {
    roomName,
    roomUrl: buildDailyRoomUrl(host, roomName),
    guestUrl: buildDailyRoomUrl(host, roomName, guestToken),
    hostUrl: buildDailyRoomUrl(host, roomName, hostToken),
    nbf,
    exp,
  };
}

export async function mintDailyJoinUrl(opts: {
  roomName: string;
  isOwner: boolean;
  userName: string;
  nbf?: number;
  exp?: number;
}): Promise<string> {
  const { host } = domain();
  const now = Math.floor(Date.now() / 1000);
  const token = await createDailyMeetingToken({
    roomName: opts.roomName,
    isOwner: opts.isOwner,
    userName: opts.userName,
    nbf: opts.nbf ?? now - 60,
    exp: opts.exp ?? now + 4 * 60 * 60,
  });
  return buildDailyRoomUrl(host, opts.roomName, token);
}
