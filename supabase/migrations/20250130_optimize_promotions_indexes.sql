-- =====================================================
-- OPTIMISATION DES INDEX POUR LES PROMOTIONS
-- Date: 30 Janvier 2025
-- Description: Création d'index composites pour améliorer les performances
--              des requêtes de promotions avec filtres et pagination
-- =====================================================

-- =====================================================
-- 1. INDEX COMPOSITE POUR PROMOTIONS (table simple)
-- =====================================================

-- Index pour requêtes fréquentes : store_id + is_active + dates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_promotions_store_active_dates'
  ) THEN
    CREATE INDEX idx_promotions_store_active_dates 
    ON public.promotions(store_id, is_active, start_date, end_date)
    WHERE is_active = true;
  END IF;
END $$;

-- Index pour recherche par code (déjà existe mais on vérifie)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_promotions_code'
  ) THEN
    CREATE INDEX idx_promotions_code 
    ON public.promotions(code);
    
  END IF;
END $$;

-- Index pour recherche textuelle (code + description)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_promotions_search'
  ) THEN
    CREATE INDEX idx_promotions_search 
    ON public.promotions USING gin(
      to_tsvector('french', coalesce(code, '') || ' ' || coalesce(description, ''))
    );
    
  END IF;
END $$;

-- =====================================================
-- 2. INDEX COMPOSITE POUR PRODUCT_PROMOTIONS
-- =====================================================

-- Index pour requêtes fréquentes : store_id + is_active + dates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_product_promotions_store_active_dates'
  ) THEN
    CREATE INDEX idx_product_promotions_store_active_dates 
    ON public.product_promotions(store_id, is_active, starts_at, ends_at)
    WHERE is_active = true;
    
  END IF;
END $$;

-- Index pour recherche par code (vérifier si existe déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_product_promotions_code_search'
  ) THEN
    CREATE INDEX idx_product_promotions_code_search 
    ON public.product_promotions(code)
    WHERE code IS NOT NULL;
    
  END IF;
END $$;

-- Index pour recherche textuelle (name + description)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_product_promotions_search'
  ) THEN
    CREATE INDEX idx_product_promotions_search 
    ON public.product_promotions USING gin(
      to_tsvector('french', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(code, ''))
    );
    
  END IF;
END $$;

-- Index pour filtrage par type de réduction
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_product_promotions_discount_type'
  ) THEN
    CREATE INDEX idx_product_promotions_discount_type 
    ON public.product_promotions(store_id, discount_type, is_active);
    
  END IF;
END $$;

-- =====================================================
-- 3. INDEX POUR PROMOTION_USAGE (table de suivi)
-- =====================================================

-- Index composite pour requêtes d'utilisation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_promotion_usage_promotion_customer'
  ) THEN
    CREATE INDEX idx_promotion_usage_promotion_customer 
    ON public.promotion_usage(promotion_id, customer_id);
    
  END IF;
END $$;

-- Index pour statistiques par date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_promotion_usage_date'
  ) THEN
    CREATE INDEX idx_promotion_usage_date 
    ON public.promotion_usage(used_at DESC);
    
  END IF;
END $$;

-- =====================================================
-- 4. ANALYSE DES TABLES POUR OPTIMISATION
-- =====================================================

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE public.promotions;
ANALYZE public.product_promotions;
ANALYZE public.promotion_usage;

-- =====================================================
-- 5. COMMENTAIRES SUR LES INDEX
-- =====================================================

COMMENT ON INDEX idx_promotions_store_active_dates IS 
'Index composite pour requêtes fréquentes: promotions actives d''un store avec filtres de dates';

COMMENT ON INDEX idx_promotions_search IS 
'Index GIN pour recherche textuelle rapide dans code et description';

COMMENT ON INDEX idx_product_promotions_store_active_dates IS 
'Index composite pour requêtes fréquentes: promotions actives d''un store avec filtres de dates';

COMMENT ON INDEX idx_product_promotions_search IS 
'Index GIN pour recherche textuelle rapide dans name, description et code';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

