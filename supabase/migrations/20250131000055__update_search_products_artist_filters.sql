-- Migration: Ajout des filtres artist dans search_products
-- Date: 31 Janvier 2025
-- Description: Ajoute les filtres spécifiques aux œuvres d'artistes dans la fonction de recherche

-- ============================================================
-- Mise à jour de la fonction search_products pour supporter les filtres artist
-- ============================================================

-- Supprimer l'ancienne fonction avec sa signature exacte pour éviter l'erreur "function name is not unique"
DROP FUNCTION IF EXISTS public.search_products(
  TEXT,
  INTEGER,
  INTEGER,
  TEXT,
  TEXT,
  NUMERIC,
  NUMERIC,
  NUMERIC
);

-- Créer la nouvelle fonction avec les paramètres supplémentaires
CREATE OR REPLACE FUNCTION public.search_products(
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  -- Nouveaux paramètres pour filtres artist
  p_artist_type TEXT DEFAULT NULL,
  p_edition_type TEXT DEFAULT NULL,
  p_certificate_of_authenticity BOOLEAN DEFAULT NULL
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
    -- Jointure avec artist_products pour les filtres artist
    LEFT JOIN public.artist_products ap ON ap.product_id = p.id
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
        OR
        -- Recherche dans les données artist (nom d'artiste, titre d'œuvre)
        (ap.artist_name ILIKE '%' || p_search_query || '%')
        OR
        (ap.artwork_title ILIKE '%' || p_search_query || '%')
      )
      -- Filtres de base
      AND (p_category IS NULL OR p.category = p_category)
      AND (p_product_type IS NULL OR p.product_type = p_product_type)
      AND (p_min_price IS NULL OR COALESCE(p.promotional_price, p.price) >= p_min_price)
      AND (p_max_price IS NULL OR COALESCE(p.promotional_price, p.price) <= p_max_price)
      AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
      -- Filtres spécifiques Artist
      AND (
        p_product_type != 'artist'
        OR p_artist_type IS NULL
        OR ap.artist_type = p_artist_type
      )
      AND (
        p_product_type != 'artist'
        OR p_edition_type IS NULL
        OR ap.artwork_edition_type = p_edition_type
      )
      AND (
        p_product_type != 'artist'
        OR p_certificate_of_authenticity IS NULL
        OR ap.certificate_of_authenticity = p_certificate_of_authenticity
      )
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

-- Commentaire pour documentation
COMMENT ON FUNCTION public.search_products IS 
'Recherche full-text de produits avec support des filtres spécifiques par type, incluant les filtres artist (type d''artiste, type d''édition, certificat d''authenticité)';

