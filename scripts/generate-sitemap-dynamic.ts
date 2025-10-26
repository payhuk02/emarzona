/**
 * Script de génération de sitemap.xml dynamique
 * Génère automatiquement le sitemap avec produits, boutiques et pages statiques
 * 
 * Usage: npm run sitemap:generate
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-anon-key';
const SITE_URL = 'https://payhuk.com'; // À modifier selon votre domaine

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

/**
 * Formate une date au format ISO 8601 pour sitemap
 */
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Génère le XML du sitemap
 */
function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlsXML = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <!-- Sitemap généré automatiquement le ${new Date().toISOString()} -->
  <!-- Plateforme: Payhuk SaaS E-Commerce -->
  ${urlsXML}
</urlset>`;
}

/**
 * Récupère les pages statiques
 */
function getStaticPages(): SitemapUrl[] {
  const today = formatDate(new Date());
  
  return [
    {
      loc: `${SITE_URL}/`,
      lastmod: today,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: `${SITE_URL}/marketplace`,
      lastmod: today,
      changefreq: 'hourly',
      priority: 0.9
    },
    {
      loc: `${SITE_URL}/auth`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.5
    }
  ];
}

/**
 * Récupère les boutiques actives
 */
async function getStores(): Promise<SitemapUrl[]> {
  try {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération boutiques:', error);
      return [];
    }

    return stores?.map(store => ({
      loc: `${SITE_URL}/stores/${store.slug}`,
      lastmod: formatDate(store.updated_at),
      changefreq: 'weekly' as const,
      priority: 0.8
    })) || [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
}

/**
 * Récupère les produits actifs
 */
async function getProducts(): Promise<SitemapUrl[]> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        slug,
        updated_at,
        stores!inner (slug, is_active)
      `)
      .eq('is_active', true)
      .eq('stores.is_active', true)
      .order('updated_at', { ascending: false })
      .limit(10000); // Limite pour éviter surcharge

    if (error) {
      console.error('Erreur récupération produits:', error);
      return [];
    }

    return products?.map((product: any) => ({
      loc: `${SITE_URL}/stores/${product.stores.slug}/products/${product.slug}`,
      lastmod: formatDate(product.updated_at),
      changefreq: 'weekly' as const,
      priority: 0.7
    })) || [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
}

/**
 * Génère le sitemap complet
 */
async function generateSitemap(): Promise<void> {
  console.log('🚀 Génération du sitemap...\n');

  // Récupérer toutes les URLs
  console.log('📄 Récupération pages statiques...');
  const staticPages = getStaticPages();
  console.log(`   ✓ ${staticPages.length} pages statiques\n`);

  console.log('🏪 Récupération boutiques...');
  const stores = await getStores();
  console.log(`   ✓ ${stores.length} boutiques actives\n`);

  console.log('📦 Récupération produits...');
  const products = await getProducts();
  console.log(`   ✓ ${products.length} produits actifs\n`);

  // Combiner toutes les URLs
  const allUrls = [
    ...staticPages,
    ...stores,
    ...products
  ];

  console.log(`📊 Total URLs: ${allUrls.length}\n`);

  // Générer le XML
  const sitemapXML = generateSitemapXML(allUrls);

  // Écrire le fichier
  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, sitemapXML, 'utf-8');

  console.log(`✅ Sitemap généré avec succès !`);
  console.log(`📍 Emplacement: ${outputPath}`);
  console.log(`📏 Taille: ${(sitemapXML.length / 1024).toFixed(2)} KB\n`);

  // Statistiques
  console.log('📊 Répartition:');
  console.log(`   - Pages statiques: ${staticPages.length}`);
  console.log(`   - Boutiques: ${stores.length}`);
  console.log(`   - Produits: ${products.length}`);
  console.log(`   ────────────────────────`);
  console.log(`   Total: ${allUrls.length} URLs`);
}

// Exécution
generateSitemap()
  .then(() => {
    console.log('\n✨ Terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });

