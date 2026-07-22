/**
 * CORS helpers for Edge Functions.
 * Must allow storefront subdomains (*.myemarzona.shop) used at checkout.
 */

function normalizeDefaultOrigin(): string {
  const raw = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function isAllowedStorefrontOrigin(originHeader: string): boolean {
  if (
    originHeader.startsWith('http://localhost:') ||
    originHeader.startsWith('http://127.0.0.1:')
  ) {
    return true;
  }

  try {
    const host = new URL(originHeader).hostname.toLowerCase();
    return (
      host === 'www.emarzona.com' ||
      host === 'emarzona.com' ||
      host === 'www.myemarzona.shop' ||
      host === 'myemarzona.shop' ||
      host.endsWith('.emarzona.com') ||
      host.endsWith('.myemarzona.shop')
    );
  } catch {
    return false;
  }
}

export function resolveCorsOrigin(originHeader: string | null): string {
  const defaultOrigin = normalizeDefaultOrigin();
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || defaultOrigin)
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  if (!originHeader) return defaultOrigin;

  if (allowed.includes(originHeader) || isAllowedStorefrontOrigin(originHeader)) {
    return originHeader;
  }

  return defaultOrigin;
}

export function buildCorsHeaders(originHeader: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, stripe-signature, x-checkout-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

export function jsonResponse(body: unknown, status: number, originHeader: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCorsHeaders(originHeader), 'Content-Type': 'application/json' },
  });
}
