-- =========================================================
-- Migration : Galerie 3D et Système de Provenance Avancé
-- Date : 1 Février 2025
-- Description : Support 3D pour œuvres artistes et système de provenance complet
-- =========================================================

-- ============================================================
-- 1. TABLE: artist_3d_models
-- ============================================================

CREATE TABLE IF NOT EXISTS public.artist_3d_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Fichier 3D
  model_url TEXT NOT NULL, -- URL du fichier 3D (glb, gltf, obj, etc.)
  model_type TEXT NOT NULL CHECK (model_type IN (
    'glb',      -- GLTF Binary
    'gltf',     -- GLTF JSON
    'obj',      -- Wavefront OBJ
    'fbx',      -- Autodesk FBX
    'usd',      -- Universal Scene Description
    'stl'       -- STereoLithography
  )),
  model_size_bytes BIGINT, -- Taille du fichier en bytes
  
  -- Prévisualisation
  thumbnail_url TEXT, -- Image de prévisualisation
  preview_images TEXT[], -- Images supplémentaires
  
  -- Métadonnées 3D
  model_metadata JSONB DEFAULT '{}'::jsonb, -- Dimensions, unités, etc.
  
  -- Options d'affichage
  auto_rotate BOOLEAN DEFAULT true,
  auto_play BOOLEAN DEFAULT false,
  show_controls BOOLEAN DEFAULT true,
  background_color TEXT DEFAULT '#ffffff',
  camera_position JSONB, -- Position initiale de la caméra {x, y, z}
  camera_target JSONB, -- Cible de la caméra {x, y, z}
  
  -- Statistiques
  views_count INTEGER DEFAULT 0,
  interactions_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. TABLE: artwork_provenance
-- ============================================================

CREATE TABLE IF NOT EXISTS public.artwork_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Informations de provenance
  provenance_type TEXT NOT NULL CHECK (provenance_type IN (
    'creation',      -- Création originale
    'ownership',     -- Changement de propriétaire
    'exhibition',    -- Exposition
    'publication',   -- Publication
    'restoration',   -- Restauration
    'authentication', -- Authentification
    'certification', -- Certification
    'other'          -- Autre
  )),
  
  -- Dates
  event_date DATE NOT NULL,
  recorded_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Acteurs
  previous_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_owner_name TEXT, -- Pour les propriétaires non-enregistrés
  current_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_owner_name TEXT,
  
  -- Lieu
  location_country TEXT,
  location_city TEXT,
  location_address TEXT,
  
  -- Détails
  description TEXT,
  notes TEXT,
  
  -- Documents
  documents JSONB DEFAULT '[]'::jsonb, -- Array de {url, type, description}
  certificates JSONB DEFAULT '[]'::jsonb, -- Certificats d'authenticité
  
  -- Blockchain (optionnel)
  blockchain_hash TEXT, -- Hash de la transaction blockchain
  blockchain_tx_id TEXT, -- ID de transaction blockchain
  blockchain_network TEXT, -- Réseau blockchain (ethereum, polygon, etc.)
  
  -- Vérification
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. TABLE: artwork_certificates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.artwork_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Type de certificat
  certificate_type TEXT NOT NULL CHECK (certificate_type IN (
    'authenticity',   -- Certificat d'authenticité
    'provenance',    -- Certificat de provenance
    'condition',     -- Certificat d'état
    'appraisal',     -- Certificat d'expertise
    'export',        -- Certificat d'exportation
    'other'          -- Autre
  )),
  
  -- Informations
  certificate_number TEXT UNIQUE, -- Numéro unique du certificat
  issued_by TEXT NOT NULL, -- Organisme émetteur
  issued_by_contact TEXT, -- Contact de l'organisme
  issued_date DATE NOT NULL,
  expiry_date DATE, -- Date d'expiration (optionnel)
  
  -- Contenu
  certificate_content TEXT, -- Contenu du certificat
  certificate_pdf_url TEXT, -- URL du PDF du certificat
  
  -- Vérification
  is_verified BOOLEAN DEFAULT false,
  verification_code TEXT, -- Code de vérification unique
  qr_code_url TEXT, -- URL du QR code pour vérification
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_3d_models_product_id ON public.artist_3d_models(product_id);
CREATE INDEX IF NOT EXISTS idx_3d_models_store_id ON public.artist_3d_models(store_id);
CREATE INDEX IF NOT EXISTS idx_3d_models_type ON public.artist_3d_models(model_type);

CREATE INDEX IF NOT EXISTS idx_provenance_product_id ON public.artwork_provenance(product_id);
CREATE INDEX IF NOT EXISTS idx_provenance_store_id ON public.artwork_provenance(store_id);
CREATE INDEX IF NOT EXISTS idx_provenance_type ON public.artwork_provenance(provenance_type);
CREATE INDEX IF NOT EXISTS idx_provenance_event_date ON public.artwork_provenance(event_date);
CREATE INDEX IF NOT EXISTS idx_provenance_verified ON public.artwork_provenance(is_verified);

CREATE INDEX IF NOT EXISTS idx_certificates_product_id ON public.artwork_certificates(product_id);
CREATE INDEX IF NOT EXISTS idx_certificates_store_id ON public.artwork_certificates(store_id);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON public.artwork_certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.artwork_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON public.artwork_certificates(verification_code);

-- ============================================================
-- 5. FUNCTIONS
-- ============================================================

-- Fonction pour générer un numéro de certificat unique
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT := 'CERT';
  v_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_sequence INTEGER;
BEGIN
  -- Récupérer le prochain numéro de séquence pour l'année
  SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 10) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.artwork_certificates
  WHERE certificate_number LIKE v_prefix || '-' || v_year || '-%';
  
  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir l'historique complet de provenance d'une œuvre
CREATE OR REPLACE FUNCTION get_artwork_provenance_history(p_product_id UUID)
RETURNS TABLE (
  id UUID,
  provenance_type TEXT,
  event_date DATE,
  previous_owner_name TEXT,
  current_owner_name TEXT,
  location_country TEXT,
  location_city TEXT,
  description TEXT,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.provenance_type,
    ap.event_date,
    ap.previous_owner_name,
    ap.current_owner_name,
    ap.location_country,
    ap.location_city,
    ap.description,
    ap.is_verified,
    ap.created_at
  FROM public.artwork_provenance ap
  WHERE ap.product_id = p_product_id
  ORDER BY ap.event_date ASC, ap.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter les vues d'un modèle 3D
CREATE OR REPLACE FUNCTION increment_3d_model_views(p_model_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  UPDATE public.artist_3d_models
  SET views_count = views_count + 1
  WHERE id = p_model_id
  RETURNING views_count INTO v_new_count;
  
  RETURN COALESCE(v_new_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_3d_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_3d_models_updated_at'
  ) THEN
    CREATE TRIGGER update_3d_models_updated_at
    BEFORE UPDATE ON public.artist_3d_models
    FOR EACH ROW
    EXECUTE FUNCTION update_3d_models_updated_at();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_provenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_provenance_updated_at'
  ) THEN
    CREATE TRIGGER update_provenance_updated_at
    BEFORE UPDATE ON public.artwork_provenance
    FOR EACH ROW
    EXECUTE FUNCTION update_provenance_updated_at();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_certificates_updated_at'
  ) THEN
    CREATE TRIGGER update_certificates_updated_at
    BEFORE UPDATE ON public.artwork_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_certificates_updated_at();
  END IF;
END $$;

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

ALTER TABLE public.artist_3d_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_certificates ENABLE ROW LEVEL SECURITY;

-- Store owners can manage 3D models
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'artist_3d_models' AND policyname = 'Store owners can manage 3D models'
  ) THEN
    CREATE POLICY "Store owners can manage 3D models"
    ON public.artist_3d_models
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = artist_3d_models.store_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Everyone can view 3D models
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'artist_3d_models' AND policyname = 'Everyone can view 3D models'
  ) THEN
    CREATE POLICY "Everyone can view 3D models"
    ON public.artist_3d_models
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Store owners can manage provenance
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'artwork_provenance' AND policyname = 'Store owners can manage provenance'
  ) THEN
    CREATE POLICY "Store owners can manage provenance"
    ON public.artwork_provenance
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = artwork_provenance.store_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Everyone can view provenance
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'artwork_provenance' AND policyname = 'Everyone can view provenance'
  ) THEN
    CREATE POLICY "Everyone can view provenance"
    ON public.artwork_provenance
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Store owners can manage certificates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'artwork_certificates' AND policyname = 'Store owners can manage certificates'
  ) THEN
    CREATE POLICY "Store owners can manage certificates"
    ON public.artwork_certificates
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = artwork_certificates.store_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Everyone can view certificates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'artwork_certificates' AND policyname = 'Everyone can view certificates'
  ) THEN
    CREATE POLICY "Everyone can view certificates"
    ON public.artwork_certificates
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON TABLE public.artist_3d_models IS 'Modèles 3D pour les œuvres d''artistes';
COMMENT ON TABLE public.artwork_provenance IS 'Historique de provenance des œuvres d''art';
COMMENT ON TABLE public.artwork_certificates IS 'Certificats d''authenticité et de provenance';

COMMENT ON FUNCTION generate_certificate_number() IS 'Génère un numéro de certificat unique';
COMMENT ON FUNCTION get_artwork_provenance_history(UUID) IS 'Retourne l''historique complet de provenance d''une œuvre';
COMMENT ON FUNCTION increment_3d_model_views(UUID) IS 'Incrémente le compteur de vues d''un modèle 3D';

