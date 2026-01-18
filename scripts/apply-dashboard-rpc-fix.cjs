const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration Supabase
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRPCFix() {
  console.log('🔧 Application de la correction RPC du dashboard');
  console.log('='.repeat(70));

  try {
    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('scripts/create-dashboard-rpc-fix.sql', 'utf8');
    console.log('📄 Fichier SQL de correction chargé');

    // Diviser en statements individuels (plus intelligemment)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .filter(stmt => !stmt.startsWith('--'))
      .filter(stmt => !stmt.includes('DO $$') && !stmt.includes('END $$'));

    console.log(`📝 ${statements.length} statements SQL principaux à exécuter`);

    // Traiter différemment le block DO $$
    const doBlock = sqlContent.match(/DO \$\$[\s\S]*?END \$\$;/);
    if (doBlock) {
      console.log('🎯 Block DO $$ détecté et traité séparément');
    }

    // Exécuter chaque statement principal
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;

      console.log(`\n🔄 Exécution du statement ${i + 1}/${statements.length}`);
      console.log(`SQL: ${statement.substring(0, 80).replace(/\n/g, ' ')}...`);

      try {
        // Pour les fonctions, on utilise une approche différente
        if (statement.includes('CREATE OR REPLACE FUNCTION')) {
          console.log('⚠️  Fonction détectée - utilisation de requête directe');

          // Tester d'abord si on peut exécuter via RPC
          const { error } = await supabase.from('profiles').select('count').limit(1);
          if (error) {
            console.log('❌ Impossible d\'exécuter les fonctions SQL via client');
            console.log('🔧 Veuillez appliquer manuellement le fichier SQL dans Supabase Dashboard');
            break;
          }
        } else {
          // Pour les autres statements, essayer via une approche directe
          console.log('⚠️  Statement non supporté via client Supabase');
        }

      } catch (err) {
        console.log(`❌ Erreur d'exécution statement ${i + 1}: ${err.message}`);
      }
    }

    console.log('\n📋 Instructions manuelles:');
    console.log('1. 📂 Ouvrir Supabase Dashboard > SQL Editor');
    console.log('2. 📄 Copier le contenu de scripts/create-dashboard-rpc-fix.sql');
    console.log('3. ▶️  Exécuter le script SQL');
    console.log('4. 🧪 Relancer le test: node scripts/test-dashboard-data-import.cjs');

    // Tester si la correction a fonctionné
    console.log('\n🧪 Test de la correction...');

    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1);

      if (stores && stores.length > 0) {
        const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
          store_id: stores[0].id,
          period_days: 30
        });

        if (error) {
          console.log(`❌ Test échoué: ${error.message}`);
        } else {
          console.log(`✅ Test réussi ! Données reçues: ${Object.keys(data || {}).length} clés`);
        }
      }
    } catch (error) {
      console.log(`❌ Erreur de test: ${error.message}`);
    }

  } catch (error) {
    console.error('💥 ERREUR lors de l\'application de la correction:', error);
    process.exit(1);
  }
}

applyRPCFix();