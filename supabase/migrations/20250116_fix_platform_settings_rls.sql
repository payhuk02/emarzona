-- ============================================================
-- FIX RLS : platform_settings - Accès public aux données de personnalisation
-- Date: 2025-01-16
--
-- Problème : Les politiques RLS actuelles ne permettent l'accès à platform_settings
-- qu'aux admins, mais l'application fait des appels pour la personnalisation
-- et les recommandations IA qui devraient être accessibles aux utilisateurs normaux.
--
-- Solution : Permettre l'accès SELECT aux utilisateurs authentifiés pour certaines clés
-- ============================================================

-- Supprimer les politiques actuelles trop restrictives
DROP POLICY IF EXISTS "platform_settings_select_policy" ON platform_settings;
DROP POLICY IF EXISTS "platform_settings_insert_policy" ON platform_settings;
DROP POLICY IF EXISTS "platform_settings_update_policy" ON platform_settings;
DROP POLICY IF EXISTS "platform_settings_delete_policy" ON platform_settings;

-- Nouvelle politique SELECT : Utilisateurs authentifiés peuvent lire les données de personnalisation
CREATE POLICY "platform_settings_select_authenticated_policy"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (
    -- Permettre l'accès aux clés publiques de personnalisation
    key IN ('customization', 'ai_recommendation_settings')
    OR
    -- Admins peuvent tout voir
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Seulement admins
CREATE POLICY "platform_settings_insert_policy"
  ON platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Seulement admins
CREATE POLICY "platform_settings_update_policy"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins
CREATE POLICY "platform_settings_delete_policy"
  ON platform_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Commentaires mis à jour
COMMENT ON POLICY "platform_settings_select_authenticated_policy" ON platform_settings IS
'Policy allowing authenticated users to read platform customization and AI settings';

COMMENT ON POLICY "platform_settings_insert_policy" ON platform_settings IS
'Policy allowing only admins to insert platform settings';

COMMENT ON POLICY "platform_settings_update_policy" ON platform_settings IS
'Policy allowing only admins to update platform settings';

COMMENT ON POLICY "platform_settings_delete_policy" ON platform_settings IS
'Policy allowing only admins to delete platform settings';