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

    if (!res.ok) return false;

    const data = await res.json();
    if (data.error) return false;
    return data.result === 'OK';
  } catch (err) {
    console.error('Redis Mutex error:', err);
    return false;
  }
}
