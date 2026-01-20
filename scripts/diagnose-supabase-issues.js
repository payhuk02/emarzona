#!/usr/bin/env node

/**
 * Script de diagnostic des problèmes Supabase
 * - Vérifie les fonctions Edge déployées
 * - Teste les politiques RLS
 * - Valide la configuration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Diagnostic Supabase - Emarzona\n');

// 1. Test de connexion de base
console.log('1️⃣ Test de connexion...');
try {
  const { data, error } = await supabase.from('profiles').select('count').limit(1).single();
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }
  console.log('✅ Connexion Supabase OK');
} catch (error) {
  console.log('❌ Erreur de connexion:', error.message);
}

// 2. Vérifier les fonctions Edge déployées
console.log('\n2️⃣ Vérification des fonctions Edge...');

const requiredFunctions = [
  'rate-limiter',
  'moneroo',
  'send-email',
  'send-order-confirmation-email'
];

for (const funcName of requiredFunctions) {
  try {
    const { data, error } = await supabase.functions.invoke(funcName, {
      body: { test: true },
      headers: { 'Content-Type': 'application/json' }
    });

    if (error) {
      console.log(`❌ Fonction ${funcName}: ${error.message}`);
    } else {
      console.log(`✅ Fonction ${funcName}: déployée`);
    }
  } catch (error) {
    console.log(`❌ Fonction ${funcName}: ${error.message}`);
  }
}

// 3. Test des RPC functions critiques
console.log('\n3️⃣ Test des fonctions RPC...');

const criticalRPCs = [
  'get_dashboard_stats_rpc',
  'get_ai_recommendation_settings'
];

for (const rpcName of criticalRPCs) {
  try {
    const { data, error } = await supabase.rpc(rpcName);
    if (error) {
      console.log(`❌ RPC ${rpcName}: ${error.message}`);
    } else {
      console.log(`✅ RPC ${rpcName}: disponible`);
    }
  } catch (error) {
    console.log(`❌ RPC ${rpcName}: ${error.message}`);
  }
}

// 4. Vérifier les tables critiques
console.log('\n4️⃣ Vérification des tables...');

const criticalTables = [
  'profiles',
  'stores',
  'products',
  'orders',
  'customers'
];

for (const tableName of criticalTables) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
      console.log(`❌ Table ${tableName}: ${error.message}`);
    } else {
      console.log(`✅ Table ${tableName}: accessible`);
    }
  } catch (error) {
    console.log(`❌ Table ${tableName}: ${error.message}`);
  }
}

// 5. Recommandations
console.log('\n📋 RECOMMANDATIONS:');
console.log('1. Déployer les fonctions Edge manquantes:');
console.log('   cd supabase/functions && supabase functions deploy');
console.log('');
console.log('2. Exécuter les migrations RLS:');
console.log('   supabase db reset  # ou exécuter les scripts SQL manuellement');
console.log('');
console.log('3. Vérifier les politiques RLS:');
console.log('   SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\';');
console.log('');
console.log('4. Tester avec un utilisateur authentifié pour les fonctions nécessitant auth');

console.log('\n🎯 Diagnostic terminé!');