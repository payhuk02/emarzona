import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalVerification() {
  console.log('🎯 Vérification finale de Supabase Payhula...\n');
  
  // Test de toutes les fonctions
  const functions = [
    { name: 'generate_order_number', params: {} },
    { name: 'generate_referral_code', params: {} },
    { name: 'generate_slug', params: { input_text: 'test' } },
    { name: 'has_role', params: { _role: 'user', _user_id: '00000000-0000-0000-0000-000000000000' } }
  ];
  
  let allOK = true;
  
  for (const func of functions) {
    try {
      const { data, error } = await supabase.rpc(func.name, func.params);
      if (error) {
        console.log(`❌ ${func.name}: ${error.message}`);
        allOK = false;
      } else {
        console.log(`✅ ${func.name}: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.log(`❌ ${func.name}: ${err.message}`);
      allOK = false;
    }
  }
  
  // Test des tables principales
  const tables = ['stores', 'products', 'profiles', 'orders'];
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
        allOK = false;
      } else {
        console.log(`✅ Table ${table}: ${count || 0} lignes`);
      }
    } catch (err) {
      console.log(`❌ Table ${table}: ${err.message}`);
      allOK = false;
    }
  }
  
  console.log(`\n${allOK ? '🎉' : '⚠️'} Supabase ${allOK ? 'est prêt' : 'a des problèmes'} !`);
  return allOK;
}

finalVerification().catch(console.error);
