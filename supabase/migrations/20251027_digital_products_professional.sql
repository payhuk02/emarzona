-- =====================================================
-- PAYHUK DIGITAL PRODUCTS SYSTEM - PROFESSIONAL GRADE
-- Date: 27 Octobre 2025
-- Inspiré de : Gumroad, Stripe, Paddle, Lemonsqueezy
-- Description: Système complet pour produits digitaux haut de gamme
-- Version: 1.0
-- =====================================================

-- Drop existing tables if any
DROP TABLE IF EXISTS public.digital_license_activations CASCADE;
DROP TABLE IF EXISTS public.digital_licenses CASCADE;
DROP TABLE IF EXISTS public.digital_product_updates CASCADE;
DROP TABLE IF EXISTS public.digital_product_downloads CASCADE;
DROP TABLE IF EXISTS public.digital_product_files CASCADE;
DROP TABLE IF EXISTS public.digital_products CASCADE;

-- =====================================================
-- 1. TABLE: digital_products
-- =====================================================
CREATE TABLE public.digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Type spécifique de produit digital
  digital_type TEXT NOT NULL CHECK (digital_type IN (
    'software',      -- Logiciel / Application
    'ebook',         -- Livre numérique
    'template',      -- Template / Thème
    'plugin',        -- Plugin / Extension
    'music',         -- Fichier audio / Musique
    'video',         -- Vidéo
    'graphic',       -- Graphisme / Design
    'game',          -- Jeu
    'app',           -- Application mobile
    'course_files',  -- Fichiers de cours (distinct des cours)
    'document',      -- Document / PDF
    'data',          -- Dataset / Base de données
    'other'          -- Autre
  )) DEFAULT 'other',
  
  -- === LICENSING SYSTEM (Professional) ===
  license_type TEXT NOT NULL CHECK (license_type IN (
    'single',        -- 1 appareil/utilisateur
    'multi',         -- Multiple appareils (3-5)
    'unlimited',     -- Illimité
    'subscription',  -- Abonnement
    'lifetime'       -- À vie
  )) DEFAULT 'single',
  
  license_duration_days INTEGER, -- NULL = lifetime
  max_activations INTEGER DEFAULT 1, -- -1 = unlimited
  allow_license_transfer BOOLEAN DEFAULT FALSE,
  license_key_format TEXT DEFAULT 'XXXX-XXXX-XXXX-XXXX',
  auto_generate_keys BOOLEAN DEFAULT TRUE,
  
  -- === FILES MANAGEMENT ===
  main_file_url TEXT NOT NULL,
  main_file_size_mb NUMERIC,
  main_file_format TEXT, -- 'pdf', 'zip', 'exe', etc.
  main_file_version TEXT DEFAULT '1.0',
  main_file_hash TEXT, -- Pour intégrité
  
  total_files INTEGER DEFAULT 1,
  total_size_mb NUMERIC,
  
  -- Fichiers additionnels (bonus, resources)
  additional_files JSONB DEFAULT '[]'::jsonb,
  
  -- === DOWNLOAD SETTINGS (Gumroad-style) ===
  download_limit INTEGER DEFAULT 5, -- -1 = unlimited
  download_expiry_days INTEGER DEFAULT 30, -- -1 = permanent
  require_registration BOOLEAN DEFAULT TRUE,
  watermark_enabled BOOLEAN DEFAULT FALSE,
  watermark_text TEXT,
  
  -- Protection avancée
  ip_restriction_enabled BOOLEAN DEFAULT FALSE,
  max_ips_allowed INTEGER DEFAULT 3,
  geo_restriction_enabled BOOLEAN DEFAULT FALSE,
  allowed_countries TEXT[],
  blocked_countries TEXT[],
  
  -- === UPDATES & VERSIONING ===
  version TEXT DEFAULT '1.0',
  changelog TEXT,
  auto_update_enabled BOOLEAN DEFAULT FALSE,
  update_notifications BOOLEAN DEFAULT TRUE,
  last_version_date TIMESTAMPTZ,
  
  -- === ENCRYPTION & SECURITY ===
  encryption_enabled BOOLEAN DEFAULT FALSE,
  encryption_type TEXT CHECK (encryption_type IN ('aes256', 'rsa', 'none')) DEFAULT 'none',
  drm_enabled BOOLEAN DEFAULT FALSE,
  drm_provider TEXT,
  
  -- === PREVIEW & DEMO ===
  has_preview BOOLEAN DEFAULT FALSE,
  preview_url TEXT,
  preview_duration_seconds INTEGER, -- Pour vidéos/audio
  demo_available BOOLEAN DEFAULT FALSE,
  demo_url TEXT,
  trial_period_days INTEGER,
  
  -- === ADVANCED FEATURES ===
  source_code_included BOOLEAN DEFAULT FALSE,
  documentation_url TEXT,
  support_period_days INTEGER,
  support_email TEXT,
  
  -- Compatibility info
  compatible_os TEXT[], -- ['windows', 'mac', 'linux', 'ios', 'android']
  minimum_requirements JSONB,
  
  -- === STATISTICS (calculées) ===
  total_downloads INTEGER DEFAULT 0,
  unique_downloaders INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  average_download_time_seconds INTEGER DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0, -- % qui n'ont pas téléchargé après achat
  
  -- Ratings & Reviews
  average_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour digital_products
CREATE INDEX IF NOT EXISTS idx_digital_products_product_id ON public.digital_products(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_digital_type ON public.digital_products(digital_type);
CREATE INDEX IF NOT EXISTS idx_digital_products_license_type ON public.digital_products(license_type);
CREATE INDEX IF NOT EXISTS idx_digital_products_total_downloads ON public.digital_products(total_downloads DESC);
CREATE INDEX IF NOT EXISTS idx_digital_products_average_rating ON public.digital_products(average_rating DESC);

-- Trigger updated_at
CREATE TRIGGER update_digital_products_updated_at
  BEFORE UPDATE ON public.digital_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.digital_products IS 'Table dédiée aux produits digitaux avec fonctionnalités avancées professionnelles';

-- =====================================================
-- 2. TABLE: digital_product_files
-- =====================================================
CREATE TABLE IF NOT EXISTS public.digital_product_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  
  -- File info
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_mb NUMERIC NOT NULL,
  file_hash TEXT, -- MD5 ou SHA256
  
  -- Organization
  order_index INTEGER NOT NULL DEFAULT 0,
  category TEXT, -- 'main', 'bonus', 'documentation', 'source'
  
  -- Access control
  is_main BOOLEAN DEFAULT FALSE,
  is_preview BOOLEAN DEFAULT FALSE,
  requires_purchase BOOLEAN DEFAULT TRUE,
  requires_license BOOLEAN DEFAULT FALSE,
  
  -- Versioning
  version TEXT DEFAULT '1.0',
  
  -- Statistics
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_digital_product_files_product_id ON public.digital_product_files(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_files_is_main ON public.digital_product_files(is_main);
CREATE INDEX IF NOT EXISTS idx_digital_product_files_order ON public.digital_product_files(digital_product_id, order_index);

-- Trigger
CREATE TRIGGER update_digital_product_files_updated_at
  BEFORE UPDATE ON public.digital_product_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.digital_product_files IS 'Fichiers individuels liés aux produits digitaux';

-- =====================================================
-- 3. TABLE: digital_product_downloads (Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.digital_product_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.digital_product_files(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Download info
  download_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  download_ip TEXT,
  download_country TEXT,
  user_agent TEXT,
  download_method TEXT DEFAULT 'web', -- 'web', 'api', 'app'
  
  -- Performance
  download_duration_seconds INTEGER,
  download_speed_mbps NUMERIC,
  download_success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- License info (si applicable)
  license_key TEXT,
  license_id UUID, -- Référence vers digital_licenses
  
  -- Version info
  file_version TEXT,
  
  -- Session
  session_id TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_digital_downloads_product_id ON public.digital_product_downloads(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_user_id ON public.digital_product_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_date ON public.digital_product_downloads(download_date DESC);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_success ON public.digital_product_downloads(download_success);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_license_key ON public.digital_product_downloads(license_key);

COMMENT ON TABLE public.digital_product_downloads IS 'Tracking détaillé de tous les téléchargements';

-- =====================================================
-- 4. TABLE: digital_licenses (Professional License Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.digital_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- License key
  license_key TEXT NOT NULL UNIQUE,
  license_type TEXT NOT NULL CHECK (license_type IN ('single', 'multi', 'unlimited', 'subscription', 'lifetime')),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'suspended',
    'expired',
    'revoked',
    'pending'
  )) DEFAULT 'pending',
  
  -- Activation
  max_activations INTEGER DEFAULT 1,
  current_activations INTEGER DEFAULT 0,
  activation_history JSONB DEFAULT '[]'::jsonb, -- [{device_id, activated_at, ip, user_agent}]
  
  -- Validity
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_validated_at TIMESTAMPTZ,
  
  -- Features (pour licenses avec fonctionnalités différentes)
  allowed_features JSONB DEFAULT '{}'::jsonb,
  
  -- Restrictions
  ip_restrictions TEXT[],
  device_restrictions TEXT[], -- Device IDs autorisés
  
  -- Metadata
  order_id UUID, -- Lien vers commande
  payment_id UUID, -- Lien vers paiement
  customer_email TEXT,
  customer_name TEXT,
  
  -- Notes
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_digital_licenses_product_id ON public.digital_licenses(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_digital_licenses_user_id ON public.digital_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_licenses_key ON public.digital_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_digital_licenses_status ON public.digital_licenses(status);
CREATE INDEX IF NOT EXISTS idx_digital_licenses_expires_at ON public.digital_licenses(expires_at);

-- Trigger
CREATE TRIGGER update_digital_licenses_updated_at
  BEFORE UPDATE ON public.digital_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.digital_licenses IS 'Système professionnel de gestion des licenses';

-- =====================================================
-- 5. TABLE: digital_license_activations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.digital_license_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.digital_licenses(id) ON DELETE CASCADE,
  
  -- Device info
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet', 'server'
  os_name TEXT,
  os_version TEXT,
  
  -- Network
  ip_address TEXT NOT NULL,
  country TEXT,
  city TEXT,
  
  -- Activation
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT,
  
  -- Usage tracking
  validation_count INTEGER DEFAULT 0,
  last_app_version TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_license_activations_license_id ON public.digital_license_activations(license_id);
CREATE INDEX IF NOT EXISTS idx_license_activations_device_id ON public.digital_license_activations(device_id);
CREATE INDEX IF NOT EXISTS idx_license_activations_is_active ON public.digital_license_activations(is_active);

COMMENT ON TABLE public.digital_license_activations IS 'Activations individuelles des licenses';

-- =====================================================
-- 6. TABLE: digital_product_updates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.digital_product_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  
  -- Version info
  version TEXT NOT NULL,
  previous_version TEXT,
  release_type TEXT CHECK (release_type IN ('major', 'minor', 'patch', 'hotfix')) DEFAULT 'minor',
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  changelog TEXT NOT NULL,
  
  -- Files
  file_url TEXT NOT NULL,
  file_size_mb NUMERIC,
  file_hash TEXT,
  
  -- Release info
  is_published BOOLEAN DEFAULT FALSE,
  is_forced BOOLEAN DEFAULT FALSE, -- Force update
  release_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Statistics
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_updates_product_id ON public.digital_product_updates(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_product_updates_version ON public.digital_product_updates(version);
CREATE INDEX IF NOT EXISTS idx_product_updates_release_date ON public.digital_product_updates(release_date DESC);

COMMENT ON TABLE public.digital_product_updates IS 'Historique des mises à jour de produits';

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_updates ENABLE ROW LEVEL SECURITY;

-- Policies: digital_products (Store owners can manage)
DROP POLICY IF EXISTS "Store owners manage digital products" ON public.digital_products;
CREATE POLICY "Store owners manage digital products"
  ON public.digital_products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE p.id = digital_products.product_id
        AND s.user_id = auth.uid()
    )
  );

-- Anyone can view (via products table)
DROP POLICY IF EXISTS "Anyone can view digital products" ON public.digital_products;
CREATE POLICY "Anyone can view digital products"
  ON public.digital_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = digital_products.product_id
        AND p.is_active = TRUE
    )
  );

-- Policies: digital_product_files
DROP POLICY IF EXISTS "Store owners manage files" ON public.digital_product_files;
CREATE POLICY "Store owners manage files"
  ON public.digital_product_files
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_products dp
      INNER JOIN public.products p ON dp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE dp.id = digital_product_files.digital_product_id
        AND s.user_id = auth.uid()
    )
  );

-- Users can view files they purchased
DROP POLICY IF EXISTS "Users view purchased files" ON public.digital_product_files;
CREATE POLICY "Users view purchased files"
  ON public.digital_product_files
  FOR SELECT
  USING (
    is_preview = TRUE OR
    requires_purchase = FALSE OR
    EXISTS (
      SELECT 1 FROM public.order_items oi
      INNER JOIN public.orders o ON oi.order_id = o.id
      INNER JOIN public.customers c ON o.customer_id = c.id
      INNER JOIN public.digital_products dp ON oi.product_id = dp.product_id
      WHERE dp.id = digital_product_files.digital_product_id
        AND o.payment_status = 'paid'
        AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Policies: digital_product_downloads
DROP POLICY IF EXISTS "Users view own downloads" ON public.digital_product_downloads;
CREATE POLICY "Users view own downloads"
  ON public.digital_product_downloads
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create downloads" ON public.digital_product_downloads;
CREATE POLICY "Users create downloads"
  ON public.digital_product_downloads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Store owners can view downloads for their products
DROP POLICY IF EXISTS "Store owners view product downloads" ON public.digital_product_downloads;
CREATE POLICY "Store owners view product downloads"
  ON public.digital_product_downloads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_products dp
      INNER JOIN public.products p ON dp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE dp.id = digital_product_downloads.digital_product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: digital_licenses
DROP POLICY IF EXISTS "Users view own licenses" ON public.digital_licenses;
CREATE POLICY "Users view own licenses"
  ON public.digital_licenses
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Store owners view product licenses" ON public.digital_licenses;
CREATE POLICY "Store owners view product licenses"
  ON public.digital_licenses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_products dp
      INNER JOIN public.products p ON dp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE dp.id = digital_licenses.digital_product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: digital_license_activations
DROP POLICY IF EXISTS "Users view own activations" ON public.digital_license_activations;
CREATE POLICY "Users view own activations"
  ON public.digital_license_activations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_licenses dl
      WHERE dl.id = digital_license_activations.license_id
        AND dl.user_id = auth.uid()
    )
  );

-- Policies: digital_product_updates
DROP POLICY IF EXISTS "Anyone can view published updates" ON public.digital_product_updates;
CREATE POLICY "Anyone can view published updates"
  ON public.digital_product_updates
  FOR SELECT
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "Store owners manage updates" ON public.digital_product_updates;
CREATE POLICY "Store owners manage updates"
  ON public.digital_product_updates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_products dp
      INNER JOIN public.products p ON dp.product_id = p.id
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE dp.id = digital_product_updates.digital_product_id
        AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename LIKE 'digital_%'
  AND schemaname = 'public'
ORDER BY tablename;

