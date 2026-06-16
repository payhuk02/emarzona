/**
 * GET /api/cache/health — État santé cache (Redis, métriques).
 */

async function redisPing(config) {
  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['PING']),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.result === 'PONG';
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  if (!url || !token) return null;
  return { url, token };
}

export default async function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const config = getRedisConfig();
  let redis = { status: 'unconfigured', latencyMs: null };

  if (config) {
    const t0 = Date.now();
    const ok = await redisPing(config);
    redis = {
      status: ok ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - t0,
    };
  }

  const health = {
    status: redis.status === 'healthy' ? 'ok' : redis.status === 'unconfigured' ? 'degraded' : 'error',
    layers: {
      redis,
      cdn: { status: 'edge', provider: 'cloudflare+vercel' },
      browser: { status: 'client-managed' },
      reactQuery: { status: 'client-managed' },
      serviceWorker: { status: 'active-on-prod' },
    },
    invalidationSecretConfigured: Boolean(process.env.CACHE_INVALIDATION_SECRET),
    buildId: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    timestamp: new Date().toISOString(),
  };

  const statusCode = health.status === 'error' ? 503 : 200;
  return res.status(statusCode).json(health);
}
