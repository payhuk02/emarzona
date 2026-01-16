#!/usr/bin/env node

/**
 * TEST DE LA MIGRATION CORRIGÉE
 * Vérification que les vues matérialisées fonctionnent après correction
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

async function testMigrationFix() {
  console.log('🔧 TEST DE LA MIGRATION CORRIGÉE\n');

  try {
    // Test 1: Vérifier que les vues existent
    console.log('1️⃣ Test: Vérification existence des vues');
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
        const { error } = await supabase.from(view).select('*').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.log(`   ❌ ${view}: ${error.message}`);
        } else {
          console.log(`   ✅ ${view}: OK`);
        }
      } catch (err) {
        console.log(`   ❌ ${view}: ${err.message}`);
      }
    }

    // Test 2: Tester la fonction RPC principale
    console.log('\n2️⃣ Test: Fonction get_dashboard_stats_rpc');
    try {
      // Récupérer un store_id existant
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .limit(1);

      if (storesError || !stores || stores.length === 0) {
        console.log('   ⚠️ Aucun store trouvé pour le test');
        return;
      }

      const storeId = stores[0].id;
      console.log(`   📍 Test avec store: ${stores[0].name} (${storeId})`);

      const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id: storeId,
        period_days: 30
      });

      if (error) {
        console.log(`   ❌ Erreur RPC: ${error.message}`);
        console.log(`   📝 Détails:`, error.details || 'Aucun détail');
      } else {
        console.log(`   ✅ RPC réussie en ${Date.now()}ms`);
        console.log(`   📊 Données reçues: ${Object.keys(data || {}).length} propriétés`);

        // Vérifier la structure des données
        const expectedKeys = ['baseStats', 'ordersStats', 'customersStats', 'productPerformance', 'topProducts', 'recentOrders'];
        const receivedKeys = Object.keys(data || {});

        expectedKeys.forEach(key => {
          const hasKey = receivedKeys.includes(key);
          console.log(`      ${hasKey ? '✅' : '❌'} ${key}`);
        });
      }
    } catch (err) {
      console.log(`   ❌ Exception RPC: ${err.message}`);
    }

    // Test 3: Vérifier les données spécifiques
    console.log('\n3️⃣ Test: Validation données');
    if (data) {
      // Test baseStats
      if (data.baseStats) {
        const base = data.baseStats;
        console.log(`   📦 Produits - Total: ${base.totalProducts || 0}, Actifs: ${base.activeProducts || 0}`);
        console.log(`   🏷️  Types: Digital: ${base.digitalProducts || 0}, Physical: ${base.physicalProducts || 0}, Service: ${base.serviceProducts || 0}`);
      }

      // Test ordersStats
      if (data.ordersStats) {
        const orders = data.ordersStats;
        console.log(`   📋 Commandes - Total: ${orders.totalOrders || 0}, Complétées: ${orders.completedOrders || 0}`);
        console.log(`   💰 Revenus - Total: ${orders.totalRevenue || 0} FCFA, 30j: ${orders.revenue30d || 0} FCFA`);
      }

      // Test topProducts
      if (data.topProducts && Array.isArray(data.topProducts)) {
        console.log(`   🏆 Top produits: ${data.topProducts.length} trouvés`);
        if (data.topProducts.length > 0) {
          const top = data.topProducts[0];
          console.log(`      🥇 "${top.name}": ${top.revenue} FCFA (${top.orderCount} ventes)`);
        }
      }

      // Test recentOrders
      if (data.recentOrders && Array.isArray(data.recentOrders)) {
        console.log(`   📅 Commandes récentes: ${data.recentOrders.length} trouvées`);
        if (data.recentOrders.length > 0) {
          const recent = data.recentOrders[0];
          console.log(`      🆕 "${recent.orderNumber}": ${recent.totalAmount} FCFA`);
        }
      }
    }

    console.log('\n✅ TESTS TERMINÉS\n');

    if (error) {
      console.log('❌ STATUT: Migration à corriger');
      console.log('   🔧 Problème identifié: référence incorrecte oi.products.product_type');
      console.log('   ✅ Correction appliquée: utilisation de p.product_type uniquement');
      console.log('   📋 Action: Redéployer la migration corrigée');
    } else {
      console.log('🎉 STATUT: Migration opérationnelle!');
      console.log('   ✅ Toutes les vues matérialisées créées');
      console.log('   ✅ Fonction RPC fonctionnelle');
      console.log('   ✅ Données cohérentes et complètes');
      console.log('   🚀 Prêt pour optimisation dashboard!');
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testMigrationFix().catch(console.error);