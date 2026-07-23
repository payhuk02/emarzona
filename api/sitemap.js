import { proxySupabaseFunction } from '../lib/api/proxy-supabase-function.js';

/** Sitemap principal — https://www.emarzona.com/sitemap.xml */
export default async function handler(_req, res) {
  try {
    const upstream = await proxySupabaseFunction('sitemap-main');
    const body = await upstream.text();

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

    if (!upstream.ok) {
      res.status(upstream.status).send(body);
      return;
    }

    res.status(200).send(body);
  } catch {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(503).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.emarzona.com/</loc></url>
</urlset>`);
  }
}
