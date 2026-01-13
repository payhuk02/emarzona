/**
 * Script de vérification des images sur le marketplace
 * Vérifie que les images des produits sont bien importées et accessibles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Vérifie si une URL d'image est accessible
 */
async function checkImageAccessibility(imageUrl) {
  if (!imageUrl) return { accessible: false, reason: 'URL vide' };

  try {
    // Si c'est une URL Supabase Storage, vérifier l'accès
    if (imageUrl.includes('supabase.co/storage')) {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
          return { accessible: true, contentType };
        } else {
          return { accessible: false, reason: `Content-Type incorrect: ${contentType} (attendu: image/*)` };
        }
      } else {
        return { accessible: false, reason: `HTTP ${response.status}: ${response.statusText}` };
      }
    } else {
      // Pour les autres URLs, faire une requête HEAD
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return {
        accessible: response.ok,
        reason: response.ok ? 'OK' : `HTTP ${response.status}`,
        contentType: response.headers.get('content-type'),
      };
    }
  } catch (error) {
    return { accessible: false, reason: error.message };
  }
}

/**
 * Vérifie les images des produits du marketplace
 */
async function verifyMarketplaceImages() {
  console.log('🔍 Vérification des images sur le marketplace...\n');

  try {
    // Récupérer les produits actifs du marketplace
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, image_url, product_type, stores(id, name, slug)')
      .eq('is_active', true)
      .eq('is_draft', false)
      .limit(50); // Limiter à 50 produits pour le diagnostic

    if (error) {
      console.error('❌ Erreur lors de la récupération des produits:', error.message);
      return;
    }

    if (!products || products.length === 0) {
      console.log('⚠️  Aucun produit trouvé dans le marketplace');
      return;
    }

    console.log(`📦 ${products.length} produits trouvés\n`);

    // Statistiques
    let totalProducts = products.length;
    let productsWithImage = 0;
    let productsWithoutImage = 0;
    let accessibleImages = 0;
    let inaccessibleImages = 0;
    const issues = [];

    // Vérifier chaque produit
    for (const product of products) {
      const hasImage = !!product.image_url;
      
      if (hasImage) {
        productsWithImage++;
        console.log(`\n📸 Produit: ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Type: ${product.product_type || 'N/A'}`);
        console.log(`   Image URL: ${product.image_url}`);

        // Vérifier l'accessibilité de l'image
        const check = await checkImageAccessibility(product.image_url);
        
        if (check.accessible) {
          accessibleImages++;
          console.log(`   ✅ Image accessible (${check.contentType || 'OK'})`);
        } else {
          inaccessibleImages++;
          console.log(`   ❌ Image non accessible: ${check.reason}`);
          issues.push({
            productId: product.id,
            productName: product.name,
            imageUrl: product.image_url,
            reason: check.reason,
          });
        }
      } else {
        productsWithoutImage++;
        console.log(`\n⚠️  Produit sans image: ${product.name} (ID: ${product.id})`);
      }
    }

    // Afficher le résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE LA VÉRIFICATION');
    console.log('='.repeat(60));
    console.log(`Total de produits vérifiés: ${totalProducts}`);
    console.log(`Produits avec image: ${productsWithImage} (${Math.round((productsWithImage / totalProducts) * 100)}%)`);
    console.log(`Produits sans image: ${productsWithoutImage} (${Math.round((productsWithoutImage / totalProducts) * 100)}%)`);
    console.log(`Images accessibles: ${accessibleImages} (${productsWithImage > 0 ? Math.round((accessibleImages / productsWithImage) * 100) : 0}%)`);
    console.log(`Images non accessibles: ${inaccessibleImages} (${productsWithImage > 0 ? Math.round((inaccessibleImages / productsWithImage) * 100) : 0}%)`);

    // Afficher les problèmes détectés
    if (issues.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('⚠️  PROBLÈMES DÉTECTÉS');
      console.log('='.repeat(60));
      issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. Produit: ${issue.productName}`);
        console.log(`   ID: ${issue.productId}`);
        console.log(`   URL: ${issue.imageUrl}`);
        console.log(`   Raison: ${issue.reason}`);
      });

      console.log('\n💡 SOLUTIONS POSSIBLES:');
      console.log('   1. Vérifier que le bucket "product-images" est public dans Supabase');
      console.log('   2. Vérifier les politiques RLS du bucket');
      console.log('   3. Exécuter la migration: supabase/migrations/20250301_final_fix_product_images_access.sql');
      console.log('   4. Attendre 2-3 minutes après modification des politiques (délai de propagation)');
    }

    // Vérifier la configuration du bucket
    console.log('\n' + '='.repeat(60));
    console.log('🔧 VÉRIFICATION DU BUCKET');
    console.log('='.repeat(60));

    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.log('⚠️  Impossible de vérifier les buckets:', bucketError.message);
      } else {
        const productImagesBucket = buckets?.find(b => b.id === 'product-images');
        
        if (productImagesBucket) {
          console.log('✅ Bucket "product-images" trouvé');
          console.log(`   Public: ${productImagesBucket.public ? '✅ OUI' : '❌ NON'}`);
          console.log(`   Créé le: ${productImagesBucket.created_at}`);
          
          if (!productImagesBucket.public) {
            console.log('\n⚠️  ATTENTION: Le bucket n\'est pas public!');
            console.log('   → Allez dans Supabase Dashboard > Storage > Buckets > product-images');
            console.log('   → Activez "Public bucket"');
          }
        } else {
          console.log('❌ Bucket "product-images" non trouvé');
          console.log('   → Créez le bucket dans Supabase Dashboard');
        }
      }
    } catch (error) {
      console.log('⚠️  Erreur lors de la vérification du bucket:', error.message);
    }

    console.log('\n✅ Vérification terminée!');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

// Exécuter la vérification
verifyMarketplaceImages().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
