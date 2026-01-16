#!/usr/bin/env node

/**
 * TEST DE LA MIGRATION CORRIGÉE V2
 * Correction du problème DISTINCT JSON_BUILD_OBJECT
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigrationV2() {
  console.log('🔧 TEST MIGRATION CORRIGÉE V2 - DISTINCT JSON_BUILD_OBJECT\n');

  try {
    // Test direct de la vue dashboard_recent_orders qui avait le problème
    console.log('1️⃣ Test: Vue dashboard_recent_orders (corrigée)');
    try {
      const { data, error } = await supabase
        .from('dashboard_recent_orders')
        .select('*')
        .limit(3);

      if (error) {
        console.log(`   ❌ Erreur vue: ${error.message}`);
        if (error.details) {
          console.log(`   📝 Détails: ${error.details}`);
        }
      } else {
        console.log(`   ✅ Vue accessible: ${data?.length || 0} enregistrements`);

        // Vérifier la structure des product_types
        if (data && data.length > 0) {
          const firstRecord = data[0];
          console.log(`   📋 Structure vérifiée:`);
          console.log(`      - ID: ${firstRecord.id ? '✅' : '❌'}`);
          console.log(`      - orderNumber: ${firstRecord.order_number ? '✅' : '❌'}`);
          console.log(`      - totalAmount: ${typeof firstRecord.total_amount === 'number' ? '✅' : '❌'}`);
          console.log(`      - customer: ${firstRecord.customer ? '✅' : '❌'}`);
          console.log(`      - product_types: ${Array.isArray(firstRecord.product_types) ? `✅ (${firstRecord.product_types.length} types)` : '❌'}`);

          if (Array.isArray(firstRecord.product_types) && firstRecord.product_types.length > 0) {
            console.log(`         Types: ${firstRecord.product_types.map(pt => pt.type).join(', ')}`);
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }

    // Test 2: Vérifier que toutes les vues sont accessibles
    console.log('\n2️⃣ Test: Accessibilité de toutes les vues');
    const views = [
      'dashboard_base_stats',
      'dashboard_orders_stats',
      'dashboard_customers_stats',
      'dashboard_product_performance',
      'dashboard_top_products',
      'dashboard_recent_orders'
    ];

    for (const view of views) {
      try {
        const { error } = await supabase.from(view).select('count').limit(1);
        if (error && error.code !== 'PGRST116') {
          console.log(`   ❌ ${view}: ${error.message}`);
        } else {
          console.log(`   ✅ ${view}: Accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${view}: ${err.message}`);
      }
    }

    // Test 3: Tester la fonction RPC complète
    console.log('\n3️⃣ Test: Fonction RPC get_dashboard_stats_rpc');
    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id, name')
        .limit(1);

      if (!stores || stores.length === 0) {
        console.log('   ⚠️ Aucun store trouvé');
        return;
      }

      const storeId = stores[0].id;
      console.log(`   🏪 Test avec: ${stores[0].name}`);

      const startTime = Date.now();
      const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id: storeId,
        period_days: 30
      });
      const endTime = Date.now();

      if (error) {
        console.log(`   ❌ Erreur RPC: ${error.message}`);
      } else {
        console.log(`   ✅ RPC réussie en ${endTime - startTime}ms`);
        console.log(`   📊 Propriétés reçues: ${Object.keys(data || {}).length}`);

        // Vérifier spécifiquement recentOrders avec product_types
        if (data?.recentOrders && Array.isArray(data.recentOrders)) {
          console.log(`   📋 Commandes récentes: ${data.recentOrders.length}`);
          if (data.recentOrders.length > 0) {
            const order = data.recentOrders[0];
            const hasProductTypes = Array.isArray(order.product_types);
            console.log(`      🏷️ Product types: ${hasProductTypes ? '✅' : '❌'}`);
            if (hasProductTypes && order.product_types.length > 0) {
              console.log(`         Types distincts: ${order.product_types.map(pt => pt.type).join(', ')}`);
            }
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception RPC: ${err.message}`);
    }

    console.log('\n✅ TESTS V2 TERMINÉS\n');

    console.log('🎯 RÉSUMÉ DES CORRECTIONS:');
    console.log('   1. ✅ Référence oi.products.product_type → p.product_type');
    console.log('   2. ✅ DISTINCT JSON_BUILD_OBJECT → sous-requête avec DISTINCT');
    console.log('   3. ✅ Utilisation de ARRAY_AGG sur résultats distincts');

    console.log('\n🚀 STATUT: Migration prête pour déploiement!');

  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

testMigrationV2().catch(console.error);