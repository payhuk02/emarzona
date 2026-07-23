/**
 * Client Upstash Redis REST pour les Edge Functions Supabase (Mutex & Rate Limiting)
 */

export async function upstashSetNx(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<boolean> {
  const restUrl = Deno.env.get('UPSTASH_REDIS_REST_URL') || Deno.env.get('KV_REST_API_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || Deno.env.get('KV_REST_API_TOKEN');

  if (!restUrl || !token) {
    console.warn('UPSTASH_REDIS_REST_URL or TOKEN is missing. Mutex is bypassed.');
    return true; // Bypass lock in dev if no redis
  }

  try {
    const res = await fetch(restUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', key, value, 'NX', 'EX', ttlSeconds]),
    });

    if (!res.ok) {
      console.error('Redis Mutex HTTP error — fail-open to avoid blocking paid webhooks', res.status);
      return true;
    }

    const data = await res.json();
    if (data.error) {
      console.error('Redis Mutex API error — fail-open', data.error);
      return true;
    }
    return data.result === 'OK';
  } catch (err) {
    console.error('Redis Mutex error — fail-open', err);
    return true;
  }
}

/**
 * Incrémente un compteur Redis et définit son TTL en une seule opération atomique (pipeline)
 */
export async function upstashIncrWithTtl(
  key: string,
  ttlSeconds: number
): Promise<number> {
  const restUrl = Deno.env.get('UPSTASH_REDIS_REST_URL') || Deno.env.get('KV_REST_API_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || Deno.env.get('KV_REST_API_TOKEN');

  if (!restUrl || !token) {
    return 0; // En dev, si Redis n'est pas configuré, on ne bloque pas
  }

  try {
    const res = await fetch(`${restUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, ttlSeconds],
      ]),
    });

    if (!res.ok) return 0;

    const data = await res.json() as Array<{ result?: number }>;
    const count = data?.[0]?.result;
    return typeof count === 'number' ? count : 0;
  } catch (err) {
    console.error('Redis INCR pipeline error:', err);
    return 0;
  }
}

/**
 * Vérifie et applique le rate limit via Upstash Redis
 */
export async function isRateLimited(
  identifier: string,
  endpoint: string,
  maxRequests = 30,
  windowSeconds = 60
): Promise<{ allowed: boolean; count: number }> {
  const restUrl = Deno.env.get('UPSTASH_REDIS_REST_URL') || Deno.env.get('KV_REST_API_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || Deno.env.get('KV_REST_API_TOKEN');

  if (!restUrl || !token) {
    // Si Upstash n'est pas configuré, on bypass le rate limiting (comportement dev/fallback)
    return { allowed: true, count: 0 };
  }

  const key = `rate_limit:${endpoint}:${identifier}`;
  const count = await upstashIncrWithTtl(key, windowSeconds);

  if (count === 0) {
    // Si l'incrémentation échoue ou renvoie 0, on autorise l'action par précaution
    return { allowed: true, count: 1 };
  }

  return {
    allowed: count <= maxRequests,
    count,
  };
}
