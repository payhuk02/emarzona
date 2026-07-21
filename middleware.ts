/**
 * Vercel Edge Middleware - Prerendering pour bots
 *
 * Epic 4.1 : cache distribue Upstash Redis + rate-limit bots
 * Epic 4.2 : SEO meta pour domaines personnalises vendeurs
 */

import {
  BOT_RATE_LIMIT_PER_MINUTE,
  BOT_RATE_WINDOW_SECONDS,
  META_CACHE_TTL_SECONDS,
  buildBotRateLimitKey,
  buildMetaCacheKey,
  isLikelyCustomStoreHost,
  isStoreWildcardHost,
  parseCachedMeta,
  serializeCachedMeta,
  type CachedMetaPayload,
} from './src/lib/middleware/meta-cache';
import { upstashGet, upstashIncrWithTtl, upstashSetEx } from './src/lib/middleware/upstash-redis';
import {
  applyCspResponseHeaders,
  generateCspNonce,
  injectScriptNonces,
} from './src/lib/middleware/csp-policy';
import {
  AUTH_ROUTE_RATE_LIMIT_PER_MINUTE,
  AUTH_ROUTE_RATE_WINDOW_SECONDS,
  buildAuthRouteRateLimitKey,
  isAuthRateLimitPath,
} from './src/lib/middleware/auth-route-rate-limit';

export const config = {
  matcher: '/((?!_next|assets|.*\\..*).*)',
};

const BOT_REGEX =
  /(googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot|pinterest|redditbot|applebot|gptbot|claudebot|perplexitybot|google-extended|chatgpt-user|oai-searchbot)/i;

const SUPABASE_URL =
  globalThis.process?.env?.VITE_SUPABASE_URL || globalThis.process?.env?.SUPABASE_URL || '';
const SITE = 'https://www.emarzona.com';
const STORE_DOMAIN = 'myemarzona.shop';

/**
 * 🔒 SECURITY: Validate and sanitize slugs before PostgREST filter interpolation.
 * Prevents filter injection via URL path segments.
 */
function sanitizeSlug(raw: string): string | null {
  // Allow only lowercase alphanumeric + hyphens, max 100 chars
  const slug = decodeURIComponent(raw).toLowerCase().trim();
  if (!slug || slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return null;
  }
  return slug;
}

interface Meta {
  title: string;
  description: string;
  image: string;
  url: string;
  type: 'website' | 'product' | 'profile';
  price?: number;
  currency?: string;
}

const DEFAULT_META: Meta = {
  title: 'Emarzona — Vendez tout. Gérez tout. Sans limites.',
  description:
    "Plateforme e-commerce premium : produits digitaux, physiques, services, cours et œuvres d'artiste. Paiements sécurisés, marketing intégré, marketplace Afrique.",
  image: `${SITE}/og-image.png`,
  url: SITE,
  type: 'website',
};

function getAuthHeaders() {
  const anonKey =
    globalThis.process?.env?.SUPABASE_ANON_KEY || globalThis.process?.env?.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    console.error('[Middleware] Missing SUPABASE_ANON_KEY environment variable.');
  }
  return {
    apikey: anonKey || '',
    Authorization: `Bearer ${anonKey || ''}`,
  };
}

async function fetchStoreRowByCustomDomain(host: string): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_store_by_custom_domain`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_domain: host }),
    });
    const data = await r.json();
    const s = Array.isArray(data) ? data[0] : data;
    return s ?? null;
  } catch {
    return null;
  }
}

async function fetchProductMeta(slug: string, storeId?: string): Promise<Meta | null> {
  try {
    const safeSlug = sanitizeSlug(slug);
    if (!safeSlug) return null;
    const filter = storeId ? `slug=eq.${safeSlug}&store_id=eq.${storeId}` : `slug=eq.${safeSlug}`;
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/products?${filter}&select=name,description,image_url,price,currency,meta_title,meta_description,slug&is_active=eq.true&limit=1`,
      {
        headers: getAuthHeaders(),
      }
    );
    const data = await r.json();
    const p = data?.[0];
    if (!p) return null;
    return {
      title: p.meta_title || `${p.name} | Emarzona`,
      description: (p.meta_description || p.description || '').slice(0, 160),
      image: p.image_url || DEFAULT_META.image,
      url: '',
      type: 'product',
      price: p.price,
      currency: p.currency,
    };
  } catch {
    return null;
  }
}

async function fetchStoreMeta(slugOrSubdomain: string): Promise<Meta | null> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/stores?or=(subdomain.eq.${sanitizeSlug(slugOrSubdomain) ?? ''},slug.eq.${sanitizeSlug(slugOrSubdomain) ?? ''})&select=name,description,about,logo_url,meta_title,meta_description,slug,subdomain&is_active=eq.true&limit=1`,
      {
        headers: getAuthHeaders(),
      }
    );
    const data = await r.json();
    const s = data?.[0];
    if (!s) return null;
    return {
      title: s.meta_title || `${s.name} | Emarzona`,
      description: (s.meta_description || s.description || s.about || '').slice(0, 160),
      image: s.logo_url || DEFAULT_META.image,
      url: '',
      type: 'profile',
    };
  } catch {
    return null;
  }
}

async function fetchCollectionMeta(slug: string): Promise<Meta | null> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/artist_collections?collection_slug=eq.${sanitizeSlug(slug) ?? ''}&select=collection_name,collection_description,cover_image_url&is_public=eq.true&limit=1`,
      {
        headers: getAuthHeaders(),
      }
    );
    const data = await r.json();
    const c = data?.[0];
    if (!c) return null;
    return {
      title: `${c.collection_name} | Collection Emarzona`,
      description: (c.collection_description || '').slice(0, 160),
      image: c.cover_image_url || DEFAULT_META.image,
      url: '',
      type: 'website',
    };
  } catch {
    return null;
  }
}

async function fetchAuctionMeta(slug: string): Promise<Meta | null> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/artist_product_auctions?auction_slug=eq.${sanitizeSlug(slug) ?? ''}&select=auction_title,auction_description,current_bid,artist_products(products(image_url))&limit=1`,
      {
        headers: getAuthHeaders(),
      }
    );
    const data = await r.json();
    const a = data?.[0];
    if (!a) return null;

    const image = a.artist_products?.products?.image_url || DEFAULT_META.image;

    return {
      title: `${a.auction_title} | Enchère Emarzona`,
      description: (a.auction_description || '').slice(0, 160),
      image: image,
      url: '',
      type: 'product',
      price: a.current_bid,
      currency: 'XOF',
    };
  } catch {
    return null;
  }
}

const TYPE_SEO_LABELS: Record<string, string> = {
  digital: 'Produits digitaux',
  physical: 'Produits physiques',
  service: 'Services',
  course: 'Cours en ligne',
  artist: "Œuvres d'artistes",
};

function buildMarketplaceBotMeta(searchParams: URLSearchParams, site: string): Meta {
  const q = searchParams.get('q')?.trim();
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const qs = searchParams.toString();
  const url = `${site}/marketplace${qs ? `?${qs}` : ''}`;

  if (q) {
    return {
      title: `Recherche « ${q} » | Marketplace Emarzona`,
      description: `Résultats marketplace pour « ${q} » — produits digitaux, physiques, services, cours et art sur Emarzona.`,
      image: `${site}/og-marketplace.jpg`,
      url,
      type: 'website',
    };
  }

  const typeLabel = type && type !== 'all' ? TYPE_SEO_LABELS[type] : null;
  const categoryLabel =
    category && category !== 'all'
      ? category === 'featured'
        ? 'En vedette'
        : category.replace(/[-_]/g, ' ')
      : null;

  if (typeLabel && categoryLabel) {
    return {
      title: `${typeLabel} — ${categoryLabel} | Marketplace Emarzona`,
      description: `Parcourez les ${typeLabel.toLowerCase()} dans la catégorie ${categoryLabel} sur Emarzona.`,
      image: `${site}/og-marketplace.jpg`,
      url,
      type: 'website',
    };
  }

  if (typeLabel) {
    return {
      title: `${typeLabel} | Marketplace Emarzona`,
      description: `Découvrez nos ${typeLabel.toLowerCase()} sur le marketplace Emarzona. Paiement sécurisé.`,
      image: `${site}/og-marketplace.jpg`,
      url,
      type: 'website',
    };
  }

  if (categoryLabel) {
    return {
      title: `${categoryLabel} | Marketplace Emarzona`,
      description: `Produits et services dans la catégorie ${categoryLabel} sur Emarzona.`,
      image: `${site}/og-marketplace.jpg`,
      url,
      type: 'website',
    };
  }

  return {
    title: 'Marketplace Emarzona',
    description:
      "Découvrez des milliers de produits digitaux, physiques, services, cours en ligne et œuvres d'artistes sur Emarzona. Marketplace sécurisée.",
    image: `${site}/og-marketplace.jpg`,
    url,
    type: 'website',
  };
}

async function resolveMeta(req: Request): Promise<Meta> {
  const url = new URL(req.url);
  const host = (req.headers.get('host') || '').toLowerCase();
  const path = url.pathname;

  if (path === '/marketplace' || path.startsWith('/marketplace/')) {
    return buildMarketplaceBotMeta(url.searchParams, SITE);
  }

  if (path === '/pricing') {
    return {
      title: 'Tarifs | Emarzona',
      description:
        'Découvrez les plans et tarifs Emarzona : abonnements produits physiques et commission 10 % sur digital, services, cours et art.',
      image: DEFAULT_META.image,
      url: `${SITE}/pricing`,
      type: 'website',
    };
  }

  // Domaine personnalise vendeur (hors emarzona.com / *.myemarzona.shop)
  if (isLikelyCustomStoreHost(host, STORE_DOMAIN)) {
    const storeRow = await fetchStoreRowByCustomDomain(host);
    const productMatchCustom = path.match(/^\/products\/([^/]+)/);
    if (productMatchCustom && storeRow?.id) {
      const m = await fetchProductMeta(productMatchCustom[1], String(storeRow.id));
      if (m) {
        m.url = `https://${host}${path}`;
        return m;
      }
    }
    if (storeRow) {
      return {
        title: (storeRow.meta_title as string) || `${storeRow.name as string} | Emarzona`,
        description: String(
          storeRow.meta_description || storeRow.description || storeRow.about || ''
        ).slice(0, 160),
        image: (storeRow.logo_url as string) || DEFAULT_META.image,
        url: `https://${host}${path}`,
        type: 'profile',
      };
    }
  }

  // Sous-domaine boutique : *.myemarzona.shop
  if (isStoreWildcardHost(host, STORE_DOMAIN) && host !== STORE_DOMAIN) {
    const sub = host.replace(`.${STORE_DOMAIN}`, '');
    const productMatch = path.match(/^\/products\/([^/]+)/);
    if (productMatch) {
      const m = await fetchProductMeta(productMatch[1]);
      if (m) {
        m.url = `https://${host}${path}`;
        return m;
      }
    }
    const storeMeta = await fetchStoreMeta(sub);
    if (storeMeta) {
      storeMeta.url = `https://${host}${path}`;
      return storeMeta;
    }
  }

  // emarzona.com routes (products, courses, digital, etc.)
  const productMatch = path.match(
    /^\/(?:product|digital|physical|service|artist|courses|learn)\/([^/]+)/
  );
  if (productMatch) {
    const m = await fetchProductMeta(productMatch[1]);
    if (m) {
      m.url = `${SITE}${path}`;
      return m;
    }
  }

  // Collections
  const collectionMatch = path.match(/^\/collections\/([^/]+)/);
  if (collectionMatch) {
    const m = await fetchCollectionMeta(collectionMatch[1]);
    if (m) {
      m.url = `${SITE}${path}`;
      return m;
    }
  }

  // Auctions
  const auctionMatch = path.match(/^\/auctions\/([^/]+)/);
  if (auctionMatch) {
    const m = await fetchAuctionMeta(auctionMatch[1]);
    if (m) {
      m.url = `${SITE}${path}`;
      return m;
    }
  }

  // Stores and Portfolios
  const storeMatch = path.match(/^\/(?:store|portfolio)\/([^/]+)/);
  if (storeMatch) {
    const m = await fetchStoreMeta(storeMatch[1]);
    if (m) {
      m.url = `${SITE}${path}`;
      return m;
    }
  }

  return { ...DEFAULT_META, url: `https://${host || 'emarzona.com'}${path}` };
}

// -- Cache : Upstash Redis (prod) + fallback in-memory (dev/preview) --
interface CacheEntry {
  meta: Meta;
  timestamp: number;
}
const MEMORY_CACHE_TTL_MS = META_CACHE_TTL_SECONDS * 1000;
const MAX_MEMORY_CACHE_SIZE = 500;
const memoryCache = new Map<string, CacheEntry>();

function getUpstashConfig(): { url: string; token: string } | null {
  const url =
    globalThis.process?.env?.UPSTASH_REDIS_REST_URL ||
    globalThis.process?.env?.KV_REST_API_URL ||
    '';
  const token =
    globalThis.process?.env?.UPSTASH_REDIS_REST_TOKEN ||
    globalThis.process?.env?.KV_REST_API_TOKEN ||
    '';
  if (!url || !token) return null;
  return { url, token };
}

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

async function checkBotRateLimit(req: Request): Promise<boolean> {
  const redis = getUpstashConfig();
  if (!redis) return true;

  const key = buildBotRateLimitKey(getClientIp(req));
  const count = await upstashIncrWithTtl(redis.url, redis.token, key, BOT_RATE_WINDOW_SECONDS);
  return count <= BOT_RATE_LIMIT_PER_MINUTE;
}

async function checkAuthRouteRateLimit(req: Request): Promise<boolean> {
  const redis = getUpstashConfig();
  if (!redis) return true;

  const ip = getClientIp(req);
  const key = buildAuthRouteRateLimitKey(ip);
  const count = await upstashIncrWithTtl(
    redis.url,
    redis.token,
    key,
    AUTH_ROUTE_RATE_WINDOW_SECONDS
  );
  return count <= AUTH_ROUTE_RATE_LIMIT_PER_MINUTE;
}

async function checkApiRateLimit(req: Request): Promise<boolean> {
  const redis = getUpstashConfig();
  if (!redis) return true;

  const ip = getClientIp(req);
  const key = `rate_limit:api:${ip}`;
  const count = await upstashIncrWithTtl(redis.url, redis.token, key, 60);
  return count <= 100;
}

async function readMetaFromCache(
  cacheKey: string
): Promise<{ meta: Meta; source: 'redis' | 'memory' } | null> {
  const redis = getUpstashConfig();
  if (redis) {
    const raw = await upstashGet(redis.url, redis.token, cacheKey);
    const parsed = parseCachedMeta(raw);
    if (parsed) return { meta: parsed.meta as Meta, source: 'redis' };
  }

  const mem = memoryCache.get(cacheKey);
  if (mem && Date.now() - mem.timestamp < MEMORY_CACHE_TTL_MS) {
    return { meta: mem.meta, source: 'memory' };
  }
  return null;
}

async function writeMetaToCache(cacheKey: string, meta: Meta): Promise<void> {
  const payload: CachedMetaPayload = { meta, cachedAt: Date.now() };
  const serialized = serializeCachedMeta(payload);

  const redis = getUpstashConfig();
  if (redis) {
    await upstashSetEx(redis.url, redis.token, cacheKey, serialized, META_CACHE_TTL_SECONDS);
  }

  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(cacheKey, { meta, timestamp: Date.now() });
}

async function resolveMetaCached(
  req: Request
): Promise<{ meta: Meta; cache: 'hit-redis' | 'hit-memory' | 'miss' }> {
  const cacheKey = buildMetaCacheKey(req.url);
  const cached = await readMetaFromCache(cacheKey);
  if (cached) {
    return {
      meta: cached.meta,
      cache: cached.source === 'redis' ? 'hit-redis' : 'hit-memory',
    };
  }

  const meta = await resolveMeta(req);
  await writeMetaToCache(cacheKey, meta);
  return { meta, cache: 'miss' };
}

function escapeHtml(s: string): string {
  return s.replace(
    /[<>&"']/g,
    c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}

function injectMeta(html: string, meta: Meta): string {
  const title = escapeHtml(meta.title);
  const desc = escapeHtml(meta.description);
  const image = escapeHtml(meta.image);
  const url = escapeHtml(meta.url);

  const block = `
    <title>${title}</title>
    <meta name="description" content="${desc}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="${meta.type}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:site_name" content="Emarzona" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${image}" />
${meta.type === 'product' && meta.price != null ? `    <meta property="product:price:amount" content="${meta.price}" />\n    <meta property="product:price:currency" content="${escapeHtml(meta.currency || 'XOF')}" />\n` : ''}`;

  // Supprimer title et meta existants ciblés, puis injecter le bloc avant </head>
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(
      /<meta\s+(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi,
      ''
    )
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
  out = out.replace(/<\/head>/i, `${block}\n  </head>`);
  return out;
}

/** En-tête interne pour éviter que fetch() ne relance le middleware (boucle 508). */
const PRERENDER_BYPASS_HEADER = 'x-emarzona-prerender-bypass';

async function fetchHtmlBypass(req: Request): Promise<Response> {
  const bypassHeaders = new Headers(req.headers);
  bypassHeaders.set(PRERENDER_BYPASS_HEADER, '1');
  return fetch(
    new Request(req.url, {
      method: req.method,
      headers: bypassHeaders,
    })
  );
}

function buildCspHtmlResponse(
  html: string,
  res: Response,
  extraHeaders: Record<string, string> = {}
): Response {
  const nonce = generateCspNonce();
  const body = injectScriptNonces(html, nonce);
  const headers = new Headers(res.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  applyCspResponseHeaders(headers, nonce);
  for (const [key, value] of Object.entries(extraHeaders)) {
    headers.set(key, value);
  }
  return new Response(body, { status: res.status, headers });
}

export default async function middleware(req: Request): Promise<Response | undefined> {
  // Requête issue du fetch interne ci-dessous → laisser atteindre index.html
  if (req.headers.get(PRERENDER_BYPASS_HEADER) === '1') {
    return;
  }

  const url = new URL(req.url);

  // P0-4 — Rate limit pages /auth (IP) ; SSO enterprise exclu
  if (isAuthRateLimitPath(url.pathname)) {
    const allowed = await checkAuthRouteRateLimit(req);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Too Many Requests', message: 'Trop de requêtes sur cette page.' }),
        {
          status: 429,
          headers: { 'content-type': 'application/json', 'retry-after': '60' },
        }
      );
    }
  }

  // Rate Limiting sur les routes API
  if (url.pathname.startsWith('/api/')) {
    const allowed = await checkApiRateLimit(req);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': '60' },
      });
    }
    // Laissez passer les requêtes API (elles ne sont pas du HTML)
    return;
  }

  const ua = req.headers.get('user-agent') || '';
  const isBot = BOT_REGEX.test(ua);

  // Epic 5.1 — CSP nonce pour utilisateurs réels (HTML uniquement)
  if (!isBot) {
    const res = await fetchHtmlBypass(req);
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return res;
    const html = await res.text();

    // Keep HTML edge cache short so hashed /assets/* from a previous deploy
    // cannot outlive the deployment that published them.
    return buildCspHtmlResponse(html, res, {
      'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      'x-edge-caching': 'swr-enabled',
    });
  }

  const allowed = await checkBotRateLimit(req);
  if (!allowed) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: { 'content-type': 'text/plain', 'retry-after': '60' },
    });
  }

  const res = await fetchHtmlBypass(req);

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return res;

  try {
    const { meta, cache } = await Promise.race([
      resolveMetaCached(req),
      new Promise<{ meta: Meta; cache: 'miss' }>(resolve =>
        setTimeout(() => resolve({ meta: DEFAULT_META, cache: 'miss' }), 1500)
      ),
    ]);
    const html = await res.text();
    const rewritten = injectMeta(html, meta);
    return buildCspHtmlResponse(rewritten, res, {
      'cache-control': 'public, max-age=300, s-maxage=600',
      'x-prerendered': 'bot',
      'x-seo-cache': cache,
    });
  } catch {
    return res;
  }
}
