-- ============================================================
-- RLS Phase 2 : Tables PRODUITS et MARKETING
-- Date: 2025-01-30
-- 
-- Activation RLS et création de politiques pour les tables de produits,
-- catégories, avis et marketing
-- Priorité : HAUTE - Données publiques mais nécessitent contrôle d'accès
-- ============================================================

-- ============================================================
-- 1. PRODUCTS - Produits
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- SELECT : Tous peuvent voir les produits actifs, propriétaires voient tous leurs produits
CREATE POLICY "products_select_policy"
  ON products FOR SELECT
  USING (
    -- Produits actifs et non masqués sont visibles par tous
    (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
    OR
    -- Propriétaires voient tous leurs produits (même inactifs)
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    -- Admins voient tout
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Seulement propriétaires de boutique ou admins
CREATE POLICY "products_insert_policy"
  ON products FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Propriétaires de boutique ou admins
CREATE POLICY "products_update_policy"
  ON products FOR UPDATE
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins (les produits ne doivent pas être supprimés directement)
CREATE POLICY "products_delete_policy"
  ON products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. PRODUCT_VARIANTS - Variantes de produits
-- ============================================================
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- SELECT : Visibles si le produit parent est visible
CREATE POLICY "product_variants_select_policy"
  ON product_variants FOR SELECT
  USING (
    physical_product_id IN (
      SELECT id FROM products
      WHERE (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
         OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- INSERT : Via produit parent (propriétaires ou admins)
CREATE POLICY "product_variants_insert_policy"
  ON product_variants FOR INSERT
  WITH CHECK (
    physical_product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- UPDATE : Propriétaires de boutique ou admins
CREATE POLICY "product_variants_update_policy"
  ON product_variants FOR UPDATE
  USING (
    physical_product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- DELETE : Propriétaires de boutique ou admins
CREATE POLICY "product_variants_delete_policy"
  ON product_variants FOR DELETE
  USING (
    physical_product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- ============================================================
-- 3. PRODUCT_IMAGES - Images de produits
-- ============================================================
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- SELECT : Visibles si le produit parent est visible
CREATE POLICY "product_images_select_policy"
  ON product_images FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE (is_active = true AND (hide_from_store IS NULL OR hide_from_store = false))
         OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- INSERT : Via produit parent (propriétaires ou admins)
CREATE POLICY "product_images_insert_policy"
  ON product_images FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- UPDATE : Propriétaires de boutique ou admins
CREATE POLICY "product_images_update_policy"
  ON product_images FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- DELETE : Propriétaires de boutique ou admins
CREATE POLICY "product_images_delete_policy"
  ON product_images FOR DELETE
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- ============================================================
-- 4. CATEGORIES - Catégories
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- SELECT : Tous peuvent voir les catégories actives
CREATE POLICY "categories_select_policy"
  ON categories FOR SELECT
  USING (
    is_active = true
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Seulement admins (catégories globales)
CREATE POLICY "categories_insert_policy"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Seulement admins
CREATE POLICY "categories_update_policy"
  ON categories FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins
CREATE POLICY "categories_delete_policy"
  ON categories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 5. REVIEWS - Avis clients
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- SELECT : Tous peuvent voir les avis (publics)
CREATE POLICY "reviews_select_policy"
  ON reviews FOR SELECT
  USING (true);

-- INSERT : Utilisateurs authentifiés peuvent créer des avis
CREATE POLICY "reviews_insert_policy"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR user_id IS NULL  -- Permet les avis anonymes si nécessaire
    )
  );

-- UPDATE : Utilisateurs peuvent modifier leurs propres avis, admins peuvent tout modifier
CREATE POLICY "reviews_update_policy"
  ON reviews FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Utilisateurs peuvent supprimer leurs propres avis, admins peuvent tout supprimer
CREATE POLICY "reviews_delete_policy"
  ON reviews FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 6. PROMOTIONS - Promotions
-- ============================================================
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- SELECT : Tous peuvent voir les promotions actives, propriétaires voient toutes leurs promotions
CREATE POLICY "promotions_select_policy"
  ON promotions FOR SELECT
  USING (
    -- Promotions actives et valides sont visibles par tous
    (is_active = true 
     AND (start_date IS NULL OR start_date <= NOW())
     AND (end_date IS NULL OR end_date >= NOW()))
    OR
    -- Propriétaires voient toutes leurs promotions
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    -- Admins voient tout
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Propriétaires de boutique ou admins
CREATE POLICY "promotions_insert_policy"
  ON promotions FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Propriétaires de boutique ou admins
CREATE POLICY "promotions_update_policy"
  ON promotions FOR UPDATE
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Propriétaires de boutique ou admins
CREATE POLICY "promotions_delete_policy"
  ON promotions FOR DELETE
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 7. EMAIL_CAMPAIGNS - Campagnes email
-- NOTE: Table "email_campaigns" non trouvée dans la base de données.
-- Si la table existe, décommenter cette section.
-- ============================================================
-- ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- SELECT : Propriétaires voient leurs campagnes, admins voient tout
-- CREATE POLICY "email_campaigns_select_policy"
--   ON email_campaigns FOR SELECT
--   USING (
--     store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- INSERT : Propriétaires de boutique ou admins
-- CREATE POLICY "email_campaigns_insert_policy"
--   ON email_campaigns FOR INSERT
--   WITH CHECK (
--     store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- UPDATE : Propriétaires de boutique ou admins
-- CREATE POLICY "email_campaigns_update_policy"
--   ON email_campaigns FOR UPDATE
--   USING (
--     store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- DELETE : Propriétaires de boutique ou admins
-- CREATE POLICY "email_campaigns_delete_policy"
--   ON email_campaigns FOR DELETE
--   USING (
--     store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- ============================================================
-- 8. EMAIL_WORKFLOWS - Workflows email
-- NOTE: Table "email_workflows" non trouvée dans la base de données.
-- Si la table existe, décommenter cette section.
-- ============================================================
-- ALTER TABLE email_workflows ENABLE ROW LEVEL SECURITY;

-- SELECT : Propriétaires voient leurs workflows, admins voient tout
-- CREATE POLICY "email_workflows_select_policy"
--   ON email_workflows FOR SELECT
--   USING (
--     store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- INSERT : Propriétaires de boutique ou admins
-- CREATE POLICY "email_workflows_insert_policy"
--   ON email_workflows FOR INSERT
--   WITH CHECK (
--     store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- UPDATE : Propriétaires de boutique ou admins
-- CREATE POLICY "email_workflows_update_policy"
--   ON email_workflows FOR UPDATE
--   USING (
--     store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- DELETE : Propriétaires de boutique ou admins
-- CREATE POLICY "email_workflows_delete_policy"
--   ON email_workflows FOR DELETE
--   USING (
--     store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- ============================================================
-- Commentaires pour documentation
-- ============================================================
COMMENT ON POLICY "products_select_policy" ON products IS 'Produits actifs visibles par tous, propriétaires voient tous leurs produits, admins voient tout';
COMMENT ON POLICY "product_variants_select_policy" ON product_variants IS 'Variantes visibles si produit parent visible';
COMMENT ON POLICY "product_images_select_policy" ON product_images IS 'Images visibles si produit parent visible';
COMMENT ON POLICY "categories_select_policy" ON categories IS 'Catégories actives visibles par tous, gestion par admins uniquement';
COMMENT ON POLICY "reviews_select_policy" ON reviews IS 'Avis publics visibles par tous, utilisateurs gèrent leurs propres avis';
COMMENT ON POLICY "promotions_select_policy" ON promotions IS 'Promotions actives visibles par tous, propriétaires gèrent leurs promotions';
-- COMMENT ON POLICY "email_campaigns_select_policy" ON email_campaigns IS 'Propriétaires voient leurs campagnes email, admins voient tout';
-- COMMENT ON POLICY "email_workflows_select_policy" ON email_workflows IS 'Propriétaires voient leurs workflows email, admins voient tout';

