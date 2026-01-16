// Test rapide des liens courts affiliés
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testShortLinks() {
  console.log('🧪 Test des liens courts affiliés...\n');

  try {
    // Test 0: Test de connectivité basique
    console.log('0. Test de connectivité:');
    const { data: connectData, error: connectError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (connectError) {
      console.log('❌ Erreur de connectivité:', connectError.message);
      return;
    } else {
      console.log('✅ Connexion Supabase établie');
    }

    // Test 1: Vérifier si la table affiliate_short_links existe
    console.log('\n1. Test existence table affiliate_short_links:');
    const { data: tableData, error: tableError } = await supabase
      .from('affiliate_short_links')
      .select('*', { count: 'exact', head: true });

    if (tableError && tableError.code === 'PGRST301') {
      console.log('❌ Table affiliate_short_links n\'existe pas - Migration manquante');
    } else if (tableError) {
      console.log('❌ Erreur table:', tableError.message);
    } else {
      console.log('✅ Table affiliate_short_links existe');
    }

    // Test 2: Génération de code court
    console.log('\n2. Test de génération de code court:');
    const { data: codeData, error: codeError } = await supabase.rpc('generate_short_link_code', {
      p_length: 6
    });

    if (codeError) {
      console.log('❌ Erreur génération code:', codeError.message);
    } else {
      console.log('✅ Code généré:', codeData);
    }

    // Test 3: Test de tracking (avec code fictif)
    console.log('\n3. Test de tracking (code fictif):');
    const { data: trackData, error: trackError } = await supabase.rpc('track_short_link_click', {
      p_short_code: 'TEST123'
    });

    if (trackError) {
      console.log('❌ Erreur tracking (attendue pour code fictif):', trackError.message);
    } else {
      console.log('✅ Tracking réussi:', trackData);
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testShortLinks();