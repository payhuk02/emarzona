/**
 * Edge Function: sitemap-main
 * Génère dynamiquement le sitemap.xml de https://www.emarzona.com
 * Inclut: pages statiques + boutiques publiées + produits actifs
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildWwwProductPublicUrl } from '../_shared/product-public-url.ts';

const SITE = 'https://www.emarzona.com';
const allowOrigin = Deno.env.get('SITE_URL') || SITE;

const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/marketplace', changefreq: 'hourly', priority: '0.9' },
  { path: '/courses', changefreq: 'daily', priority: '0.85' },
  { path: '/collections', changefreq: 'daily', priority: '0.8' },
  { path: '/auctions', changefreq: 'daily', priority: '0.8' },
  { path: '/community', changefreq: 'daily', priority: '0.7' },
  { path: '/trending', changefreq: 'daily', priority: '0.8' },
  { path: '/discover', changefreq: 'daily', priority: '0.7' },
  { path: '/recommendations', changefreq: 'daily', priority: '0.7' },
  { path: '/digital/search', changefreq: 'daily', priority: '0.7' },
  { path: '/products/compare', changefreq: 'weekly', priority: '0.5' },
  { path: '/art', changefreq: 'daily', priority: '0.8' },
  { path: '/digital/compare', changefreq: 'weekly', priority: '0.5' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/careers', changefreq: 'monthly', priority: '0.5' },
  { path: '/press', changefreq: 'monthly', priority: '0.5' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/docs', changefreq: 'weekly', priority: '0.6' },
  { path: '/help', changefreq: 'weekly', priority: '0.6' },
  { path: '/faq', changefreq: 'weekly', priority: '0.75' },
  { path: '/integrations', changefreq: 'monthly', priority: '0.6' },
  { path: '/pricing', changefreq: 'weekly', priority: '0.7' },
  { path: '/legal/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cgv', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cookies', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/refund', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/dpa', changefreq: 'yearly', priority: '0.3' },
];

function xmlEscape(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!
  );
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
  const urls: string[] = STATIC_PAGES.map(p =>
    urlNode(`${SITE}${p.path}`, today, p.changefreq, p.priority)
  );

  // Note: les boutiques sont dans sitemap-stores.xml (sous-domaines *.myemarzona.shop)
  // On ne les inclut PAS ici car /store/:slug redirige vers le sous-domaine (302)

  // Produits actifs indexables sur www (URL par type — pas /product/:slug)
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, updated_at, product_type')
    .eq('is_active', true)
    .eq('is_draft', false)
    .limit(40000);

  for (const p of products ?? []) {
    const loc = buildWwwProductPublicUrl(
      { id: p.id, slug: p.slug, product_type: p.product_type },
      SITE
    );
    if (!loc) continue;
    urls.push(urlNode(loc, p.updated_at, 'weekly', '0.7'));
  }

  const { data: blogPosts } = await supabase
    .from('platform_blog_posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .eq('noindex', false)
    .order('published_at', { ascending: false })
    .limit(5000);

  for (const post of blogPosts ?? []) {
    if (!post.slug) continue;
    const lastmod = post.updated_at ?? post.published_at ?? today;
    urls.push(urlNode(`${SITE}/blog/${post.slug}`, lastmod, 'weekly', '0.7'));
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
