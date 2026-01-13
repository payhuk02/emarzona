#!/usr/bin/env node

/**
 * Script de vérification des politiques RLS
 * Vérifie que toutes les tables ont des politiques RLS complètes
 * 
 * Usage: node scripts/verify-rls-policies.js
 * 
 * Nécessite: Variables d'environnement Supabase configurées
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement Supabase manquantes');
  console.error('   VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Obtenir toutes les tables avec RLS activé
 */
async function getTablesWithRLS() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        t.tablename,
        t.rowsecurity as rls_enabled,
        COUNT(p.policyname) as policy_count
      FROM pg_tables t
      LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
      WHERE t.schemaname = 'public'
        AND t.rowsecurity = true
      GROUP BY t.tablename, t.rowsecurity
      ORDER BY t.tablename;
    `,
  });

  if (error) {
    console.error('❌ Erreur lors de la récupération des tables:', error);
    return null;
  }

  return data;
}

/**
 * Obtenir les politiques pour une table
 */
async function getPoliciesForTable(tableName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        policyname,
        cmd,
        roles,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = $1
      ORDER BY cmd, policyname;
    `,
    params: [tableName],
  });

  if (error) {
    console.error(`❌ Erreur pour la table ${tableName}:`, error);
    return null;
  }

  return data;
}

/**
 * Vérifier qu'une table a toutes les politiques nécessaires
 */
function checkTablePolicies(policies) {
  if (!policies || policies.length === 0) {
    return {
      hasAll: false,
      missing: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      existing: [],
    };
  }

  const requiredOps = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
  const existingOps = policies.map(p => p.cmd);
  const missingOps = requiredOps.filter(op => !existingOps.includes(op));

  return {
    hasAll: missingOps.length === 0,
    missing: missingOps,
    existing: existingOps,
  };
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Vérification des politiques RLS...\n');

  // Obtenir toutes les tables avec RLS
  const tables = await getTablesWithRLS();

  if (!tables) {
    console.error('❌ Impossible de récupérer les tables');
    process.exit(1);
  }

  console.log(`📊 ${tables.length} table(s) avec RLS activé\n`);

  const results = {
    total: tables.length,
    complete: 0,
    incomplete: 0,
    missing: 0,
    details: [],
  };

  // Vérifier chaque table
  for (const table of tables) {
    const detail = {
      table: table.tablename,
      rlsEnabled: table.rls_enabled,
      accessible: table.accessible,
      error: table.error,
    };

    results.details.push(detail);

    if (table.error) {
      results.missing++;
      console.log(`❌ ${table.tablename}: ${table.error}`);
    } else if (!table.accessible && table.rls_enabled) {
      // RLS activé mais accès bloqué = probablement pas de politiques
      results.missing++;
      console.log(`❌ ${table.tablename}: RLS activé mais accès bloqué (probablement aucune politique)`);
      console.log(`   → Exécutez la requête SQL dans Supabase Dashboard pour vérifier:`);
      console.log(`   SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = '${table.tablename}';`);
    } else if (table.accessible) {
      // Table accessible (peut avoir des politiques permissives)
      console.log(`⚠️  ${table.tablename}: Accessible (vérifiez les politiques dans Supabase Dashboard)`);
      results.incomplete++;
    } else {
      console.log(`❓ ${table.tablename}: État inconnu`);
      results.missing++;
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  console.log(`Total: ${results.total} table(s)`);
  console.log(`✅ Complètes: ${results.complete}`);
  console.log(`⚠️  Incomplètes: ${results.incomplete}`);
  console.log(`❌ Sans politiques: ${results.missing}`);

  if (results.missing > 0 || results.incomplete > 0) {
    console.log('\n⚠️  ACTION REQUISE:');
    console.log('   1. Vérifiez les politiques dans Supabase Dashboard → SQL Editor:');
    console.log('      SELECT tablename, COUNT(*) as policy_count');
    console.log('      FROM pg_policies WHERE schemaname = \'public\'');
    console.log('      GROUP BY tablename ORDER BY tablename;');
    console.log('');
    console.log('   2. Exécutez les migrations RLS depuis:');
    console.log('      docs/audits/GUIDE_EXECUTION_RLS_PRIORITE_1.md');
    console.log('');
    console.log('   3. Réexécutez ce script après les migrations:');
    console.log('      npm run verify:rls');
    process.exit(1);
  } else {
    console.log('\n✅ Toutes les tables semblent avoir des politiques RLS!');
    console.log('   Pour une vérification complète, exécutez dans Supabase SQL Editor:');
    console.log('   SELECT tablename, COUNT(*) FROM pg_policies WHERE schemaname = \'public\' GROUP BY tablename;');
  }
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
