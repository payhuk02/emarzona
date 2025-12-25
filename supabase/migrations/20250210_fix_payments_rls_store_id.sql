-- ============================================================
-- Migration : Fix Payments RLS Policy to include store_id check
-- Date : 10 Février 2025
-- Description : Corriger la politique RLS pour payments afin d'inclure une vérification directe par store_id
-- ============================================================

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "payments_select_policy" ON payments;

-- Créer une nouvelle politique qui vérifie directement store_id (PRIORITAIRE)
-- Cette vérification est la plus simple et la plus efficace
CREATE POLICY "payments_select_policy"
  ON payments FOR SELECT
  USING (
    -- PRIORITÉ 1: Vérification directe par store_id (le plus efficace et le plus commun)
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR
    -- PRIORITÉ 2: Admins peuvent tout voir (vérification via user_id, pas id)
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
    -- PRIORITÉ 4: Vérification via order_id (pour compatibilité avec anciens paiements)
    order_id IN (
      SELECT id FROM orders
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
  );

COMMENT ON POLICY "payments_select_policy" ON payments IS 
'Politique RLS pour payments : 
1. Les propriétaires de boutique peuvent voir leurs paiements via store_id (le plus efficace)
2. Les admins peuvent tout voir
3. Les clients peuvent voir leurs paiements via customer_id
4. Compatibilité avec anciens paiements via order_id';

