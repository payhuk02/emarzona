-- =========================================================
-- 🔧 Index pour accélérer les requêtes sur la table products
-- =========================================================

-- Index pour accélérer les requêtes par store
CREATE INDEX IF NOT EXISTS idx_products_store_id 
  ON public.products(store_id);

-- Index pour rechercher les produits par slug
CREATE INDEX IF NOT EXISTS idx_products_slug 
  ON public.products(slug);

-- Index pour filtrer les produits actifs
CREATE INDEX IF NOT EXISTS idx_products_is_active 
  ON public.products(is_active);

-- Index pour trier ou filtrer par note moyenne
CREATE INDEX IF NOT EXISTS idx_products_rating 
  ON public.products(rating);

-- Index pour les filtres ou tris par prix promotionnel
CREATE INDEX IF NOT EXISTS idx_products_promo_price 
  ON public.products(promo_price);
