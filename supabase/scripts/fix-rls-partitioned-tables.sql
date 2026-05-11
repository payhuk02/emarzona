-- ============================================================
-- Script de Correction RLS pour Tables Partitionnées
-- ============================================================
-- Basé sur les résultats de l'audit RLS
-- Date: 2025-01-30
-- ============================================================

-- ============================================================
-- TABLE: digital_product_downloads_partitioned
-- ============================================================

-- Activer RLS
ALTER TABLE digital_product_downloads_partitioned ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres téléchargements
CREATE POLICY "Users can view their own downloads"
  ON digital_product_downloads_partitioned
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent créer leurs propres téléchargements
CREATE POLICY "Users can create their own downloads"
  ON digital_product_downloads_partitioned
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent mettre à jour leurs propres téléchargements
CREATE POLICY "Users can update their own downloads"
  ON digital_product_downloads_partitioned
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: DELETE généralement non autorisé pour les téléchargements (historique)

-- ============================================================
-- TABLE: orders_partitioned
-- ============================================================

-- Vérifier que RLS est activé (déjà activé selon l'audit)
ALTER TABLE orders_partitioned ENABLE ROW LEVEL SECURITY;

-- Politique: Les clients peuvent voir leurs propres commandes
CREATE POLICY "Customers can view their own orders"
  ON orders_partitioned
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Politique: Les vendeurs peuvent voir les commandes de leurs produits
CREATE POLICY "Vendors can view orders for their products"
  ON orders_partitioned
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE oi.order_id = orders_partitioned.id
      AND s.user_id = auth.uid()
    )
  );

-- Politique: Les admins peuvent voir toutes les commandes
CREATE POLICY "Admins can view all orders"
  ON orders_partitioned
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Politique: Les clients peuvent créer leurs propres commandes
CREATE POLICY "Customers can create their own orders"
  ON orders_partitioned
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Politique: Les vendeurs peuvent mettre à jour les commandes de leurs produits
CREATE POLICY "Vendors can update orders for their products"
  ON orders_partitioned
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE oi.order_id = orders_partitioned.id
      AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE oi.order_id = orders_partitioned.id
      AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- VÉRIFICATION POST-APPLICATION
-- ============================================================

-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('digital_product_downloads_partitioned', 'orders_partitioned')
ORDER BY tablename;

-- Vérifier les politiques créées
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('digital_product_downloads_partitioned', 'orders_partitioned')
ORDER BY tablename, policyname;

-- ============================================================
-- NOTES
-- ============================================================
-- 
-- Après avoir exécuté ce script:
-- 1. Tester les politiques en développement
-- 2. Vérifier que les utilisateurs peuvent accéder à leurs données
-- 3. Vérifier que les vendeurs peuvent accéder aux commandes de leurs produits
-- 4. Documenter dans supabase/rls-policies.md
--
-- Voir: docs/GUIDE_APPLICATION_AUDIT_RLS.md pour plus de détails
-- ============================================================

