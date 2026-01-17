// Test de l'API backend offline-first
// À exécuter avec Node.js pour tester les endpoints

import fetch from 'node-fetch';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-anon-key';

console.log('🧪 Test de l\'API Backend Offline-First\n');

// =================================================
// TEST 1: Endpoint de santé
// =================================================

async function testHealthEndpoint() {
  console.log('1️⃣ Test endpoint /api/health');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('   ✅ Status:', response.status);
    console.log('   📊 Response:', result);

    return response.ok;

  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    return false;
  }
}

// =================================================
// TEST 2: Endpoint de synchronisation (simulation)
// =================================================

async function testSyncEndpoint() {
  console.log('\n2️⃣ Test endpoint /api/sync/actions');

  // Payload de test
  const testPayload = {
    actions: [
      {
        id: 'test-action-1',
        action_type: 'create_order',
        payload: {
          order_number: 'TEST-001',
          total_amount: 100.00,
          currency: 'EUR',
          shipping_address: {
            street: '123 Test Street',
            city: 'Test City',
            postal_code: '12345',
            country: 'FR'
          }
        },
        idempotency_key: 'test-key-001',
        store_id: 'test-store-id'
      }
    ]
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log('   ✅ Status:', response.status);
    console.log('   📊 Response:', result);

    return response.ok;

  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    console.log('   💡 Note: L\'endpoint peut nécessiter une authentification JWT valide');
    return false;
  }
}

// =================================================
// TEST 3: Vérification des tables Supabase
// =================================================

async function testDatabaseTables() {
  console.log('\n3️⃣ Test tables Supabase');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/idempotency_keys?select=count`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('   ✅ Table idempotency_keys accessible:', response.status === 200);

    // Test des autres tables mentionnées dans le système
    const tablesToCheck = ['orders', 'products', 'carts', 'stores', 'users'];

    for (const table of tablesToCheck) {
      try {
        const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          }
        });

        console.log(`   ${tableResponse.status === 200 ? '✅' : '❓'} Table ${table}:`, tableResponse.status);

      } catch (error) {
        console.log(`   ❓ Table ${table}: Erreur - ${error.message}`);
      }
    }

    return response.status === 200;

  } catch (error) {
    console.log('   ❌ Erreur vérification tables:', error.message);
    return false;
  }
}

// =================================================
// EXÉCUTION DES TESTS
// =================================================

async function runTests() {
  console.log('🚀 Démarrage des tests...\n');

  const results = {
    health: await testHealthEndpoint(),
    sync: await testSyncEndpoint(),
    database: await testDatabaseTables()
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSULTATS DES TESTS');
  console.log('='.repeat(50));

  console.log(`Endpoint santé: ${results.health ? '✅' : '❌'}`);
  console.log(`Endpoint sync: ${results.sync ? '✅' : '❌'} (peut nécessiter JWT)`);
  console.log(`Tables DB: ${results.database ? '✅' : '❌'}`);

  const allPassed = Object.values(results).every(Boolean);

  console.log('\n' + (allPassed ? '🎉' : '⚠️') + ' CONCLUSION:');
  if (allPassed) {
    console.log('✅ Le système offline-first est opérationnel !');
    console.log('💡 Vous pouvez maintenant utiliser les hooks et composants frontend.');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez :');
    console.log('   - Variables d\'environnement SUPABASE_URL et SUPABASE_ANON_KEY');
    console.log('   - Authentification JWT pour les endpoints protégés');
    console.log('   - Permissions RLS sur les tables');
  }

  console.log('\n📚 Ressources:');
  console.log('   - OFFLINE_FIRST_README.md pour la documentation');
  console.log('   - test-offline-system.sql pour les tests DB');
  console.log('   - Composants frontend dans src/components/offline/');
}

// Exécuter les tests
runTests().catch(console.error);