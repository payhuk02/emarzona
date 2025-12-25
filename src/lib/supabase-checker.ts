// Script de vérification des tables Supabase
// À exécuter avec: npm run dev ou dans l'environnement Vite

import { logger } from './logger';

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

// Fonction pour vérifier une table
async function checkTable(supabase, tableName) {
  try {
    logger.info(`🔍 Vérification de la table: ${tableName}`);
    
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        logger.warn(`${tableName} - Table n'existe pas`, { tableName, error: error.message });
        return { exists: false, accessible: false, error: error.message };
      } else {
        logger.warn(`${tableName} - Existe mais erreur d'accès`, { tableName, error: error.message });
        return { exists: true, accessible: false, error: error.message };
      }
    } else {
      logger.info(`${tableName} - OK`, { tableName, rowCount: count || 0 });
      return { exists: true, accessible: true, rowCount: count || 0 };
    }
  } catch (err: any) {
    logger.error(`${tableName} - Erreur`, { tableName, error: err.message });
    return { exists: false, accessible: false, error: err.message };
  }
}

// Fonction pour vérifier les fonctions personnalisées
async function checkCustomFunctions(supabase) {
  logger.info('🔧 Vérification des fonctions personnalisées...');
  
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
        logger.error(`${funcName} - Erreur`, { funcName, error: error.message });
      } else {
        logger.info(`${funcName} - OK`, { funcName });
      }
    } catch (err: any) {
      logger.error(`${funcName} - Erreur`, { funcName, error: err.message });
    }
  }
}

// Fonction principale de vérification
export async function checkSupabaseTables(supabase) {
  logger.info('🚀 Vérification des tables Supabase...');
  
  const results = [];
  
  for (const tableName of REQUIRED_TABLES) {
    const result = await checkTable(supabase, tableName);
    results.push({ name: tableName, ...result });
  }
  
  const existingTables = results.filter(r => r.exists);
  const accessibleTables = results.filter(r => r.accessible);
  const missingTables = results.filter(r => !r.exists);
  
  logger.info('📊 Résumé des tables', {
    existing: existingTables.length,
    accessible: accessibleTables.length,
    missing: missingTables.length,
    total: REQUIRED_TABLES.length
  });
  
  if (missingTables.length > 0) {
    logger.warn('🚨 Tables manquantes', {
      missing: missingTables.map(t => ({ name: t.name, error: t.error }))
    });
  }
  
  if (accessibleTables.length !== REQUIRED_TABLES.length) {
    logger.warn('⚠️  Certaines tables ne sont pas accessibles. Vérifiez les permissions RLS.');
  }
  
  // Test de connexion générale
  logger.info('🔗 Test de connexion générale...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      logger.error('Erreur de connexion', { error: error.message });
    } else {
      logger.info('✅ Connexion Supabase OK');
    }
  } catch (err: any) {
    logger.error('Erreur de connexion', { error: err.message });
  }
  
  // Vérification des fonctions
  await checkCustomFunctions(supabase);
  
  logger.info('🎉 Vérification terminée !');
  
  return results;
}

// Export pour utilisation dans d'autres modules
export { REQUIRED_TABLES };
