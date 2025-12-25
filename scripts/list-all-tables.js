/**
 * Script pour lister TOUTES les tables de la base de données Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
  console.log('🔍 Liste complète de toutes les tables de la plateforme Emarzona...\n');
  
  const allTables = [];
  const categories = {
    'Utilisateurs & Authentification': [],
    'Produits': [],
    'Commandes & Paiements': [],
    'Boutiques': [],
    'Panier & Wishlist': [],
    'Coupons & Promotions': [],
    'Affiliation': [],
    'Cours & Formations': [],
    'Reviews & Évaluations': [],
    'Notifications': [],
    'Messagerie': [],
    'Stock & Inventaire': [],
    'Livraison': [],
    'Retours & Garanties': [],
    'Analytics': [],
    'Recherche & Recommandations': [],
    'Templates': [],
    'Communauté': [],
    'Clients': [],
    'Webhooks': [],
    'Paramètres Plateforme': [],
    'Disputes': [],
    'Licences': [],
    'Souscriptions': [],
    'Réservations': [],
    'Lots & Expiration': [],
    'Suivi de Série': [],
    'Kits Produits': [],
    'Devis & Facturation': [],
    'Multi-devises': [],
    'Multi-régions': [],
    'Préférences Utilisateur': [],
    'Sécurité': [],
    'Stockage': [],
    'Tracking': [],
    'Gamification': [],
    'Livraison par Lots': [],
    'Optimisation de Coûts': [],
    'Prévision de Demande': [],
    'Ressources': [],
    'Personnalisation Avancée': [],
    'Produits Artistes': [],
    'Protection Téléchargement': [],
    'Versioning Produits': [],
    'Bundles Digitaux': [],
    'Gestion Licences Digitales': [],
    'Autres': [],
  };
  
  // Tester toutes les tables possibles
  const possibleTables = [
    // Utilisateurs & Authentification
    'profiles', 'users', 'user_preferences', 'cookie_preferences',
    
    // Produits
    'products', 'digital_products', 'digital_product_files', 'digital_licenses',
    'physical_products', 'physical_product_variants', 'inventory_items', 'physical_product_inventory',
    'service_products', 'service_bookings', 'service_availability_slots',
    'artist_products', 'product_templates', 'product_versions', 'version_history',
    'product_kits', 'kit_items', 'digital_bundles', 'bundle_items',
    
    // Commandes & Paiements
    'orders', 'order_items', 'transactions', 'payment_methods',
    'invoices', 'invoice_items', 'invoice_taxes', 'taxes',
    'quotes', 'quote_items',
    
    // Boutiques
    'stores', 'store_settings', 'store_customization', 'store_team',
    'store_withdrawals', 'store_payment_methods', 'store_advanced_customization',
    'store_info_messages', 'store_analytics',
    
    // Panier & Wishlist
    'cart', 'cart_items', 'wishlist', 'wishlist_items', 'abandoned_carts',
    
    // Coupons & Promotions
    'coupons', 'coupon_usage', 'gift_cards', 'gift_card_transactions',
    
    // Affiliation
    'affiliates', 'affiliate_commissions', 'affiliate_links', 'affiliate_short_links',
    'commission_payments', 'referral_codes', 'referral_commissions',
    
    // Cours & Formations
    'courses', 'course_lessons', 'course_enrollments', 'course_progress',
    'course_assignments', 'course_cohorts', 'course_gamification',
    'course_learning_paths', 'course_live_sessions', 'course_notes',
    'course_prerequisites', 'course_drip_content', 'quiz_questions', 'quiz_answers',
    
    // Reviews & Évaluations
    'reviews', 'review_media', 'product_ratings',
    
    // Notifications
    'notifications', 'notification_preferences', 'push_notifications',
    
    // Messagerie
    'conversations', 'messages', 'vendor_conversations', 'shipping_service_conversations',
    
    // Stock & Inventaire
    'warehouses', 'warehouse_items', 'inventory_movements', 'suppliers', 'purchase_orders',
    
    // Livraison
    'shipping_methods', 'shipping_carriers', 'shipping_rates', 'shipments',
    'tracking_numbers', 'shipping_tracking', 'delivery_confirmations', 'batch_shipments',
    'batch_shipment_items',
    
    // Retours & Garanties
    'returns', 'return_items', 'warranties', 'repairs',
    
    // Analytics
    'product_analytics', 'order_analytics', 'user_analytics', 'analytics_events',
    
    // Recherche & Recommandations
    'product_search', 'product_recommendations', 'price_stock_alerts',
    
    // Templates
    'user_templates',
    
    // Communauté
    'community_posts', 'community_comments', 'community_likes', 'community_follows',
    
    // Clients
    'customers', 'customer_addresses',
    
    // Webhooks
    'webhooks', 'webhook_events', 'webhook_logs',
    
    // Paramètres Plateforme
    'platform_settings', 'platform_roles', 'admin_actions', 'admin_config',
    
    // Disputes
    'disputes', 'dispute_messages', 'dispute_resolutions',
    
    // Licences
    'product_licenses', 'license_activations', 'digital_license_keys', 'license_usage_tracking',
    
    // Souscriptions
    'subscriptions', 'subscription_plans', 'subscription_payments',
    
    // Réservations
    'recurring_bookings', 'booking_schedules', 'resource_bookings', 'resource_conflicts',
    'staff_availability',
    
    // Lots & Expiration
    'product_lots', 'lot_expiration_alerts',
    
    // Suivi de Série
    'serial_numbers', 'serial_tracking',
    
    // Multi-devises
    'currencies', 'currency_rates', 'currency_conversion_logs',
    
    // Multi-régions
    'regions', 'region_settings',
    
    // Sécurité
    'api_keys', 'rate_limits', 'transaction_retries',
    
    // Stockage
    'storage_buckets', 'storage_objects', 'video_uploads', 'video_processing',
    'file_uploads', 'file_metadata',
    
    // Tracking
    'upsell_tracking',
    
    // Gamification
    'user_points', 'user_badges', 'user_achievements',
    
    // Optimisation
    'cost_optimization', 'cost_analysis', 'demand_forecasts', 'forecast_accuracy',
    
    // Ressources
    'resources', 'resource_conflict_settings', 'staff_availability_settings',
    
    // Protection
    'download_protections', 'download_attempts',
  ];
  
  console.log('Vérification de', possibleTables.length, 'tables possibles...\n');
  
  for (const table of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (!error || (error.code !== 'PGRST116' && !error.message.includes('does not exist'))) {
        allTables.push(table);
        console.log(`✅ ${table}`);
      } else {
        console.log(`❌ ${table} - MANQUANTE`);
      }
    } catch (err) {
      // Table n'existe pas
      console.log(`❌ ${table} - MANQUANTE`);
    }
  }
  
  // Organiser par catégories
  possibleTables.forEach(table => {
    if (allTables.includes(table)) {
      let categorized = false;
      
      if (['profiles', 'users', 'user_preferences', 'cookie_preferences'].includes(table)) {
        categories['Utilisateurs & Authentification'].push(table);
        categorized = true;
      }
      if (table.includes('product') && !categorized) {
        categories['Produits'].push(table);
        categorized = true;
      }
      if (['orders', 'order_items', 'transactions', 'payment', 'invoice'].some(t => table.includes(t))) {
        categories['Commandes & Paiements'].push(table);
        categorized = true;
      }
      if (table.includes('store')) {
        categories['Boutiques'].push(table);
        categorized = true;
      }
      if (['cart', 'wishlist', 'abandoned'].some(t => table.includes(t))) {
        categories['Panier & Wishlist'].push(table);
        categorized = true;
      }
      if (['coupon', 'gift'].some(t => table.includes(t))) {
        categories['Coupons & Promotions'].push(table);
        categorized = true;
      }
      if (['affiliate', 'referral', 'commission'].some(t => table.includes(t))) {
        categories['Affiliation'].push(table);
        categorized = true;
      }
      if (table.includes('course') || table.includes('quiz')) {
        categories['Cours & Formations'].push(table);
        categorized = true;
      }
      if (['review', 'rating'].some(t => table.includes(t))) {
        categories['Reviews & Évaluations'].push(table);
        categorized = true;
      }
      if (table.includes('notification')) {
        categories['Notifications'].push(table);
        categorized = true;
      }
      if (['conversation', 'message', 'vendor'].some(t => table.includes(t))) {
        categories['Messagerie'].push(table);
        categorized = true;
      }
      if (['warehouse', 'inventory', 'supplier'].some(t => table.includes(t))) {
        categories['Stock & Inventaire'].push(table);
        categorized = true;
      }
      if (['shipping', 'shipment', 'tracking', 'delivery', 'batch_shipment'].some(t => table.includes(t))) {
        categories['Livraison'].push(table);
        categorized = true;
      }
      if (['return', 'warranty', 'repair'].some(t => table.includes(t))) {
        categories['Retours & Garanties'].push(table);
        categorized = true;
      }
      if (table.includes('analytics')) {
        categories['Analytics'].push(table);
        categorized = true;
      }
      if (['search', 'recommendation', 'alert'].some(t => table.includes(t))) {
        categories['Recherche & Recommandations'].push(table);
        categorized = true;
      }
      if (table.includes('template')) {
        categories['Templates'].push(table);
        categorized = true;
      }
      if (table.includes('community')) {
        categories['Communauté'].push(table);
        categorized = true;
      }
      if (['customer', 'address'].some(t => table.includes(t))) {
        categories['Clients'].push(table);
        categorized = true;
      }
      if (table.includes('webhook')) {
        categories['Webhooks'].push(table);
        categorized = true;
      }
      if (['platform', 'admin'].some(t => table.includes(t))) {
        categories['Paramètres Plateforme'].push(table);
        categorized = true;
      }
      if (table.includes('dispute')) {
        categories['Disputes'].push(table);
        categorized = true;
      }
      if (['license', 'activation'].some(t => table.includes(t))) {
        categories['Licences'].push(table);
        categorized = true;
      }
      if (table.includes('subscription')) {
        categories['Souscriptions'].push(table);
        categorized = true;
      }
      if (['booking', 'schedule', 'resource', 'staff'].some(t => table.includes(t))) {
        categories['Réservations'].push(table);
        categorized = true;
      }
      if (['lot', 'expiration'].some(t => table.includes(t))) {
        categories['Lots & Expiration'].push(table);
        categorized = true;
      }
      if (['serial', 'tracking'].some(t => table.includes(t)) && !table.includes('shipping')) {
        categories['Suivi de Série'].push(table);
        categorized = true;
      }
      if (['currency', 'conversion'].some(t => table.includes(t))) {
        categories['Multi-devises'].push(table);
        categorized = true;
      }
      if (table.includes('region')) {
        categories['Multi-régions'].push(table);
        categorized = true;
      }
      if (['api_key', 'rate_limit', 'transaction_retry'].some(t => table.includes(t))) {
        categories['Sécurité'].push(table);
        categorized = true;
      }
      if (['storage', 'video', 'file'].some(t => table.includes(t))) {
        categories['Stockage'].push(table);
        categorized = true;
      }
      if (['upsell', 'referral'].some(t => table.includes(t)) && !table.includes('affiliate')) {
        categories['Tracking'].push(table);
        categorized = true;
      }
      if (['point', 'badge', 'achievement'].some(t => table.includes(t))) {
        categories['Gamification'].push(table);
        categorized = true;
      }
      if (['cost', 'demand', 'forecast'].some(t => table.includes(t))) {
        categories['Optimisation de Coûts'].push(table);
        categorized = true;
      }
      if (table.includes('download')) {
        categories['Protection Téléchargement'].push(table);
        categorized = true;
      }
      if (table.includes('bundle')) {
        categories['Bundles Digitaux'].push(table);
        categorized = true;
      }
      
      if (!categorized) {
        categories['Autres'].push(table);
      }
    }
  });
  
  // Générer le rapport
  const report = [];
  report.push('# 📊 RAPPORT COMPLET - TABLES DE LA PLATEFORME EMARZONA\n');
  report.push(`**Date** : ${new Date().toLocaleDateString('fr-FR')}\n`);
  report.push(`**Total de tables trouvées** : ${allTables.length}\n`);
  report.push(`**Total de tables testées** : ${possibleTables.length}\n`);
  report.push(`**Taux de complétude** : ${((allTables.length / possibleTables.length) * 100).toFixed(2)}%\n\n`);
  report.push('---\n\n');
  
  Object.entries(categories).forEach(([category, tables]) => {
    if (tables.length > 0) {
      report.push(`## ${category} (${tables.length})\n\n`);
      tables.forEach(table => {
        report.push(`- ✅ \`${table}\`\n`);
      });
      report.push('\n');
    }
  });
  
  const missingTables = possibleTables.filter(t => !allTables.includes(t));
  if (missingTables.length > 0) {
    report.push('## ❌ Tables Manquantes\n\n');
    missingTables.forEach(table => {
      report.push(`- ❌ \`${table}\`\n`);
    });
  }
  
  const reportContent = report.join('');
  writeFileSync('docs/audits/RAPPORT_TABLES_EMARZONA.md', reportContent);
  
  console.log('\n========================================');
  console.log('📊 RÉSUMÉ COMPLET');
  console.log('========================================');
  console.log(`✅ Tables trouvées: ${allTables.length}`);
  console.log(`❌ Tables manquantes: ${missingTables.length}`);
  console.log(`📈 Taux de complétude: ${((allTables.length / possibleTables.length) * 100).toFixed(2)}%`);
  console.log('\n📄 Rapport généré: docs/audits/RAPPORT_TABLES_EMARZONA.md');
  
  // Afficher par catégories
  console.log('\n========================================');
  console.log('📋 TABLES PAR CATÉGORIES');
  console.log('========================================');
  Object.entries(categories).forEach(([category, tables]) => {
    if (tables.length > 0) {
      console.log(`\n${category} (${tables.length}):`);
      tables.forEach(table => {
        console.log(`  ✅ ${table}`);
      });
    }
  });
}

listAllTables().catch(console.error);

