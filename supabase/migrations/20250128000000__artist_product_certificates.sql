-- =====================================================
-- EMARZONA ARTIST PRODUCT CERTIFICATES SYSTEM
-- Date: 28 Janvier 2025
-- Description: Système complet de certificats d'authenticité pour produits artistes
-- Version: 1.0
-- =====================================================

-- Table: artist_product_certificates
CREATE TABLE IF NOT EXISTS public.artist_product_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  artist_product_id UUID NOT NULL REFERENCES public.artist_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Certificat
  certificate_number TEXT UNIQUE NOT NULL, -- Numéro unique du certificat
  certificate_type TEXT DEFAULT 'authenticity' CHECK (certificate_type IN ('authenticity', 'limited_edition', 'handmade')),
  
  -- Informations
  edition_number INTEGER, -- Si édition limitée (ex: 1/100)
  total_edition INTEGER, -- Nombre total d'exemplaires
  signed_by_artist BOOLEAN DEFAULT FALSE,
  signed_date DATE,
  
  -- Fichier PDF
  certificate_pdf_url TEXT, -- URL du PDF généré dans Supabase Storage
  certificate_image_url TEXT, -- URL de l'image du certificat (preview)
  
  -- Métadonnées
  artwork_title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  artwork_medium TEXT,
  artwork_year INTEGER,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  
  -- Statut
  is_generated BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  
  -- Validation
  is_valid BOOLEAN DEFAULT TRUE,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  -- Partage
  is_public BOOLEAN DEFAULT FALSE,
  verification_code TEXT UNIQUE, -- Code de vérification publique
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_certificates_order_id ON public.artist_product_certificates(order_id);
CREATE INDEX IF NOT EXISTS idx_artist_certificates_product_id ON public.artist_product_certificates(product_id);
CREATE INDEX IF NOT EXISTS idx_artist_certificates_artist_product_id ON public.artist_product_certificates(artist_product_id);
CREATE INDEX IF NOT EXISTS idx_artist_certificates_user_id ON public.artist_product_certificates(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_certificates_number ON public.artist_product_certificates(certificate_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_certificates_verification_code ON public.artist_product_certificates(verification_code) WHERE verification_code IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER update_artist_certificates_updated_at
  BEFORE UPDATE ON public.artist_product_certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction: Générer numéro certificat unique
CREATE OR REPLACE FUNCTION public.generate_artist_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_number TEXT;
  v_certificate_number TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT LPAD((COUNT(*) + 1)::TEXT, 6, '0')
  INTO v_number
  FROM public.artist_product_certificates
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_certificate_number := 'ART-' || v_year || '-' || v_number;
  
  RETURN v_certificate_number;
END;
$$;

-- Fonction: Générer code de vérification
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Générer un code aléatoire de 8 caractères (lettres et chiffres)
  v_code := UPPER(
    SUBSTRING(
      MD5(RANDOM()::TEXT || CURRENT_TIMESTAMP::TEXT),
      1, 8
    )
  );
  
  -- Vérifier l'unicité
  WHILE EXISTS (SELECT 1 FROM public.artist_product_certificates WHERE verification_code = v_code) LOOP
    v_code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || CURRENT_TIMESTAMP::TEXT),
        1, 8
      )
    );
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- RLS (Row Level Security)
ALTER TABLE public.artist_product_certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Utilisateurs peuvent voir leurs propres certificats
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.artist_product_certificates;
CREATE POLICY "Users can view their own certificates"
  ON public.artist_product_certificates
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Certificats publics sont visibles par tous
DROP POLICY IF EXISTS "Public certificates are visible to all" ON public.artist_product_certificates;
CREATE POLICY "Public certificates are visible to all"
  ON public.artist_product_certificates
  FOR SELECT
  USING (is_public = TRUE AND is_valid = TRUE AND revoked = FALSE);

-- Policy: Propriétaires de boutiques peuvent voir les certificats de leurs produits
DROP POLICY IF EXISTS "Store owners can view product certificates" ON public.artist_product_certificates;
CREATE POLICY "Store owners can view product certificates"
  ON public.artist_product_certificates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_products ap
      INNER JOIN public.products p ON ap.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE ap.id = artist_product_certificates.artist_product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policy: Système peut créer des certificats (via Edge Function)
DROP POLICY IF EXISTS "System can create certificates" ON public.artist_product_certificates;
CREATE POLICY "System can create certificates"
  ON public.artist_product_certificates
  FOR INSERT
  WITH CHECK (TRUE); -- Géré par Edge Function avec service_role

-- Policy: Utilisateurs peuvent mettre à jour leurs certificats (download count, etc.)
DROP POLICY IF EXISTS "Users can update their own certificates" ON public.artist_product_certificates;
CREATE POLICY "Users can update their own certificates"
  ON public.artist_product_certificates
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Commentaires
COMMENT ON TABLE public.artist_product_certificates IS 'Certificats d''authenticité pour produits artistes';
COMMENT ON COLUMN public.artist_product_certificates.certificate_number IS 'Numéro unique du certificat (format: ART-YYYY-NNNNNN)';
COMMENT ON COLUMN public.artist_product_certificates.verification_code IS 'Code de vérification publique pour validation en ligne';

