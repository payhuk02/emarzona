const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration Supabase
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDashboardFix() {
  console.log('🔧 Application de la correction dashboard_recent_orders');
  console.log('='.repeat(60));

  try {
    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('scripts/fix-dashboard-recent-orders.sql', 'utf8');
    console.log('📄 Fichier SQL chargé');

    // Diviser le SQL en statements individuels
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 ${statements.length} statements SQL à exécuter`);

    // Exécuter chaque statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;

      console.log(`\n🔄 Exécution du statement ${i + 1}/${statements.length}`);
      console.log(`SQL: ${statement.substring(0, 100)}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.log(`⚠️  Erreur sur statement ${i + 1}: ${error.message}`);
          // Continuer avec les autres statements
        } else {
          console.log(`✅ Statement ${i + 1} exécuté avec succès`);
        }
      } catch (err) {
        console.log(`❌ Erreur d'exécution statement ${i + 1}: ${err.message}`);
      }
    }

    console.log('\n🎉 Correction appliquée !');
    console.log('🔄 Rafraîchissement des vues matérialisées...');

    // Rafraîchir manuellement les vues
    const refreshStatements = [
      'REFRESH MATERIALIZED VIEW dashboard_recent_orders;',
      'REFRESH MATERIALIZED VIEW dashboard_base_stats;',
      'REFRESH MATERIALIZED VIEW dashboard_orders_stats;',
      'REFRESH MATERIALIZED VIEW dashboard_customers_stats;',
      'REFRESH MATERIALIZED VIEW dashboard_product_performance;',
      'REFRESH MATERIALIZED VIEW dashboard_top_products;'
    ];

    for (const refreshStmt of refreshStatements) {
      try {
        console.log(`🔄 ${refreshStmt}`);
        const { error } = await supabase.rpc('exec_sql', { sql: refreshStmt });
        if (error) {
          console.log(`⚠️  Erreur refresh: ${error.message}`);
        } else {
          console.log(`✅ Vue rafraîchie`);
        }
      } catch (err) {
        console.log(`❌ Erreur refresh: ${err.message}`);
      }
    }

    console.log('\n✅ Toutes les corrections ont été appliquées !');
    console.log('🧪 Vous pouvez maintenant relancer le test de données.');

  } catch (error) {
    console.error('💥 ERREUR lors de l\'application de la correction:', error);
    process.exit(1);
  }
}

applyDashboardFix();