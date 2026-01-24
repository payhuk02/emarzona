/**
 * Script de diagnostic pour les erreurs de style preferences
 * Date: 2026-01-18
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStylePreferencesTable() {
  console.log('🔍 Vérification de la table user_style_preferences...\n');

  try {
    // 1. Vérifier si la table existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_style_preferences');

    if (tablesError) {
      console.error('❌ Erreur lors de la vérification des tables:', tablesError);
      return;
    }

    if (!tables || tables.length === 0) {
      console.error('❌ La table user_style_preferences n\'existe pas !');
      console.log('\n🔧 Solution: Appliquer la migration:');
      console.log('   npx supabase db reset --local');
      console.log('   ou');
      console.log('   npx supabase migration up');
      return;
    }

    console.log('✅ La table user_style_preferences existe');

    // 2. Vérifier la structure de la table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_style_preferences')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Erreur lors de la vérification des colonnes:', columnsError);
      return;
    }

    console.log('\n📋 Structure de la table:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : ''}`);
    });

    // 3. Vérifier les politiques RLS
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies', { table_name: 'user_style_preferences' })
      .catch(() => {
        // Si la fonction n'existe pas, utiliser une requête directe
        return supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'user_style_preferences');
      });

    if (policiesError) {
      console.error('❌ Erreur lors de la vérification des politiques RLS:', policiesError);
    } else if (policies && policies.length > 0) {
      console.log('\n🔒 Politiques RLS:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.roles?.join(', ') || 'all'})`);
      });
    } else {
      console.log('\n⚠️ Aucune politique RLS trouvée');
    }

    // 4. Tester un insert basique
    console.log('\n🧪 Test d\'insertion basique...');

    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID null pour test
      profile: { test: true },
      quiz_completed_at: new Date().toISOString(),
    };

    const { data: insertData, error: insertError } = await supabase
      .from('user_style_preferences')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion de test:', insertError);
      console.log('🔍 Détails de l\'erreur:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Insertion de test réussie:', insertData);

      // Nettoyer
      await supabase
        .from('user_style_preferences')
        .delete()
        .eq('user_id', testData.user_id);
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

async function checkMigrations() {
  console.log('\n🔍 Vérification des migrations...\n');

  try {
    // Vérifier si la migration existe
    const fs = await import('fs');
    const path = await import('path');

    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250126000000_create_user_style_preferences.sql');

    if (fs.existsSync(migrationPath)) {
      console.log('✅ Fichier de migration trouvé:', migrationPath);

      const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
      console.log('📄 Contenu de la migration (aperçu):');
      console.log(migrationContent.substring(0, 200) + '...');
    } else {
      console.error('❌ Fichier de migration manquant:', migrationPath);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des migrations:', error);
  }
}

// Exécuter les vérifications
async function main() {
  console.log('🚀 Diagnostic des erreurs de style preferences\n');

  await checkMigrations();
  await checkStylePreferencesTable();

  console.log('\n✨ Diagnostic terminé');
  console.log('\n💡 Si la table n\'existe pas, exécutez:');
  console.log('   npx supabase db reset --local');
}

main().catch(console.error);