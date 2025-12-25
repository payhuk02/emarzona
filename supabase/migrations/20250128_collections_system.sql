-- =====================================================
-- EMARZONA COLLECTIONS SYSTEM
-- Date: 28 Janvier 2025
-- Description: Système de collections pour organiser les produits
-- =====================================================

-- =====================================================
-- 1. TABLE: collections
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Informations de base
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Paramètres
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  -- Métadonnées
  meta_title TEXT,
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(store_id, slug)
);

-- =====================================================
-- 2. TABLE: collection_products (relation many-to-many)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collection_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique
  UNIQUE(collection_id, product_id)
);

-- =====================================================
-- 3. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_collections_store_id ON public.collections(store_id);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_active ON public.collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON public.collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id ON public.collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON public.collection_products(product_id);

-- =====================================================
-- 4. RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

-- Politiques pour collections
CREATE POLICY "Anyone can view active collections"
ON public.collections FOR SELECT
USING (is_active = true);

CREATE POLICY "Store owners can manage their collections"
ON public.collections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = collections.store_id
    AND stores.user_id = auth.uid()
  )
);

-- Politiques pour collection_products
CREATE POLICY "Anyone can view collection products"
ON public.collection_products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE collections.id = collection_products.collection_id
    AND collections.is_active = true
  )
);

CREATE POLICY "Store owners can manage collection products"
ON public.collection_products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    INNER JOIN public.stores ON stores.id = collections.store_id
    WHERE collections.id = collection_products.collection_id
    AND stores.user_id = auth.uid()
  )
);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Trigger pour updated_at sur collections
CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION update_collections_updated_at();

-- =====================================================
-- 6. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE public.collections IS 'Collections de produits pour organiser le catalogue';
COMMENT ON TABLE public.collection_products IS 'Relation many-to-many entre collections et produits';
COMMENT ON COLUMN public.collections.slug IS 'Slug unique par store pour les URLs';
COMMENT ON COLUMN public.collections.sort_order IS 'Ordre d''affichage de la collection';

