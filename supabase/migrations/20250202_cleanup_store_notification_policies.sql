-- Nettoyage des policies RLS pour store_notification_settings
-- Date: 2025-02-02
-- Description: Supprime les policies en double et garde uniquement les bonnes

-- Supprimer toutes les policies existantes pour repartir de zéro
DROP POLICY IF EXISTS "store_notification_settings_select_own" ON public.store_notification_settings;
DROP POLICY IF EXISTS "store_notification_settings_select_policy" ON public.store_notification_settings;
DROP POLICY IF EXISTS "store_notification_settings_update_own" ON public.store_notification_settings;
DROP POLICY IF EXISTS "store_notification_settings_update_policy" ON public.store_notification_settings;
DROP POLICY IF EXISTS "store_notification_settings_insert_own" ON public.store_notification_settings;
DROP POLICY IF EXISTS "store_notification_settings_insert_policy" ON public.store_notification_settings;
DROP POLICY IF EXISTS "store_notification_settings_delete_policy" ON public.store_notification_settings;
DROP POLICY IF EXISTS "Store owners can manage their notification settings" ON public.store_notification_settings;

-- Recréer uniquement les 3 policies essentielles avec user_id
-- Policy: Les propriétaires de boutique peuvent lire leurs paramètres
CREATE POLICY "store_notification_settings_select_own"
  ON public.store_notification_settings FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Policy: Les propriétaires de boutique peuvent modifier leurs paramètres
CREATE POLICY "store_notification_settings_update_own"
  ON public.store_notification_settings FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Policy: Les propriétaires de boutique peuvent créer leurs paramètres
CREATE POLICY "store_notification_settings_insert_own"
  ON public.store_notification_settings FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Commentaires pour documentation
COMMENT ON POLICY "store_notification_settings_select_own" ON public.store_notification_settings 
  IS 'Permet aux propriétaires de boutique de lire leurs paramètres de notifications';
COMMENT ON POLICY "store_notification_settings_update_own" ON public.store_notification_settings 
  IS 'Permet aux propriétaires de boutique de modifier leurs paramètres de notifications';
COMMENT ON POLICY "store_notification_settings_insert_own" ON public.store_notification_settings 
  IS 'Permet aux propriétaires de boutique de créer leurs paramètres de notifications';

