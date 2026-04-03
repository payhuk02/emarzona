-- =========================================================
-- Migration : Système de Produits pour Artistes
-- Date : 28/02/2025
-- Description : Ajoute le support des produits artistes avec fonctionnalités spécialisées
--               pour écrivains, musiciens, artistes visuels, designers, etc.
-- =========================================================

-- 1. Ajouter 'artist' au type de produit dans la table products
-- Note: Si la contrainte CHECK existe déjà, on doit la modifier
DO $$ 
BEGIN
  -- Vérifier si la colonne product_type existe et a une contrainte CHECK
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%product_type%' 
    AND table_name = 'products'
  ) THEN
    -- Supprimer l'ancienne contrainte si elle existe
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_product_type_check;
  END IF;
  
  -- Ajouter la nouvelle contrainte avec 'artist'
  ALTER TABLE public.products 
  ADD CONSTRAINT products_product_type_check 
  CHECK (product_type IN ('digital', 'physical', 'service', 'course', 'artist'));
END $$;

-- 2. Créer la table artist_products (extension pour produits artistes)
CREATE TABLE IF NOT EXISTS public.artist_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Type d'artiste
  artist_type TEXT NOT NULL CHECK (artist_type IN (
    'writer',        -- Écrivain / Auteur
    'musician',     -- Musicien / Compositeur
    'visual_artist', -- Artiste visuel
    'designer',     -- Designer / Créateur
    'multimedia',   -- Artiste multimédia
    'other'         -- Autre
  )),
  
  -- Informations artiste
  artist_name TEXT NOT NULL,
  artist_bio TEXT,
  artist_website TEXT,
  artist_social_links JSONB DEFAULT '{}'::jsonb, -- {instagram, facebook, twitter, youtube, tiktok, website}
  
  -- Informations œuvre
  artwork_title TEXT NOT NULL,
  artwork_year INTEGER,
  artwork_medium TEXT, -- "Huile sur toile", "Acrylique", "Photographie", "Roman", "Album", etc.
  artwork_dimensions JSONB, -- {width, height, depth, unit: 'cm'|'in'}
  artwork_edition_type TEXT CHECK (artwork_edition_type IN ('original', 'limited_edition', 'print', 'reproduction')),
  edition_number INTEGER, -- Pour éditions limitées (ex: 1/100)
  total_editions INTEGER, -- Nombre total d'éditions
  
  -- Spécificités par type (stockées en JSONB pour flexibilité)
  writer_specific JSONB, -- {isbn, pages, language, format, genre, publisher, publication_date}
  musician_specific JSONB, -- {album_format, tracks, genre, label, release_date, duration}
  visual_artist_specific JSONB, -- {style, subject, framed, certificate_of_authenticity}
  designer_specific JSONB, -- {category, format, license_type, commercial_use}
  multimedia_specific JSONB, -- {media_type, duration, resolution, format}
  
  -- Livraison & Expédition
  requires_shipping BOOLEAN DEFAULT true,
  shipping_handling_time INTEGER DEFAULT 7, -- Jours
  shipping_fragile BOOLEAN DEFAULT false,
  shipping_insurance_required BOOLEAN DEFAULT false,
  shipping_insurance_amount DECIMAL(10, 2), -- Montant de l'assurance
  
  -- Authentification & Certification
  certificate_of_authenticity BOOLEAN DEFAULT false,
  certificate_file_url TEXT,
  signature_authenticated BOOLEAN DEFAULT false,
  signature_location TEXT, -- Où se trouve la signature (ex: "En bas à droite")
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_artist_products_product_id ON public.artist_products(product_id);
CREATE INDEX IF NOT EXISTS idx_artist_products_store_id ON public.artist_products(store_id);
CREATE INDEX IF NOT EXISTS idx_artist_products_artist_type ON public.artist_products(artist_type);
CREATE INDEX IF NOT EXISTS idx_artist_products_edition_type ON public.artist_products(artwork_edition_type);
CREATE INDEX IF NOT EXISTS idx_artist_products_artist_name ON public.artist_products(artist_name);

-- Index GIN pour recherches dans JSONB
CREATE INDEX IF NOT EXISTS idx_artist_products_writer_specific ON public.artist_products USING GIN(writer_specific);
CREATE INDEX IF NOT EXISTS idx_artist_products_musician_specific ON public.artist_products USING GIN(musician_specific);
CREATE INDEX IF NOT EXISTS idx_artist_products_visual_artist_specific ON public.artist_products USING GIN(visual_artist_specific);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_artist_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger de manière idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'artist_products_updated_at'
    AND tgrelid = 'public.artist_products'::regclass
  ) THEN
    CREATE TRIGGER artist_products_updated_at
      BEFORE UPDATE ON public.artist_products
      FOR EACH ROW
      EXECUTE FUNCTION update_artist_products_updated_at();
  END IF;
END $$;

-- RLS (Row Level Security)
ALTER TABLE public.artist_products ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les produits artistes de leurs boutiques
DROP POLICY IF EXISTS "Users can view their own store artist products" ON public.artist_products;
CREATE POLICY "Users can view their own store artist products"
  ON public.artist_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = artist_products.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent créer des produits artistes pour leurs boutiques
DROP POLICY IF EXISTS "Users can create artist products for their stores" ON public.artist_products;
CREATE POLICY "Users can create artist products for their stores"
  ON public.artist_products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = artist_products.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent modifier leurs produits artistes
DROP POLICY IF EXISTS "Users can update their own store artist products" ON public.artist_products;
CREATE POLICY "Users can update their own store artist products"
  ON public.artist_products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = artist_products.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent supprimer leurs produits artistes
DROP POLICY IF EXISTS "Users can delete their own store artist products" ON public.artist_products;
CREATE POLICY "Users can delete their own store artist products"
  ON public.artist_products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = artist_products.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les visiteurs peuvent voir les produits artistes actifs
DROP POLICY IF EXISTS "Public can view active artist products" ON public.artist_products;
CREATE POLICY "Public can view active artist products"
  ON public.artist_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = artist_products.product_id
      AND products.is_active = true
    )
  );

-- Commentaires
COMMENT ON TABLE public.artist_products IS 'Table d''extension pour les produits artistes (écrivains, musiciens, artistes visuels, etc.)';
COMMENT ON COLUMN public.artist_products.artist_type IS 'Type d''artiste: writer, musician, visual_artist, designer, multimedia, other';
COMMENT ON COLUMN public.artist_products.artwork_edition_type IS 'Type d''édition: original, limited_edition, print, reproduction';
COMMENT ON COLUMN public.artist_products.writer_specific IS 'Données spécifiques aux écrivains (ISBN, pages, langue, format, genre, etc.)';
COMMENT ON COLUMN public.artist_products.musician_specific IS 'Données spécifiques aux musiciens (format album, pistes, genre, label, etc.)';
COMMENT ON COLUMN public.artist_products.visual_artist_specific IS 'Données spécifiques aux artistes visuels (style, sujet, encadré, certificat, etc.)';

