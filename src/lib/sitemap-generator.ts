/**
 * Générateur de Sitemap XML pour les boutiques
 * Génère automatiquement un sitemap XML pour une boutique
 */

import { logger } from './logger';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number; // 0.0 à 1.0
}

export interface SitemapOptions {
  baseUrl: string;
  storeSlug: string;
  storeUrl?: string; // URL personnalisée si domaine custom
  products?: Array<{
    slug: string;
    updated_at?: string;
  }>;
  includePages?: string[]; // Pages additionnelles à inclure
}

/**
 * Génère un sitemap XML pour une boutique
 */
export function generateStoreSitemap(options: SitemapOptions): string {
  const {
    baseUrl,
    storeSlug,
    storeUrl,
    products = [],
    includePages = []
  } = options;

  const urls: SitemapUrl[] = [];
  const storeBaseUrl = storeUrl || `${baseUrl}/stores/${storeSlug}`;

  // URL principale de la boutique
  urls.push({
    loc: storeBaseUrl,
    changefreq: 'daily',
    priority: 1.0,
    lastmod: new Date().toISOString().split('T')[0]
  });

  // Pages de produits
  products.forEach(product => {
    urls.push({
      loc: `${storeBaseUrl}/products/${product.slug}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: product.updated_at 
        ? new Date(product.updated_at).toISOString().split('T')[0]
        : undefined
    });
  });

  // Pages additionnelles
  includePages.forEach(page => {
    urls.push({
      loc: `${storeBaseUrl}${page.startsWith('/') ? '' : '/'}${page}`,
      changefreq: 'monthly',
      priority: 0.5
    });
  });

  // Générer le XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}${url.changefreq ? `
    <changefreq>${url.changefreq}</changefreq>` : ''}${url.priority !== undefined ? `
    <priority>${url.priority.toFixed(1)}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

/**
 * Échappe les caractères XML spéciaux
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Télécharge un sitemap XML
 */
export function downloadSitemap(xml: string, filename: string = 'sitemap.xml'): void {
  try {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Error downloading sitemap', { error });
    throw error;
  }
}

/**
 * Génère un sitemap index pour plusieurs boutiques
 */
export function generateSitemapIndex(
  sitemaps: Array<{
    loc: string;
    lastmod?: string;
  }>
): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${escapeXml(sitemap.loc)}</loc>${sitemap.lastmod ? `
    <lastmod>${sitemap.lastmod}</lastmod>` : ''}
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return xml;
}

