#!/usr/bin/env node

/**
 * Script pour générer automatiquement les migrations RLS
 * à partir des résultats de l'audit RLS
 * 
 * Usage:
 *   node scripts/generate-rls-migrations.js
 *   node scripts/generate-rls-migrations.js --table=notifications --pattern=1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patterns disponibles
const PATTERNS = {
  1: {
    name: 'user_id',
    description: 'Table avec user_id (données utilisateur)',
    examples: ['notifications', 'user_preferences', 'saved_addresses'],
  },
  2: {
    name: 'store_id',
    description: 'Table avec store_id (données boutique)',
    examples: ['products', 'orders', 'customers', 'inventory'],
  },
  3: {
    name: 'public',
    description: 'Table publique (marketplace)',
    examples: ['reviews', 'community_posts'],
  },
  4: {
    name: 'admin_only',
    description: 'Table admin seulement',
    examples: ['platform_settings', 'admin_config', 'system_logs'],
  },
};

/**
 * Génère le code SQL pour un pattern donné
 */
function generatePatternSQL(patternNumber, tableName, userIdColumn, storeIdColumn) {
  const patterns = {
    1: `
  -- SELECT : Utilisateur voit ses propres données + admins voient tout
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_user_id_column
  );

  -- INSERT : Utilisateur peut créer ses propres données
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (%I = auth.uid())',
    v_table_name || '_insert_policy',
    v_table_name,
    v_user_id_column
  );

  -- UPDATE : Utilisateur peut modifier ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_user_id_column
  );

  -- DELETE : Utilisateur peut supprimer ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name,
    v_user_id_column
  );`,

    2: `
  -- SELECT : Propriétaire de la boutique voit ses données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_store_id_column
  );

  -- INSERT : Propriétaire de la boutique peut créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )',
    v_table_name || '_insert_policy',
    v_table_name,
    v_store_id_column
  );

  -- UPDATE : Propriétaire de la boutique peut modifier + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_store_id_column
  );

  -- DELETE : Seulement admins (ou propriétaire selon contexte)
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name
  );`,

    3: `
  -- SELECT : Tous les utilisateurs authentifiés peuvent lire
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (auth.uid() IS NOT NULL)',
    v_table_name || '_select_policy',
    v_table_name
  );

  -- INSERT : Utilisateurs authentifiés peuvent créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)',
    v_table_name || '_insert_policy',
    v_table_name
  );

  -- UPDATE : Seulement propriétaire ou admin
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_user_id_column
  );

  -- DELETE : Seulement propriétaire ou admin
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name,
    v_user_id_column
  );`,

    4: `
  -- SELECT : Seulement admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name
  );

  -- INSERT : Seulement admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_insert_policy',
    v_table_name
  );

  -- UPDATE : Seulement admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name
  );

  -- DELETE : Seulement admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name
  );`,
  };

  return patterns[patternNumber] || patterns[1];
}

/**
 * Génère une migration RLS complète
 */
function generateMigration(tableName, patternNumber = 1, userIdColumn = 'user_id', storeIdColumn = 'store_id') {
  const patternSQL = generatePatternSQL(patternNumber, tableName, userIdColumn, storeIdColumn);
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '');

  return `-- ============================================================
-- Migration RLS : ${tableName}
-- Date: ${new Date().toISOString().split('T')[0]}
-- 
-- Objectif: Ajouter des politiques RLS pour ${tableName}
-- Pattern: ${patternNumber} (${PATTERNS[patternNumber].description})
-- ============================================================

DO $$
DECLARE
  v_table_name text := '${tableName}';
  v_user_id_column text := '${userIdColumn}';
  v_store_id_column text := '${storeIdColumn}';
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  -- Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE EXCEPTION 'Table "%" does not exist in schema "public". Vérifiez le nom de la table.', v_table_name;
  END IF;

  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on %. Run: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', v_table_name, v_table_name;
  END IF;

  -- Vérifier qu'il n'y a pas déjà de politiques
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE NOTICE 'Table % already has policies. Review existing policies before adding new ones.', v_table_name;
    RETURN;
  END IF;

-- ============================================================
-- PATTERN ${patternNumber} : ${PATTERNS[patternNumber].description.toUpperCase()}
-- ============================================================
${patternSQL}

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = v_table_name;
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for %. Review the migration.', v_table_name;
  ELSE
    RAISE NOTICE '✅ Created % policies for %', policy_count, v_table_name;
  END IF;

END $$;

-- ============================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "${tableName}_select_policy" ON ${tableName} IS 
'Policy for SELECT operations on ${tableName}. Pattern ${patternNumber}: ${PATTERNS[patternNumber].description}';

COMMENT ON POLICY "${tableName}_insert_policy" ON ${tableName} IS 
'Policy for INSERT operations on ${tableName}. Pattern ${patternNumber}: ${PATTERNS[patternNumber].description}';

COMMENT ON POLICY "${tableName}_update_policy" ON ${tableName} IS 
'Policy for UPDATE operations on ${tableName}. Pattern ${patternNumber}: ${PATTERNS[patternNumber].description}';

COMMENT ON POLICY "${tableName}_delete_policy" ON ${tableName} IS 
'Policy for DELETE operations on ${tableName}. Pattern ${patternNumber}: ${PATTERNS[patternNumber].description}';
`;
}

/**
 * Fonction principale
 */
function main() {
  const args = process.argv.slice(2);
  const tableArg = args.find(arg => arg.startsWith('--table='));
  const patternArg = args.find(arg => arg.startsWith('--pattern='));
  const userIdArg = args.find(arg => arg.startsWith('--user-id-column='));
  const storeIdArg = args.find(arg => arg.startsWith('--store-id-column='));

  if (!tableArg) {
    console.log('🔧 Générateur de Migrations RLS\n');
    console.log('Usage:');
    console.log('  node scripts/generate-rls-migrations.js --table=TABLE_NAME [--pattern=1|2|3|4] [--user-id-column=COLUMN] [--store-id-column=COLUMN]\n');
    console.log('Exemples:');
    console.log('  node scripts/generate-rls-migrations.js --table=notifications --pattern=1');
    console.log('  node scripts/generate-rls-migrations.js --table=platform_settings --pattern=4');
    console.log('  node scripts/generate-rls-migrations.js --table=products --pattern=2\n');
    console.log('Patterns disponibles:');
    Object.entries(PATTERNS).forEach(([num, info]) => {
      console.log(`  ${num}. ${info.name}: ${info.description}`);
      console.log(`     Exemples: ${info.examples.join(', ')}`);
    });
    process.exit(1);
  }

  const tableName = tableArg.split('=')[1];
  const patternNumber = patternArg ? parseInt(patternArg.split('=')[1]) : 1;
  const userIdColumn = userIdArg ? userIdArg.split('=')[1] : 'user_id';
  const storeIdColumn = storeIdArg ? storeIdArg.split('=')[1] : 'store_id';

  if (!PATTERNS[patternNumber]) {
    console.error(`❌ Pattern ${patternNumber} invalide. Patterns disponibles: 1, 2, 3, 4`);
    process.exit(1);
  }

  console.log(`📝 Génération migration RLS pour table: ${tableName}`);
  console.log(`   Pattern: ${patternNumber} (${PATTERNS[patternNumber].description})`);
  console.log(`   Colonnes: user_id=${userIdColumn}, store_id=${storeIdColumn}\n`);

  const migrationSQL = generateMigration(tableName, patternNumber, userIdColumn, storeIdColumn);

  // Générer nom de fichier
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '').substring(0, 14);
  const fileName = `${timestamp}_rls_${tableName}.sql`;
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', fileName);

  // Créer dossier migrations s'il n'existe pas
  const migrationsDir = path.dirname(filePath);
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  // Écrire le fichier
  fs.writeFileSync(filePath, migrationSQL, 'utf-8');

  console.log(`✅ Migration générée : ${filePath}`);
  console.log(`\n📋 Prochaines étapes:`);
  console.log(`   1. Vérifier le contenu de la migration`);
  console.log(`   2. Exécuter dans Supabase Dashboard → SQL Editor`);
  console.log(`   3. Tester avec différents rôles (user, vendor, admin)`);
}

main();
