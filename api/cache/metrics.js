/**
 * GET /api/cache/metrics — Métriques cache agrégées (admin).
 */

function checkAuth(req) {
  const secret = process.env.CACHE_INVALIDATION_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') || '';

  if (secret && auth === `Bearer ${secret}`) return true;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  return false;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const config = getRedisConfig();
  let redisInfo = { connected: false, keyCount: 0 };

  if (config) {
    const keys = await redisKeys(config, 'emz:v1:*');
    const seoKeys = await redisKeys(config, 'seo:meta:v1:*');
    redisInfo = {
      connected: true,
      appKeys: keys.length,
      seoKeys: seoKeys.length,
      totalKeys: keys.length + seoKeys.length,
    };
  }

  return res.status(200).json({
    redis: redisInfo,
    cdn: {
      cacheReserve: 'cloudflare-dashboard',
      edgeCache: 'vercel-edge + cloudflare',
      compression: 'brotli',
    },
    strategies: {
      marketplace: { ttl: 90, swr: 600, sie: 1800 },
      product: { ttl: 120, swr: 600, sie: 3600 },
      seo: { ttl: 600, swr: 1800, sie: 3600 },
      assets: { ttl: 31536000, immutable: true },
    },
    timestamp: new Date().toISOString(),
  });
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  if (!url || !token) return null;
  return { url, token };
}

async function redisKeys(config, pattern) {
  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['KEYS', pattern]),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.result ?? [];
}
