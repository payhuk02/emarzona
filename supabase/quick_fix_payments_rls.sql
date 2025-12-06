-- ============================================================
-- QUICK FIX: Corriger la politique RLS pour payments
-- À exécuter IMMÉDIATEMENT dans Supabase Dashboard → SQL Editor
-- ============================================================

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "payments_select_policy" ON payments;

-- Créer la nouvelle politique avec vérification store_id prioritaire
CREATE POLICY "payments_select_policy"
  ON payments FOR SELECT
  USING (
    -- PRIORITÉ 1: Vérification directe par store_id (le plus efficace)
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR
    -- PRIORITÉ 2: Admins peuvent tout voir
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- PRIORITÉ 3: Vérification via customer_id (pour les clients)
    customer_id IN (
      SELECT id FROM customers 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR
    -- PRIORITÉ 4: Vérification via order_id (pour compatibilité)
    order_id IN (
      SELECT id FROM orders
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
  );

-- Vérifier que la politique est créée
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'payments' AND policyname = 'payments_select_policy';

