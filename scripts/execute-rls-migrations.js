#!/usr/bin/env node

/**
 * Script pour exécuter les migrations RLS
 * Supporte l'exécution via Supabase CLI ou génère des instructions
 * 
 * Usage:
 *   node scripts/execute-rls-migrations.js
 *   node scripts/execute-rls-migrations.js --pattern=4
 *   node scripts/execute-rls-migrations.js --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vérifie si Supabase CLI est disponible
 */
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Exécute les migrations via Supabase CLI
 */
function executeViaCLI(patternFiles, patternName) {
  console.log(`\n🚀 Exécution via Supabase CLI pour Pattern ${patternName}\n`);
  console.log('='.repeat(80));

  const executionDir = path.join(__dirname, '..', 'supabase', 'migrations', 'rls_execution');
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  patternFiles.forEach((file, index) => {
    const filePath = path.join(executionDir, file.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  Fichier non trouvé: ${file.file}`);
      return;
    }

    try {
      console.log(`  [${index + 1}/${patternFiles.length}] Exécution: ${file.tableName}...`);
      
      // Exécuter via Supabase CLI
      execSync(`supabase db execute --file "${filePath}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        encoding: 'utf-8'
      });

      console.log(`  ✅ Migration exécutée: ${file.tableName}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Erreur pour ${file.tableName}:`, error.message);
      errors.push({ table: file.tableName, error: error.message });
      errorCount++;
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  console.log(`✅ Migrations réussies: ${successCount}`);
  console.log(`❌ Migrations échouées: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\n❌ ERREURS:');
    errors.forEach(({ table, error }) => {
      console.log(`  - ${table}: ${error}`);
    });
  }

  return { successCount, errorCount, errors };
}

/**
 * Génère des instructions pour exécution manuelle
 */
function generateManualInstructions(patternFiles, patternName) {
  const executionDir = path.join(__dirname, '..', 'supabase', 'migrations', 'rls_execution');
  
  console.log(`\n📋 Instructions pour Exécution Manuelle - Pattern ${patternName}\n`);
  console.log('='.repeat(80));
  console.log('\n1. Ouvrir Supabase Dashboard → SQL Editor');
  console.log('2. Pour chaque migration, suivre ces étapes:\n');

  patternFiles.forEach((file, index) => {
    const filePath = path.join(executionDir, file.file);
    const relativePath = path.relative(process.cwd(), filePath);
    
    console.log(`\nMigration ${index + 1}/${patternFiles.length}: ${file.tableName}`);
    console.log(`  Fichier: ${relativePath}`);
    console.log(`  Étapes:`);
    console.log(`    1. Ouvrir le fichier`);
    console.log(`    2. Copier tout le contenu (Ctrl+A, Ctrl+C)`);
    console.log(`    3. Coller dans SQL Editor (Ctrl+V)`);
    console.log(`    4. Exécuter (Run ou Ctrl+Enter)`);
    console.log(`    5. Vérifier les messages de succès`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Alternative: Utiliser le fichier combiné');
  
  const combinedFile = `20260113_rls_pattern_${patternFiles[0].pattern}_${patternName}_combined.sql`;
  const combinedPath = path.join(executionDir, combinedFile);
  
  if (fs.existsSync(combinedPath)) {
    console.log(`\n  Fichier combiné: ${path.relative(process.cwd(), combinedPath)}`);
    console.log(`  Ce fichier contient toutes les migrations du pattern en un seul fichier.`);
    console.log(`  Plus rapide à exécuter !`);
  }
}

/**
 * Fonction principale
 */
function executeRLSMigrations() {
  const args = process.argv.slice(2);
  const patternArg = args.find(arg => arg.startsWith('--pattern='));
  const allArg = args.includes('--all');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const executionDir = path.join(__dirname, '..', 'supabase', 'migrations', 'rls_execution');

  // Lire toutes les migrations RLS générées aujourd'hui
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.includes('_rls_') && file.endsWith('.sql') && file.startsWith('20260113'))
    .map(file => {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const tableMatch = content.match(/v_table_name text := '([^']+)'/);
      const tableName = tableMatch ? tableMatch[1] : null;
      
      const patternMatch = content.match(/Pattern: (\d+)/);
      const pattern = patternMatch ? parseInt(patternMatch[1]) : null;

      return { file, tableName, pattern, path: filePath };
    })
    .filter(f => f.pattern !== null && f.tableName !== null && f.tableName !== 'unknown');

  // Filtrer par pattern si spécifié
  let filteredFiles = files;
  if (patternArg) {
    const patternFilter = parseInt(patternArg.split('=')[1]);
    filteredFiles = files.filter(f => f.pattern === patternFilter);
  }

  // Grouper par pattern
  const byPattern = {};
  filteredFiles.forEach(file => {
    const pattern = file.pattern;
    if (!byPattern[pattern]) {
      byPattern[pattern] = [];
    }
    byPattern[pattern].push(file);
  });

  const patternNames = {
    1: 'user_id',
    2: 'store_id',
    3: 'public',
    4: 'admin_only',
  };

  console.log('🚀 Exécution des Migrations RLS\n');
  console.log('='.repeat(80));

  // Vérifier si Supabase CLI est disponible
  const hasCLI = checkSupabaseCLI();
  
  if (hasCLI) {
    console.log('✅ Supabase CLI détecté - Exécution automatique possible\n');
  } else {
    console.log('⚠️  Supabase CLI non détecté - Instructions manuelles générées\n');
    console.log('💡 Pour installer Supabase CLI:');
    console.log('   npm install -g supabase');
    console.log('   ou');
    console.log('   https://supabase.com/docs/guides/cli\n');
  }

  // Déterminer quels patterns exécuter
  const patternsToExecute = allArg 
    ? Object.keys(byPattern).sort().map(p => parseInt(p))
    : patternArg 
      ? [parseInt(patternArg.split('=')[1])]
      : [4]; // Par défaut, Pattern 4

  let totalSuccess = 0;
  let totalErrors = 0;

  // Exécuter chaque pattern
  for (const patternNum of patternsToExecute) {
    const patternFiles = byPattern[patternNum];
    if (!patternFiles || patternFiles.length === 0) {
      console.log(`\n⚠️  Aucune migration trouvée pour Pattern ${patternNum}`);
      continue;
    }

    const patternName = patternNames[patternNum] || `pattern_${patternNum}`;
    
    console.log(`\n📋 Pattern ${patternNum} (${patternName}): ${patternFiles.length} migration(s)`);
    console.log('-'.repeat(80));

    if (hasCLI) {
      // Exécuter via CLI
      const result = executeViaCLI(patternFiles, patternName);
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;
    } else {
      // Générer instructions manuelles
      generateManualInstructions(patternFiles, patternName);
    }
  }

  // Résumé final
  if (hasCLI) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(80));
    console.log(`✅ Total migrations réussies: ${totalSuccess}`);
    console.log(`❌ Total migrations échouées: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('\n🎉 Toutes les migrations ont été exécutées avec succès !');
    }
  } else {
    console.log('\n' + '='.repeat(80));
    console.log('📋 PROCHAINES ÉTAPES');
    console.log('='.repeat(80));
    console.log('1. Suivre les instructions ci-dessus');
    console.log('2. Ou installer Supabase CLI pour exécution automatique');
    console.log('3. Vérifier les résultats dans Supabase Dashboard');
  }

  console.log('\n');
}

// Afficher l'aide si nécessaire
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage:');
  console.log('  npm run execute:rls-migrations              # Exécuter Pattern 4 (par défaut)');
  console.log('  npm run execute:rls-migrations -- --pattern=1  # Exécuter Pattern 1');
  console.log('  npm run execute:rls-migrations -- --all        # Exécuter tous les patterns');
  console.log('\nOptions:');
  console.log('  --pattern=N    Exécuter un pattern spécifique (1, 2, 3, ou 4)');
  console.log('  --all          Exécuter tous les patterns dans l\'ordre');
  console.log('  --help         Afficher cette aide\n');
  process.exit(0);
}

executeRLSMigrations();
