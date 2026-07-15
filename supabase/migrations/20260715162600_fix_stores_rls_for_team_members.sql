-- ============================================================
-- FIX RLS : Permettre aux membres d'équipe de voir les boutiques
-- Date: 2026-07-15
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "stores_select_policy" ON public.stores;

CREATE POLICY "stores_select_policy"
  ON public.stores FOR SELECT
  TO authenticated
  USING (
    -- Le propriétaire peut voir
    user_id = auth.uid() OR
    -- Les membres de l'équipe peuvent voir
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = stores.id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    ) OR
    -- Les admins peuvent tout voir
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMIT;
