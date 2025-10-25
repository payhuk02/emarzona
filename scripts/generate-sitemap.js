/**
 * Script: Générateur de Sitemap XML
 * Description: Génère un sitemap.xml dynamique pour toutes les pages publiques
 * Usage: node scripts/generate-sitemap.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration site
const SITE_URL = process.env.VITE_SITE_URL || 'https://payhula.vercel.app';

/**
 * Génère l'URL complète
 */
const generateUrl = (path) => {
  return `${SITE_URL}${path}`;
};

/**
 * Formate une date en ISO 8601
 */
const formatDate = (date) => {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Échappe les caractères XML spéciaux
 */
const escapeXml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Récupère toutes les boutiques actives
 */
async function fetchStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('slug, name, updated_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des boutiques:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère tous les produits actifs
 */
async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      slug,
      name,
      image_url,
      updated_at,
      store:stores!inner(slug, is_active)
    `)
    .eq('is_active', true)
    .eq('store.is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return [];
  }

  return data || [];
}

/**
 * Génère une entrée URL pour le sitemap
 */
function generateUrlEntry(loc, changefreq = 'weekly', priority = '0.5', lastmod = null, images = []) {
  let entry = `  <url>\n`;
  entry += `    <loc>${escapeXml(loc)}</loc>\n`;
  entry += `    <changefreq>${changefreq}</changefreq>\n`;
  entry += `    <priority>${priority}</priority>\n`;
  
  if (lastmod) {
    entry += `    <lastmod>${formatDate(lastmod)}</lastmod>\n`;
  }
  
  // Ajout des images si présentes
  if (images && images.length > 0) {
    images.forEach(img => {
      entry += `    <image:image>\n`;
      entry += `      <image:loc>${escapeXml(img.url)}</image:loc>\n`;
      if (img.title) {
        entry += `      <image:title>${escapeXml(img.title)}</image:title>\n`;
      }
      if (img.caption) {
        entry += `      <image:caption>${escapeXml(img.caption)}</image:caption>\n`;
      }
      entry += `    </image:image>\n`;
    });
  }
  
  entry += `  </url>\n`;
  return entry;
}

/**
 * Génère le sitemap XML complet
 */
async function generateSitemap() {
  console.log('🚀 Génération du sitemap XML...\n');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n`;

  // 1. Homepage
  console.log('📄 Ajout de la homepage...');
  xml += generateUrlEntry(
    generateUrl('/'),
    'daily',
    '1.0',
    new Date().toISOString()
  );

  // 2. Marketplace
  console.log('📄 Ajout de la marketplace...');
  xml += generateUrlEntry(
    generateUrl('/marketplace'),
    'daily',
    '0.9',
    new Date().toISOString()
  );

  // 3. Toutes les boutiques
  console.log('🏪 Récupération des boutiques...');
  const stores = await fetchStores();
  console.log(`✅ ${stores.length} boutiques trouvées`);
  
  stores.forEach(store => {
    xml += generateUrlEntry(
      generateUrl(`/stores/${store.slug}`),
      'weekly',
      '0.8',
      store.updated_at
    );
  });

  // 4. Tous les produits
  console.log('📦 Récupération des produits...');
  const products = await fetchProducts();
  console.log(`✅ ${products.length} produits trouvés`);
  
  products.forEach(product => {
    const images = product.image_url ? [{
      url: product.image_url,
      title: product.name,
      caption: `Acheter ${product.name} sur Payhula`
    }] : [];
    
    xml += generateUrlEntry(
      generateUrl(`/stores/${product.store.slug}/products/${product.slug}`),
      'weekly',
      '0.7',
      product.updated_at,
      images
    );
  });

  xml += `</urlset>`;

  return xml;
}

/**
 * Sauvegarde le sitemap dans public/
 */
function saveSitemap(xml) {
  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`\n✅ Sitemap généré avec succès: ${outputPath}`);
  
  const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
  console.log(`📊 Taille du fichier: ${fileSize} KB`);
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('═══════════════════════════════════════');
    console.log('  GÉNÉRATEUR DE SITEMAP XML - PAYHULA');
    console.log('═══════════════════════════════════════\n');

    const xml = await generateSitemap();
    saveSitemap(xml);

    console.log('\n✨ Sitemap XML généré avec succès !');
    console.log(`🌐 URL: ${SITE_URL}/sitemap.xml\n`);
    
    // Stats
    const urlCount = (xml.match(/<url>/g) || []).length;
    const imageCount = (xml.match(/<image:image>/g) || []).length;
    
    console.log('📊 STATISTIQUES:');
    console.log(`   - URLs: ${urlCount}`);
    console.log(`   - Images: ${imageCount}`);
    console.log('\n💡 N\'oubliez pas de soumettre le sitemap à Google Search Console!');
    console.log('   👉 https://search.google.com/search-console\n');

  } catch (error) {
    console.error('❌ Erreur lors de la génération du sitemap:', error);
    process.exit(1);
  }
}

main();

