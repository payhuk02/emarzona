/**
 * Edge Function: store-robots
 * Sert le robots.txt pour les sous-domaines des boutiques *.myemarzona.shop
 * et pour le domaine apex myemarzona.shop
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const STORE_DOMAIN = 'myemarzona.shop';
const allowOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';

serve(async req => {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || '';

  const headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    'Access-Control-Allow-Origin': allowOrigin,
  };

  // Apex domain
  if (!slug || slug === STORE_DOMAIN) {
    const body = `# robots.txt - ${STORE_DOMAIN} (apex)
User-agent: *
Disallow: /

Sitemap: https://${STORE_DOMAIN}/sitemap.xml
`;
    return new Response(body, { status: 200, headers });
  }

  const host = `${slug}.${STORE_DOMAIN}`;
  const body = `# robots.txt - ${host}
User-agent: *
Allow: /
Allow: /products/
Allow: /collections/
Allow: /portfolio
Allow: /auctions

Disallow: /cart
Disallow: /checkout
Disallow: /payment/
Disallow: /account
Disallow: /admin
Disallow: /api

# Bots IA
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: https://${host}/sitemap.xml
`;
  return new Response(body, { status: 200, headers });
});
