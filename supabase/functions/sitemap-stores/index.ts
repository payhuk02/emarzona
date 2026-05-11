/**
 * Edge Function: sitemap-stores
 * Sert deux modes selon le paramètre ?slug=
 * - sans slug: sitemap-index listant toutes les boutiques *.myemarzona.shop
 * - avec slug: sitemap des produits de la boutique correspondante
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STORE_DOMAIN = 'myemarzona.shop';
const allowOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';

function xmlEscape(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

serve(async req => {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const headers = {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    'Access-Control-Allow-Origin': allowOrigin,
  };

  // Mode sitemap-index: toutes les boutiques
  if (!slug) {
    const { data: stores } = await supabase
      .from('stores')
      .select('slug, subdomain, updated_at')
      .eq('is_active', true)
      .limit(50000);

    const items = (stores ?? [])
      .map(s => {
        const sub = s.subdomain || s.slug;
        if (!sub) return '';
        return `  <sitemap>
    <loc>https://${xmlEscape(sub)}.${STORE_DOMAIN}/sitemap.xml</loc>
    <lastmod>${(s.updated_at || new Date().toISOString()).slice(0, 10)}</lastmod>
  </sitemap>`;
      })
      .filter(Boolean)
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`;
    return new Response(xml, { status: 200, headers });
  }

  // Mode sitemap d'une boutique
  const { data: store } = await supabase
    .from('stores')
    .select('id, slug, subdomain, updated_at')
    .or(`subdomain.eq.${slug},slug.eq.${slug}`)
    .eq('is_active', true)
    .maybeSingle();

  if (!store) {
    return new Response('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>', {
      status: 404,
      headers,
    });
  }

  const base = `https://${store.subdomain || store.slug}.${STORE_DOMAIN}`;
  const today = new Date().toISOString().slice(0, 10);
  const urls: string[] = [
    `  <url><loc>${base}/</loc><lastmod>${(store.updated_at || today).slice(0, 10)}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `  <url><loc>${base}/collections</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    `  <url><loc>${base}/portfolio</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
  ];

  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('store_id', store.id)
    .eq('is_active', true)
    .limit(40000);

  for (const p of products ?? []) {
    if (!p.slug) continue;
    urls.push(
      `  <url><loc>${base}/products/${xmlEscape(p.slug)}</loc><lastmod>${(p.updated_at || today).slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  return new Response(xml, { status: 200, headers });
});
