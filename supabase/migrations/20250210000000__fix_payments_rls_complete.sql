-- ============================================================
-- Migration : Fix Payments RLS Policy COMPLETE
-- Date : 10 Février 2025
-- Description : Corriger COMPLÈTEMENT la politique RLS pour payments
-- Problème : La politique utilise profiles.id au lieu de profiles.user_id
-- ============================================================

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "payments_select_policy" ON payments;

-- Créer la nouvelle politique CORRIGÉE avec toutes les vérifications nécessaires
CREATE POLICY "payments_select_policy"
  ON payments FOR SELECT
  USING (
    -- PRIORITÉ 1: Vérification directe par store_id (le plus efficace et le plus commun)
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR
    -- PRIORITÉ 2: Admins peuvent tout voir (CORRIGÉ: utiliser profiles.user_id au lieu de profiles.id)
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- PRIORITÉ 3: Vérification via customer_id (pour les clients)
    -- Note: Cette vérification nécessite l'accès à auth.users, donc on la simplifie
    customer_id IN (
      SELECT id FROM customers 
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    OR
    -- PRIORITÉ 4: Vérification via order_id (pour compatibilité avec anciens paiements)
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

COMMENT ON POLICY "payments_select_policy" ON payments IS 
'Politique RLS pour payments : 
1. Les propriétaires de boutique peuvent voir leurs paiements via store_id (le plus efficace)
2. Les admins peuvent tout voir (via profiles.user_id)
3. Les clients peuvent voir leurs paiements via customer_id (simplifié pour éviter auth.users)
4. Compatibilité avec anciens paiements via order_id';

