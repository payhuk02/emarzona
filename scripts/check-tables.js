import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY sont requis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables requises selon les types TypeScript
const REQUIRED_TABLES = [
  'admin_actions',
  'categories', 
  'customers',
  'kyc_submissions',
  'order_items',
  'orders',
  'payments',
  'pixel_events',
  'platform_commissions',
  'products',
  'profiles',
  'promotions',
  'referral_commissions',
  'referrals',
  'reviews',
  'seo_pages',
  'stores',
  'transaction_logs',
  'transactions',
  'user_pixels',
  'user_roles'
];

async function checkTable(tableName) {
  try {
    console.log(`🔍 Vérification de la table: ${tableName}`);
    
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log(`❌ ${tableName} - Table n'existe pas`);
        return { exists: false, accessible: false, error: error.message };
      } else {
        console.log(`⚠️  ${tableName} - Existe mais erreur d'accès: ${error.message}`);
        return { exists: true, accessible: false, error: error.message };
      }
    } else {
      console.log(`✅ ${tableName} - OK (${count || 0} lignes)`);
      return { exists: true, accessible: true, rowCount: count || 0 };
    }
  } catch (err) {
    console.log(`❌ ${tableName} - Erreur: ${err.message}`);
    return { exists: false, accessible: false, error: err.message };
  }
}

async function checkCustomFunctions() {
  console.log('\n🔧 Vérification des fonctions personnalisées...');
  
  const functions = [
    'generate_order_number',
    'generate_referral_code', 
    'generate_slug',
    'has_role',
    'is_product_slug_available',
    'is_store_slug_available'
  ];
  
  for (const funcName of functions) {
    try {
      // Test avec des paramètres par défaut
      let params = {};
      if (funcName === 'generate_slug') {
        params = { input_text: 'test' };
      } else if (funcName === 'has_role') {
        params = { _role: 'user', _user_id: '00000000-0000-0000-0000-000000000000' };
      } else if (funcName === 'is_product_slug_available') {
        params = { check_slug: 'test', check_store_id: '00000000-0000-0000-0000-000000000000' };
      } else if (funcName === 'is_store_slug_available') {
        params = { check_slug: 'test' };
      }
      
      const { data, error } = await supabase.rpc(funcName, params);
      if (error) {
        console.log(`❌ ${funcName}: ${error.message}`);
      } else {
        console.log(`✅ ${funcName}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${funcName}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Vérification des tables Supabase...\n');
  
  const results = [];
  
  for (const tableName of REQUIRED_TABLES) {
    const result = await checkTable(tableName);
    results.push({ name: tableName, ...result });
  }
  
  console.log('\n📊 Résumé:');
  const existingTables = results.filter(r => r.exists);
  const accessibleTables = results.filter(r => r.accessible);
  const missingTables = results.filter(r => !r.exists);
  
  console.log(`✅ Tables existantes: ${existingTables.length}/${REQUIRED_TABLES.length}`);
  console.log(`🔓 Tables accessibles: ${accessibleTables.length}/${REQUIRED_TABLES.length}`);
  console.log(`❌ Tables manquantes: ${missingTables.length}/${REQUIRED_TABLES.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n🚨 Tables manquantes:');
    missingTables.forEach(table => {
      console.log(`   - ${table.name}: ${table.error}`);
    });
  }
  
  if (accessibleTables.length !== REQUIRED_TABLES.length) {
    console.log('\n⚠️  Certaines tables ne sont pas accessibles. Vérifiez les permissions RLS.');
  }
  
  // Test de connexion générale
  console.log('\n🔗 Test de connexion générale...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log(`❌ Erreur de connexion: ${error.message}`);
    } else {
      console.log('✅ Connexion Supabase OK');
    }
  } catch (err) {
    console.log(`❌ Erreur de connexion: ${err.message}`);
  }
  
  // Vérification des fonctions
  await checkCustomFunctions();
  
  console.log('\n🎉 Vérification terminée !');
}

main().catch(console.error);
