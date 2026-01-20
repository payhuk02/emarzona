#!/usr/bin/env node

/**
 * Script pour afficher le SQL de migration dashboard à copier dans Supabase
 */

import fs from 'fs';
import path from 'path';

function showMigrationSQL() {
  console.log('📋 SQL MIGRATION DASHBOARD - À COPIER DANS SUPABASE\n');
  console.log('=' .repeat(60));
  console.log('Aller sur: https://app.supabase.com/project/hbdnzajbyjakdhuavrvb/sql');
  console.log('Créer une nouvelle query et coller le SQL ci-dessous:');
  console.log('=' .repeat(60));
  console.log('');

  try {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260121_dashboard_materialized_views.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(migrationSQL);

    console.log('');
    console.log('=' .repeat(60));
    console.log('📝 APRÈS EXÉCUTION:');
    console.log('1. Vérifier que la fonction get_dashboard_stats_rpc() existe');
    console.log('2. Tester avec: SELECT get_dashboard_stats_rpc(\'your-store-id\'::uuid, 30);');
    console.log('3. Redémarrer l\'application: npm run dev');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier:', error.message);
  }
}

showMigrationSQL();