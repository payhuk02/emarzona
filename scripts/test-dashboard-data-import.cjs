/**
 * Script de test pour vérifier l'importation des données du tableau de bord
 * Date: 18 janvier 2026
 *
 * Ce script teste :
 * 1. La connexion à Supabase
 * 2. L'existence et l'accessibilité des vues matérialisées
 * 3. Le fonctionnement de la fonction RPC get_dashboard_stats_rpc
 * 4. La complétude des données retournées
 * 5. La cohérence des calculs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase (valeurs codées en dur comme dans les autres scripts)
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

class DashboardDataTester {
  constructor() {
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': 'ℹ️ ',
      'success': '✅ ',
      'error': '❌ ',
      'warning': '⚠️ ',
      'test': '🧪 '
    }[type] || 'ℹ️ ';

    console.log(`[${timestamp}] ${prefix}${message}`);
  }

  async runTest(testName, testFunction) {
    this.log(`Démarrage du test: ${testName}`, 'test');

    try {
      const result = await testFunction();
      if (result.success) {
        this.results.passed++;
        this.log(`${testName}: ${result.message}`, 'success');
      } else if (result.warning) {
        this.results.warnings++;
        this.log(`${testName}: ${result.message}`, 'warning');
      } else {
        this.results.failed++;
        this.log(`${testName}: ${result.message}`, 'error');
      }

      this.results.tests.push({
        name: testName,
        success: result.success,
        warning: result.warning,
        message: result.message,
        details: result.details
      });

    } catch (error) {
      this.results.failed++;
      this.log(`${testName}: ERREUR - ${error.message}`, 'error');
      this.results.tests.push({
        name: testName,
        success: false,
        message: error.message,
        details: error.stack
      });
    }
  }

  async testSupabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .limit(1);

      if (error) throw error;

      return {
        success: true,
        message: 'Connexion Supabase établie avec succès',
        details: { storesCount: data?.length || 0 }
      };
    } catch (error) {
      return {
        success: false,
        message: `Échec de connexion Supabase: ${error.message}`,
        details: error
      };
    }
  }

  async testMaterializedViewsExist() {
    const views = [
      'dashboard_base_stats',
      'dashboard_orders_stats',
      'dashboard_customers_stats',
      'dashboard_product_performance',
      'dashboard_top_products',
      'dashboard_recent_orders'
    ];

    const results = {};

    for (const view of views) {
      try {
        const { data, error } = await supabase
          .from(view)
          .select('*')
          .limit(1);

        if (error && !error.message.includes('permission denied')) {
          results[view] = { exists: false, error: error.message };
        } else {
          results[view] = { exists: true, hasData: data && data.length > 0 };
        }
      } catch (error) {
        results[view] = { exists: false, error: error.message };
      }
    }

    const allExist = Object.values(results).every(r => r.exists);
    const hasData = Object.values(results).some(r => r.hasData);

    return {
      success: allExist,
      warning: !hasData,
      message: allExist
        ? (hasData ? 'Toutes les vues matérialisées existent et contiennent des données' : 'Toutes les vues matérialisées existent mais certaines sont vides')
        : 'Certaines vues matérialisées sont manquantes',
      details: results
    };
  }

  async testRPCFunction() {
    try {
      // D'abord, récupérer un store_id valide
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .limit(1);

      if (storesError) throw storesError;
      if (!stores || stores.length === 0) {
        return {
          success: false,
          message: 'Aucun store trouvé pour tester la fonction RPC',
          details: { stores: [] }
        };
      }

      const storeId = stores[0].id;
      this.log(`Test de la RPC avec store_id: ${storeId}`, 'info');

      // Tester la fonction RPC
      const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id_param: storeId,
        period_days_param: 365
      });

      if (error) throw error;

      // Vérifier la structure des données
      const requiredKeys = ['baseStats', 'ordersStats', 'customersStats', 'productPerformance', 'topProducts', 'recentOrders'];
      const missingKeys = requiredKeys.filter(key => !data || !(key in data));

      if (missingKeys.length > 0) {
        return {
          success: false,
          message: `Données RPC incomplètes, clés manquantes: ${missingKeys.join(', ')}`,
          details: { data, missingKeys }
        };
      }

      // Vérifier que les données ne sont pas nulles/vides
      const hasData = requiredKeys.every(key => {
        const value = data[key];
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined;
      });

      return {
        success: true,
        message: `Fonction RPC fonctionne correctement${hasData ? ' avec des données' : ' (données vides)'}`,
        details: {
          storeId,
          dataKeys: Object.keys(data),
          hasData,
          sampleData: {
            baseStats: data.baseStats,
            ordersCount: data.recentOrders?.length || 0,
            productsCount: data.topProducts?.length || 0
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Échec de la fonction RPC: ${error.message}`,
        details: error
      };
    }
  }

  async testDataConsistency() {
    try {
      // Récupérer un store_id
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1);

      if (!stores || stores.length === 0) {
        return {
          success: false,
          message: 'Aucun store trouvé pour tester la cohérence'
        };
      }

      const storeId = stores[0].id;

      // Récupérer les données via RPC
      const { data: rpcData } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id_param: storeId,
        period_days_param: 365
      });

      if (!rpcData) {
        return {
          success: false,
          message: 'Aucune donnée RPC pour tester la cohérence'
        };
      }

      // Vérifier la cohérence des totaux
      const issues = [];

      // Vérifier que les commandes correspondent aux stats
      if (rpcData.recentOrders && rpcData.ordersStats) {
        const recentOrdersTotal = rpcData.recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const statsTotal = rpcData.ordersStats.totalRevenue || 0;

        if (Math.abs(recentOrdersTotal - statsTotal) > 0.01) {
          issues.push(`Incohérence revenus: commandes récentes = ${recentOrdersTotal}, stats = ${statsTotal}`);
        }
      }

      // Vérifier les types de produits
      if (rpcData.productPerformance && rpcData.baseStats) {
        const performanceTotal = rpcData.productPerformance.reduce((sum, perf) => sum + (perf.productsSold || 0), 0);
        const baseTotal = rpcData.baseStats.totalProducts || 0;

        if (performanceTotal !== baseTotal) {
          issues.push(`Incohérence produits: performance = ${performanceTotal}, base = ${baseTotal}`);
        }
      }

      return {
        success: issues.length === 0,
        warning: issues.length > 0,
        message: issues.length === 0
          ? 'Données cohérentes entre toutes les vues'
          : `Incohérences détectées: ${issues.length}`,
        details: { issues, rpcData }
      };

    } catch (error) {
      return {
        success: false,
        message: `Erreur lors du test de cohérence: ${error.message}`,
        details: error
      };
    }
  }

  async testDataCompleteness() {
    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1);

      if (!stores || stores.length === 0) {
        return {
          success: false,
          message: 'Aucun store trouvé pour tester la complétude'
        };
      }

      const storeId = stores[0].id;
      const { data: rpcData } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id_param: storeId,
        period_days_param: 365
      });

      if (!rpcData) {
        return {
          success: false,
          message: 'Aucune donnée RPC récupérée'
        };
      }

      // Vérifier que toutes les propriétés requises sont présentes et non-nulles
      const requiredPaths = [
        'baseStats.totalProducts',
        'ordersStats.totalOrders',
        'customersStats.totalCustomers',
        'productPerformance',
        'topProducts',
        'recentOrders'
      ];

      const missingData = [];
      const zeroData = [];

      // Fonction récursive pour vérifier les chemins
      const checkPath = (obj, path) => {
        const keys = path.split('.');
        let current = obj;

        for (const key of keys) {
          if (current && typeof current === 'object' && key in current) {
            current = current[key];
          } else {
            missingData.push(path);
            return false;
          }
        }

        if (current === null || current === undefined) {
          missingData.push(path);
          return false;
        }

        if (typeof current === 'number' && current === 0) {
          zeroData.push(path);
        }

        return true;
      };

      requiredPaths.forEach(path => checkPath(rpcData, path));

      const completeness = ((requiredPaths.length - missingData.length) / requiredPaths.length) * 100;

      return {
        success: missingData.length === 0,
        warning: zeroData.length > 0,
        message: `Complétude des données: ${completeness.toFixed(1)}% (${missingData.length === 0 ? 'complète' : `${missingData.length} éléments manquants`})`,
        details: {
          completeness: completeness.toFixed(1) + '%',
          missingData,
          zeroData,
          totalRequired: requiredPaths.length,
          totalMissing: missingData.length,
          totalZero: zeroData.length
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Erreur lors du test de complétude: ${error.message}`,
        details: error
      };
    }
  }

  async runAllTests() {
    this.log('🚀 Démarrage des tests d\'importation des données du tableau de bord', 'info');
    this.log('='.repeat(70), 'info');

    await this.runTest('Connexion Supabase', () => this.testSupabaseConnection());
    await this.runTest('Existence des vues matérialisées', () => this.testMaterializedViewsExist());
    await this.runTest('Fonction RPC get_dashboard_stats_rpc', () => this.testRPCFunction());
    await this.runTest('Cohérence des données', () => this.testDataConsistency());
    await this.runTest('Complétude des données', () => this.testDataCompleteness());

    this.log('='.repeat(70), 'info');
    this.log(`📊 RÉSULTATS FINAUX:`, 'info');
    this.log(`✅ Tests réussis: ${this.results.passed}`, 'success');
    this.log(`⚠️  Avertissements: ${this.results.warnings}`, 'warning');
    this.log(`❌ Tests échoués: ${this.results.failed}`, 'error');
    this.log(`📈 Taux de succès: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`, 'info');

    // Sauvegarder les résultats
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dashboard-data-test-${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.tests.length,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        successRate: ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1) + '%'
      },
      tests: this.results.tests
    }, null, 2));

    this.log(`💾 Résultats sauvegardés dans: ${filename}`, 'info');

    return this.results;
  }
}

// Fonction principale
async function main() {
  const tester = new DashboardDataTester();

  try {
    const results = await tester.runAllTests();

    // Exit code basé sur les résultats
    if (results.failed > 0) {
      console.log('\n❌ ÉCHEC: Des données ne sont pas correctement importées');
      process.exit(1);
    } else if (results.warnings > 0) {
      console.log('\n⚠️  AVERTISSEMENT: Données importées mais avec des avertissements');
      process.exit(0);
    } else {
      console.log('\n✅ SUCCÈS: Toutes les données sont correctement importées');
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { DashboardDataTester };