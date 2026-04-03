-- ============================================================================
-- MIGRATION: Product Versioning & Update Notification System
-- Date: 2025-10-29
-- Description: Système de gestion des versions et notifications de mise à jour
-- ============================================================================

-- Types ENUM
DROP TYPE IF EXISTS version_status CASCADE;
CREATE TYPE version_status AS ENUM ('draft', 'beta', 'stable', 'deprecated');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Supprimer les tables existantes (pour développement)
DROP TABLE IF EXISTS public.version_download_logs CASCADE;
DROP TABLE IF EXISTS public.product_versions CASCADE;

-- ============================================================================
-- TABLE: product_versions
-- ============================================================================
CREATE TABLE public.product_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Version info
  version_number TEXT NOT NULL, -- e.g., "1.0.0", "2.3.1"
  version_name TEXT, -- e.g., "Winter Update", "Bug Fix Release"
  status version_status DEFAULT 'stable',
  
  -- Files
  download_url TEXT NOT NULL,
  file_size_mb NUMERIC,
  file_checksum TEXT, -- MD5 or SHA256
  
  -- Changelog
  changelog_title TEXT,
  changelog_markdown TEXT, -- Rich markdown changelog
  whats_new JSONB DEFAULT '[]'::jsonb, -- ["Feature 1", "Feature 2"]
  bug_fixes JSONB DEFAULT '[]'::jsonb,
  breaking_changes JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  release_date TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  is_major_update BOOLEAN DEFAULT false,
  is_security_update BOOLEAN DEFAULT false,
  minimum_version TEXT, -- Minimum version required for update
  
  -- Notifications
  notify_customers BOOLEAN DEFAULT true,
  notification_sent_at TIMESTAMPTZ,
  customers_notified INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(product_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_product ON public.product_versions(product_id);
CREATE INDEX IF NOT EXISTS idx_versions_status ON public.product_versions(status);
CREATE INDEX IF NOT EXISTS idx_versions_release ON public.product_versions(release_date DESC);

-- ============================================================================
-- TABLE: version_download_logs
-- ============================================================================
CREATE TABLE public.version_download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  license_id UUID REFERENCES public.digital_product_licenses(id),
  
  ip_address INET,
  user_agent TEXT,
  download_completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_download_logs_version ON public.version_download_logs(version_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_customer_v ON public.version_download_logs(customer_id);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_download_logs ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their versions
CREATE POLICY "Vendors manage versions"
  ON public.product_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = product_versions.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Customers can view versions
CREATE POLICY "Customers view versions"
  ON public.product_versions FOR SELECT
  USING (status = 'stable');

COMMENT ON TABLE public.product_versions IS 'Product versions with changelog and update tracking';

