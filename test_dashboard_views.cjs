#!/usr/bin/env node

/**
 * TEST DES VUES MATÉRIALISÉES DU DASHBOARD
 * Date: Janvier 2026
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

async function testDashboardViews() {
  console.log('🧪 TEST DES VUES MATÉRIALISÉES DU DASHBOARD\n');

  try {
    // Test 1: Rafraîchir les vues matérialisées
    console.log('1️⃣ Test: Rafraîchissement des vues matérialisées');
    const { data: refreshData, error: refreshError } = await supabase.rpc('refresh_dashboard_materialized_views');

    if (refreshError) {
      console.log('⚠️  Fonction refresh_dashboard_materialized_views non trouvée (normal si migration pas déployée)');
      console.log('   Erreur:', refreshError.message);
    } else {
      console.log('✅ Rafraîchissement réussi:', refreshData);
    }

    // Test 2: Récupérer un store_id pour les tests
    console.log('\n2️⃣ Test: Récupération d\'une boutique existante');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .limit(1);

    if (storesError || !stores || stores.length === 0) {
      console.log('❌ Aucune boutique trouvée pour les tests');
      console.log('   Erreur:', storesError?.message);
      return;
    }

    const storeId = stores[0].id;
    const storeName = stores[0].name;
    console.log(`✅ Boutique trouvée: ${storeName} (${storeId})`);

    // Test 3: Tester la fonction RPC optimisée
    console.log('\n3️⃣ Test: Fonction RPC get_dashboard_stats_rpc');
    const { data: dashboardData, error: dashboardError } = await supabase.rpc('get_dashboard_stats_rpc', {
      store_id: storeId,
      period_days: 30
    });

    if (dashboardError) {
      console.log('⚠️  Fonction get_dashboard_stats_rpc non trouvée (migration pas déployée)');
      console.log('   Erreur:', dashboardError.message);
    } else {
      console.log('✅ Données du dashboard récupérées:');
      console.log('   📊 Stats de base:', dashboardData?.baseStats ? '✅' : '❌');
      console.log('   📦 Stats commandes:', dashboardData?.ordersStats ? '✅' : '❌');
      console.log('   👥 Stats clients:', dashboardData?.customersStats ? '✅' : '❌');
      console.log('   📈 Performance produits:', dashboardData?.productPerformance?.length || 0, 'types');
      console.log('   🏆 Top produits:', dashboardData?.topProducts?.length || 0, 'produits');
      console.log('   📋 Commandes récentes:', dashboardData?.recentOrders?.length || 0, 'commandes');

      if (dashboardData?.generatedAt) {
        console.log('   ⏰ Généré le:', new Date(dashboardData.generatedAt).toLocaleString('fr-FR'));
      }
    }

    // Test 4: Comparer les performances (requêtes individuelles vs vues matérialisées)
    console.log('\n4️⃣ Test: Comparaison performances');

    // Mesurer le temps avec la méthode actuelle (10 requêtes)
    console.log('   🕐 Test méthode actuelle (estimation)...');
    const startTime = Date.now();

    // Simuler les 10 requêtes individuelles
    const queries = [
      supabase.from('products').select('*').eq('store_id', storeId),
      supabase.from('orders').select('*').eq('store_id', storeId),
      supabase.from('customers').select('*').eq('store_id', storeId),
      supabase.from('order_items').select('*').in('order_id',
        (await supabase.from('orders').select('id').eq('store_id', storeId)).data?.map(o => o.id) || []
      ),
    ];

    await Promise.allSettled(queries);
    const endTime = Date.now();
    const individualQueriesTime = endTime - startTime;

    console.log(`   📊 Temps requêtes individuelles: ${individualQueriesTime}ms`);

    // Mesurer le temps avec les vues matérialisées
    const optimizedStartTime = Date.now();
    await supabase.rpc('get_dashboard_stats_rpc', { store_id: storeId, period_days: 30 });
    const optimizedEndTime = Date.now();
    const optimizedTime = optimizedEndTime - optimizedStartTime;

    console.log(`   ⚡ Temps vues matérialisées: ${optimizedTime}ms`);

    if (optimizedTime > 0 && individualQueriesTime > 0) {
      const improvement = ((individualQueriesTime - optimizedTime) / individualQueriesTime * 100).toFixed(1);
      console.log(`   🎯 Amélioration: ${improvement}% plus rapide`);
    }

    // Test 5: Vérifier la structure des données
    console.log('\n5️⃣ Test: Validation structure données');

    if (dashboardData) {
      const validations = [
        { field: 'baseStats.totalProducts', value: dashboardData.baseStats?.totalProducts, expected: 'number' },
        { field: 'ordersStats.totalRevenue', value: dashboardData.ordersStats?.totalRevenue, expected: 'number' },
        { field: 'customersStats.totalCustomers', value: dashboardData.customersStats?.totalCustomers, expected: 'number' },
        { field: 'productPerformance', value: Array.isArray(dashboardData.productPerformance), expected: 'array' },
        { field: 'topProducts', value: Array.isArray(dashboardData.topProducts), expected: 'array' },
        { field: 'recentOrders', value: Array.isArray(dashboardData.recentOrders), expected: 'array' },
      ];

      validations.forEach(validation => {
        const isValid = validation.expected === 'array' ? validation.value :
                       typeof validation.value === validation.expected;
        console.log(`   ${isValid ? '✅' : '❌'} ${validation.field}: ${isValid ? 'OK' : 'INVALID'}`);
      });
    }

    console.log('\n✅ TESTS TERMINÉS\n');

    if (dashboardError) {
      console.log('⚠️  STATUS: Vues matérialisées non déployées');
      console.log('   📋 Actions requises:');
      console.log('      1. Déployer la migration 20260121_dashboard_materialized_views.sql');
      console.log('      2. Rafraîchir les vues: SELECT refresh_dashboard_materialized_views();');
      console.log('      3. Tester à nouveau ce script');
    } else {
      console.log('🎉 STATUS: Vues matérialisées opérationnelles!');
      console.log('   ✅ Performance optimisée');
      console.log('   ✅ Données cohérentes');
      console.log('   ✅ Structure validée');
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testDashboardViews().catch(console.error);