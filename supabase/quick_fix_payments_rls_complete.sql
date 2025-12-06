-- ============================================================
-- QUICK FIX COMPLETE: Corriger la politique RLS pour payments
-- À exécuter IMMÉDIATEMENT dans Supabase Dashboard → SQL Editor
-- 
-- PROBLÈME IDENTIFIÉ:
-- 1. La politique utilise profiles.id au lieu de profiles.user_id
-- 2. La vérification via customer_id essaie d'accéder à auth.users
-- ============================================================

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "payments_select_policy" ON payments;

-- Créer la nouvelle politique CORRIGÉE
CREATE POLICY "payments_select_policy"
  ON payments FOR SELECT
  USING (
    -- PRIORITÉ 1: Vérification directe par store_id (le plus efficace)
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR
    -- PRIORITÉ 2: Admins peuvent tout voir (CORRIGÉ: utiliser profiles.user_id)
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- PRIORITÉ 3: Vérification via customer_id (SIMPLIFIÉE pour éviter auth.users)
    -- On vérifie simplement que le customer appartient à une boutique de l'utilisateur
    customer_id IN (
      SELECT id FROM customers 
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
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
  cmd
FROM pg_policies 
WHERE tablename = 'payments' AND policyname = 'payments_select_policy';

