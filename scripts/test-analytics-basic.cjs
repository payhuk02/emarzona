const { createClient } = require('@supabase/supabase-js');

// Variables d'environnement Supabase (à remplacer par les vraies valeurs)
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Test du système d\'analytics dynamique Payhuk');
console.log('================================================');

async function testAnalyticsSystem() {
  try {
    console.log('\n📊 Test de connexion à Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      console.log(`❌ Erreur de connexion: ${connectionError.message}`);
      console.log('💡 Assurez-vous que les variables Supabase sont correctes');
      return;
    }
    console.log('✅ Connexion Supabase réussie');

    console.log('\n📊 Test des tables d\'analytics...');
    
    const tables = ['product_analytics', 'analytics_events', 'user_sessions', 'analytics_reports'];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: accessible`);
      }
    }

    console.log('\n🎉 Tests terminés !');
    console.log('📋 Pour utiliser le système d\'analytics:');
    console.log('   1. Appliquez la migration SQL dans Supabase');
    console.log('   2. Configurez les variables d\'environnement');
    console.log('   3. Le système sera automatiquement fonctionnel');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAnalyticsSystem();
