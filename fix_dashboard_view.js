// Script pour corriger la vue matérialisée dashboard_recent_orders
// Exécute le SQL directement via Supabase

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDashboardView() {
  try {
    console.log('🔧 Correction de la vue matérialisée dashboard_recent_orders...');

    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('./fix_dashboard_view.sql', 'utf8');

    // Diviser en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 ${commands.length} commandes SQL à exécuter`);

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.includes('--') || command.trim() === '') continue;

      console.log(`⚡ Exécution commande ${i + 1}/${commands.length}`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });

        if (error) {
          console.error(`❌ Erreur commande ${i + 1}:`, error);
          // Continuer avec les autres commandes
        } else {
          console.log(`✅ Commande ${i + 1} exécutée`);
        }
      } catch (err) {
        console.error(`💥 Exception commande ${i + 1}:`, err.message);
      }
    }

    // Tester la vue corrigée
    console.log('🧪 Test de la vue corrigée...');
    const { data, error } = await supabase
      .from('dashboard_recent_orders')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Test échoué:', error);
    } else {
      console.log(`✅ Test réussi: ${data} enregistrements dans la vue`);
    }

    // Tester la fonction RPC
    console.log('🚀 Test de la fonction RPC...');
    const testStoreId = '58874540-6553-45e3-bc98-14ea3808208c'; // À adapter

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_stats_rpc', {
      store_id: testStoreId,
      period_days: 30
    });

    if (rpcError) {
      console.error('❌ RPC test échoué:', rpcError);
    } else {
      console.log('✅ RPC test réussi !');
      console.log('- Statistiques de base:', !!rpcData?.baseStats);
      console.log('- Commandes récentes:', rpcData?.recentOrders?.length || 0);
    }

  } catch (error) {
    console.error('💥 Exception générale:', error);
  }
}

// Exécuter la correction
fixDashboardView();