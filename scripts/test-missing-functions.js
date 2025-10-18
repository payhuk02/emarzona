import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMissingFunctions() {
  console.log('🧪 Test des fonctions manquantes...\n');
  
  const functions = [
    'generate_order_number',
    'generate_referral_code'
  ];
  
  let allWorking = true;
  
  for (const funcName of functions) {
    try {
      console.log(`🔍 Test de ${funcName}...`);
      const { data, error } = await supabase.rpc(funcName, {});
      
      if (error) {
        console.log(`❌ ${funcName}: ${error.message}`);
        allWorking = false;
      } else {
        console.log(`✅ ${funcName}: ${data}`);
      }
    } catch (err) {
      console.log(`❌ ${funcName}: ${err.message}`);
      allWorking = false;
    }
  }
  
  console.log('\n📊 Résultat:');
  if (allWorking) {
    console.log('🎉 Toutes les fonctions manquantes sont maintenant créées et fonctionnelles !');
    console.log('✅ Votre base de données Supabase est complète.');
  } else {
    console.log('❌ Certaines fonctions ne sont pas encore créées.');
    console.log('💡 Exécutez le SQL fourni dans Supabase SQL Editor.');
  }
  
  return allWorking;
}

async function main() {
  console.log('🚀 Vérification des fonctions manquantes\n');
  
  const success = await testMissingFunctions();
  
  if (success) {
    console.log('\n🎯 Prochaines étapes:');
    console.log('1. ✅ Base de données complète');
    console.log('2. ✅ Toutes les fonctions disponibles');
    console.log('3. 🚀 Prêt pour la production !');
  } else {
    console.log('\n📋 Actions requises:');
    console.log('1. Ouvrez Supabase Dashboard');
    console.log('2. Allez dans SQL Editor');
    console.log('3. Exécutez le SQL du fichier: supabase/functions/create-missing-functions.sql');
    console.log('4. Relancez ce script pour vérifier');
  }
}

main().catch(console.error);
