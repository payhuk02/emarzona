// Benchmark des performances de chargement des données de produits
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class DashboardProductsBenchmark {
  constructor() {
    this.results = [];
    this.testStoreId = null;
  }

  async runBenchmark() {
    console.log('🏁 DÉMARRAGE DU BENCHMARK - CHARGEMENT PRODUITS DASHBOARD\n');

    try {
      // 1. Préparation
      await this.setup();

      // 2. Tests individuels
      await this.benchmarkBaseStats();
      await this.benchmarkProductPerformance();
      await this.benchmarkTopProducts();
      await this.benchmarkRPCFull();

      // 3. Rapport final
      this.generateReport();

    } catch (error) {
      console.error('💥 Erreur lors du benchmark:', error.message);
    }
  }

  async setup() {
    console.log('1️⃣ Configuration du benchmark...');

    // Récupérer un storeId valide
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1);

    if (error || !stores || stores.length === 0) {
      throw new Error('Aucune boutique trouvée');
    }

    this.testStoreId = stores[0].id;
    console.log(`✅ Boutique de test: ${stores[0].name} (${this.testStoreId})`);
  }

  async benchmarkBaseStats() {
    console.log('\n2️⃣ Test dashboard_base_stats...');

    const startTime = performance.now();

    const { data, error } = await supabase
      .from('dashboard_base_stats')
      .select('*')
      .eq('store_id', this.testStoreId)
      .single();

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
      this.results.push({
        test: 'base_stats',
        duration,
        success: false,
        error: error.message
      });
    } else {
      console.log(`✅ Succès en ${duration.toFixed(2)}ms`);
      console.log(`   📊 Produits: ${data.total_products} total, ${data.active_products} actifs`);
      console.log(`   💰 Prix moyen: ${data.avg_product_price?.toFixed(2)} FCFA`);

      this.results.push({
        test: 'base_stats',
        duration,
        success: true,
        dataSize: JSON.stringify(data).length,
        metrics: data
      });
    }
  }

  async benchmarkProductPerformance() {
    console.log('\n3️⃣ Test dashboard_product_performance...');

    const startTime = performance.now();

    const { data, error } = await supabase
      .from('dashboard_product_performance')
      .select('*')
      .eq('store_id', this.testStoreId);

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
      this.results.push({
        test: 'product_performance',
        duration,
        success: false,
        error: error.message
      });
    } else {
      console.log(`✅ Succès en ${duration.toFixed(2)}ms`);
      console.log(`   📈 ${data.length} types de produits analysés`);

      data.forEach(type => {
        console.log(`      ${type.product_type}: ${type.total_orders} cmd, ${type.total_revenue} FCFA`);
      });

      this.results.push({
        test: 'product_performance',
        duration,
        success: true,
        dataSize: JSON.stringify(data).length,
        recordCount: data.length,
        metrics: data
      });
    }
  }

  async benchmarkTopProducts() {
    console.log('\n4️⃣ Test dashboard_top_products...');

    const startTime = performance.now();

    const { data, error } = await supabase
      .from('dashboard_top_products')
      .select('*')
      .eq('store_id', this.testStoreId)
      .order('rank')
      .limit(10);

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
      this.results.push({
        test: 'top_products',
        duration,
        success: false,
        error: error.message
      });
    } else {
      console.log(`✅ Succès en ${duration.toFixed(2)}ms`);
      console.log(`   🏆 ${data.length} top produits récupérés`);

      data.slice(0, 3).forEach((product, index) => {
        console.log(`      ${index + 1}. ${product.name}: ${product.total_revenue} FCFA`);
      });

      this.results.push({
        test: 'top_products',
        duration,
        success: true,
        dataSize: JSON.stringify(data).length,
        recordCount: data.length,
        metrics: data
      });
    }
  }

  async benchmarkRPCFull() {
    console.log('\n5️⃣ Test RPC complet get_dashboard_stats_rpc...');

    const startTime = performance.now();

    const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
      store_id: this.testStoreId,
      period_days: 30
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (error) {
      console.log(`❌ Erreur RPC: ${error.message}`);
      this.results.push({
        test: 'rpc_full',
        duration,
        success: false,
        error: error.message
      });
    } else {
      console.log(`✅ RPC réussie en ${duration.toFixed(2)}ms`);
      console.log(`   📦 Données complètes reçues:`);
      console.log(`      Base stats: ${!!data?.baseStats}`);
      console.log(`      Product perf: ${data?.productPerformance?.length || 0} types`);
      console.log(`      Top products: ${data?.topProducts?.length || 0} produits`);
      console.log(`      Recent orders: ${data?.recentOrders?.length || 0} commandes`);

      this.results.push({
        test: 'rpc_full',
        duration,
        success: true,
        dataSize: JSON.stringify(data).length,
        hasBaseStats: !!data?.baseStats,
        productTypesCount: data?.productPerformance?.length || 0,
        topProductsCount: data?.topProducts?.length || 0,
        recentOrdersCount: data?.recentOrders?.length || 0
      });
    }
  }

  generateReport() {
    console.log('\n📊 RAPPORT DE PERFORMANCE\n');

    const successfulTests = this.results.filter(r => r.success);
    const failedTests = this.results.filter(r => !r.success);

    console.log(`✅ Tests réussis: ${successfulTests.length}/${this.results.length}`);
    console.log(`❌ Tests échoués: ${failedTests.length}`);

    if (failedTests.length > 0) {
      console.log('\n❌ Tests échoués:');
      failedTests.forEach(test => {
        console.log(`   - ${test.test}: ${test.error}`);
      });
    }

    if (successfulTests.length > 0) {
      console.log('\n📈 Performances des tests réussis:');

      const avgDuration = successfulTests.reduce((sum, test) => sum + test.duration, 0) / successfulTests.length;
      const totalDataSize = successfulTests.reduce((sum, test) => sum + (test.dataSize || 0), 0);

      console.log(`   ⏱️  Durée moyenne: ${avgDuration.toFixed(2)}ms`);
      console.log(`   📦 Taille totale des données: ${(totalDataSize / 1024).toFixed(2)} KB`);

      successfulTests.forEach(test => {
        console.log(`   ${test.test}: ${test.duration.toFixed(2)}ms (${(test.dataSize / 1024).toFixed(2)} KB)`);

        if (test.test === 'rpc_full') {
          console.log(`      📊 Métriques: ${test.productTypesCount} types, ${test.topProductsCount} top prod, ${test.recentOrdersCount} orders`);
        } else if (test.recordCount) {
          console.log(`      📊 Enregistrements: ${test.recordCount}`);
        }
      });
    }

    console.log('\n🎯 RECOMMANDATIONS:');

    const rpcTest = this.results.find(r => r.test === 'rpc_full');
    if (rpcTest?.success && rpcTest.duration > 1000) {
      console.log('⚠️  RPC lente (>1s) - Considérer optimisation des vues matérialisées');
    }

    const baseStatsTest = this.results.find(r => r.test === 'base_stats');
    if (baseStatsTest?.success && baseStatsTest.metrics?.total_products > 1000) {
      console.log('⚠️  Beaucoup de produits - Considérer partitionnement ou index supplémentaires');
    }

    console.log('✅ Benchmark terminé avec succès');
  }
}

// Exécuter le benchmark
const benchmark = new DashboardProductsBenchmark();
benchmark.runBenchmark();