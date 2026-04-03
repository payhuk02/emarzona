-- =====================================================
-- EMARZONA ARTIST COLLECTIONS SYSTEM
-- Date: 4 Février 2025
-- Description: Système de collections d'œuvres et galeries thématiques pour artistes
-- =====================================================

-- =====================================================
-- 1. TABLE: artist_collections
-- =====================================================
CREATE TABLE IF NOT EXISTS public.artist_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  artist_product_id UUID, -- Collection liée à un artiste spécifique (optionnel)
  
  -- Informations collection
  collection_name TEXT NOT NULL,
  collection_slug TEXT NOT NULL,
  collection_description TEXT,
  collection_short_description TEXT,
  
  -- Type de collection
  collection_type TEXT NOT NULL CHECK (collection_type IN (
    'thematic',      -- Thématique (ex: "Nature", "Portraits")
    'chronological', -- Chronologique (ex: "Œuvres 2020-2024")
    'series',        -- Série (ex: "Série Abstractions")
    'exhibition',    -- Exposition
    'custom'         -- Personnalisée
  )) DEFAULT 'thematic',
  
  -- Visuel
  cover_image_url TEXT,
  cover_image_alt TEXT,
  
  -- Organisation
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  -- Métadonnées
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Dates
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(store_id, collection_slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_collections_store_id ON public.artist_collections(store_id);
CREATE INDEX IF NOT EXISTS idx_artist_collections_artist_product_id ON public.artist_collections(artist_product_id);
CREATE INDEX IF NOT EXISTS idx_artist_collections_type ON public.artist_collections(collection_type);
CREATE INDEX IF NOT EXISTS idx_artist_collections_featured ON public.artist_collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_artist_collections_public ON public.artist_collections(is_public);
CREATE INDEX IF NOT EXISTS idx_artist_collections_slug ON public.artist_collections(collection_slug);

-- =====================================================
-- 2. TABLE: artist_collection_items
-- =====================================================
CREATE TABLE IF NOT EXISTS public.artist_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL,
  product_id UUID NOT NULL,
  artist_product_id UUID NOT NULL,
  
  -- Organisation dans la collection
  display_order INTEGER DEFAULT 0,
  is_featured_in_collection BOOLEAN DEFAULT false,
  
  -- Notes spécifiques à cette œuvre dans cette collection
  collection_notes TEXT,
  
  -- Dates
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(collection_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.artist_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_product_id ON public.artist_collection_items(product_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_artist_product_id ON public.artist_collection_items(artist_product_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_display_order ON public.artist_collection_items(display_order);

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- Fonction pour obtenir le nombre d'œuvres dans une collection
CREATE OR REPLACE FUNCTION get_collection_items_count(p_collection_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artist_collection_items') THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO v_count
  FROM public.artist_collection_items
  WHERE collection_id = p_collection_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Fonction pour obtenir les collections d'un store
CREATE OR REPLACE FUNCTION get_store_collections(
  p_store_id UUID,
  p_include_private BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  collection_name TEXT,
  collection_slug TEXT,
  collection_description TEXT,
  collection_type TEXT,
  cover_image_url TEXT,
  is_featured BOOLEAN,
  is_public BOOLEAN,
  items_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artist_collections') THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    ac.id,
    ac.collection_name,
    ac.collection_slug,
    ac.collection_description,
    ac.collection_type,
    ac.cover_image_url,
    ac.is_featured,
    ac.is_public,
    COALESCE(get_collection_items_count(ac.id), 0)::INTEGER as items_count,
    ac.created_at
  FROM public.artist_collections ac
  WHERE ac.store_id = p_store_id
    AND (p_include_private OR ac.is_public = true)
  ORDER BY ac.is_featured DESC, ac.display_order ASC, ac.created_at DESC;
END;
$$;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

ALTER TABLE public.artist_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_collection_items ENABLE ROW LEVEL SECURITY;

-- Créer les RLS policies seulement si les tables nécessaires existent
DO $$ 
BEGIN
  -- Public can view public collections
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'artist_collections'
    AND policyname = 'Public can view public collections'
  ) THEN
    EXECUTE '
      CREATE POLICY "Public can view public collections"
        ON public.artist_collections
        FOR SELECT
        USING (is_public = true)';
  END IF;

  -- Store owners can manage their collections
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'artist_collections'
      AND policyname = 'Store owners can manage their collections'
    ) THEN
      EXECUTE '
        CREATE POLICY "Store owners can manage their collections"
          ON public.artist_collections
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.stores
              WHERE stores.id = artist_collections.store_id
              AND (stores.user_id = auth.uid() OR stores.owner_id = auth.uid())
            )
          )';
    END IF;
  END IF;

  -- Public can view collection items for public collections
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'artist_collection_items'
    AND policyname = 'Public can view collection items for public collections'
  ) THEN
    EXECUTE '
      CREATE POLICY "Public can view collection items for public collections"
        ON public.artist_collection_items
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.artist_collections
            WHERE artist_collections.id = artist_collection_items.collection_id
            AND artist_collections.is_public = true
          )
        )';
  END IF;

  -- Store owners can manage collection items
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artist_collections') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'artist_collection_items'
      AND policyname = 'Store owners can manage collection items'
    ) THEN
      EXECUTE '
        CREATE POLICY "Store owners can manage collection items"
          ON public.artist_collection_items
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.artist_collections ac
              INNER JOIN public.stores s ON s.id = ac.store_id
              WHERE ac.id = artist_collection_items.collection_id
              AND (s.user_id = auth.uid() OR s.owner_id = auth.uid())
            )
          )';
    END IF;
  END IF;
END $$;

-- Trigger pour updated_at
CREATE TRIGGER update_artist_collections_updated_at
  BEFORE UPDATE ON public.artist_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. COMMENTS
-- =====================================================

COMMENT ON TABLE public.artist_collections IS 'Collections d''œuvres d''artiste organisées par thème, série, ou exposition';
COMMENT ON TABLE public.artist_collection_items IS 'Liaison entre collections et œuvres d''artiste';
COMMENT ON FUNCTION get_collection_items_count IS 'Retourne le nombre d''œuvres dans une collection';
COMMENT ON FUNCTION get_store_collections IS 'Retourne toutes les collections d''un store';












