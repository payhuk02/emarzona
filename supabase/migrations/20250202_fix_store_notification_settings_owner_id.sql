-- Correction: Remplacement de owner_id par user_id dans les policies RLS
-- Date: 2025-02-02
-- Description: Corrige les policies RLS qui utilisaient owner_id au lieu de user_id

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "store_notification_settings_select_own" ON public.store_notification_settings;
DROP POLICY IF EXISTS "store_notification_settings_update_own" ON public.store_notification_settings;
DROP POLICY IF EXISTS "store_notification_settings_insert_own" ON public.store_notification_settings;

-- Recréer les policies avec user_id au lieu de owner_id
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

