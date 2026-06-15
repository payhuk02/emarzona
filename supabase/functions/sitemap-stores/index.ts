/**
 * Epic 4.9 — Sitemap stores + domaines personnalisés actifs
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STORE_DOMAIN = 'myemarzona.shop';
const allowOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';

function xmlEscape(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!
  );
}

function urlNode(
  base: string,
  path: string,
  lastmod?: string,
  changefreq?: string,
  priority?: string
): string {
  const loc = path ? `${base}${path}` : base;
  return `  <url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}${priority ? `<priority>${priority}</priority>` : ''}</url>`;
}

async function resolveStore(
  supabase: ReturnType<typeof createClient>,
  slug: string | null,
  domain: string | null
) {
  if (domain) {
    const { data } = await supabase.rpc('get_store_by_custom_domain', { p_domain: domain });
    return (data as Array<Record<string, unknown>> | null)?.[0] ?? null;
  }
  if (!slug) return null;
  const { data } = await supabase
    .from('stores')
    .select('id, slug, subdomain, updated_at')
    .or(`subdomain.eq.${slug},slug.eq.${slug}`)
    .eq('is_active', true)
    .maybeSingle();
  return data;
}

serve(async req => {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  const domain = url.searchParams.get('domain');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const headers = {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    'Access-Control-Allow-Origin': allowOrigin,
  };

  // Index : sous-domaines + domaines custom actifs
  if (!slug && !domain) {
    const [{ data: stores }, { data: domains }] = await Promise.all([
      supabase
        .from('stores')
        .select('slug, subdomain, updated_at')
        .eq('is_active', true)
        .limit(50000),
      supabase
        .from('custom_domains')
        .select('domain, updated_at')
        .eq('status', 'active')
        .limit(10000),
    ]);

    const items: string[] = [];
    for (const s of stores ?? []) {
      const sub = s.subdomain || s.slug;
      if (!sub) continue;
      items.push(`  <sitemap>
    <loc>https://${xmlEscape(sub)}.${STORE_DOMAIN}/sitemap.xml</loc>
    <lastmod>${(s.updated_at || new Date().toISOString()).slice(0, 10)}</lastmod>
  </sitemap>`);
    }
    for (const d of domains ?? []) {
      if (!d.domain) continue;
      items.push(`  <sitemap>
    <loc>https://${xmlEscape(d.domain)}/sitemap.xml</loc>
    <lastmod>${(d.updated_at || new Date().toISOString()).slice(0, 10)}</lastmod>
  </sitemap>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join('\n')}
</sitemapindex>`;
    return new Response(xml, { status: 200, headers });
  }

  const store = await resolveStore(supabase, slug, domain);
  if (!store) {
    return new Response(
      '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>',
      {
        status: 404,
        headers,
      }
    );
  }

  const base = domain
    ? `https://${domain}`
    : `https://${(store.subdomain || store.slug) as string}.${STORE_DOMAIN}`;
  const today = new Date().toISOString().slice(0, 10);
  const urls: string[] = [
    urlNode(base, '/', (store.updated_at as string) || today, 'daily', '1.0'),
    urlNode(base, '/collections', today, 'weekly', '0.7'),
    urlNode(base, '/portfolio', today, 'weekly', '0.6'),
  ];

  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('store_id', store.id as string)
    .eq('is_active', true)
    .limit(40000);

  for (const p of products ?? []) {
    if (!p.slug) continue;
    urls.push(urlNode(base, `/products/${p.slug}`, p.updated_at, 'weekly', '0.8'));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  return new Response(xml, { status: 200, headers });
});
