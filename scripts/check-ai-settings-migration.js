/**
 * Script de vérification de la migration des paramètres IA
 * À exécuter pour diagnostiquer l'état de la base de données
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (à adapter selon votre environnement)
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAIMigrationStatus() {
  console.log('🔍 Vérification de la migration des paramètres IA...\n');

  try {
    // 1. Vérifier si la colonne ai_recommendation_settings existe
    console.log('1. Vérification de la colonne ai_recommendation_settings...');
    const { data: columnData, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'platform_settings')
      .eq('column_name', 'ai_recommendation_settings')
      .maybeSingle();

    if (columnError) {
      console.log('❌ Erreur lors de la vérification de la colonne:', columnError.message);
      return;
    }

    if (!columnData) {
      console.log('❌ La colonne ai_recommendation_settings n\'existe pas');
      console.log('📝 Solution: Exécutez la migration 20260113_add_ai_recommendation_settings.sql');
      return;
    }

    console.log('✅ Colonne ai_recommendation_settings trouvée:');
    console.log(`   - Type: ${columnData.data_type}`);
    console.log(`   - Nullable: ${columnData.is_nullable}`);
    console.log(`   - Défaut: ${columnData.column_default ? 'Oui' : 'Non'}\n`);

    // 2. Vérifier si l'enregistrement existe
    console.log('2. Vérification de l\'enregistrement platform_settings...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('platform_settings')
      .select('id, ai_recommendation_settings')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .maybeSingle();

    if (settingsError) {
      console.log('❌ Erreur lors de la récupération des paramètres:', settingsError.message);
      return;
    }

    if (!settingsData) {
      console.log('❌ Aucun enregistrement trouvé dans platform_settings');
      console.log('📝 Solution: L\'enregistrement par défaut devrait être créé par la migration');
      return;
    }

    console.log('✅ Enregistrement platform_settings trouvé\n');

    // 3. Vérifier le contenu des paramètres IA
    console.log('3. Vérification du contenu des paramètres IA...');
    if (!settingsData.ai_recommendation_settings) {
      console.log('⚠️ Les paramètres IA sont NULL ou vides');
      console.log('📝 Solution: La migration devrait avoir défini des valeurs par défaut');
    } else {
      const settings = settingsData.ai_recommendation_settings;

      console.log('✅ Paramètres IA trouvés:');
      console.log(`   - Algorithmes: ${Object.keys(settings.algorithms || {}).length}`);
      console.log(`   - Poids: ${Object.keys(settings.weights || {}).length}`);
      console.log(`   - Similarité: ${Object.keys(settings.similarity || {}).length}`);
      console.log(`   - Types produits: ${Object.keys(settings.productTypes || {}).length}`);
      console.log(`   - Limitations: ${Object.keys(settings.limits || {}).length}`);
      console.log(`   - Fallbacks: ${Object.keys(settings.fallbacks || {}).length}`);

      // Vérifier la structure
      const requiredSections = ['algorithms', 'weights', 'similarity', 'productTypes', 'limits', 'fallbacks'];
      const missingSections = requiredSections.filter(section => !settings[section]);

      if (missingSections.length > 0) {
        console.log(`⚠️ Sections manquantes: ${missingSections.join(', ')}`);
      } else {
        console.log('✅ Structure complète des paramètres IA');
      }
    }

    console.log('\n🎉 Migration des paramètres IA vérifiée avec succès !');
    console.log('🚀 Vous pouvez maintenant accéder à la page /admin/ai-settings');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
  }
}

// Exécuter la vérification
checkAIMigrationStatus().catch(console.error);