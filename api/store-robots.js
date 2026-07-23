import { proxySupabaseFunction } from '../lib/api/proxy-supabase-function.js';

/** robots.txt des boutiques *.myemarzona.shop */
export default async function handler(req, res) {
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  const query = slug ? `slug=${encodeURIComponent(slug)}` : '';

  try {
    const upstream = await proxySupabaseFunction('store-robots', query);
    const body = await upstream.text();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(upstream.ok ? 200 : upstream.status).send(body);
  } catch {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(503).send('User-agent: *\nDisallow: /\n');
  }
}
