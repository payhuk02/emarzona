export function resolveCorsOrigin(originHeader: string | null): string {
  const defaultOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || defaultOrigin)
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  if (!originHeader) return defaultOrigin;
  return allowed.includes(originHeader) ? originHeader : defaultOrigin;
}

export function buildCorsHeaders(originHeader: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}

export function jsonResponse(body: unknown, status: number, originHeader: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCorsHeaders(originHeader), 'Content-Type': 'application/json' },
  });
}
