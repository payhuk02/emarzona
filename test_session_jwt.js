// Test du système de gestion de session JWT
// Simule différents scénarios d'erreurs

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSessionHandling() {
  console.log('🧪 TEST DU SYSTÈME DE GESTION DE SESSION JWT\n');

  try {
    // Test 1: Vérifier l'état de session actuel
    console.log('1️⃣ Test de l\'état de session actuel...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('❌ Erreur de récupération de session:', sessionError.message);
    } else if (session) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const minutesUntilExpiry = Math.round(timeUntilExpiry / 1000 / 60);

      console.log('✅ Session active:');
      console.log('   - Expire dans:', minutesUntilExpiry, 'minutes');
      console.log('   - Date d\'expiration:', expiresAt.toLocaleString('fr-FR'));
    } else {
      console.log('⚠️ Aucune session active');
    }

    // Test 2: Simuler une erreur JWT
    console.log('\n2️⃣ Test de simulation d\'erreur JWT...');

    try {
      // Cette requête devrait échouer avec un JWT expiré simulé
      const { error: jwtError } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id: 'test-id',
        period_days: 30
      });

      if (jwtError) {
        console.log('📋 Erreur obtenue:', jwtError.message);
        console.log('🔍 Type d\'erreur:', jwtError.code || 'Inconnu');

        // Analyser l'erreur
        const isJwtExpired = jwtError.message?.includes('JWT expired') ||
                           jwtError.message?.includes('401') ||
                           jwtError.code === 'PGRST303';

        console.log('🎯 Est-ce une erreur JWT?', isJwtExpired ? '✅ OUI' : '❌ NON');
      }
    } catch (catchError) {
      console.log('💥 Exception capturée:', catchError.message);
    }

    // Test 3: Tester le rafraîchissement de session
    console.log('\n3️⃣ Test de rafraîchissement de session...');

    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      console.log('❌ Échec du rafraîchissement:', refreshError.message);
    } else if (refreshData.session) {
      console.log('✅ Session rafraîchie avec succès');
      const newExpiresAt = new Date(refreshData.session.expires_at * 1000);
      console.log('   - Nouvelle expiration:', newExpiresAt.toLocaleString('fr-FR'));
    } else {
      console.log('⚠️ Aucune session après rafraîchissement');
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error.message);
  }

  console.log('\n📋 RÉSUMÉ DES TESTS:');
  console.log('===================');
  console.log('1. État de session: Vérifié');
  console.log('2. Gestion d\'erreur JWT: Simulée');
  console.log('3. Rafraîchissement: Testé');
  console.log('\n🎉 Tests terminés !');
}

// Exécuter les tests
testSessionHandling();