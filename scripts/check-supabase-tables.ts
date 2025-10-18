import { supabase } from './src/integrations/supabase/client';

/**
 * Script de vérification des tables Supabase
 * Vérifie que toutes les tables nécessaires existent et sont accessibles
 */

interface TableCheck {
  name: string;
  exists: boolean;
  accessible: boolean;
  error?: string;
  rowCount?: number;
}

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

async function checkTable(tableName: string): Promise<TableCheck> {
  const result: TableCheck = {
    name: tableName,
    exists: false,
    accessible: false
  };

  try {
    // Test simple de sélection pour vérifier l'existence et l'accessibilité
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      result.error = error.message;
      // Vérifier si c'est une erreur de table inexistante
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        result.exists = false;
      } else {
        result.exists = true; // Table existe mais erreur d'accès
        result.accessible = false;
      }
    } else {
      result.exists = true;
      result.accessible = true;
      result.rowCount = count || 0;
    }
  } catch (err: any) {
    result.error = err.message;
    result.exists = false;
    result.accessible = false;
  }

  return result;
}

async function checkAllTables(): Promise<void> {
  console.log('🔍 Vérification des tables Supabase...\n');
  
  const results: TableCheck[] = [];
  
  for (const tableName of REQUIRED_TABLES) {
    console.log(`Vérification de la table: ${tableName}`);
    const result = await checkTable(tableName);
    results.push(result);
    
    if (result.exists && result.accessible) {
      console.log(`✅ ${tableName} - OK (${result.rowCount} lignes)`);
    } else if (result.exists && !result.accessible) {
      console.log(`⚠️  ${tableName} - Existe mais non accessible: ${result.error}`);
    } else {
      console.log(`❌ ${tableName} - N'existe pas: ${result.error}`);
    }
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
  } catch (err: any) {
    console.log(`❌ Erreur de connexion: ${err.message}`);
  }
}

// Fonction pour vérifier les fonctions personnalisées
async function checkCustomFunctions(): Promise<void> {
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
      const { data, error } = await supabase.rpc(funcName, {});
      if (error) {
        console.log(`❌ ${funcName}: ${error.message}`);
      } else {
        console.log(`✅ ${funcName}: OK`);
      }
    } catch (err: any) {
      console.log(`❌ ${funcName}: ${err.message}`);
    }
  }
}

// Exécution du script
async function main() {
  try {
    await checkAllTables();
    await checkCustomFunctions();
    console.log('\n🎉 Vérification terminée !');
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter seulement si ce fichier est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkAllTables, checkCustomFunctions };
