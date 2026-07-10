-- ============================================================
-- RLS Harden Phase : Orders and related tables INSERT policies
-- Date: 2026-07-10
--
-- Restreindre la création de commandes, paiements, etc.
-- pour empêcher l'usurpation d'identité via l'API REST Supabase.
-- ============================================================

BEGIN;

-- 1. ORDERS
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
CREATE POLICY "orders_insert_policy"
  ON orders FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    (
      -- Le client crée une commande pour lui-même
      customer_id IN (
        SELECT id FROM customers 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
      OR
      -- L'admin peut créer n'importe quelle commande
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- 2. ORDER_ITEMS
DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
CREATE POLICY "order_items_insert_policy"
  ON order_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (
        SELECT id FROM customers 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
      OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- 3. PAYMENTS
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
CREATE POLICY "payments_insert_policy"
  ON payments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    (
      customer_id IN (
        SELECT id FROM customers 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
      OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- 4. TRANSACTIONS
DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;
CREATE POLICY "transactions_insert_policy"
  ON transactions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    (
      user_id = auth.uid()
      OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- 5. SHIPMENTS
-- Une expédition est généralement créée par le vendeur (propriétaire de boutique)
DROP POLICY IF EXISTS "shipments_insert_policy" ON shipments;
CREATE POLICY "shipments_insert_policy"
  ON shipments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    (
      order_id IN (
        SELECT id FROM orders
        WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
      )
      OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

COMMIT;
