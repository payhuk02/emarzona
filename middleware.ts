/**
 * Vercel Edge Middleware - Prerendering pour bots
 *
 * Détecte les crawlers (Google, Bing, Facebook, Twitter, LinkedIn, WhatsApp, IA, etc.)
 * et injecte les méta-données dynamiques (title, description, og:*, canonical)
 * dans le HTML statique avant la réponse.
 *
 * Les utilisateurs réels passent inchangés (React Helmet prend le relais).
 */

export const config = {
  matcher: '/((?!_next|api|assets|.*\\..*).*)',
};

const BOT_REGEX =
  /(googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot|pinterest|redditbot|applebot|gptbot|claudebot|perplexitybot|google-extended|chatgpt-user|oai-searchbot)/i;

const SUPABASE_URL = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const SITE = 'https://www.emarzona.com';
const STORE_DOMAIN = 'myemarzona.shop';

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
  title: 'Emarzona - Plateforme de ecommerce et marketing',
  description:
    "Plateforme de ecommerce et marketing. Vendez vos produits digitaux, physiques, services, cours en ligne et oeuvres d'artiste.",
  image: `${SITE}/og-image.png`,
  url: SITE,
  type: 'website',
};

async function fetchProductMeta(slug: string, storeId?: string): Promise<Meta | null> {
  try {
    const filter = storeId
      ? `slug=eq.${slug}&store_id=eq.${storeId}`
      : `slug=eq.${slug}`;
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/products?${filter}&select=name,description,image_url,price,currency,meta_title,meta_description,slug&is_active=eq.true&limit=1`,
      {
        headers: {
          apikey: globalThis.process?.env?.SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${globalThis.process?.env?.SUPABASE_ANON_KEY || ''}`,
        },
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
      `${SUPABASE_URL}/rest/v1/stores?or=(subdomain.eq.${slugOrSubdomain},slug.eq.${slugOrSubdomain})&select=name,description,about,logo_url,meta_title,meta_description,slug,subdomain&is_active=eq.true&limit=1`,
      {
        headers: {
          apikey: globalThis.process?.env?.SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${globalThis.process?.env?.SUPABASE_ANON_KEY || ''}`,
        },
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

async function resolveMeta(req: Request): Promise<Meta> {
  const url = new URL(req.url);
  const host = (req.headers.get('host') || '').toLowerCase();
  const path = url.pathname;

  // Sous-domaine boutique : *.myemarzona.shop
  if (host.endsWith(`.${STORE_DOMAIN}`)) {
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

  // emarzona.com routes
  const productMatch = path.match(/^\/product\/([^/]+)/);
  if (productMatch) {
    const m = await fetchProductMeta(productMatch[1]);
    if (m) {
      m.url = `${SITE}${path}`;
      return m;
    }
  }

  const storeMatch = path.match(/^\/store\/([^/]+)/);
  if (storeMatch) {
    const m = await fetchStoreMeta(storeMatch[1]);
    if (m) {
      m.url = `${SITE}${path}`;
      return m;
    }
  }

  return { ...DEFAULT_META, url: `https://${host || 'emarzona.com'}${path}` };
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));
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
    .replace(/<meta\s+(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
  out = out.replace(/<\/head>/i, `${block}\n  </head>`);
  return out;
}

export default async function middleware(req: Request): Promise<Response> {
  const ua = req.headers.get('user-agent') || '';
  const isBot = BOT_REGEX.test(ua);

  // Récupérer la réponse statique
  const res = await fetch(req);

  if (!isBot) return res;

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return res;

  try {
    const meta = await Promise.race<Meta>([
      resolveMeta(req),
      new Promise<Meta>(resolve => setTimeout(() => resolve(DEFAULT_META), 1500)),
    ]);
    const html = await res.text();
    const rewritten = injectMeta(html, meta);
    return new Response(rewritten, {
      status: res.status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300, s-maxage=600',
        'x-prerendered': 'bot',
      },
    });
  } catch {
    return res;
  }
}
