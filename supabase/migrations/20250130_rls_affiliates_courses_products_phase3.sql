-- ============================================================
-- RLS Phase 3 : Tables AFFILIATION, COURSES et PRODUITS SPÉCIALISÉS
-- Date: 2025-01-30
-- 
-- Activation RLS et création de politiques pour les tables d'affiliation,
-- cours, produits digitaux/physiques/services et retraits
-- Priorité : HAUTE - Données sensibles (affiliation, commissions, retraits)
-- ============================================================

-- ============================================================
-- 1. AFFILIATES - Affiliés
-- ============================================================
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- SELECT : Affiliés voient leurs propres données, admins voient tout
CREATE POLICY "affiliates_select_policy"
  ON affiliates FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Utilisateurs authentifiés peuvent devenir affiliés
CREATE POLICY "affiliates_insert_policy"
  ON affiliates FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Affiliés peuvent modifier leurs propres données, admins peuvent tout modifier
CREATE POLICY "affiliates_update_policy"
  ON affiliates FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins
CREATE POLICY "affiliates_delete_policy"
  ON affiliates FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. AFFILIATE_LINKS - Liens d'affiliation
-- ============================================================
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- SELECT : Affiliés voient leurs liens, propriétaires voient les liens de leur boutique, admins voient tout
CREATE POLICY "affiliate_links_select_policy"
  ON affiliate_links FOR SELECT
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Affiliés peuvent créer des liens pour les produits des boutiques
CREATE POLICY "affiliate_links_insert_policy"
  ON affiliate_links FOR INSERT
  WITH CHECK (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Affiliés ou propriétaires de boutique ou admins
CREATE POLICY "affiliate_links_update_policy"
  ON affiliate_links FOR UPDATE
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Affiliés ou propriétaires de boutique ou admins
CREATE POLICY "affiliate_links_delete_policy"
  ON affiliate_links FOR DELETE
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 3. COMMISSION_PAYMENTS - Paiements de commissions
-- ============================================================
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

-- SELECT : Affiliés voient leurs paiements, admins voient tout
CREATE POLICY "commission_payments_select_policy"
  ON commission_payments FOR SELECT
  USING (
    referrer_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Seulement système/admin (via application)
CREATE POLICY "commission_payments_insert_policy"
  ON commission_payments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Seulement admins
CREATE POLICY "commission_payments_update_policy"
  ON commission_payments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins
CREATE POLICY "commission_payments_delete_policy"
  ON commission_payments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 4. COURSES - Cours
-- ============================================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- SELECT : Tous peuvent voir les cours (via produit parent), propriétaires voient leurs cours
CREATE POLICY "courses_select_policy"
  ON courses FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
         OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- INSERT : Via produit parent (propriétaires ou admins)
CREATE POLICY "courses_insert_policy"
  ON courses FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- UPDATE : Propriétaires de boutique ou admins
CREATE POLICY "courses_update_policy"
  ON courses FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- DELETE : Seulement admins
CREATE POLICY "courses_delete_policy"
  ON courses FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 5. COURSE_ENROLLMENTS - Inscriptions aux cours
-- ============================================================
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- SELECT : Utilisateurs voient leurs inscriptions, propriétaires voient les inscriptions à leurs cours
CREATE POLICY "course_enrollments_select_policy"
  ON course_enrollments FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    course_id IN (
      SELECT id FROM courses
      WHERE product_id IN (
        SELECT id FROM products
        WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
      )
    )
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Via application lors de l'achat d'un cours
CREATE POLICY "course_enrollments_insert_policy"
  ON course_enrollments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Utilisateurs peuvent modifier leurs propres inscriptions, propriétaires ou admins
CREATE POLICY "course_enrollments_update_policy"
  ON course_enrollments FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    course_id IN (
      SELECT id FROM courses
      WHERE product_id IN (
        SELECT id FROM products
        WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
      )
    )
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins (les inscriptions ne doivent pas être supprimées directement)
CREATE POLICY "course_enrollments_delete_policy"
  ON course_enrollments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 6. DIGITAL_PRODUCTS - Produits digitaux
-- ============================================================
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;

-- SELECT : Visibles si le produit parent est visible
CREATE POLICY "digital_products_select_policy"
  ON digital_products FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
         OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- INSERT : Via produit parent (propriétaires ou admins)
CREATE POLICY "digital_products_insert_policy"
  ON digital_products FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- UPDATE : Propriétaires de boutique ou admins
CREATE POLICY "digital_products_update_policy"
  ON digital_products FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- DELETE : Seulement admins
CREATE POLICY "digital_products_delete_policy"
  ON digital_products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 7. PHYSICAL_PRODUCTS - Produits physiques
-- ============================================================
ALTER TABLE physical_products ENABLE ROW LEVEL SECURITY;

-- SELECT : Visibles si le produit parent est visible
CREATE POLICY "physical_products_select_policy"
  ON physical_products FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
         OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- INSERT : Via produit parent (propriétaires ou admins)
CREATE POLICY "physical_products_insert_policy"
  ON physical_products FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- UPDATE : Propriétaires de boutique ou admins
CREATE POLICY "physical_products_update_policy"
  ON physical_products FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- DELETE : Seulement admins
CREATE POLICY "physical_products_delete_policy"
  ON physical_products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 8. SERVICE_PRODUCTS - Produits de service
-- ============================================================
ALTER TABLE service_products ENABLE ROW LEVEL SECURITY;

-- SELECT : Visibles si le produit parent est visible
CREATE POLICY "service_products_select_policy"
  ON service_products FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
         OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- INSERT : Via produit parent (propriétaires ou admins)
CREATE POLICY "service_products_insert_policy"
  ON service_products FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- UPDATE : Propriétaires de boutique ou admins
CREATE POLICY "service_products_update_policy"
  ON service_products FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- DELETE : Seulement admins
CREATE POLICY "service_products_delete_policy"
  ON service_products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 9. STORE_WITHDRAWALS - Retraits de boutique
-- ============================================================
ALTER TABLE store_withdrawals ENABLE ROW LEVEL SECURITY;

-- SELECT : Propriétaires voient leurs retraits, admins voient tout
CREATE POLICY "store_withdrawals_select_policy"
  ON store_withdrawals FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Propriétaires de boutique peuvent créer des demandes de retrait
CREATE POLICY "store_withdrawals_insert_policy"
  ON store_withdrawals FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Propriétaires peuvent modifier leurs demandes en attente, admins peuvent tout modifier
CREATE POLICY "store_withdrawals_update_policy"
  ON store_withdrawals FOR UPDATE
  USING (
    (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
     AND status = 'pending')  -- Propriétaires peuvent modifier seulement les demandes en attente
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins
CREATE POLICY "store_withdrawals_delete_policy"
  ON store_withdrawals FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Commentaires pour documentation
-- ============================================================
COMMENT ON POLICY "affiliates_select_policy" ON affiliates IS 'Affiliés voient leurs propres données, admins voient tout';
COMMENT ON POLICY "affiliate_links_select_policy" ON affiliate_links IS 'Affiliés voient leurs liens, propriétaires voient les liens de leur boutique, admins voient tout';
COMMENT ON POLICY "commission_payments_select_policy" ON commission_payments IS 'Affiliés voient leurs paiements de commissions, admins voient tout';
COMMENT ON POLICY "courses_select_policy" ON courses IS 'Cours visibles si produit parent visible, propriétaires gèrent leurs cours';
COMMENT ON POLICY "course_enrollments_select_policy" ON course_enrollments IS 'Utilisateurs voient leurs inscriptions, propriétaires voient les inscriptions à leurs cours';
COMMENT ON POLICY "digital_products_select_policy" ON digital_products IS 'Produits digitaux visibles si produit parent visible';
COMMENT ON POLICY "physical_products_select_policy" ON physical_products IS 'Produits physiques visibles si produit parent visible';
COMMENT ON POLICY "service_products_select_policy" ON service_products IS 'Produits de service visibles si produit parent visible';
COMMENT ON POLICY "store_withdrawals_select_policy" ON store_withdrawals IS 'Propriétaires voient leurs retraits, admins voient tout';

