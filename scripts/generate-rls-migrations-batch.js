#!/usr/bin/env node

/**
 * Script pour générer plusieurs migrations RLS en batch
 * 
 * Usage:
 *   node scripts/generate-rls-migrations-batch.js
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration des tables à migrer par pattern
const TABLES_BY_PATTERN = {
  1: [
    // Tables avec user_id (données utilisateur)
    'notifications',
    'user_preferences',
    'saved_addresses',
    'certificates',
    'user_sessions',
    'user_activity_logs',
  ],
  2: [
    // Tables avec store_id (données boutique)
    'subscriptions',
    'invoices',
    'disputes',
    'service_availability',
    'recurring_bookings',
    'warranty_claims',
    'product_analytics',
    'store_analytics',
  ],
  3: [
    // Tables publiques (marketplace)
    'reviews',
    'community_posts',
    'public_reviews',
  ],
  4: [
    // Tables admin seulement
    'platform_settings',
    'admin_config',
    'system_logs',
    'admin_actions',
  ],
};

/**
 * Génère les migrations pour toutes les tables configurées
 */
function generateBatchMigrations() {
  console.log('🚀 Génération Batch des Migrations RLS\n');
  console.log('=' .repeat(60));

  let totalGenerated = 0;
  let totalSkipped = 0;
  const errors = [];

  // Parcourir chaque pattern
  for (const [patternNum, tables] of Object.entries(TABLES_BY_PATTERN)) {
    const pattern = parseInt(patternNum);
    console.log(`\n📋 Pattern ${pattern} : ${tables.length} table(s)`);
    console.log('-'.repeat(60));

    for (const table of tables) {
      try {
        console.log(`  ⏳ Génération migration pour: ${table}...`);
        
        const command = `node scripts/generate-rls-migrations.js --table=${table} --pattern=${pattern}`;
        execSync(command, { 
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe',
          encoding: 'utf-8'
        });

        console.log(`  ✅ Migration générée: ${table}`);
        totalGenerated++;
      } catch (error) {
        const errorMsg = error.message || error.toString();
        if (errorMsg.includes('already exists') || errorMsg.includes('already has policies')) {
          console.log(`  ⏭️  Migration déjà existante: ${table}`);
          totalSkipped++;
        } else {
          console.error(`  ❌ Erreur pour ${table}:`, errorMsg);
          errors.push({ table, pattern, error: errorMsg });
        }
      }
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(60));
  console.log(`✅ Migrations générées: ${totalGenerated}`);
  console.log(`⏭️  Migrations ignorées: ${totalSkipped}`);
  console.log(`❌ Erreurs: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERREURS DÉTAILLÉES:');
    errors.forEach(({ table, pattern, error }) => {
      console.log(`  - ${table} (Pattern ${pattern}): ${error}`);
    });
  }

  console.log('\n📋 Prochaines étapes:');
  console.log('  1. Vérifier les migrations générées dans supabase/migrations/');
  console.log('  2. Adapter les colonnes si nécessaire');
  console.log('  3. Exécuter les migrations dans Supabase Dashboard');
  console.log('  4. Tester avec différents rôles\n');
}

// Exécuter si appelé directement
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || import.meta.url.includes('generate-rls-migrations-batch.js')) {
  generateBatchMigrations();
}

export { generateBatchMigrations, TABLES_BY_PATTERN };
