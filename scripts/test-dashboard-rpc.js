#!/usr/bin/env node

/**
 * Script pour tester la fonction RPC dashboard après migration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardRPC() {
  console.log('🧪 Test de la fonction RPC dashboard...\n');

  try {
    // Tester la fonction RPC avec un UUID de test
    const testStoreId = '00000000-0000-0000-0000-000000000000';

    console.log('📡 Test de get_dashboard_stats_rpc...');
    const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
      store_id: testStoreId,
      period_days: 30
    });

    if (error) {
      console.log(`❌ Erreur RPC: ${error.message}`);
      console.log('💡 La migration n\'a peut-être pas été appliquée.');
      console.log('🔧 Exécutez d\'abord le SQL dans Supabase SQL Editor');
    } else {
      console.log(`✅ RPC fonctionnelle!`);
      console.log('📊 Données reçues:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur de test:', error.message);
  }

  console.log('\n🎯 Prochaines étapes:');
  console.log('1. Si RPC échoue: Appliquez le SQL ci-dessus dans Supabase');
  console.log('2. Redémarrez l\'application: npm run dev');
  console.log('3. Les erreurs 401 dans le dashboard devraient disparaître');
}

testDashboardRPC().catch(console.error);