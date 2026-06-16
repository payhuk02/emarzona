/**
 * POST /api/cache/invalidate — Purge Redis par tags (server-side).
 * Auth: Bearer CACHE_INVALIDATION_SECRET
 */

const TAG_CASCADE = {
  product: [
    'product',
    'products-list',
    'product-detail',
    'store',
    'category',
    'search',
    'facets',
    'recommendations',
    'homepage',
    'marketplace',
    'seo-meta',
  ],
  store: ['store', 'store-detail', 'products-list', 'homepage', 'marketplace', 'seo-meta'],
  service: ['service', 'products-list', 'search', 'facets', 'marketplace', 'seo-meta'],
  course: ['course', 'products-list', 'search', 'facets', 'marketplace', 'seo-meta'],
  artist: ['artist', 'artist-collection', 'auction', 'products-list', 'search', 'marketplace', 'seo-meta'],
};

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

async function redisDel(config, key) {
  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['DEL', key]),
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.result ?? 0;
}

function expandTags(tags) {
  const expanded = new Set(tags);
  for (const tag of tags) {
    const cascade = TAG_CASCADE[tag];
    if (cascade) cascade.forEach(t => expanded.add(t));
  }
  return [...expanded];
}

function checkAuth(req) {
  const secret = process.env.CACHE_INVALIDATION_SECRET;
  if (!secret) return { ok: false, reason: 'CACHE_INVALIDATION_SECRET not configured' };
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${secret}`) return { ok: false, reason: 'Unauthorized' };
  return { ok: true };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = checkAuth(req);
  if (!auth.ok) {
    return res.status(auth.reason === 'Unauthorized' ? 401 : 503).json({ error: auth.reason });
  }

  const { tags = [], event } = req.body ?? {};
  let tagsToPurge = [...tags];

  if (event && TAG_CASCADE[event.replace(':mutation', '')]) {
    const base = event.replace(':mutation', '');
    tagsToPurge = TAG_CASCADE[base] ?? tagsToPurge;
  }

  tagsToPurge = expandTags(tagsToPurge);
  const config = getRedisConfig();

  if (!config) {
    return res.status(200).json({
      deleted: 0,
      tags: tagsToPurge,
      redis: 'unavailable',
      message: 'Redis not configured — client-side invalidation only',
    });
  }

  let deleted = 0;
  const patterns = [
    ...tagsToPurge.map(t => `emz:v1:*${t}*`),
    ...tagsToPurge.map(t => `tag-index:v1:${t}`),
    'seo:meta:v1:*',
  ];

  const seen = new Set();
  for (const pattern of patterns) {
    const keys = await redisKeys(config, pattern);
    for (const key of keys) {
      if (!seen.has(key)) {
        seen.add(key);
        deleted += await redisDel(config, key);
      }
    }
  }

  return res.status(200).json({
    deleted,
    tags: tagsToPurge,
    redis: 'ok',
    timestamp: new Date().toISOString(),
  });
}
