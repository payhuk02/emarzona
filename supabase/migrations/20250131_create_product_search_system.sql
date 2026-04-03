-- Migration: Système de Recherche Avancée avec Full-Text Search
-- Date: 31 Janvier 2025
-- Description: Ajoute full-text search et auto-complétion pour les produits

-- ============================================================
-- ÉTAPE 1: Créer colonne FTS (Full-Text Search) si elle n'existe pas
-- ============================================================

-- Ajouter colonne pour full-text search
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'fts'
  ) THEN
    ALTER TABLE public.products
    ADD COLUMN fts tsvector;
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 2: Créer fonction pour mettre à jour FTS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_product_fts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fts :=
    setweight(to_tsvector('french', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.short_description, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- ÉTAPE 3: Créer trigger pour mettre à jour FTS automatiquement
-- ============================================================

DROP TRIGGER IF EXISTS trigger_update_product_fts ON public.products;
CREATE TRIGGER trigger_update_product_fts
  BEFORE INSERT OR UPDATE OF name, description, short_description, category, tags ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_fts();

-- ============================================================
-- ÉTAPE 4: Mettre à jour FTS pour les produits existants
-- ============================================================

UPDATE public.products
SET fts =
  setweight(to_tsvector('french', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('french', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('french', COALESCE(short_description, '')), 'B') ||
  setweight(to_tsvector('french', COALESCE(category, '')), 'C') ||
  setweight(to_tsvector('french', COALESCE(array_to_string(tags, ' '), '')), 'C')
WHERE fts IS NULL;

-- ============================================================
-- ÉTAPE 5: Créer index GIN pour performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products USING gin(fts);

-- ============================================================
-- ÉTAPE 6: Activer l'extension pg_trgm si nécessaire
-- ============================================================

-- Activer l'extension pg_trgm AVANT de créer les index qui l'utilisent
-- Note: Dans Supabase, cette extension doit être activée via l'interface Dashboard
-- ou nécessite des privilèges super-utilisateur
DO $$
BEGIN
  -- Essayer d'activer l'extension
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Si les privilèges sont insuffisants, on continuera sans pg_trgm
    RAISE NOTICE 'Extension pg_trgm non disponible. L''auto-complétion utilisera une recherche ILIKE standard.';
  WHEN OTHERS THEN
    -- Autre erreur, on continue sans pg_trgm
    RAISE NOTICE 'Extension pg_trgm non disponible: %', SQLERRM;
END $$;

-- ============================================================
-- ÉTAPE 7: Créer index pour recherche par nom (auto-complétion)
-- ============================================================

-- Essayer de créer l'index avec pg_trgm, sinon utiliser un index B-tree standard
DO $$
BEGIN
  -- Vérifier si l'extension pg_trgm est disponible
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
  ) THEN
    -- Créer l'index GIN avec pg_trgm pour recherche de similarité
    CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
    ON public.products USING gin(name gin_trgm_ops);
  ELSE
    -- Fallback: Créer un index B-tree standard pour recherche par préfixe
    CREATE INDEX IF NOT EXISTS idx_products_name_prefix 
    ON public.products(name text_pattern_ops);
    
    -- Créer aussi un index standard pour recherche ILIKE
    CREATE INDEX IF NOT EXISTS idx_products_name_ilike 
    ON public.products(name);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, créer un index B-tree standard
    CREATE INDEX IF NOT EXISTS idx_products_name_prefix 
    ON public.products(name text_pattern_ops);
    
    CREATE INDEX IF NOT EXISTS idx_products_name_ilike 
    ON public.products(name);
END $$;

-- ============================================================
-- ÉTAPE 8: Fonction pour recherche full-text avec ranking
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_products(
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  image_url TEXT,
  price NUMERIC,
  promotional_price NUMERIC,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  purchases_count INTEGER,
  store_id UUID,
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  rank NUMERIC,
  match_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.description,
      p.image_url,
      p.price,
      p.promotional_price,
      p.currency,
      p.category,
      p.product_type,
      p.rating,
      p.reviews_count,
      p.purchases_count,
      p.store_id,
      s.name AS store_name,
      s.slug AS store_slug,
      s.logo_url AS store_logo_url,
      -- Calcul du rank basé sur pertinence FTS
      ts_rank_cd(p.fts, plainto_tsquery('french', p_search_query)) AS rank,
      -- Type de match pour priorisation
      CASE
        WHEN p.name ILIKE '%' || p_search_query || '%' THEN 'exact_name'
        WHEN p.name ILIKE p_search_query || '%' THEN 'starts_with'
        WHEN p.fts @@ plainto_tsquery('french', p_search_query) THEN 'full_text'
        ELSE 'partial'
      END AS match_type
    FROM public.products p
    INNER JOIN public.stores s ON s.id = p.store_id
    WHERE p.is_active = true
      AND p.is_draft = false
      AND (
        -- Recherche full-text
        p.fts @@ plainto_tsquery('french', p_search_query)
        OR
        -- Recherche par nom (similarité si pg_trgm disponible, sinon ILIKE)
        (
          (EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AND p.name % p_search_query)
          OR
          (NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AND p.name ILIKE '%' || p_search_query || '%')
        )
        OR
        -- Recherche par catégorie/tags
        p.category ILIKE '%' || p_search_query || '%'
        OR
        EXISTS (
          SELECT 1 FROM unnest(p.tags) tag
          WHERE tag ILIKE '%' || p_search_query || '%'
        )
      )
      AND (p_category IS NULL OR p.category = p_category)
      AND (p_product_type IS NULL OR p.product_type = p_product_type)
      AND (p_min_price IS NULL OR COALESCE(p.promotional_price, p.price) >= p_min_price)
      AND (p_max_price IS NULL OR COALESCE(p.promotional_price, p.price) <= p_max_price)
      AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
  )
  SELECT 
    sr.id,
    sr.name,
    sr.slug,
    sr.description,
    sr.image_url,
    sr.price,
    sr.promotional_price,
    sr.currency,
    sr.category,
    sr.product_type,
    sr.rating,
    sr.reviews_count,
    sr.purchases_count,
    sr.store_id,
    sr.store_name,
    sr.store_slug,
    sr.store_logo_url,
    sr.rank,
    sr.match_type
  FROM search_results sr
  ORDER BY
    -- Prioriser les correspondances exactes
    CASE sr.match_type
      WHEN 'exact_name' THEN 1
      WHEN 'starts_with' THEN 2
      WHEN 'full_text' THEN 3
      ELSE 4
    END,
    sr.rank DESC,
    sr.purchases_count DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- ÉTAPE 9: Fonction pour auto-complétion (suggestions)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_search_suggestions(
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  suggestion TEXT,
  suggestion_type TEXT,
  count INTEGER,
  relevance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH product_suggestions AS (
    SELECT DISTINCT
      p.name AS suggestion,
      'product' AS suggestion_type,
      COUNT(*)::INTEGER AS count,
      -- Calculer la pertinence selon la disponibilité de pg_trgm
      CASE
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
          MAX(similarity(p.name, p_query))
        ELSE
          MAX(
            CASE 
              WHEN LOWER(p.name) = LOWER(p_query) THEN 1.0
              WHEN p.name ILIKE p_query || '%' THEN 0.9
              WHEN p.name ILIKE '%' || p_query || '%' THEN 0.5
              ELSE 0.0
            END
          )::NUMERIC
      END AS relevance
    FROM public.products p
    WHERE p.is_active = true
      AND p.is_draft = false
      AND (
        (EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AND p.name % p_query)
        OR
        (NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AND p.name ILIKE '%' || p_query || '%')
      )
    GROUP BY p.name
    ORDER BY relevance DESC, count DESC
    LIMIT p_limit
  ),
  category_suggestions AS (
    SELECT DISTINCT
      p.category AS suggestion,
      'category' AS suggestion_type,
      COUNT(*)::INTEGER AS count,
      CASE
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
          MAX(similarity(p.category, p_query))
        ELSE
          MAX(
            CASE 
              WHEN LOWER(p.category) = LOWER(p_query) THEN 1.0
              WHEN p.category ILIKE p_query || '%' THEN 0.9
              WHEN p.category ILIKE '%' || p_query || '%' THEN 0.5
              ELSE 0.0
            END
          )::NUMERIC
      END AS relevance
    FROM public.products p
    WHERE p.is_active = true
      AND p.is_draft = false
      AND p.category IS NOT NULL
      AND (
        (EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AND p.category % p_query)
        OR
        (NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AND p.category ILIKE '%' || p_query || '%')
      )
    GROUP BY p.category
    ORDER BY relevance DESC, count DESC
    LIMIT 5
  ),
  tag_suggestions AS (
    SELECT DISTINCT
      tag AS suggestion,
      'tag' AS suggestion_type,
      COUNT(*)::INTEGER AS count,
      CASE
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
          MAX(similarity(tag, p_query))
        ELSE
          MAX(
            CASE 
              WHEN LOWER(tag) = LOWER(p_query) THEN 1.0
              WHEN tag ILIKE p_query || '%' THEN 0.9
              WHEN tag ILIKE '%' || p_query || '%' THEN 0.5
              ELSE 0.0
            END
          )::NUMERIC
      END AS relevance
    FROM public.products p
    CROSS JOIN LATERAL unnest(p.tags) tag
    WHERE p.is_active = true
      AND p.is_draft = false
      AND (
        (EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AND tag % p_query)
        OR
        (NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AND tag ILIKE '%' || p_query || '%')
      )
    GROUP BY tag
    ORDER BY relevance DESC, count DESC
    LIMIT 5
  ),
  all_suggestions AS (
    SELECT * FROM product_suggestions
    UNION ALL
    SELECT * FROM category_suggestions
    UNION ALL
    SELECT * FROM tag_suggestions
  )
  SELECT 
    suggestion,
    suggestion_type,
    count,
    relevance
  FROM all_suggestions
  ORDER BY 
    CASE suggestion_type
      WHEN 'product' THEN 1
      WHEN 'category' THEN 2
      WHEN 'tag' THEN 3
    END,
    relevance DESC,
    count DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- ÉTAPE 10: Fonction pour recherches populaires
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_popular_searches(
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  query TEXT,
  count BIGINT,
  last_searched TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cette fonction nécessitera une table search_history si elle existe
  -- Pour l'instant, retournons des catégories populaires
  RETURN QUERY
  SELECT 
    p.category AS query,
    COUNT(*)::BIGINT AS count,
    MAX(p.created_at) AS last_searched
  FROM public.products p
  WHERE p.is_active = true
    AND p.is_draft = false
    AND p.category IS NOT NULL
    AND p.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY p.category
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- ÉTAPE 11: Table pour historique de recherche (optionnel)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON public.search_history(query);

-- RLS pour search_history
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search history"
  ON public.search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON public.search_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON COLUMN public.products.fts IS 'Colonne full-text search pour recherche avancée';
COMMENT ON FUNCTION public.update_product_fts() IS 'Met à jour la colonne FTS lors des modifications de produit';
COMMENT ON FUNCTION public.search_products(TEXT, INTEGER, INTEGER, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC) IS 'Recherche full-text de produits avec ranking et filtres';
COMMENT ON FUNCTION public.get_search_suggestions(TEXT, INTEGER) IS 'Retourne des suggestions de recherche pour auto-complétion';
COMMENT ON FUNCTION public.get_popular_searches(INTEGER, INTEGER) IS 'Retourne les recherches populaires';
COMMENT ON TABLE public.search_history IS 'Historique des recherches utilisateurs';

