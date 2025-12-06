-- ============================================================
-- Migration : Fix Payments RLS Policy to include store_id check
-- Date : 10 Février 2025
-- Description : Corriger la politique RLS pour payments afin d'inclure une vérification directe par store_id
-- ============================================================

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "payments_select_policy" ON payments;

-- Créer une nouvelle politique qui vérifie directement store_id
CREATE POLICY "payments_select_policy"
  ON payments FOR SELECT
  USING (
    -- Vérification directe par store_id (plus efficace)
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR
    -- Vérification via customer_id (pour les clients)
    customer_id IN (
      SELECT id FROM customers 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR
    -- Vérification via order_id (pour compatibilité)
    order_id IN (
      SELECT id FROM orders
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    OR
    -- Admins peuvent tout voir
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY "payments_select_policy" ON payments IS 
'Politique RLS pour payments : Les propriétaires de boutique peuvent voir leurs paiements via store_id, les clients via customer_id, et les admins peuvent tout voir';

