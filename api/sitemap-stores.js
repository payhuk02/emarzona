import { proxySupabaseFunction } from './_lib/proxy-supabase-function.js';

/** Sitemap boutiques — /sitemap-stores.xml ou sous-domaines *.myemarzona.shop */
export default async function handler(req, res) {
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  const query = slug ? `slug=${encodeURIComponent(slug)}` : '';

  try {
    const upstream = await proxySupabaseFunction('sitemap-stores', query);
    const body = await upstream.text();

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(upstream.ok ? 200 : upstream.status).send(body);
  } catch {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(503).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
  }
}
