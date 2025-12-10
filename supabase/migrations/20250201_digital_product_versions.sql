-- =====================================================
-- Migration: Système de Versions & Mises à Jour Produits Digitaux
-- Date: 1 Février 2025
-- Description: Système complet de versioning pour produits digitaux
-- =====================================================

-- Table pour versions produits digitaux
CREATE TABLE IF NOT EXISTS public.digital_product_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Versioning
  version_number TEXT NOT NULL, -- Format: major.minor.patch (ex: 1.2.3)
  major_version INTEGER NOT NULL,
  minor_version INTEGER NOT NULL,
  patch_version INTEGER NOT NULL,
  
  -- Informations version
  version_name TEXT, -- Nom de la version (ex: "Version 2.0 - Nouveau Design")
  release_notes TEXT, -- Notes de version (markdown supporté)
  changelog JSONB DEFAULT '[]', -- Array de changements détaillés
  
  -- Fichiers
  files JSONB DEFAULT '[]', -- Fichiers de cette version
  file_changes JSONB DEFAULT '[]', -- Changements par rapport à version précédente
  
  -- Statut
  is_current BOOLEAN DEFAULT FALSE, -- Version actuelle
  is_beta BOOLEAN DEFAULT FALSE, -- Version beta
  is_deprecated BOOLEAN DEFAULT FALSE, -- Version dépréciée
  
  -- Dates
  released_at TIMESTAMPTZ DEFAULT NOW(),
  deprecated_at TIMESTAMPTZ,
  
  -- Métadonnées
  file_size_bytes BIGINT, -- Taille totale fichiers
  download_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte: une seule version courante par produit
  UNIQUE(digital_product_id, is_current) WHERE is_current = TRUE,
  -- Contrainte: unicité version_number par produit
  UNIQUE(digital_product_id, version_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_digital_product_versions_product_id ON public.digital_product_versions(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_versions_digital_product_id ON public.digital_product_versions(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_versions_current ON public.digital_product_versions(is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_digital_product_versions_number ON public.digital_product_versions(major_version, minor_version, patch_version);

-- Table pour notifications de mises à jour
CREATE TABLE IF NOT EXISTS public.digital_product_update_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES public.digital_product_versions(id) ON DELETE CASCADE,
  
  -- Notification
  notification_type TEXT DEFAULT 'email' CHECK (notification_type IN ('email', 'in_app', 'both')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ, -- Quand l'utilisateur a cliqué sur la notification
  
  -- Statut
  is_sent BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un utilisateur ne reçoit qu'une notification par version
  UNIQUE(user_id, version_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_update_notifications_user_id ON public.digital_product_update_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_update_notifications_product_id ON public.digital_product_update_notifications(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_update_notifications_version_id ON public.digital_product_update_notifications(version_id);
CREATE INDEX IF NOT EXISTS idx_update_notifications_unread ON public.digital_product_update_notifications(is_read) WHERE is_read = FALSE;

-- Table pour historique téléchargements par version
CREATE TABLE IF NOT EXISTS public.digital_product_version_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES public.digital_product_versions(id) ON DELETE CASCADE,
  
  -- Téléchargement
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  download_success BOOLEAN DEFAULT TRUE,
  
  -- Migration
  migrated_from_version_id UUID REFERENCES public.digital_product_versions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_version_downloads_user_id ON public.digital_product_version_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_version_downloads_version_id ON public.digital_product_version_downloads(version_id);
CREATE INDEX IF NOT EXISTS idx_version_downloads_product_id ON public.digital_product_version_downloads(digital_product_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_digital_product_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_digital_product_versions_updated_at
  BEFORE UPDATE ON public.digital_product_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_digital_product_versions_updated_at();

-- Trigger pour notifications automatiques lors nouvelle version
CREATE OR REPLACE FUNCTION notify_users_new_version()
RETURNS TRIGGER AS $$
DECLARE
  customer_record RECORD;
BEGIN
  -- Si c'est la version courante, notifier tous les clients ayant acheté
  IF NEW.is_current = TRUE THEN
    FOR customer_record IN
      SELECT DISTINCT o.user_id
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE oi.product_id = NEW.product_id
      AND o.status = 'completed'
      AND o.user_id IS NOT NULL
    LOOP
      -- Créer notification pour chaque client
      INSERT INTO public.digital_product_update_notifications (
        user_id,
        digital_product_id,
        version_id,
        notification_type,
        is_sent
      )
      VALUES (
        customer_record.user_id,
        NEW.digital_product_id,
        NEW.id,
        'both',
        FALSE
      )
      ON CONFLICT (user_id, version_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_users_new_version_trigger
  AFTER INSERT OR UPDATE OF is_current ON public.digital_product_versions
  FOR EACH ROW
  WHEN (NEW.is_current = TRUE)
  EXECUTE FUNCTION notify_users_new_version();

-- Fonction pour obtenir version courante d'un produit
CREATE OR REPLACE FUNCTION get_current_digital_product_version(
  p_product_id UUID
)
RETURNS TABLE (
  id UUID,
  version_number TEXT,
  version_name TEXT,
  release_notes TEXT,
  changelog JSONB,
  released_at TIMESTAMPTZ,
  files JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.version_number,
    v.version_name,
    v.release_notes,
    v.changelog,
    v.released_at,
    v.files
  FROM public.digital_product_versions v
  WHERE v.product_id = p_product_id
  AND v.is_current = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir historique versions
CREATE OR REPLACE FUNCTION get_digital_product_version_history(
  p_product_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  version_number TEXT,
  version_name TEXT,
  release_notes TEXT,
  released_at TIMESTAMPTZ,
  is_current BOOLEAN,
  is_beta BOOLEAN,
  is_deprecated BOOLEAN,
  download_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.version_number,
    v.version_name,
    v.release_notes,
    v.released_at,
    v.is_current,
    v.is_beta,
    v.is_deprecated,
    v.download_count
  FROM public.digital_product_versions v
  WHERE v.product_id = p_product_id
  ORDER BY v.major_version DESC, v.minor_version DESC, v.patch_version DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.digital_product_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_update_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_version_downloads ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture publique des versions (pour clients)
CREATE POLICY "digital_product_versions_select_public"
  ON public.digital_product_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = digital_product_versions.product_id
      AND p.is_active = TRUE
    )
  );

-- Policy: Propriétaires peuvent gérer leurs versions
CREATE POLICY "digital_product_versions_manage_owners"
  ON public.digital_product_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = digital_product_versions.product_id
      AND s.user_id = auth.uid()
    )
  );

-- Policy: Utilisateurs peuvent voir leurs notifications
CREATE POLICY "update_notifications_select_own"
  ON public.digital_product_update_notifications FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Utilisateurs peuvent mettre à jour leurs notifications
CREATE POLICY "update_notifications_update_own"
  ON public.digital_product_update_notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Utilisateurs peuvent voir leurs téléchargements
CREATE POLICY "version_downloads_select_own"
  ON public.digital_product_version_downloads FOR SELECT
  USING (user_id = auth.uid());

-- Commentaires
COMMENT ON TABLE public.digital_product_versions IS 'Versions des produits digitaux avec système de versioning sémantique';
COMMENT ON COLUMN public.digital_product_versions.version_number IS 'Format: major.minor.patch (ex: 1.2.3)';
COMMENT ON COLUMN public.digital_product_versions.changelog IS 'Array JSON de changements: [{"type": "added|fixed|changed|removed", "description": "..."}]';
COMMENT ON TABLE public.digital_product_update_notifications IS 'Notifications de mises à jour pour clients';
COMMENT ON TABLE public.digital_product_version_downloads IS 'Historique téléchargements par version';

