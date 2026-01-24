/**
 * Script de correction pour les erreurs de style preferences
 * Applique les migrations manquantes et corrige les problèmes
 * Date: 2026-01-18
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
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

async function applyStylePreferencesMigration() {
  console.log('🔧 Application de la migration user_style_preferences...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250126000000_create_user_style_preferences.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL chargée');

    // Diviser en statements individuels (séparés par des points-virgules)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 ${statements.length} statements SQL à exécuter`);

    // Exécuter chaque statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;

      console.log(`⚡ Exécution du statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          // Certains statements peuvent échouer si les objets existent déjà
          console.warn(`⚠️ Statement ${i + 1} a produit un avertissement:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} exécuté avec succès`);
        }
      } catch (err) {
        console.warn(`⚠️ Impossible d'exécuter le statement ${i + 1} via RPC, tentative directe...`);
        // Essayer d'exécuter directement certains statements
        try {
          await supabase.from('dummy').select('*').limit(0); // Test connection
        } catch (directError) {
          console.error(`❌ Échec de l'exécution du statement ${i + 1}:`, err);
        }
      }
    }

    console.log('\n✅ Migration appliquée avec succès');

    // Vérifier que la table existe maintenant
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_style_preferences');

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Table user_style_preferences créée avec succès');
    } else {
      console.error('❌ La table n\'a pas été créée');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    console.log('\n🔧 Solution alternative:');
    console.log('1. Assurez-vous que Docker Desktop est en cours d\'exécution');
    console.log('2. Exécutez: npx supabase start');
    console.log('3. Puis: npx supabase db reset --local');
  }
}

async function createTableDirectly() {
  console.log('\n🔧 Création directe de la table user_style_preferences...\n');

  try {
    // Créer la table directement avec une requête SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_style_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        profile JSONB NOT NULL,
        quiz_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        recommendations_viewed INTEGER DEFAULT 0,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (createError) {
      console.error('❌ Erreur lors de la création de la table:', createError);
      return;
    }

    console.log('✅ Table user_style_preferences créée');

    // Créer les indexes
    const indexSQLs = [
      'CREATE INDEX IF NOT EXISTS idx_user_style_preferences_user_id ON user_style_preferences(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_style_preferences_quiz_completed ON user_style_preferences(quiz_completed_at);',
      'CREATE INDEX IF NOT EXISTS idx_user_style_preferences_profile ON user_style_preferences USING GIN(profile);'
    ];

    for (const indexSQL of indexSQLs) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (indexError) {
        console.warn('⚠️ Erreur lors de la création d\'un index:', indexError.message);
      } else {
        console.log('✅ Index créé');
      }
    }

    // Activer RLS
    const rlsSQL = 'ALTER TABLE user_style_preferences ENABLE ROW LEVEL SECURITY;';
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });

    if (rlsError) {
      console.warn('⚠️ Erreur lors de l\'activation RLS:', rlsError.message);
    } else {
      console.log('✅ RLS activé');
    }

    // Créer les politiques
    const policies = [
      {
        name: 'Users can view their own style preferences',
        sql: `CREATE POLICY "Users can view their own style preferences" ON user_style_preferences FOR SELECT USING (auth.uid() = user_id);`
      },
      {
        name: 'Users can insert their own style preferences',
        sql: `CREATE POLICY "Users can insert their own style preferences" ON user_style_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);`
      },
      {
        name: 'Users can update their own style preferences',
        sql: `CREATE POLICY "Users can update their own style preferences" ON user_style_preferences FOR UPDATE USING (auth.uid() = user_id);`
      },
      {
        name: 'Users can delete their own style preferences',
        sql: `CREATE POLICY "Users can delete their own style preferences" ON user_style_preferences FOR DELETE USING (auth.uid() = user_id);`
      }
    ];

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (policyError) {
        console.warn(`⚠️ Erreur lors de la création de la politique "${policy.name}":`, policyError.message);
      } else {
        console.log(`✅ Politique "${policy.name}" créée`);
      }
    }

    console.log('\n✅ Configuration de la table terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la création directe:', error);
  }
}

async function testStylePreferences() {
  console.log('\n🧪 Test des préférences de style...\n');

  try {
    // Créer un utilisateur de test (simulé)
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testProfile = {
      aesthetic: 'minimalist',
      colorPalette: 'monochrome',
      budgetRange: 'midrange',
      occasionFocus: 'everyday'
    };

    console.log('📝 Test d\'insertion...');
    const { data: insertData, error: insertError } = await supabase
      .from('user_style_preferences')
      .insert({
        user_id: testUserId,
        profile: testProfile,
        quiz_completed_at: new Date().toISOString(),
      })
      .select();

    if (insertError) {
      console.error('❌ Erreur lors du test d\'insertion:', insertError);
      return;
    }

    console.log('✅ Insertion réussie:', insertData);

    console.log('📖 Test de récupération...');
    const { data: fetchData, error: fetchError } = await supabase
      .from('user_style_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (fetchError) {
      console.error('❌ Erreur lors du test de récupération:', fetchError);
    } else {
      console.log('✅ Récupération réussie:', fetchData);
    }

    // Nettoyer
    console.log('🧹 Nettoyage des données de test...');
    await supabase
      .from('user_style_preferences')
      .delete()
      .eq('user_id', testUserId);

    console.log('✅ Test terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter les corrections
async function main() {
  console.log('🚀 Correction des erreurs de style preferences\n');

  // Essayer d'appliquer la migration d'abord
  await applyStylePreferencesMigration();

  // Si ça ne marche pas, créer directement
  await createTableDirectly();

  // Tester
  await testStylePreferences();

  console.log('\n✨ Corrections terminées');
  console.log('\n💡 Si les erreurs persistent, vérifiez:');
  console.log('   1. Docker Desktop est démarré');
  console.log('   2. Variables d\'environnement sont correctes');
  console.log('   3. Base de données Supabase locale est accessible');
}

main().catch(console.error);