/**
 * Purge Redis Upstash — partagé cache-invalidate / cache-warm edge functions.
 */

const TAG_CASCADE: Record<string, string[]> = {
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
  artist: [
    'artist',
    'artist-collection',
    'auction',
    'products-list',
    'search',
    'marketplace',
    'seo-meta',
  ],
};

function getRedisConfig(): { url: string; token: string } | null {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL') || Deno.env.get('KV_REST_API_URL') || '';
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || Deno.env.get('KV_REST_API_TOKEN') || '';
  if (!url || !token) return null;
  return { url, token };
}

async function redisCommand<T>(
  config: { url: string; token: string },
  command: (string | number)[]
): Promise<T | null> {
  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: T; error?: string };
  if (data.error) return null;
  return data.result ?? null;
}

export function resolveEventTags(table: string, _operation: string): string[] {
  const t = table.toLowerCase();
  if (t === 'products' || t === 'physical_products' || t === 'digital_products') {
    return TAG_CASCADE.product;
  }
  if (t === 'stores') return TAG_CASCADE.store;
  if (t === 'service_products' || t === 'services') return TAG_CASCADE.service;
  if (t === 'courses' || t === 'course_products') return TAG_CASCADE.course;
  if (t === 'artist_products' || t === 'artist_collections') return TAG_CASCADE.artist;
  return TAG_CASCADE.product;
}

export function expandTags(tags: string[]): string[] {
  const expanded = new Set(tags);
  for (const tag of tags) {
    const cascade = TAG_CASCADE[tag];
    if (cascade) cascade.forEach(t => expanded.add(t));
  }
  return [...expanded];
}

export async function purgeRedisByTags(tags: string[]): Promise<number> {
  const config = getRedisConfig();
  if (!config) return 0;

  const tagsToPurge = expandTags(tags);
  const patterns = [
    ...tagsToPurge.map(t => `emz:v1:*${t}*`),
    ...tagsToPurge.map(t => `tag-index:v1:${t}`),
    'seo:meta:v1:*',
  ];

  const seen = new Set<string>();
  let deleted = 0;

  for (const pattern of patterns) {
    const keys = (await redisCommand<string[]>(config, ['KEYS', pattern])) ?? [];
    for (const key of keys) {
      if (seen.has(key)) continue;
      seen.add(key);
      const count = await redisCommand<number>(config, ['DEL', key]);
      deleted += count ?? 0;
    }
  }

  return deleted;
}

/** Debounce 2s — évite tempête d'invalidations sur import massif */
export async function shouldDebounceInvalidate(debounceKey: string): Promise<boolean> {
  const config = getRedisConfig();
  if (!config) return false;

  const key = `cache:debounce:v1:${debounceKey}`;
  const result = await redisCommand<string>(config, ['SET', key, '1', 'EX', '2', 'NX']);
  return result !== 'OK';
}
