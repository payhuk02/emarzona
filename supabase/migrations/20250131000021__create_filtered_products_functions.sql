-- Migration: Fonctions RPC pour filtrage serveur des produits avec relations
-- Date: 31 Janvier 2025
-- Description: Crée des fonctions optimisées pour filtrer les produits par type avec leurs relations
--              Remplace le filtrage côté client pour améliorer les performances

-- ============================================================
-- FONCTION 1: Filtrer les produits digitaux avec relations
-- ============================================================

CREATE OR REPLACE FUNCTION public.filter_digital_products(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_digital_sub_type TEXT DEFAULT NULL,
  p_instant_delivery BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
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
  is_active BOOLEAN,
  is_draft BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tags TEXT[],
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  digital_type TEXT,
  license_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
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
    p.is_active,
    p.is_draft,
    p.created_at,
    p.updated_at,
    p.tags,
    s.name AS store_name,
    s.slug AS store_slug,
    s.logo_url AS store_logo_url,
    dp.digital_type,
    dp.license_type
  FROM public.products p
  INNER JOIN public.stores s ON s.id = p.store_id
  LEFT JOIN public.digital_products dp ON dp.product_id = p.id
  WHERE p.is_active = true
    AND p.is_draft = false
    AND p.product_type = 'digital'
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR COALESCE(p.promotional_price, p.price) >= p_min_price)
    AND (p_max_price IS NULL OR COALESCE(p.promotional_price, p.price) <= p_max_price)
    AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
    AND (p_digital_sub_type IS NULL OR dp.digital_type = p_digital_sub_type)
    AND (p_instant_delivery IS NULL OR dp.instant_delivery = p_instant_delivery)
  ORDER BY
    CASE 
      WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN p.price
      WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN -p.price
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'rating' AND p_sort_order = 'asc' THEN p.rating
      WHEN p_sort_by = 'rating' AND p_sort_order = 'desc' THEN -p.rating
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN -EXTRACT(EPOCH FROM p.created_at)
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'asc' THEN p.purchases_count
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'desc' THEN -p.purchases_count
    END NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- FONCTION 2: Filtrer les produits physiques avec relations
-- ============================================================

CREATE OR REPLACE FUNCTION public.filter_physical_products(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_shipping_type TEXT DEFAULT NULL,
  p_physical_category TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
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
  is_active BOOLEAN,
  is_draft BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tags TEXT[],
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  stock INTEGER,
  sku TEXT,
  weight NUMERIC,
  dimensions JSONB,
  free_shipping BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
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
    p.is_active,
    p.is_draft,
    p.created_at,
    p.updated_at,
    p.tags,
    s.name AS store_name,
    s.slug AS store_slug,
    s.logo_url AS store_logo_url,
    pp.stock,
    pp.sku,
    pp.weight,
    pp.dimensions,
    pp.free_shipping
  FROM public.products p
  INNER JOIN public.stores s ON s.id = p.store_id
  LEFT JOIN public.physical_products pp ON pp.product_id = p.id
  WHERE p.is_active = true
    AND p.is_draft = false
    AND p.product_type = 'physical'
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR COALESCE(p.promotional_price, p.price) >= p_min_price)
    AND (p_max_price IS NULL OR COALESCE(p.promotional_price, p.price) <= p_max_price)
    AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
    AND (
      p_stock_availability IS NULL OR
      (p_stock_availability = 'in_stock' AND (pp.stock IS NULL OR pp.stock > 0)) OR
      (p_stock_availability = 'low_stock' AND pp.stock IS NOT NULL AND pp.stock > 0 AND pp.stock < 10) OR
      (p_stock_availability = 'out_of_stock' AND (pp.stock IS NOT NULL AND pp.stock = 0))
    )
    AND (p_shipping_type IS NULL OR (p_shipping_type = 'free' AND pp.free_shipping = true) OR (p_shipping_type = 'paid' AND (pp.free_shipping = false OR pp.free_shipping IS NULL)))
    AND (p_physical_category IS NULL OR pp.category = p_physical_category)
  ORDER BY
    CASE 
      WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN p.price
      WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN -p.price
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'rating' AND p_sort_order = 'asc' THEN p.rating
      WHEN p_sort_by = 'rating' AND p_sort_order = 'desc' THEN -p.rating
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN -EXTRACT(EPOCH FROM p.created_at)
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'asc' THEN p.purchases_count
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'desc' THEN -p.purchases_count
    END NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- FONCTION 3: Filtrer les services avec relations
-- ============================================================

CREATE OR REPLACE FUNCTION public.filter_service_products(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_service_type TEXT DEFAULT NULL,
  p_location_type TEXT DEFAULT NULL,
  p_calendar_available BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
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
  is_active BOOLEAN,
  is_draft BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tags TEXT[],
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  service_type TEXT,
  location_type TEXT,
  calendar_available BOOLEAN,
  booking_required BOOLEAN,
  duration INTEGER,
  duration_unit TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
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
    p.is_active,
    p.is_draft,
    p.created_at,
    p.updated_at,
    p.tags,
    s.name AS store_name,
    s.slug AS store_slug,
    s.logo_url AS store_logo_url,
    sp.service_type,
    sp.location_type,
    sp.calendar_available,
    sp.booking_required,
    sp.duration,
    sp.duration_unit
  FROM public.products p
  INNER JOIN public.stores s ON s.id = p.store_id
  LEFT JOIN public.service_products sp ON sp.product_id = p.id
  WHERE p.is_active = true
    AND p.is_draft = false
    AND p.product_type = 'service'
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR COALESCE(p.promotional_price, p.price) >= p_min_price)
    AND (p_max_price IS NULL OR COALESCE(p.promotional_price, p.price) <= p_max_price)
    AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
    AND (p_service_type IS NULL OR sp.service_type = p_service_type)
    AND (p_location_type IS NULL OR sp.location_type = p_location_type)
    AND (p_calendar_available IS NULL OR sp.calendar_available = p_calendar_available)
  ORDER BY
    CASE 
      WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN p.price
      WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN -p.price
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'rating' AND p_sort_order = 'asc' THEN p.rating
      WHEN p_sort_by = 'rating' AND p_sort_order = 'desc' THEN -p.rating
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN -EXTRACT(EPOCH FROM p.created_at)
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'asc' THEN p.purchases_count
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'desc' THEN -p.purchases_count
    END NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- FONCTION 4: Filtrer les cours avec relations
-- ============================================================

CREATE OR REPLACE FUNCTION public.filter_course_products(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_access_type TEXT DEFAULT NULL,
  p_course_duration TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
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
  is_active BOOLEAN,
  is_draft BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tags TEXT[],
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  difficulty TEXT,
  access_type TEXT,
  total_duration INTEGER,
  enrollment_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
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
    p.is_active,
    p.is_draft,
    p.created_at,
    p.updated_at,
    p.tags,
    s.name AS store_name,
    s.slug AS store_slug,
    s.logo_url AS store_logo_url,
    c.difficulty,
    c.access_type,
    c.total_duration,
    c.enrollment_count
  FROM public.products p
  INNER JOIN public.stores s ON s.id = p.store_id
  LEFT JOIN public.courses c ON c.product_id = p.id
  WHERE p.is_active = true
    AND p.is_draft = false
    AND p.product_type = 'course'
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR COALESCE(p.promotional_price, p.price) >= p_min_price)
    AND (p_max_price IS NULL OR COALESCE(p.promotional_price, p.price) <= p_max_price)
    AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
    AND (p_difficulty IS NULL OR c.difficulty = p_difficulty)
    AND (p_access_type IS NULL OR c.access_type = p_access_type)
    AND (
      p_course_duration IS NULL OR
      (p_course_duration = '<1h' AND (c.total_duration IS NULL OR c.total_duration < 3600)) OR
      (p_course_duration = '1-5h' AND c.total_duration IS NOT NULL AND c.total_duration >= 3600 AND c.total_duration <= 18000) OR
      (p_course_duration = '5-10h' AND c.total_duration IS NOT NULL AND c.total_duration > 18000 AND c.total_duration <= 36000) OR
      (p_course_duration = '10h+' AND c.total_duration IS NOT NULL AND c.total_duration > 36000)
    )
  ORDER BY
    CASE 
      WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN p.price
      WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN -p.price
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'rating' AND p_sort_order = 'asc' THEN p.rating
      WHEN p_sort_by = 'rating' AND p_sort_order = 'desc' THEN -p.rating
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN -EXTRACT(EPOCH FROM p.created_at)
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'asc' THEN p.purchases_count
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'desc' THEN -p.purchases_count
    END NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- FONCTION 5: Filtrer les œuvres d'artistes avec relations
-- ============================================================

CREATE OR REPLACE FUNCTION public.filter_artist_products(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_artist_type TEXT DEFAULT NULL,
  p_edition_type TEXT DEFAULT NULL,
  p_certificate_of_authenticity BOOLEAN DEFAULT NULL,
  p_artwork_availability TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
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
  is_active BOOLEAN,
  is_draft BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tags TEXT[],
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  artist_type TEXT,
  artist_name TEXT,
  artwork_title TEXT,
  artwork_year INTEGER,
  artwork_medium TEXT,
  artwork_dimensions JSONB,
  artwork_edition_type TEXT,
  edition_number INTEGER,
  total_editions INTEGER,
  certificate_of_authenticity BOOLEAN,
  signature_authenticated BOOLEAN,
  requires_shipping BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
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
    p.is_active,
    p.is_draft,
    p.created_at,
    p.updated_at,
    p.tags,
    s.name AS store_name,
    s.slug AS store_slug,
    s.logo_url AS store_logo_url,
    ap.artist_type,
    ap.artist_name,
    ap.artwork_title,
    ap.artwork_year,
    ap.artwork_medium,
    ap.artwork_dimensions,
    ap.artwork_edition_type,
    ap.edition_number,
    ap.total_editions,
    ap.certificate_of_authenticity,
    ap.signature_authenticated,
    ap.requires_shipping
  FROM public.products p
  INNER JOIN public.stores s ON s.id = p.store_id
  LEFT JOIN public.artist_products ap ON ap.product_id = p.id
  WHERE p.is_active = true
    AND p.is_draft = false
    AND p.product_type = 'artist'
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_min_price IS NULL OR COALESCE(p.promotional_price, p.price) >= p_min_price)
    AND (p_max_price IS NULL OR COALESCE(p.promotional_price, p.price) <= p_max_price)
    AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
    AND (p_artist_type IS NULL OR ap.artist_type = p_artist_type)
    AND (p_edition_type IS NULL OR ap.artwork_edition_type = p_edition_type)
    AND (p_certificate_of_authenticity IS NULL OR ap.certificate_of_authenticity = p_certificate_of_authenticity)
    AND (
      p_artwork_availability IS NULL OR
      (p_artwork_availability = 'available' AND (ap.total_editions IS NULL OR ap.edition_number IS NULL OR ap.edition_number < ap.total_editions)) OR
      (p_artwork_availability = 'sold_out' AND ap.total_editions IS NOT NULL AND ap.edition_number IS NOT NULL AND ap.edition_number >= ap.total_editions)
    )
  ORDER BY
    CASE 
      WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN p.price
      WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN -p.price
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'rating' AND p_sort_order = 'asc' THEN p.rating
      WHEN p_sort_by = 'rating' AND p_sort_order = 'desc' THEN -p.rating
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN -EXTRACT(EPOCH FROM p.created_at)
    END NULLS LAST,
    CASE 
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'asc' THEN p.purchases_count
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'desc' THEN -p.purchases_count
    END NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Commentaires pour documentation
COMMENT ON FUNCTION public.filter_digital_products IS 
'Filtre les produits digitaux avec leurs relations (digital_products) côté serveur pour optimiser les performances';

COMMENT ON FUNCTION public.filter_physical_products IS 
'Filtre les produits physiques avec leurs relations (physical_products) côté serveur pour optimiser les performances';

COMMENT ON FUNCTION public.filter_service_products IS 
'Filtre les services avec leurs relations (service_products) côté serveur pour optimiser les performances';

COMMENT ON FUNCTION public.filter_course_products IS 
'Filtre les cours avec leurs relations (courses) côté serveur pour optimiser les performances';

COMMENT ON FUNCTION public.filter_artist_products IS 
'Filtre les œuvres d''artistes avec leurs relations (artist_products) côté serveur pour optimiser les performances';

