/**
 * Script de vérification de toutes les tables de la plateforme Emarzona
 * Exécute une requête SQL pour lister toutes les tables et vérifier leur présence
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Liste de toutes les tables attendues
const expectedTables = [
  // Tables principales
  'profiles',
  'products',
  'orders',
  'order_items',
  'stores',
  'transactions',
  
  // Produits digitaux
  'digital_products',
  'digital_product_files',
  'digital_licenses',
  
  // Produits physiques
  'physical_products',
  'physical_product_variants',
  'inventory_items',
  
  // Produits services
  'service_products',
  'service_bookings',
  'service_availability_slots',
  
  // Panier et wishlist
  'cart',
  'cart_items',
  'wishlist',
  'wishlist_items',
  
  // Coupons et promotions
  'coupons',
  'coupon_usage',
  'gift_cards',
  
  // Affiliation
  'affiliates',
  'affiliate_commissions',
  'affiliate_links',
  
  // Cours
  'courses',
  'course_lessons',
  'course_enrollments',
  'course_progress',
  
  // Reviews
  'reviews',
  'review_media',
  
  // Notifications
  'notifications',
  'notification_preferences',
  
  // Messagerie
  'conversations',
  'messages',
  
  // Stock
  'warehouses',
  'warehouse_items',
  
  // Livraison
  'shipping_methods',
  'shipments',
  
  // Retours
  'returns',
  'return_items',
  
  // Analytics
  'product_analytics',
  'store_analytics',
  
  // Webhooks
  'webhooks',
  'webhook_events',
  
  // Paramètres
  'platform_settings',
  'platform_roles',
  
  // Clients
  'customers',
  'customer_addresses',
  
  // Souscriptions
  'subscriptions',
  'subscription_plans',
];

async function verifyTables() {
  console.log('🔍 Vérification des tables de la plateforme Emarzona...\n');
  
  try {
    // Récupérer toutes les tables du schéma public
    const { data: tables, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });
    
    // Alternative: utiliser une requête directe via REST API
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (tablesError) {
      console.log('⚠️  Impossible d\'utiliser information_schema via REST API');
      console.log('   Utilisation d\'une approche alternative...\n');
      
      // Approche alternative: tester chaque table individuellement
      const results = {
        existing: [],
        missing: [],
      };
      
      for (const table of expectedTables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            results.missing.push(table);
            console.log(`❌ ${table} - MANQUANTE`);
          } else {
            // Table existe mais peut-être vide ou erreur de permissions
            results.existing.push(table);
            console.log(`✅ ${table}`);
          }
        } else {
          results.existing.push(table);
          console.log(`✅ ${table}`);
        }
      }
      
      console.log('\n========================================');
      console.log('📊 RÉSUMÉ');
      console.log('========================================');
      console.log(`✅ Tables existantes: ${results.existing.length} / ${expectedTables.length}`);
      console.log(`❌ Tables manquantes: ${results.missing.length} / ${expectedTables.length}`);
      console.log(`📈 Taux de complétude: ${((results.existing.length / expectedTables.length) * 100).toFixed(2)}%`);
      
      if (results.missing.length > 0) {
        console.log('\n========================================');
        console.log('⚠️  TABLES MANQUANTES');
        console.log('========================================');
        results.missing.forEach(table => {
          console.log(`  - ${table}`);
        });
      } else {
        console.log('\n🎉 TOUTES LES TABLES SONT PRÉSENTES !');
      }
      
      return;
    }
    
    const existingTableNames = tablesData?.map(t => t.table_name) || [];
    
    const results = {
      existing: [],
      missing: [],
    };
    
    expectedTables.forEach(table => {
      if (existingTableNames.includes(table)) {
        results.existing.push(table);
        console.log(`✅ ${table}`);
      } else {
        results.missing.push(table);
        console.log(`❌ ${table} - MANQUANTE`);
      }
    });
    
    console.log('\n========================================');
    console.log('📊 RÉSUMÉ');
    console.log('========================================');
    console.log(`✅ Tables existantes: ${results.existing.length} / ${expectedTables.length}`);
    console.log(`❌ Tables manquantes: ${results.missing.length} / ${expectedTables.length}`);
    console.log(`📈 Taux de complétude: ${((results.existing.length / expectedTables.length) * 100).toFixed(2)}%`);
    
    if (results.missing.length > 0) {
      console.log('\n========================================');
      console.log('⚠️  TABLES MANQUANTES');
      console.log('========================================');
      results.missing.forEach(table => {
        console.log(`  - ${table}`);
      });
    } else {
      console.log('\n🎉 TOUTES LES TABLES SONT PRÉSENTES !');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

verifyTables();

