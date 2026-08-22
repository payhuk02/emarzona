export type ServiceMeetingPlatform = 'daily' | 'zoom' | 'google_meet' | 'custom';

export type DailyDomain = {
  subdomain: string;
  host: string;
};

const DAILY_HOST_SUFFIX = '.daily.co';

/** Accepts `emarzona`, `emarzona.daily.co`, or `https://emarzona.daily.co`. */
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
): ServiceMeetingPlatform | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase().replace(/-/g, '_');
  if (value === 'daily' || value === 'emarzona' || value === 'emarzona_visio') return 'daily';
  if (value === 'zoom') return 'zoom';
  if (value === 'google_meet' || value === 'googlemeet' || value === 'meet') return 'google_meet';
  if (value === 'custom') return 'custom';
  return null;
}

/**
 * Platform visio: Daily (Emarzona) by default, Zoom/Meet only if explicitly requested.
 */
export function resolveServiceMeetingPlatform(input: {
  requested?: string | null;
  preferred?: string | null;
  dailyConfigured: boolean;
}): ServiceMeetingPlatform {
  const requested = normalizeServiceMeetingPlatform(input.requested);
  const preferred = normalizeServiceMeetingPlatform(input.preferred);

  if (requested && requested !== 'custom') {
    if (requested === 'daily' && !input.dailyConfigured) return 'zoom';
    return requested;
  }

  // Visio plateforme = Daily dès que la clé est présente.
  // L’ancienne pref Zoom/Meet (CHECK SQL) ne doit pas l’écraser.
  if (input.dailyConfigured) return 'daily';
  if (preferred === 'zoom' || preferred === 'google_meet') return preferred;
  return 'zoom';
}

/** Wall time `YYYY-MM-DD` + `HH:MM[:SS]` in an IANA zone → UTC Date. */
export function zonedLocalDateTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
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
      return Date.UTC(
        get('year'),
        get('month') - 1,
        get('day'),
        get('hour'),
        get('minute'),
        get('second')
      );
    } catch {
      return ms;
    }
  };

  const zoned = wallAsUtcMs(utcGuess, tz);
  const adjusted = utcGuess - (zoned - utcGuess);
  const zonedAgain = wallAsUtcMs(adjusted, tz);
  return new Date(adjusted - (zonedAgain - utcGuess));
}

export function canShowServiceMeetingJoin(input: {
  meetingUrl?: string | null;
  meetingPlatform?: string | null;
  locationType?: string | null;
  status?: string | null;
}): boolean {
  if (input.status === 'cancelled' || input.status === 'no_show') return false;
  const hasJoinTarget = Boolean(
    input.meetingUrl || input.meetingPlatform === 'daily' || input.locationType === 'online'
  );
  if (!hasJoinTarget) return false;
  if (input.status === 'pending') return Boolean(input.meetingUrl);
  return true;
}

export function isDailyMeetingLink(
  meetingUrl?: string | null,
  meetingPlatform?: string | null
): boolean {
  const platform = String(meetingPlatform || '').toLowerCase();
  if (platform === 'daily') return true;
  return Boolean(meetingUrl && /daily\.co/i.test(meetingUrl));
}

/** Daily tokens are nbf-gated; e-mails should send the bookings portal so join remints. */
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
