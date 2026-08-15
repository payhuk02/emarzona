/**
 * Client-side platform visitor tracking (pages, device, geo, duration).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { withTimeoutFallback } from '@/lib/promise-timeout';

const VISITOR_TRACK_TIMEOUT_MS = 5000;

const SESSION_KEY = 'emarzona_platform_visitor_session';
const SESSION_TTL_MS = 30 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 120_000;
const EXCLUDED_PATH_PREFIXES = ['/admin', '/api', '/auth/callback'];
const EXCLUDED_EXACT_PATHS = new Set([
  '/login',
  '/register',
  '/connexion',
  '/auth',
  '/auth/login',
  '/auth/register',
]);

export type PlatformVisitorEventType = 'page_view' | 'session_heartbeat' | 'session_end';

type SessionState = {
  sessionId: string;
  startedAt: number;
  lastActivityAt: number;
  accumulatedMs: number;
  lastFlushAt: number;
};

type DeviceInfo = {
  device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser: string;
  os: string;
  user_agent: string;
  language: string;
  timezone: string;
};

type GeoInfo = {
  country: string;
  region: string | null;
  city: string | null;
};

type TrackPayload = {
  event_type: PlatformVisitorEventType;
  page_path: string;
  page_url?: string;
  referrer?: string | null;
  duration_ms?: number;
  user_id?: string | null;
  event_data?: Record<string, unknown>;
};

const TIMEZONE_COUNTRY: Record<string, { country: string; region?: string }> = {
  'Africa/Ouagadougou': { country: 'Burkina Faso', region: 'Centre' },
  'Africa/Abidjan': { country: "Côte d'Ivoire", region: 'Abidjan' },
  'Africa/Bamako': { country: 'Mali' },
  'Africa/Dakar': { country: 'Sénégal', region: 'Dakar' },
  'Africa/Lome': { country: 'Togo' },
  'Africa/Porto-Novo': { country: 'Bénin' },
  'Africa/Lagos': { country: 'Nigeria' },
  'Africa/Accra': { country: 'Ghana' },
  'Africa/Niamey': { country: 'Niger' },
  'Africa/Conakry': { country: 'Guinée' },
  'Africa/Douala': { country: 'Cameroun' },
  'Africa/Libreville': { country: 'Gabon' },
  'Africa/Kinshasa': { country: 'RD Congo' },
  'Africa/Brazzaville': { country: 'Congo' },
  'Africa/Casablanca': { country: 'Maroc' },
  'Africa/Algiers': { country: 'Algérie' },
  'Africa/Tunis': { country: 'Tunisie' },
  'Europe/Paris': { country: 'France', region: 'Île-de-France' },
  'Europe/Brussels': { country: 'Belgique' },
  'Europe/London': { country: 'Royaume-Uni' },
  'America/New_York': { country: 'États-Unis', region: 'East' },
  'America/Toronto': { country: 'Canada' },
  UTC: { country: 'Inconnu' },
};

const LANG_COUNTRY: Record<string, string> = {
  BF: 'Burkina Faso',
  CI: "Côte d'Ivoire",
  SN: 'Sénégal',
  ML: 'Mali',
  TG: 'Togo',
  BJ: 'Bénin',
  NE: 'Niger',
  GN: 'Guinée',
  CM: 'Cameroun',
  GA: 'Gabon',
  CD: 'RD Congo',
  CG: 'Congo',
  NG: 'Nigeria',
  GH: 'Ghana',
  MA: 'Maroc',
  DZ: 'Algérie',
  TN: 'Tunisie',
  FR: 'France',
  BE: 'Belgique',
  CA: 'Canada',
  US: 'États-Unis',
  GB: 'Royaume-Uni',
};

function now() {
  return Date.now();
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `pvs_${crypto.randomUUID()}`;
  }
  return `pvs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readSession(): SessionState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SessionState;
      if (parsed?.sessionId && now() - parsed.lastActivityAt < SESSION_TTL_MS) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  const fresh: SessionState = {
    sessionId: createSessionId(),
    startedAt: now(),
    lastActivityAt: now(),
    accumulatedMs: 0,
    lastFlushAt: now(),
  };
  writeSession(fresh);
  return fresh;
}

function writeSession(state: SessionState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function shouldTrackPath(pathname: string): boolean {
  if (EXCLUDED_EXACT_PATHS.has(pathname)) return false;
  return !EXCLUDED_PATH_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function sanitizePageUrl(href: string): string {
  try {
    const url = new URL(href);
    const sensitive = ['token', 'access_token', 'refresh_token', 'code', 'password', 'key'];
    for (const key of [...url.searchParams.keys()]) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        url.searchParams.delete(key);
      }
    }
    return `${url.origin}${url.pathname}${url.search}`;
  } catch {
    return href.split('?')[0] ?? href;
  }
}

export function detectDeviceInfo(): DeviceInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let device_type: DeviceInfo['device_type'] = 'desktop';
  if (/iPad|Tablet/i.test(ua)) device_type = 'tablet';
  else if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device_type = 'mobile';
  } else if (!ua) device_type = 'unknown';

  let browser = 'Unknown';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/MSIE|Trident\//i.test(ua)) browser = 'Internet Explorer';

  let os = 'Unknown';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  const language =
    typeof navigator !== 'undefined'
      ? navigator.language ||
        (navigator as Navigator & { userLanguage?: string }).userLanguage ||
        'und'
      : 'und';

  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    timezone = 'UTC';
  }

  return { device_type, browser, os, user_agent: ua, language, timezone };
}

export function resolveGeoFromClient(device: DeviceInfo): GeoInfo {
  const tzHit = TIMEZONE_COUNTRY[device.timezone];
  if (tzHit) {
    return { country: tzHit.country, region: tzHit.region ?? null, city: null };
  }

  const langParts = device.language.split('-');
  const regionCode = (langParts[1] || '').toUpperCase();
  if (regionCode && LANG_COUNTRY[regionCode]) {
    return { country: LANG_COUNTRY[regionCode], region: regionCode, city: null };
  }

  if (device.timezone.startsWith('Africa/')) {
    return { country: 'Afrique', region: device.timezone.replace('Africa/', ''), city: null };
  }
  if (device.timezone.startsWith('Europe/')) {
    return { country: 'Europe', region: device.timezone.replace('Europe/', ''), city: null };
  }
  if (device.timezone.startsWith('America/')) {
    return { country: 'Amériques', region: device.timezone.replace('America/', ''), city: null };
  }

  return { country: 'Inconnu', region: device.timezone, city: null };
}

let geoCache: GeoInfo | null = null;
let geoFetchPromise: Promise<GeoInfo> | null = null;

async function enrichGeo(device: DeviceInfo): Promise<GeoInfo> {
  if (geoCache) return geoCache;
  const fallback = resolveGeoFromClient(device);
  if (geoFetchPromise) return geoFetchPromise;

  geoFetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 2500);
      const res = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      window.clearTimeout(timer);
      if (!res.ok) {
        geoCache = fallback;
        return fallback;
      }
      const data = (await res.json()) as {
        country_name?: string;
        region?: string;
        city?: string;
        error?: boolean;
      };
      if (data.error || !data.country_name) {
        geoCache = fallback;
        return fallback;
      }
      geoCache = {
        country: data.country_name,
        region: data.region || null,
        city: data.city || null,
      };
      return geoCache;
    } catch {
      geoCache = fallback;
      return fallback;
    } finally {
      geoFetchPromise = null;
    }
  })();

  return geoFetchPromise;
}

export async function trackPlatformVisitorEvent(payload: TrackPayload): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!shouldTrackPath(payload.page_path)) return;

  const session = readSession();
  session.lastActivityAt = now();
  writeSession(session);

  const device = detectDeviceInfo();
  const geo = await enrichGeo(device);

  const row = {
    session_id: session.sessionId,
    user_id: payload.user_id ?? null,
    event_type: payload.event_type,
    page_path: payload.page_path || '/',
    page_url: payload.page_url ? sanitizePageUrl(payload.page_url) : null,
    referrer:
      payload.referrer ?? (typeof document !== 'undefined' ? document.referrer || null : null),
    country: geo.country,
    region: geo.region,
    city: geo.city,
    timezone: device.timezone,
    language: device.language,
    device_type: device.device_type,
    browser: device.browser,
    os: device.os,
    user_agent: device.user_agent.slice(0, 500),
    duration_ms: Math.max(0, Math.round(payload.duration_ms ?? 0)),
    event_data: payload.event_data ?? {},
  };

  const { error } = await withTimeoutFallback(
    supabase.from('platform_visitor_events').insert(row),
    VISITOR_TRACK_TIMEOUT_MS,
    { error: { message: 'timeout' } },
    'platform_visitor_events_insert'
  );
  if (error) {
    logger.warn('platform visitor track failed', { error: error.message });
  }
}

export function touchSessionActiveMs(deltaMs: number): SessionState {
  const session = readSession();
  session.accumulatedMs += Math.max(0, deltaMs);
  session.lastActivityAt = now();
  writeSession(session);
  return session;
}

export function consumeUnflushedDurationMs(): number {
  const session = readSession();
  const pending = Math.max(0, session.accumulatedMs);
  session.accumulatedMs = 0;
  session.lastFlushAt = now();
  writeSession(session);
  return pending;
}

export { HEARTBEAT_INTERVAL_MS, SESSION_KEY };
