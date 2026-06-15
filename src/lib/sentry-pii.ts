/**
 * Epic 4.8 — Redaction PII avant envoi Sentry (SOC2 / RGPD)
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._-]+/gi;
const API_KEY_RE = /pk_live_[a-f0-9]+/gi;

function redactString(value: string): string {
  return value
    .replace(EMAIL_RE, '[email-redacted]')
    .replace(BEARER_RE, 'Bearer [redacted]')
    .replace(API_KEY_RE, 'pk_live_[redacted]')
    .replace(PHONE_RE, '[phone-redacted]');
}

function scrubValue(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map(scrubValue);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const key = k.toLowerCase();
      if (
        key.includes('password') ||
        key.includes('secret') ||
        key.includes('token') ||
        key.includes('api_key') ||
        key === 'authorization' ||
        key === 'cookie'
      ) {
        out[k] = '[redacted]';
      } else if (key === 'email' || key.endsWith('_email')) {
        out[k] = '[email-redacted]';
      } else if (key === 'ip_address' || key === 'ip') {
        out[k] = '[ip-redacted]';
      } else {
        out[k] = scrubValue(v);
      }
    }
    return out;
  }
  return value;
}

/** Sanitize a Sentry event payload before transmission. */
export function sanitizeSentryEvent<T extends Record<string, unknown>>(event: T): T {
  const copy = { ...event };

  if (copy.user && typeof copy.user === 'object') {
    const user = { ...(copy.user as Record<string, unknown>) };
    if (user.email) user.email = '[email-redacted]';
    if (user.ip_address) user.ip_address = '[ip-redacted]';
    if (user.username && typeof user.username === 'string' && user.username.includes('@')) {
      user.username = '[email-redacted]';
    }
    copy.user = user;
  }

  if (copy.request && typeof copy.request === 'object') {
    const req = { ...(copy.request as Record<string, unknown>) };
    if (req.headers && typeof req.headers === 'object') {
      req.headers = scrubValue(req.headers);
    }
    if (typeof req.url === 'string') req.url = redactString(req.url);
    copy.request = req;
  }

  if (Array.isArray(copy.breadcrumbs)) {
    copy.breadcrumbs = copy.breadcrumbs.map(b => {
      if (!b || typeof b !== 'object') return b;
      const crumb = { ...(b as Record<string, unknown>) };
      if (typeof crumb.message === 'string') crumb.message = redactString(crumb.message);
      if (crumb.data) crumb.data = scrubValue(crumb.data);
      return crumb;
    });
  }

  if (copy.exception && typeof copy.exception === 'object') {
    const ex = copy.exception as { values?: Array<{ value?: string }> };
    if (Array.isArray(ex.values)) {
      ex.values = ex.values.map(v => ({
        ...v,
        value: typeof v.value === 'string' ? redactString(v.value) : v.value,
      }));
    }
  }

  if (copy.extra) copy.extra = scrubValue(copy.extra);
  if (copy.contexts) copy.contexts = scrubValue(copy.contexts);

  return copy;
}
