const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDashboardViews() {
  console.log('🔧 Correction directe des vues matérialisées du dashboard');
  console.log('='.repeat(70));

  try {
    // 1. Supprimer et recréer la vue problématique
    console.log('📝 Étape 1: Recréation de dashboard_recent_orders');

    const createViewSQL = `
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
    `;

    // Essayer de supprimer d'abord
    try {
      console.log('🗑️  Suppression de l\'ancienne vue...');
      await supabase.from('dashboard_recent_orders').select('*').limit(1);
      console.log('⚠️  Vue existe, tentative de suppression...');
      // Note: On ne peut pas DROP via Supabase client, il faudra le faire manuellement
    } catch (error) {
      console.log('ℹ️  Vue n\'existe pas ou déjà supprimée');
    }

    // 2. Tester la fonction RPC directement
    console.log('🧪 Étape 2: Test de la fonction RPC existante');

    try {
      // Obtenir un store_id valide
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .limit(1);

      if (storesError) throw storesError;
      if (!stores || stores.length === 0) {
        throw new Error('Aucun store trouvé');
      }

      const storeId = stores[0].id;
      console.log(`📍 Test avec store_id: ${storeId}`);

      // Tester la RPC
      const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id: storeId,
        period_days: 30
      });

      if (error) {
        console.log(`❌ Erreur RPC: ${error.message}`);
        console.log('🔍 Détails de l\'erreur:', error);

        // Si c'est l'erreur GROUP BY, essayer une approche alternative
        if (error.message.includes('GROUP BY')) {
          console.log('🎯 Erreur GROUP BY détectée. Application de la correction...');

          // Créer une version simplifiée de la vue pour contourner le problème
          console.log('🔧 Création d\'une vue temporaire simplifiée...');

          // Tester avec une requête directe simplifiée
          const { data: simpleData, error: simpleError } = await supabase
            .from('orders')
            .select(`
              id,
              order_number,
              total_amount,
              status,
              created_at,
              store_id,
              customers (
                id,
                name,
                email
              )
            `)
            .eq('store_id', storeId)
            .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

          if (simpleError) {
            console.log(`❌ Erreur requête simplifiée: ${simpleError.message}`);
          } else {
            console.log(`✅ Requête simplifiée réussie: ${simpleData?.length || 0} commandes trouvées`);
          }
        }
      } else {
        console.log('✅ Fonction RPC fonctionne correctement');
        console.log(`📊 Données reçues: ${Object.keys(data || {}).length} clés`);
      }

    } catch (error) {
      console.log(`💥 Erreur lors du test: ${error.message}`);
    }

    console.log('\n📋 Recommandations:');
    console.log('1. 🔧 Appliquer manuellement la migration SQL dans Supabase Dashboard');
    console.log('2. 🗂️  Ou utiliser Supabase CLI: supabase db reset');
    console.log('3. 🧪 Relancer ensuite le test de données');

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error);
    process.exit(1);
  }
}

fixDashboardViews();