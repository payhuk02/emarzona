/**
 * Advanced SEO System
 * Système SEO avancé avec sitemap dynamique, Schema.org et Open Graph
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SchemaOrgData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export interface OpenGraphData {
  'og:title': string;
  'og:description': string;
  'og:image': string;
  'og:url': string;
  'og:type': string;
  'og:site_name'?: string;
  [key: string]: string;
}

/**
 * Classe principale pour le SEO avancé
 */
export class AdvancedSEO {
  /**
   * Générer le sitemap XML
   */
  async generateSitemap(baseUrl: string = window.location.origin): Promise<string> {
    try {
      const urls: SitemapUrl[] = [];

      // Page d'accueil
      urls.push({
        loc: `${baseUrl}/`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 1.0,
      });

      // Pages statiques
      const staticPages = ['/marketplace', '/about', '/contact', '/help', '/terms', '/privacy'];
      staticPages.forEach(path => {
        urls.push({
          loc: `${baseUrl}${path}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.8,
        });
      });

      // Produits
      const { data: products } = await supabase
        .from('products')
        .select('id, slug, updated_at')
        .eq('status', 'active')
        .eq('is_draft', false)
        .limit(10000);

      products?.forEach(product => {
        urls.push({
          loc: `${baseUrl}/products/${product.slug || product.id}`,
          lastmod: product.updated_at || new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.9,
        });
      });

      // Stores
      const { data: stores } = await supabase
        .from('stores')
        .select('id, slug, updated_at')
        .eq('status', 'active')
        .limit(1000);

      stores?.forEach(store => {
        urls.push({
          loc: `${baseUrl}/stores/${store.slug || store.id}`,
          lastmod: store.updated_at || new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.8,
        });
      });

      // Catégories
      const { data: categories } = await supabase
        .from('categories')
        .select('id, slug, updated_at')
        .eq('is_active', true)
        .limit(100);

      categories?.forEach(category => {
        urls.push({
          loc: `${baseUrl}/categories/${category.slug || category.id}`,
          lastmod: category.updated_at || new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.7,
        });
      });

      // Générer le XML
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    url => `  <url>
    <loc>${this.escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

      return sitemapXml;
    } catch (error) {
      logger.error('AdvancedSEO.generateSitemap error', { error, baseUrl });
      throw error;
    }
  }

  /**
   * Générer les données Schema.org pour un produit
   */
  generateProductSchema(
    product: Record<string, unknown>,
    store: Record<string, unknown> | null | undefined
  ): SchemaOrgData {
    const name = typeof product.name === 'string' ? product.name : 'Produit';
    const description = typeof product.description === 'string' ? product.description : '';
    const imagesRaw = (product as { images?: unknown }).images;
    const images = Array.isArray(imagesRaw) ? imagesRaw : imagesRaw ? [imagesRaw] : [];
    const priceRaw = (product as { price?: unknown }).price;
    const price = typeof priceRaw === 'number' ? priceRaw : 0;
    const currencyRaw = (product as { currency?: unknown }).currency;
    const currency = typeof currencyRaw === 'string' ? currencyRaw : 'XOF';
    const stockStatusRaw = (product as { stock_status?: unknown }).stock_status;
    const stockStatus = typeof stockStatusRaw === 'string' ? stockStatusRaw : undefined;
    const slugRaw = (product as { slug?: unknown }).slug;
    const slug = typeof slugRaw === 'string' ? slugRaw : undefined;
    const idRaw = (product as { id?: unknown }).id;
    const id = typeof idRaw === 'string' ? idRaw : '';
    const ratingRaw = (product as { rating?: unknown }).rating;
    const rating = typeof ratingRaw === 'number' ? ratingRaw : undefined;
    const reviewsCountRaw = (product as { reviews_count?: unknown }).reviews_count;
    const reviewsCount = typeof reviewsCountRaw === 'number' ? reviewsCountRaw : 0;
    const storeNameRaw = store ? (store as { name?: unknown }).name : undefined;
    const storeName = typeof storeNameRaw === 'string' && storeNameRaw ? storeNameRaw : 'Emarzona';

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description,
      image: images,
      brand: {
        '@type': 'Brand',
        name: storeName,
      },
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: currency,
        availability:
          stockStatus === 'in_stock'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        url: `${window.location.origin}/products/${slug || id}`,
      },
      aggregateRating:
        rating !== undefined
          ? {
              '@type': 'AggregateRating',
              ratingValue: rating,
              reviewCount: reviewsCount,
            }
          : undefined,
    };
  }

  /**
   * Générer les données Schema.org pour une organisation
   */
  generateOrganizationSchema(): SchemaOrgData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Emarzona',
      url: window.location.origin,
      logo: `${window.location.origin}/emarzona-logo.png`,
      sameAs: [
        // TODO: Ajouter les liens vers les réseaux sociaux
      ],
    };
  }

  /**
   * Générer les données Open Graph pour une page
   */
  generateOpenGraphData(data: {
    title: string;
    description: string;
    image?: string;
    url?: string;
    type?: string;
  }): OpenGraphData {
    return {
      'og:title': data.title,
      'og:description': data.description,
      // Fallback vers le logo (existe dans /public). Évite les 404 si og-image.png n'est pas fourni.
      'og:image': data.image || `${window.location.origin}/emarzona-logo.png`,
      'og:url': data.url || window.location.href,
      'og:type': data.type || 'website',
      'og:site_name': 'Emarzona',
    };
  }

  /**
   * Échapper les caractères XML
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Instance singleton
export const advancedSEO = new AdvancedSEO();
