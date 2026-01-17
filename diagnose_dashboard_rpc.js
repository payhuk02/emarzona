// Diagnostic complet de la fonction RPC get_dashboard_stats_rpc
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

async function diagnoseDashboardRPC() {
  console.log('🔍 DIAGNOSTIC COMPLET - get_dashboard_stats_rpc\n');

  try {
    // 1. Vérifier la session utilisateur
    console.log('1️⃣ Vérification de la session utilisateur...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('❌ Erreur session:', userError.message);
      return;
    }

    if (!user) {
      console.log('❌ Aucun utilisateur connecté');
      return;
    }

    console.log('✅ Utilisateur connecté:', user.id);

    // 2. Vérifier les boutiques de l'utilisateur
    console.log('\n2️⃣ Vérification des boutiques...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, slug')
      .eq('user_id', user.id);

    if (storesError) {
      console.error('❌ Erreur récupération boutiques:', storesError.message);
      return;
    }

    if (!stores || stores.length === 0) {
      console.log('⚠️ Aucune boutique trouvée pour cet utilisateur');
      console.log('💡 Créez d\'abord une boutique via l\'interface');
      return;
    }

    console.log(`✅ ${stores.length} boutique(s) trouvée(s):`);
    stores.forEach(store => {
      console.log(`   - ${store.name} (ID: ${store.id})`);
    });

    // Utiliser la première boutique pour les tests
    const testStore = stores[0];
    console.log(`\n🎯 Test avec la boutique: ${testStore.name} (${testStore.id})`);

    // 3. Tester directement la vue matérialisée
    console.log('\n3️⃣ Test de la vue matérialisée dashboard_recent_orders...');

    try {
      const { data: viewData, error: viewError } = await supabase
        .from('dashboard_recent_orders')
        .select('*')
        .limit(1);

      if (viewError) {
        console.error('❌ Erreur vue matérialisée:', viewError.message);
        console.error('🔍 Détails:', viewError.details);
        console.error('💡 Code:', viewError.code);
      } else {
        console.log('✅ Vue matérialisée accessible');
        console.log(`📊 ${viewData?.length || 0} enregistrement(s) trouvé(s)`);
      }
    } catch (viewException) {
      console.error('💥 Exception vue matérialisée:', viewException.message);
    }

    // 4. Tester la fonction RPC
    console.log('\n4️⃣ Test de la fonction RPC get_dashboard_stats_rpc...');

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id: testStore.id,
        period_days: 30
      });

      if (rpcError) {
        console.error('❌ Erreur RPC:', rpcError.message);
        console.error('🔍 Détails:', rpcError.details);
        console.error('💡 Code:', rpcError.code);

        // Analyser l'erreur spécifique
        if (rpcError.message?.includes('GROUP BY')) {
          console.log('\n🚨 PROBLÈME IDENTIFIÉ:');
          console.log('La vue matérialisée dashboard_recent_orders a encore l\'erreur GROUP BY');
          console.log('🔧 SOLUTION: Appliquer le SQL de correction dans Supabase SQL Editor');
        } else if (rpcError.message?.includes('does not exist')) {
          console.log('\n🚨 PROBLÈME IDENTIFIÉ:');
          console.log('La fonction RPC get_dashboard_stats_rpc n\'existe pas');
          console.log('🔧 SOLUTION: Appliquer la migration dashboard');
        }
      } else {
        console.log('✅ RPC réussie !');
        console.log('📊 Données reçues:', {
          baseStats: !!rpcData?.baseStats,
          ordersStats: !!rpcData?.ordersStats,
          customersStats: !!rpcData?.customersStats,
          productPerformance: rpcData?.productPerformance?.length || 0,
          topProducts: rpcData?.topProducts?.length || 0,
          recentOrders: rpcData?.recentOrders?.length || 0
        });
      }
    } catch (rpcException) {
      console.error('💥 Exception RPC:', rpcException.message);
    }

    // 5. Instructions de correction
    console.log('\n📋 INSTRUCTIONS DE CORRECTION:');
    console.log('===============================');

    if (rpcError?.message?.includes('GROUP BY')) {
      console.log('1. Ouvrez Supabase Dashboard > SQL Editor');
      console.log('2. Copiez-collez ce SQL:');
      console.log(`
-- Correction de dashboard_recent_orders
DROP MATERIALIZED VIEW IF EXISTS dashboard_recent_orders;

CREATE MATERIALIZED VIEW dashboard_recent_orders AS
SELECT
  o.id,
  o.order_number,
  o.total_amount,
  o.status,
  o.created_at,
  o.store_id,
  JSON_BUILD_OBJECT(
    'id', c.id,
    'name', c.name,
    'email', c.email
  ) as customer,
  COALESCE(ARRAY_AGG(DISTINCT p.product_type) FILTER (WHERE p.product_type IS NOT NULL), ARRAY[]::text[]) as product_types
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY o.id, o.order_number, o.total_amount, o.status, o.created_at, o.store_id, c.id, c.name, c.email
ORDER BY o.created_at DESC;

-- Index et permissions
CREATE INDEX IF NOT EXISTS idx_dashboard_recent_orders_store_created
ON dashboard_recent_orders(store_id, created_at DESC);

REFRESH MATERIALIZED VIEW dashboard_recent_orders;
GRANT SELECT ON dashboard_recent_orders TO authenticated;
      `);
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error.message);
  }

  console.log('\n🏁 Diagnostic terminé');
}

diagnoseDashboardRPC();