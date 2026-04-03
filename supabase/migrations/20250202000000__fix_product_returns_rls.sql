-- ================================================================
-- Fix RLS Policy for product_returns
-- Date: 2 Février 2025
-- Description: Corrige la politique RLS pour product_returns qui essaie d'accéder à auth.users
-- ================================================================

-- Supprimer les anciennes politiques qui essaient d'accéder à auth.users
DROP POLICY IF EXISTS "product_returns_select_policy" ON public.product_returns;
DROP POLICY IF EXISTS "Customers can view own returns" ON public.product_returns;
DROP POLICY IF EXISTS "Users can view own returns" ON public.product_returns;

-- Créer une nouvelle politique qui utilise auth.uid() directement
-- Cette politique fonctionne que la table utilise customer_id ou user_id
CREATE POLICY "product_returns_select_policy"
  ON public.product_returns FOR SELECT
  USING (
    -- Si la table a customer_id, vérifier que customer_id = auth.uid()
    (customer_id IS NOT NULL AND customer_id = auth.uid())
    OR
    -- Si la table a user_id, vérifier que user_id = auth.uid()
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    -- Les propriétaires de store peuvent voir les retours de leur boutique
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    OR
    -- Les admins peuvent voir tous les retours
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- S'assurer que la politique INSERT fonctionne aussi
DROP POLICY IF EXISTS "product_returns_insert_policy" ON public.product_returns;
DROP POLICY IF EXISTS "Users can create own returns" ON public.product_returns;
DROP POLICY IF EXISTS "Customers can create own returns" ON public.product_returns;

CREATE POLICY "product_returns_insert_policy"
  ON public.product_returns FOR INSERT
  WITH CHECK (
    (customer_id IS NOT NULL AND customer_id = auth.uid())
    OR
    (user_id IS NOT NULL AND user_id = auth.uid())
  );

-- S'assurer que la politique UPDATE fonctionne
DROP POLICY IF EXISTS "product_returns_update_policy" ON public.product_returns;

CREATE POLICY "product_returns_update_policy"
  ON public.product_returns FOR UPDATE
  USING (
    (customer_id IS NOT NULL AND customer_id = auth.uid())
    OR
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    (customer_id IS NOT NULL AND customer_id = auth.uid())
    OR
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- S'assurer que la politique DELETE fonctionne
DROP POLICY IF EXISTS "product_returns_delete_policy" ON public.product_returns;

CREATE POLICY "product_returns_delete_policy"
  ON public.product_returns FOR DELETE
  USING (
    (customer_id IS NOT NULL AND customer_id = auth.uid())
    OR
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

