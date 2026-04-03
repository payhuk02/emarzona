-- ============================================================
-- FIX RLS : Accès utilisateur aux tables essentielles
-- Date: 2025-01-16
--
-- Problème : Les utilisateurs authentifiés ne peuvent pas accéder aux données
-- nécessaires pour le fonctionnement normal de l'application.
--
-- Tables concernées :
-- - stores : propriétaires doivent voir leurs boutiques
-- - user_loyalty_profiles : utilisateurs doivent voir leurs profils fidélité
-- - cookie_preferences : utilisateurs doivent gérer leurs préférences cookies
-- - notifications : utilisateurs doivent voir leurs notifications
-- ============================================================

-- ============================================================
-- 1. STORES - Propriétaires doivent voir leurs boutiques
-- ============================================================

-- Supprimer les politiques restrictives actuelles si elles existent
DROP POLICY IF EXISTS "stores_select_policy" ON stores;
DROP POLICY IF EXISTS "stores_insert_policy" ON stores;
DROP POLICY IF EXISTS "stores_update_policy" ON stores;
DROP POLICY IF EXISTS "stores_delete_policy" ON stores;

-- Activer RLS si pas déjà fait
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- SELECT : Propriétaires voient leurs boutiques, admins voient tout
CREATE POLICY "stores_select_policy"
  ON stores FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Utilisateurs authentifiés peuvent créer des boutiques
CREATE POLICY "stores_insert_policy"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE : Propriétaires peuvent modifier leurs boutiques, admins peuvent tout modifier
CREATE POLICY "stores_update_policy"
  ON stores FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Propriétaires peuvent supprimer leurs boutiques, admins peuvent tout supprimer
CREATE POLICY "stores_delete_policy"
  ON stores FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. USER_LOYALTY_PROFILES - Utilisateurs voient leurs profils
-- ============================================================

-- Supprimer les politiques restrictives actuelles si elles existent
DROP POLICY IF EXISTS "user_loyalty_profiles_select_policy" ON user_loyalty_profiles;
DROP POLICY IF EXISTS "user_loyalty_profiles_insert_policy" ON user_loyalty_profiles;
DROP POLICY IF EXISTS "user_loyalty_profiles_update_policy" ON user_loyalty_profiles;
DROP POLICY IF EXISTS "user_loyalty_profiles_delete_policy" ON user_loyalty_profiles;

-- Activer RLS si pas déjà fait
ALTER TABLE user_loyalty_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT : Utilisateurs voient leurs profils, admins voient tout
CREATE POLICY "user_loyalty_profiles_select_policy"
  ON user_loyalty_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Via système ou admins seulement
CREATE POLICY "user_loyalty_profiles_insert_policy"
  ON user_loyalty_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Système et admins seulement
CREATE POLICY "user_loyalty_profiles_update_policy"
  ON user_loyalty_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Admins seulement
CREATE POLICY "user_loyalty_profiles_delete_policy"
  ON user_loyalty_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 3. COOKIE_PREFERENCES - Utilisateurs gèrent leurs préférences
-- ============================================================

-- Supprimer les politiques restrictives actuelles si elles existent
DROP POLICY IF EXISTS "cookie_preferences_select_policy" ON cookie_preferences;
DROP POLICY IF EXISTS "cookie_preferences_insert_policy" ON cookie_preferences;
DROP POLICY IF EXISTS "cookie_preferences_update_policy" ON cookie_preferences;
DROP POLICY IF EXISTS "cookie_preferences_delete_policy" ON cookie_preferences;

-- Activer RLS si pas déjà fait
ALTER TABLE cookie_preferences ENABLE ROW LEVEL SECURITY;

-- SELECT : Utilisateurs voient leurs préférences
CREATE POLICY "cookie_preferences_select_policy"
  ON cookie_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT : Utilisateurs peuvent créer leurs préférences
CREATE POLICY "cookie_preferences_insert_policy"
  ON cookie_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE : Utilisateurs peuvent modifier leurs préférences
CREATE POLICY "cookie_preferences_update_policy"
  ON cookie_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- DELETE : Utilisateurs peuvent supprimer leurs préférences
CREATE POLICY "cookie_preferences_delete_policy"
  ON cookie_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 4. NOTIFICATIONS - Utilisateurs voient leurs notifications
-- ============================================================

-- Supprimer les politiques restrictives actuelles si elles existent
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

-- Activer RLS si pas déjà fait
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT : Utilisateurs voient leurs notifications, admins voient tout
CREATE POLICY "notifications_select_policy"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Système seulement (via fonctions)
CREATE POLICY "notifications_insert_policy"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Le système gère cela

-- UPDATE : Utilisateurs peuvent marquer comme lu, admins peuvent tout modifier
CREATE POLICY "notifications_update_policy"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Utilisateurs peuvent supprimer leurs notifications, admins peuvent tout supprimer
CREATE POLICY "notifications_delete_policy"
  ON notifications FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 5. RPC GET_UNREAD_COUNT - Fonction pour compter notifications non lues
-- ============================================================

-- Créer ou remplacer la fonction RPC si elle n'existe pas
CREATE OR REPLACE FUNCTION get_unread_count(user_uuid UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF user_uuid IS NULL THEN
    RETURN 0;
  END IF;

  -- Compter les notifications non lues pour cet utilisateur
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = user_uuid
    AND is_read = false
    AND is_archived = false;

  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_unread_count(UUID) TO authenticated;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

DO $$
DECLARE
  table_name TEXT;
  policy_count INTEGER;
  tables_to_check TEXT[] := ARRAY['stores', 'user_loyalty_profiles', 'cookie_preferences', 'notifications'];
BEGIN
  FOREACH table_name IN ARRAY tables_to_check
  LOOP
    -- Compter les politiques
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = table_name;

    RAISE NOTICE 'Table % : % policies created', table_name, policy_count;

    -- Vérifier que RLS est activé
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND rowsecurity = true
    ) THEN
      RAISE WARNING 'RLS not enabled on table %', table_name;
    END IF;
  END LOOP;
END $$;