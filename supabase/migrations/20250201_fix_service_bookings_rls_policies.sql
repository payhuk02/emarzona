-- =========================================================
-- Migration : Correction Duplication RLS Policies service_bookings
-- Date : 1 Février 2025
-- Description : Consolidation des policies RLS pour éviter les conflits
-- =========================================================

-- ============================================================
-- 1. SUPPRIMER TOUTES LES POLICIES EXISTANTES
-- ============================================================

-- Supprimer les policies de la migration 20251027
DROP POLICY IF EXISTS "Users can view own bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Providers can view product bookings" ON public.service_bookings;

-- Supprimer les policies de la migration 20250130
DROP POLICY IF EXISTS "service_bookings_select_policy" ON public.service_bookings;
DROP POLICY IF EXISTS "service_bookings_insert_policy" ON public.service_bookings;
DROP POLICY IF EXISTS "service_bookings_update_policy" ON public.service_bookings;
DROP POLICY IF EXISTS "service_bookings_delete_policy" ON public.service_bookings;

-- ============================================================
-- 2. CRÉER LES POLICIES CONSOLIDÉES
-- ============================================================

-- SELECT : Clients voient leurs réservations, providers voient leurs réservations,
--          propriétaires voient toutes les réservations de leurs services, admins voient tout
CREATE POLICY "service_bookings_select_policy"
  ON public.service_bookings
  FOR SELECT
  USING (
    -- Client voit ses propres réservations
    user_id = auth.uid()
    OR
    -- Provider voit ses réservations assignées
    provider_id = auth.uid()
    OR
    -- Propriétaire de boutique voit toutes les réservations de ses services
    product_id IN (
      SELECT id FROM public.products
      WHERE store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )
    OR
    -- Admin voit tout
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT : Seuls les clients peuvent créer des réservations
CREATE POLICY "service_bookings_insert_policy"
  ON public.service_bookings
  FOR INSERT
  WITH CHECK (
    -- Seul le client peut créer sa propre réservation
    user_id = auth.uid()
  );

-- UPDATE : Clients peuvent modifier leurs réservations (annulation, notes),
--          providers peuvent modifier leurs réservations assignées,
--          propriétaires peuvent modifier les réservations de leurs services,
--          admins peuvent tout modifier
CREATE POLICY "service_bookings_update_policy"
  ON public.service_bookings
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    provider_id = auth.uid()
    OR
    product_id IN (
      SELECT id FROM public.products
      WHERE store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    provider_id = auth.uid()
    OR
    product_id IN (
      SELECT id FROM public.products
      WHERE store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE : Clients peuvent annuler leurs réservations,
--          propriétaires peuvent supprimer les réservations de leurs services,
--          admins peuvent tout supprimer
CREATE POLICY "service_bookings_delete_policy"
  ON public.service_bookings
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    product_id IN (
      SELECT id FROM public.products
      WHERE store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 3. COMMENTAIRES POUR DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "service_bookings_select_policy" ON public.service_bookings IS 
  'Clients voient leurs réservations, providers voient leurs réservations assignées, propriétaires voient toutes les réservations de leurs services, admins voient tout';

COMMENT ON POLICY "service_bookings_insert_policy" ON public.service_bookings IS 
  'Seuls les clients peuvent créer leurs propres réservations';

COMMENT ON POLICY "service_bookings_update_policy" ON public.service_bookings IS 
  'Clients peuvent modifier leurs réservations, providers leurs réservations assignées, propriétaires les réservations de leurs services, admins tout';

COMMENT ON POLICY "service_bookings_delete_policy" ON public.service_bookings IS 
  'Clients peuvent annuler leurs réservations, propriétaires peuvent supprimer les réservations de leurs services, admins peuvent tout supprimer';



