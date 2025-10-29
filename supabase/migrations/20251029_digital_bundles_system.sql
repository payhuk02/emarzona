-- ============================================================================
-- MIGRATION: Digital Product Bundles System
-- Date: 2025-10-29
-- Author: Payhula Team
-- Description: Système de bundles pour produits digitaux
--              Permet de créer des packs de plusieurs produits digitaux
-- ============================================================================

-- ============================================================================
-- 1. TYPES ENUMS
-- ============================================================================

DROP TYPE IF EXISTS bundle_discount_type CASCADE;
DROP TYPE IF EXISTS bundle_status CASCADE;

-- Type de remise pour bundles
CREATE TYPE bundle_discount_type AS ENUM (
  'percentage',  -- Pourcentage de réduction
  'fixed',       -- Montant fixe de réduction
  'custom'       -- Prix personnalisé pour le bundle
);

-- Statut du bundle
CREATE TYPE bundle_status AS ENUM (
  'draft',       -- Brouillon
  'active',      -- Actif et visible
  'inactive',    -- Inactif (caché)
  'scheduled',   -- Planifié (actif dans le futur)
  'expired'      -- Expiré
);

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- Supprimer les tables existantes si présentes (pour développement)
DROP TABLE IF EXISTS public.digital_bundle_items CASCADE;
DROP TABLE IF EXISTS public.digital_bundles CASCADE;

-- ============================================================================
-- 2.1 TABLE: digital_bundles
-- ============================================================================

CREATE TABLE public.digital_bundles (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Informations de base
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Images
  image_url TEXT,
  banner_url TEXT,
  
  -- Statut
  status bundle_status NOT NULL DEFAULT 'draft',
  
  -- Prix et remise
  original_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bundle_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_type bundle_discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  savings NUMERIC(10, 2) GENERATED ALWAYS AS (original_price - bundle_price) STORED,
  savings_percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN original_price > 0 THEN ((original_price - bundle_price) / original_price * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Configuration de disponibilité
  is_available BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Limites
  max_purchases INTEGER, -- NULL = illimité
  current_purchases INTEGER DEFAULT 0,
  
  -- License settings (hérité de tous les produits du bundle)
  auto_generate_licenses BOOLEAN DEFAULT true,
  license_duration_days INTEGER, -- NULL = lifetime
  
  -- Download settings
  download_limit INTEGER DEFAULT 10, -- -1 = unlimited
  download_expiry_days INTEGER DEFAULT 60, -- -1 = permanent
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  
  -- Statistiques
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC(10, 2) DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5, 2) DEFAULT 0,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  
  -- Features
  features JSONB DEFAULT '[]'::jsonb, -- [{title, description}]
  includes JSONB DEFAULT '[]'::jsonb, -- [{item, included: true/false}]
  
  -- Marketing
  badge TEXT, -- 'bestseller', 'limited', 'new', etc.
  is_featured BOOLEAN DEFAULT false,
  highlight_text TEXT, -- "SAVE 50%", "LIMITED TIME", etc.
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  
  -- Contraintes
  CONSTRAINT unique_store_bundle_slug UNIQUE (store_id, slug),
  CONSTRAINT valid_prices CHECK (bundle_price >= 0 AND original_price >= 0),
  CONSTRAINT valid_discount CHECK (discount_value >= 0),
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date),
  CONSTRAINT valid_max_purchases CHECK (max_purchases IS NULL OR max_purchases > 0)
);

-- Index pour performance
CREATE INDEX idx_bundles_store_id ON public.digital_bundles(store_id);
CREATE INDEX idx_bundles_status ON public.digital_bundles(status);
CREATE INDEX idx_bundles_slug ON public.digital_bundles(store_id, slug);
CREATE INDEX idx_bundles_is_available ON public.digital_bundles(is_available);
CREATE INDEX idx_bundles_start_date ON public.digital_bundles(start_date);
CREATE INDEX idx_bundles_end_date ON public.digital_bundles(end_date);
CREATE INDEX idx_bundles_total_sales ON public.digital_bundles(total_sales DESC);
CREATE INDEX idx_bundles_conversion_rate ON public.digital_bundles(conversion_rate DESC);
CREATE INDEX idx_bundles_is_featured ON public.digital_bundles(is_featured);

-- ============================================================================
-- 2.2 TABLE: digital_bundle_items
-- ============================================================================

CREATE TABLE public.digital_bundle_items (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.digital_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Organisation
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Prix individuel du produit (snapshot au moment de l'ajout)
  product_price NUMERIC(10, 2) NOT NULL,
  
  -- Visibilité
  is_visible BOOLEAN DEFAULT true,
  is_highlighted BOOLEAN DEFAULT false,
  highlight_text TEXT, -- "BONUS", "PREMIUM", etc.
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT unique_bundle_product UNIQUE (bundle_id, product_id),
  CONSTRAINT valid_order_index CHECK (order_index >= 0)
);

-- Index
CREATE INDEX idx_bundle_items_bundle_id ON public.digital_bundle_items(bundle_id);
CREATE INDEX idx_bundle_items_product_id ON public.digital_bundle_items(product_id);
CREATE INDEX idx_bundle_items_order ON public.digital_bundle_items(bundle_id, order_index);

-- ============================================================================
-- 3. FONCTIONS & TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_digital_bundles_updated_at
  BEFORE UPDATE ON public.digital_bundles
  FOR EACH ROW EXECUTE FUNCTION update_bundles_updated_at();

-- Fonction pour recalculer le prix original du bundle
CREATE OR REPLACE FUNCTION calculate_bundle_original_price(p_bundle_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(product_price), 0)
  INTO v_total
  FROM public.digital_bundle_items
  WHERE bundle_id = p_bundle_id;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le prix du bundle après ajout/suppression de produits
CREATE OR REPLACE FUNCTION update_bundle_pricing()
RETURNS TRIGGER AS $$
DECLARE
  v_bundle RECORD;
  v_original_price NUMERIC;
  v_new_bundle_price NUMERIC;
BEGIN
  -- Déterminer l'ID du bundle
  IF TG_OP = 'DELETE' THEN
    SELECT * INTO v_bundle FROM public.digital_bundles WHERE id = OLD.bundle_id;
  ELSE
    SELECT * INTO v_bundle FROM public.digital_bundles WHERE id = NEW.bundle_id;
  END IF;
  
  -- Calculer le nouveau prix original
  v_original_price := calculate_bundle_original_price(v_bundle.id);
  
  -- Calculer le nouveau prix du bundle selon le type de remise
  CASE v_bundle.discount_type
    WHEN 'percentage' THEN
      v_new_bundle_price := v_original_price * (1 - v_bundle.discount_value / 100);
    WHEN 'fixed' THEN
      v_new_bundle_price := GREATEST(v_original_price - v_bundle.discount_value, 0);
    WHEN 'custom' THEN
      v_new_bundle_price := v_bundle.bundle_price; -- Garder le prix custom
    ELSE
      v_new_bundle_price := v_original_price;
  END CASE;
  
  -- Mettre à jour le bundle (sauf si custom price)
  IF v_bundle.discount_type != 'custom' THEN
    UPDATE public.digital_bundles
    SET 
      original_price = v_original_price,
      bundle_price = v_new_bundle_price,
      updated_at = now()
    WHERE id = v_bundle.id;
  ELSE
    UPDATE public.digital_bundles
    SET 
      original_price = v_original_price,
      updated_at = now()
    WHERE id = v_bundle.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour recalculer le prix du bundle
CREATE TRIGGER update_bundle_pricing_on_items_change
  AFTER INSERT OR UPDATE OR DELETE ON public.digital_bundle_items
  FOR EACH ROW EXECUTE FUNCTION update_bundle_pricing();

-- Fonction pour générer un slug unique pour un bundle
CREATE OR REPLACE FUNCTION generate_bundle_slug(
  p_store_id UUID,
  p_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
  v_counter INTEGER := 0;
  v_final_slug TEXT;
BEGIN
  -- Générer le slug de base
  v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  v_final_slug := v_slug;
  
  -- Vérifier l'unicité et incrémenter si nécessaire
  WHILE EXISTS (
    SELECT 1 FROM public.digital_bundles 
    WHERE store_id = p_store_id AND slug = v_final_slug
  ) LOOP
    v_counter := v_counter + 1;
    v_final_slug := v_slug || '-' || v_counter;
  END LOOP;
  
  RETURN v_final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.digital_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_bundle_items ENABLE ROW LEVEL SECURITY;

-- Policies pour digital_bundles

-- Les vendeurs peuvent gérer leurs bundles
CREATE POLICY "Store owners can manage their bundles"
  ON public.digital_bundles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = digital_bundles.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Tout le monde peut voir les bundles actifs et disponibles
CREATE POLICY "Anyone can view available bundles"
  ON public.digital_bundles
  FOR SELECT
  USING (
    status = 'active' 
    AND is_available = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

-- Policies pour digital_bundle_items

-- Les vendeurs peuvent gérer les items de leurs bundles
CREATE POLICY "Store owners can manage bundle items"
  ON public.digital_bundle_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_bundles b
      INNER JOIN public.stores s ON b.store_id = s.id
      WHERE b.id = digital_bundle_items.bundle_id
      AND s.user_id = auth.uid()
    )
  );

-- Tout le monde peut voir les items des bundles disponibles
CREATE POLICY "Anyone can view items of available bundles"
  ON public.digital_bundle_items
  FOR SELECT
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM public.digital_bundles b
      WHERE b.id = digital_bundle_items.bundle_id
      AND b.status = 'active'
      AND b.is_available = true
    )
  );

-- ============================================================================
-- 5. VUES UTILES
-- ============================================================================

-- Vue pour afficher les bundles avec le nombre de produits
CREATE OR REPLACE VIEW digital_bundles_with_stats AS
SELECT 
  b.*,
  COUNT(DISTINCT bi.product_id) as products_count,
  ARRAY_AGG(p.name ORDER BY bi.order_index) FILTER (WHERE p.id IS NOT NULL) as product_names,
  ARRAY_AGG(p.id ORDER BY bi.order_index) FILTER (WHERE p.id IS NOT NULL) as product_ids
FROM public.digital_bundles b
LEFT JOIN public.digital_bundle_items bi ON b.id = bi.bundle_id
LEFT JOIN public.products p ON bi.product_id = p.id
GROUP BY b.id;

-- ============================================================================
-- 6. COMMENTAIRES & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.digital_bundles IS 
'Bundles (packs) de produits digitaux avec pricing et remises configurables';

COMMENT ON TABLE public.digital_bundle_items IS 
'Produits individuels inclus dans les bundles';

COMMENT ON COLUMN public.digital_bundles.discount_type IS 
'Type de remise: percentage, fixed, ou custom pricing';

COMMENT ON COLUMN public.digital_bundles.savings IS 
'Économies calculées automatiquement (original_price - bundle_price)';

COMMENT ON COLUMN public.digital_bundle_items.product_price IS 
'Snapshot du prix du produit au moment de l''ajout au bundle';

COMMENT ON FUNCTION calculate_bundle_original_price(UUID) IS 
'Calcule le prix original total d''un bundle basé sur les prix des produits';

COMMENT ON FUNCTION generate_bundle_slug(UUID, TEXT) IS 
'Génère un slug unique pour un bundle dans un store donné';

-- ============================================================================
-- 7. DONNÉES DE TEST (OPTIONNEL - Commenté par défaut)
-- ============================================================================

/*
-- Exemple de création d'un bundle
INSERT INTO public.digital_bundles (
  store_id,
  name,
  slug,
  description,
  status,
  discount_type,
  discount_value
) VALUES (
  'uuid-of-store',
  'Complete Developer Bundle',
  'complete-developer-bundle',
  'All our development tools in one package',
  'active',
  'percentage',
  30.0
);

-- Exemple d'ajout de produits au bundle
INSERT INTO public.digital_bundle_items (
  bundle_id,
  product_id,
  product_price,
  order_index
) VALUES 
  ('uuid-of-bundle', 'uuid-of-product-1', 49.99, 0),
  ('uuid-of-bundle', 'uuid-of-product-2', 39.99, 1),
  ('uuid-of-bundle', 'uuid-of-product-3', 29.99, 2);
*/

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

