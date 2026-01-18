const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardFunction() {
  console.log('🧪 Test de la fonction RPC get_dashboard_stats_rpc');
  console.log('='.repeat(70));

  try {
    // 1. Tester si la fonction existe
    console.log('1️⃣ Vérification de l\'existence de la fonction...');

    try {
      const { data: testData, error: testError } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'get_dashboard_stats_rpc');

      if (testError) {
        console.log(`❌ Erreur lors de la vérification: ${testError.message}`);
      } else {
        console.log(`✅ Fonction trouvée dans pg_proc: ${testData?.length || 0} enregistrement(s)`);
      }
    } catch (err) {
      console.log(`⚠️  Impossible de vérifier via pg_proc: ${err.message}`);
    }

    // 2. Tester l'appel direct de la fonction
    console.log('\n2️⃣ Test d\'appel direct de la fonction RPC...');

    try {
      // Obtenir un store_id valide
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .limit(1);

      if (storesError) throw storesError;
      if (!stores || stores.length === 0) {
        throw new Error('Aucun store trouvé');
      }

      const storeId = stores[0].id;
      console.log(`📍 Test avec store_id: ${storeId} (${stores[0].name})`);

      // Tester la fonction RPC
      const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id: storeId,
        period_days: 30
      });

      if (error) {
        console.log(`❌ Erreur RPC: ${error.message}`);
        console.log('🔍 Détails:', error);

        // Si la fonction n'existe pas, créer une version simple pour test
        if (error.message.includes('does not exist') || error.message.includes('not found')) {
          console.log('\n🔧 La fonction n\'existe pas. Création d\'une version de test...');

          const createSimpleFunctionSQL = `
            CREATE OR REPLACE FUNCTION get_dashboard_stats_rpc(store_id UUID, period_days INTEGER DEFAULT 30)
            RETURNS JSON
            LANGUAGE sql
            SECURITY DEFINER
            SET search_path = public
            AS $$
              SELECT json_build_object(
                'test', true,
                'storeId', store_id,
                'periodDays', period_days,
                'timestamp', NOW(),
                'message', 'Fonction de test créée'
              );
            $$;
          `;

          console.log('📝 Création d\'une fonction de test simple...');
          console.log('⚠️  Cette fonction doit être remplacée par la vraie fonction.');

          // Note: On ne peut pas créer de fonctions via le client Supabase
          console.log('❌ Impossible de créer la fonction via le client Supabase');
          console.log('🔧 Veuillez exécuter manuellement le script SQL dans Supabase Dashboard');
        }
      } else {
        console.log('✅ Fonction RPC appelée avec succès!');
        console.log(`📊 Données reçues: ${Object.keys(data || {}).length} clés`);
        console.log('🔍 Échantillon:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      }

    } catch (error) {
      console.log(`💥 Erreur lors du test: ${error.message}`);
    }

    console.log('\n📋 Instructions pour corriger:');
    console.log('1. 📂 Ouvrir Supabase Dashboard > SQL Editor');
    console.log('2. 📄 Copier le contenu de scripts/create-dashboard-rpc-fix.sql');
    console.log('3. ▶️  Exécuter le script SQL');
    console.log('4. 🧪 Relancer ce test: node scripts/test-dashboard-function.cjs');

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error);
    process.exit(1);
  }
}

testDashboardFunction();