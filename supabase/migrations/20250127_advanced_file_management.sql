-- ================================================================
-- Advanced File Management for Digital Products
-- Date: 2025-01-27
-- Description: Gestion avancée des fichiers avec versions, catégories, métadonnées
-- ================================================================

-- Ajouter des colonnes pour la gestion avancée des fichiers
ALTER TABLE public.digital_product_files
  ADD COLUMN IF NOT EXISTS file_version TEXT,
  ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_file_id UUID REFERENCES public.digital_product_files(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS compression_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS compression_ratio NUMERIC,
  ADD COLUMN IF NOT EXISTS original_size_mb NUMERIC,
  ADD COLUMN IF NOT EXISTS checksum_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS encoding TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_downloaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS changelog TEXT;

-- Améliorer la colonne category avec des valeurs plus précises
DO $$
BEGIN
  -- Ajouter une contrainte CHECK si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'digital_product_files_category_check'
  ) THEN
    ALTER TABLE public.digital_product_files
      DROP CONSTRAINT IF EXISTS digital_product_files_category_check;
    
    ALTER TABLE public.digital_product_files
      ADD CONSTRAINT digital_product_files_category_check
      CHECK (category IS NULL OR category IN (
        'main',              -- Fichier principal
        'bonus',             -- Fichier bonus
        'documentation',     -- Documentation
        'source',            -- Code source
        'update',            -- Mise à jour
        'patch',             -- Patch
        'demo',              -- Démo
        'trial',             -- Version d'essai
        'installer',         -- Installateur
        'library',           -- Bibliothèque
        'asset',             -- Ressource
        'template',          -- Template
        'example',           -- Exemple
        'other'              -- Autre
      ));
  END IF;
END $$;

-- Table pour l'historique des versions de fichiers
CREATE TABLE IF NOT EXISTS public.digital_product_file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.digital_product_files(id) ON DELETE CASCADE,
  
  -- Version info
  version_number INTEGER NOT NULL,
  version_label TEXT, -- '1.0.0', 'beta', 'rc1', etc.
  file_url TEXT NOT NULL,
  file_size_mb NUMERIC NOT NULL,
  file_hash TEXT,
  checksum_sha256 TEXT,
  
  -- Metadata
  changelog TEXT,
  release_notes TEXT,
  is_stable BOOLEAN DEFAULT true,
  is_beta BOOLEAN DEFAULT false,
  is_alpha BOOLEAN DEFAULT false,
  
  -- Dates
  released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deprecated_at TIMESTAMPTZ,
  
  -- Stats
  download_count INTEGER DEFAULT 0,
  
  -- Metadata étendue
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_file_version UNIQUE (file_id, version_number)
);

-- Table pour les catégories de fichiers personnalisées
CREATE TABLE IF NOT EXISTS public.digital_product_file_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Category info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  
  -- Organization
  parent_category_id UUID REFERENCES public.digital_product_file_categories(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_category_slug_per_store UNIQUE (store_id, slug)
);

-- Table pour les métadonnées étendues de fichiers
CREATE TABLE IF NOT EXISTS public.digital_product_file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.digital_product_files(id) ON DELETE CASCADE,
  
  -- Technical metadata
  width INTEGER,          -- Pour images/vidéos
  height INTEGER,         -- Pour images/vidéos
  duration_seconds INTEGER, -- Pour vidéos/audio
  bitrate INTEGER,        -- Pour audio/vidéo
  sample_rate INTEGER,    -- Pour audio
  channels INTEGER,       -- Pour audio (mono, stereo, etc.)
  codec TEXT,             -- Codec utilisé
  format_version TEXT,    -- Version du format (ex: PDF 1.7)
  
  -- Document metadata
  page_count INTEGER,     -- Pour PDFs
  word_count INTEGER,     -- Pour documents texte
  language TEXT,
  author TEXT,
  publisher TEXT,
  isbn TEXT,              -- Pour ebooks
  copyright TEXT,
  
  -- Software metadata
  platform TEXT[],        -- ['windows', 'mac', 'linux']
  architecture TEXT[],    -- ['x86', 'x64', 'arm']
  minimum_requirements JSONB,
  recommended_requirements JSONB,
  
  -- Custom metadata
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_file_metadata UNIQUE (file_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON public.digital_product_file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_version_number ON public.digital_product_file_versions(file_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_file_versions_released_at ON public.digital_product_file_versions(released_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_versions_is_stable ON public.digital_product_file_versions(is_stable) WHERE is_stable = true;

CREATE INDEX IF NOT EXISTS idx_file_categories_store_id ON public.digital_product_file_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_file_categories_parent ON public.digital_product_file_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_file_categories_slug ON public.digital_product_file_categories(slug);

CREATE INDEX IF NOT EXISTS idx_file_metadata_file_id ON public.digital_product_file_metadata(file_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_platform ON public.digital_product_file_metadata USING GIN(platform);
CREATE INDEX IF NOT EXISTS idx_file_metadata_architecture ON public.digital_product_file_metadata USING GIN(architecture);

-- Indexes pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_files_parent_file_id ON public.digital_product_files(parent_file_id);
CREATE INDEX IF NOT EXISTS idx_files_version_number ON public.digital_product_files(digital_product_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_files_tags ON public.digital_product_files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_files_category ON public.digital_product_files(category);
CREATE INDEX IF NOT EXISTS idx_files_is_archived ON public.digital_product_files(is_archived) WHERE is_archived = false;

-- Triggers
CREATE OR REPLACE FUNCTION update_file_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_file_categories_updated_at_trigger ON public.digital_product_file_categories;
CREATE TRIGGER update_file_categories_updated_at_trigger
  BEFORE UPDATE ON public.digital_product_file_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_file_categories_updated_at();

CREATE OR REPLACE FUNCTION update_file_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_file_metadata_updated_at_trigger ON public.digital_product_file_metadata;
CREATE TRIGGER update_file_metadata_updated_at_trigger
  BEFORE UPDATE ON public.digital_product_file_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_file_metadata_updated_at();

-- Fonction pour incrémenter le compteur de téléchargements
CREATE OR REPLACE FUNCTION increment_file_download_count(p_file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.digital_product_files
  SET 
    download_count = download_count + 1,
    last_downloaded_at = now()
  WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir la dernière version d'un fichier
CREATE OR REPLACE FUNCTION get_latest_file_version(p_file_id UUID)
RETURNS TABLE (
  version_number INTEGER,
  version_label TEXT,
  file_url TEXT,
  released_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fv.version_number,
    fv.version_label,
    fv.file_url,
    fv.released_at
  FROM public.digital_product_file_versions fv
  WHERE fv.file_id = p_file_id
    AND (fv.deprecated_at IS NULL OR fv.deprecated_at > now())
  ORDER BY fv.version_number DESC, fv.released_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.digital_product_file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_file_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_file_metadata ENABLE ROW LEVEL SECURITY;

-- Policies pour file_versions
DROP POLICY IF EXISTS "Store owners manage file versions" ON public.digital_product_file_versions;
CREATE POLICY "Store owners manage file versions"
  ON public.digital_product_file_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_product_files dpf
      INNER JOIN public.digital_products dp ON dpf.digital_product_id = dp.id
      INNER JOIN public.products p ON dp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE dpf.id = digital_product_file_versions.file_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users view file versions" ON public.digital_product_file_versions;
CREATE POLICY "Users view file versions"
  ON public.digital_product_file_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_product_files dpf
      INNER JOIN public.digital_products dp ON dpf.digital_product_id = dp.id
      INNER JOIN public.order_items oi ON dp.product_id = oi.product_id
      INNER JOIN public.orders o ON oi.order_id = o.id
      INNER JOIN public.customers c ON o.customer_id = c.id
      WHERE dpf.id = digital_product_file_versions.file_id
        AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND o.payment_status = 'paid'
    )
    OR EXISTS (
      SELECT 1 FROM public.digital_product_files dpf
      WHERE dpf.id = digital_product_file_versions.file_id
        AND dpf.is_preview = true
    )
  );

-- Policies pour file_categories
DROP POLICY IF EXISTS "Store owners manage file categories" ON public.digital_product_file_categories;
CREATE POLICY "Store owners manage file categories"
  ON public.digital_product_file_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = digital_product_file_categories.store_id
        AND stores.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view file categories" ON public.digital_product_file_categories;
CREATE POLICY "Anyone can view file categories"
  ON public.digital_product_file_categories
  FOR SELECT
  USING (true);

-- Policies pour file_metadata
DROP POLICY IF EXISTS "Store owners manage file metadata" ON public.digital_product_file_metadata;
CREATE POLICY "Store owners manage file metadata"
  ON public.digital_product_file_metadata
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_product_files dpf
      INNER JOIN public.digital_products dp ON dpf.digital_product_id = dp.id
      INNER JOIN public.products p ON dp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE dpf.id = digital_product_file_metadata.file_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users view file metadata" ON public.digital_product_file_metadata;
CREATE POLICY "Users view file metadata"
  ON public.digital_product_file_metadata
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_product_files dpf
      INNER JOIN public.digital_products dp ON dpf.digital_product_id = dp.id
      INNER JOIN public.order_items oi ON dp.product_id = oi.product_id
      INNER JOIN public.orders o ON oi.order_id = o.id
      INNER JOIN public.customers c ON o.customer_id = c.id
      WHERE dpf.id = digital_product_file_metadata.file_id
        AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND o.payment_status = 'paid'
    )
    OR EXISTS (
      SELECT 1 FROM public.digital_product_files dpf
      WHERE dpf.id = digital_product_file_metadata.file_id
        AND dpf.is_preview = true
    )
  );

-- Commentaires
COMMENT ON TABLE public.digital_product_file_versions IS 'Historique des versions de fichiers pour produits digitaux';
COMMENT ON TABLE public.digital_product_file_categories IS 'Catégories personnalisées de fichiers par store';
COMMENT ON TABLE public.digital_product_file_metadata IS 'Métadonnées techniques étendues pour fichiers (images, vidéos, documents, logiciels)';
COMMENT ON COLUMN public.digital_product_files.file_version IS 'Version du fichier (ex: 1.0.0, beta, rc1)';
COMMENT ON COLUMN public.digital_product_files.version_number IS 'Numéro de version numérique (pour tri)';
COMMENT ON COLUMN public.digital_product_files.parent_file_id IS 'Fichier parent (pour versions)';
COMMENT ON COLUMN public.digital_product_files.metadata IS 'Métadonnées personnalisées JSON';
COMMENT ON COLUMN public.digital_product_files.compression_ratio IS 'Ratio de compression (original_size / compressed_size)';

