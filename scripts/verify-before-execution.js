#!/usr/bin/env node

/**
 * Script pour vérifier l'état des tables avant l'exécution des migrations RLS
 * Génère des requêtes SQL de vérification prêtes à exécuter
 * 
 * Usage:
 *   node scripts/verify-before-execution.js
 *   node scripts/verify-before-execution.js --pattern=4
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Génère les requêtes SQL de vérification
 */
function generateVerificationQueries() {
  const args = process.argv.slice(2);
  const patternArg = args.find(arg => arg.startsWith('--pattern='));

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const outputDir = path.join(__dirname, '..', 'supabase', 'migrations', 'rls_execution');

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

      return { file, tableName, pattern };
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

  console.log('🔍 Génération des Requêtes de Vérification\n');
  console.log('='.repeat(80));

  // Générer les requêtes SQL
  const queries = [];

  Object.keys(byPattern).sort().forEach(patternNum => {
    const pattern = parseInt(patternNum);
    const patternFiles = byPattern[pattern];
    const patternName = patternNames[pattern] || `pattern_${pattern}`;
    const tableNames = patternFiles.map(f => f.tableName);

    queries.push(`-- ============================================================`);
    queries.push(`-- Vérification Pattern ${pattern} (${patternName})`);
    queries.push(`-- Tables: ${tableNames.join(', ')}`);
    queries.push(`-- ============================================================\n`);

    // Vérifier que RLS est activé
    queries.push(`-- 1. Vérifier que RLS est activé sur toutes les tables`);
    queries.push(`SELECT`);
    queries.push(`  tablename,`);
    queries.push(`  rowsecurity as rls_enabled,`);
    queries.push(`  CASE WHEN rowsecurity THEN '✅ RLS activé' ELSE '❌ RLS NON activé' END as status`);
    queries.push(`FROM pg_tables`);
    queries.push(`WHERE schemaname = 'public'`);
    queries.push(`  AND tablename IN (${tableNames.map(t => `'${t}'`).join(', ')});`);
    queries.push(``);

    // Vérifier les politiques existantes
    queries.push(`-- 2. Vérifier les politiques existantes`);
    queries.push(`SELECT`);
    queries.push(`  tablename,`);
    queries.push(`  COUNT(*) as policy_count,`);
    queries.push(`  STRING_AGG(cmd::text, ', ') as operations`);
    queries.push(`FROM pg_policies`);
    queries.push(`WHERE schemaname = 'public'`);
    queries.push(`  AND tablename IN (${tableNames.map(t => `'${t}'`).join(', ')})`);
    queries.push(`GROUP BY tablename`);
    queries.push(`ORDER BY tablename;`);
    queries.push(``);

    // Vérifier les colonnes nécessaires
    if (pattern === 1 || pattern === 3) {
      queries.push(`-- 3. Vérifier la présence de la colonne user_id`);
      tableNames.forEach(tableName => {
        queries.push(`SELECT`);
        queries.push(`  '${tableName}' as table_name,`);
        queries.push(`  EXISTS(`);
        queries.push(`    SELECT 1 FROM information_schema.columns`);
        queries.push(`    WHERE table_schema = 'public'`);
        queries.push(`      AND table_name = '${tableName}'`);
        queries.push(`      AND column_name = 'user_id'`);
        queries.push(`  ) as has_user_id;`);
      });
      queries.push(``);
    }

    if (pattern === 2) {
      queries.push(`-- 3. Vérifier la présence de la colonne store_id`);
      tableNames.forEach(tableName => {
        queries.push(`SELECT`);
        queries.push(`  '${tableName}' as table_name,`);
        queries.push(`  EXISTS(`);
        queries.push(`    SELECT 1 FROM information_schema.columns`);
        queries.push(`    WHERE table_schema = 'public'`);
        queries.push(`      AND table_name = '${tableName}'`);
        queries.push(`      AND column_name = 'store_id'`);
        queries.push(`  ) as has_store_id;`);
      });
      queries.push(``);
    }

    queries.push(`\n`);
  });

  // Requête globale de vérification
  queries.push(`-- ============================================================`);
  queries.push(`-- Vérification Globale`);
  queries.push(`-- ============================================================\n`);
  queries.push(`-- Compter toutes les tables avec RLS activé`);
  queries.push(`SELECT`);
  queries.push(`  COUNT(*) as total_tables_with_rls`);
  queries.push(`FROM pg_tables`);
  queries.push(`WHERE schemaname = 'public'`);
  queries.push(`  AND rowsecurity = true;`);
  queries.push(``);
  queries.push(`-- Compter toutes les politiques RLS existantes`);
  queries.push(`SELECT`);
  queries.push(`  COUNT(*) as total_policies`);
  queries.push(`FROM pg_policies`);
  queries.push(`WHERE schemaname = 'public';`);

  // Écrire le fichier
  const outputFile = path.join(outputDir, 'verification_queries.sql');
  fs.writeFileSync(outputFile, queries.join('\n'), 'utf-8');

  console.log(`✅ Requêtes de vérification générées : ${outputFile}\n`);
  console.log('📋 Contenu :');
  console.log('  - Vérification RLS activé par pattern');
  console.log('  - Vérification politiques existantes');
  console.log('  - Vérification colonnes nécessaires (user_id/store_id)');
  console.log('  - Vérification globale\n');

  console.log('🚀 Prochaines étapes:');
  console.log('  1. Ouvrir Supabase Dashboard → SQL Editor');
  console.log('  2. Exécuter le fichier : verification_queries.sql');
  console.log('  3. Vérifier que RLS est activé sur toutes les tables');
  console.log('  4. Vérifier qu\'il n\'y a pas de politiques existantes');
  console.log('  5. Procéder à l\'exécution des migrations\n');
}

generateVerificationQueries();
