// Test rapide de la fonction RPC get_dashboard_stats_rpc
// Pour vérifier si la correction du GROUP BY a fonctionné

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (à adapter selon votre environnement)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardRPC() {
  try {
    console.log('🧪 Test de la fonction get_dashboard_stats_rpc...');

    // Récupérer l'ID d'une boutique existante (à adapter)
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (storesError) {
      console.error('❌ Erreur lors de la récupération des boutiques:', storesError);
      return;
    }

    if (!stores || stores.length === 0) {
      console.log('⚠️ Aucune boutique trouvée');
      return;
    }

    const storeId = stores[0].id;
    console.log('📋 Test avec store_id:', storeId);

    // Tester la fonction RPC
    const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
      store_id: storeId,
      period_days: 30
    });

    if (error) {
      console.error('❌ Erreur RPC:', error);
      return;
    }

    console.log('✅ Succès ! Données reçues:');
    console.log('- Statistiques de base:', !!data?.baseStats);
    console.log('- Statistiques commandes:', !!data?.ordersStats);
    console.log('- Statistiques clients:', !!data?.customersStats);
    console.log('- Performance produits:', data?.productPerformance?.length || 0, 'éléments');
    console.log('- Top produits:', data?.topProducts?.length || 0, 'éléments');
    console.log('- Commandes récentes:', data?.recentOrders?.length || 0, 'éléments');

    if (data?.recentOrders && data.recentOrders.length > 0) {
      console.log('📦 Première commande récente:', {
        id: data.recentOrders[0].id,
        orderNumber: data.recentOrders[0].orderNumber,
        status: data.recentOrders[0].status,
        productTypes: data.recentOrders[0].productTypes
      });
    }

  } catch (err) {
    console.error('💥 Exception:', err);
  }
}

// Exécuter le test
testDashboardRPC();