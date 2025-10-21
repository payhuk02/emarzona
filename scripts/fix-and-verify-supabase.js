import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixReferralCodeFunction() {
  console.log('🔧 Correction de la fonction generate_referral_code...');
  
  try {
    // Test de la fonction actuelle
    const { data: testData, error: testError } = await supabase.rpc('generate_referral_code');
    
    if (testError) {
      console.log('❌ Fonction actuelle défaillante:', testError.message);
      
      // Appliquer la correction via une requête SQL directe
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION generate_referral_code()
          RETURNS TEXT AS $$
          DECLARE
              referral_code TEXT;
              code_exists BOOLEAN;
          BEGIN
              LOOP
                  -- Générer un code de 8 caractères alphanumériques en majuscules
                  referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
                  
                  -- Vérifier si le code existe déjà dans la table profiles
                  SELECT EXISTS(
                      SELECT 1 FROM profiles 
                      WHERE profiles.referral_code = generate_referral_code.referral_code
                  ) INTO code_exists;
                  
                  -- Si le code n'existe pas, on peut l'utiliser
                  EXIT WHEN NOT code_exists;
              END LOOP;
              
              RETURN referral_code;
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      
      if (error) {
        console.log('❌ Erreur lors de la correction:', error.message);
        return false;
      }
      
      console.log('✅ Fonction corrigée avec succès');
      
      // Tester la fonction corrigée
      const { data: newTestData, error: newTestError } = await supabase.rpc('generate_referral_code');
      
      if (newTestError) {
        console.log('❌ Fonction toujours défaillante:', newTestError.message);
        return false;
      }
      
      console.log('✅ Fonction testée avec succès, code généré:', newTestData);
      return true;
      
    } else {
      console.log('✅ Fonction déjà fonctionnelle:', testData);
      return true;
    }
    
  } catch (err) {
    console.log('❌ Erreur générale:', err.message);
    return false;
  }
}

async function verifyAllTables() {
  console.log('\n🔍 Vérification complète des tables...');
  
  const REQUIRED_TABLES = [
    'admin_actions', 'categories', 'customers', 'kyc_submissions',
    'order_items', 'orders', 'payments', 'pixel_events',
    'platform_commissions', 'products', 'profiles', 'promotions',
    'referral_commissions', 'referrals', 'reviews', 'seo_pages',
    'stores', 'transaction_logs', 'transactions', 'user_pixels', 'user_roles'
  ];
  
  let allTablesOK = true;
  
  for (const tableName of REQUIRED_TABLES) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        allTablesOK = false;
      } else {
        console.log(`✅ ${tableName}: OK (${count || 0} lignes)`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
      allTablesOK = false;
    }
  }
  
  return allTablesOK;
}

async function verifyFunctions() {
  console.log('\n🔧 Vérification des fonctions...');
  
  const functions = [
    'generate_order_number',
    'generate_referral_code', 
    'generate_slug',
    'has_role',
    'is_product_slug_available',
    'is_store_slug_available'
  ];
  
  let allFunctionsOK = true;
  
  for (const funcName of functions) {
    try {
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
        allFunctionsOK = false;
      } else {
        console.log(`✅ ${funcName}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${funcName}: ${err.message}`);
      allFunctionsOK = false;
    }
  }
  
  return allFunctionsOK;
}

async function main() {
  console.log('🚀 Vérification et correction complète de Supabase...\n');
  
  // 1. Vérifier les tables
  const tablesOK = await verifyAllTables();
  
  // 2. Corriger la fonction generate_referral_code
  const functionFixed = await fixReferralCodeFunction();
  
  // 3. Vérifier toutes les fonctions
  const functionsOK = await verifyFunctions();
  
  // Résumé final
  console.log('\n📊 Résumé final:');
  console.log(`✅ Tables: ${tablesOK ? 'OK' : 'PROBLÈMES'}`);
  console.log(`✅ Fonction generate_referral_code: ${functionFixed ? 'CORRIGÉE' : 'PROBLÈME'}`);
  console.log(`✅ Fonctions: ${functionsOK ? 'OK' : 'PROBLÈMES'}`);
  
  if (tablesOK && functionFixed && functionsOK) {
    console.log('\n🎉 Toutes les vérifications sont passées ! Supabase est prêt.');
  } else {
    console.log('\n⚠️  Certains problèmes persistent. Vérifiez les erreurs ci-dessus.');
  }
}

main().catch(console.error);
