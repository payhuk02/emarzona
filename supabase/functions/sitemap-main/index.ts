/**
 * Edge Function: sitemap-main
 * Génère dynamiquement le sitemap.xml de https://www.emarzona.com
 * Inclut: pages statiques + boutiques publiées + produits actifs
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE = 'https://www.emarzona.com';
const allowOrigin = Deno.env.get('SITE_URL') || SITE;

const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/marketplace', changefreq: 'hourly', priority: '0.9' },
  { path: '/collections', changefreq: 'daily', priority: '0.8' },
  { path: '/auctions', changefreq: 'daily', priority: '0.8' },
  { path: '/community', changefreq: 'daily', priority: '0.7' },
  { path: '/trending', changefreq: 'daily', priority: '0.8' },
  { path: '/discover', changefreq: 'daily', priority: '0.7' },
  { path: '/recommendations', changefreq: 'daily', priority: '0.7' },
  { path: '/digital/search', changefreq: 'daily', priority: '0.7' },
  { path: '/products/compare', changefreq: 'weekly', priority: '0.5' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/pricing', changefreq: 'weekly', priority: '0.7' },
  { path: '/legal/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cookies', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/refund', changefreq: 'yearly', priority: '0.3' },
];

function xmlEscape(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

function urlNode(loc: string, lastmod?: string, changefreq?: string, priority?: string): string {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}${priority ? `\n    <priority>${priority}</priority>` : ''}
  </url>`;
}

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date().toISOString().slice(0, 10);
  const urls: string[] = STATIC_PAGES.map(p => urlNode(`${SITE}${p.path}`, today, p.changefreq, p.priority));

  // Note: les boutiques sont dans sitemap-stores.xml (sous-domaines *.myemarzona.shop)
  // On ne les inclut PAS ici car /store/:slug redirige vers le sous-domaine (302)

  // Produits actifs (URL marketplace)
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at, store_id')
    .eq('is_active', true)
    .limit(40000);

  for (const p of products ?? []) {
    if (!p.slug) continue;
    urls.push(urlNode(`${SITE}/product/${p.slug}`, p.updated_at, 'weekly', '0.7'));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': allowOrigin,
    },
  });
});
