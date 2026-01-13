#!/usr/bin/env node

/**
 * Script d'exécution automatique des migrations RLS
 * Génère les instructions et vérifie la préparation
 * 
 * Usage: node scripts/execute-rls-migrations-auto.js [pattern]
 * 
 * Patterns disponibles:
 *   pattern4  - Admin Only (4 tables)
 *   pattern1  - user_id (6 tables)
 *   pattern2  - store_id (8 tables)
 *   pattern3  - Public (3 tables)
 *   all       - Tous les patterns (défaut)
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PATTERNS = {
  pattern4: {
    name: 'Pattern 4 - Admin Only',
    file: '20260113_rls_pattern_4_admin_only_combined.sql',
    tables: ['platform_settings', 'admin_config', 'system_logs', 'admin_actions'],
    priority: '🔴 CRITIQUE',
    description: 'Tables administratives critiques - Exécuter en premier',
  },
  pattern1: {
    name: 'Pattern 1 - user_id',
    file: '20260113_rls_pattern_1_user_id_combined.sql',
    tables: ['notifications', 'user_preferences', 'saved_addresses', 'certificates', 'user_sessions', 'user_activity_logs'],
    priority: '🟠 HAUTE',
    description: 'Tables liées aux utilisateurs',
  },
  pattern2: {
    name: 'Pattern 2 - store_id',
    file: '20260113_rls_pattern_2_store_id_combined.sql',
    tables: ['subscriptions', 'invoices', 'disputes', 'service_availability', 'recurring_bookings', 'warranty_claims', 'product_analytics', 'store_analytics'],
    priority: '🟠 HAUTE',
    description: 'Tables liées aux boutiques',
  },
  pattern3: {
    name: 'Pattern 3 - Public',
    file: '20260113_rls_pattern_3_public_combined.sql',
    tables: ['reviews', 'community_posts', 'public_reviews'],
    priority: '🟡 MOYENNE',
    description: 'Tables publiques',
  },
};

/**
 * Lire le contenu d'une migration
 */
async function readMigration(pattern) {
  const migrationFile = join(__dirname, '..', 'supabase', 'migrations', 'rls_execution', pattern.file);
  
  if (!existsSync(migrationFile)) {
    throw new Error(`Fichier de migration non trouvé: ${migrationFile}`);
  }

  return await readFile(migrationFile, 'utf-8');
}

/**
 * Générer les instructions d'exécution
 */
function generateInstructions(pattern, sql) {
  const instructions = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    EXÉCUTION MIGRATION RLS - ${pattern.name.padEnd(45)} ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 INFORMATIONS
   Priorité: ${pattern.priority}
   Tables concernées: ${pattern.tables.length}
   Description: ${pattern.description}

📝 TABLES CONCERNÉES:
${pattern.tables.map(t => `   • ${t}`).join('\n')}

🔧 ÉTAPES D'EXÉCUTION:

1. Ouvrir Supabase Dashboard
   → https://supabase.com/dashboard
   → Sélectionner votre projet
   → Cliquer sur "SQL Editor"

2. Créer une nouvelle requête

3. Copier le SQL ci-dessous et coller dans l'éditeur

4. Cliquer sur "Run" (ou Ctrl+Enter)

5. Vérifier qu'il n'y a pas d'erreurs

6. Vérifier les politiques créées avec:
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE schemaname = 'public' 
     AND tablename IN (${pattern.tables.map(t => `'${t}'`).join(', ')})
   ORDER BY tablename, cmd;

═══════════════════════════════════════════════════════════════════════════════
SQL À EXÉCUTER:
═══════════════════════════════════════════════════════════════════════════════

${sql}

═══════════════════════════════════════════════════════════════════════════════
`;

  return instructions;
}

/**
 * Générer un fichier d'instructions
 */
async function saveInstructions(pattern, instructions) {
  const outputFile = join(__dirname, '..', 'docs', 'audits', `INSTRUCTIONS_${pattern.name.replace(/\s+/g, '_').toUpperCase()}.md`);
  await import('fs').then(fs => fs.promises.writeFile(outputFile, instructions));
  return outputFile;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const patternArg = args[0] || 'all';

  console.log('🚀 Préparation des migrations RLS...\n');

  const patternsToExecute = patternArg === 'all' 
    ? Object.keys(PATTERNS) 
    : [patternArg];

  if (patternArg !== 'all' && !PATTERNS[patternArg]) {
    console.error(`❌ Pattern inconnu: ${patternArg}`);
    console.error(`   Patterns disponibles: ${Object.keys(PATTERNS).join(', ')}, all`);
    process.exit(1);
  }

  console.log(`📋 Patterns à exécuter: ${patternsToExecute.length}\n`);

  for (const patternKey of patternsToExecute) {
    const pattern = PATTERNS[patternKey];
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📦 ${pattern.name} (${pattern.priority})`);
    console.log('='.repeat(80));

    try {
      const sql = await readMigration(pattern);
      const instructions = generateInstructions(pattern, sql);
      
      // Afficher les instructions
      console.log(instructions);

      // Sauvegarder dans un fichier
      const outputFile = await saveInstructions(pattern, instructions);
      console.log(`\n✅ Instructions sauvegardées dans: ${outputFile}`);

    } catch (error) {
      console.error(`❌ Erreur pour ${pattern.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 RÉSUMÉ');
  console.log('='.repeat(80));
  console.log(`✅ ${patternsToExecute.length} pattern(s) préparé(s)`);
  console.log('\n💡 PROCHAINES ÉTAPES:');
  console.log('   1. Suivez les instructions ci-dessus pour chaque pattern');
  console.log('   2. Exécutez les migrations dans Supabase Dashboard');
  console.log('   3. Vérifiez avec: npm run verify:rls');
  console.log('   4. Consultez: docs/audits/GUIDE_EXECUTION_RLS_PRIORITE_1.md pour plus de détails');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
