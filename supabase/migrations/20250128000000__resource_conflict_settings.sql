-- =====================================================
-- RESOURCE CONFLICT SETTINGS
-- Date: 2025-01-28
-- Description: Paramètres de détection et gestion des conflits de ressources
-- =====================================================

-- Table pour les paramètres de détection de conflits
CREATE TABLE IF NOT EXISTS public.resource_conflict_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Détection automatique
  auto_detect_conflicts BOOLEAN DEFAULT TRUE,
  detect_interval_minutes INTEGER DEFAULT 30 CHECK (detect_interval_minutes >= 5 AND detect_interval_minutes <= 1440),
  
  -- Prévention
  prevent_double_booking BOOLEAN DEFAULT TRUE,
  check_resource_availability BOOLEAN DEFAULT TRUE,
  check_capacity BOOLEAN DEFAULT TRUE,
  check_time_slots BOOLEAN DEFAULT TRUE,
  
  -- Notifications
  notify_on_conflict BOOLEAN DEFAULT TRUE,
  
  -- Résolution
  auto_resolve_conflicts BOOLEAN DEFAULT FALSE,
  conflict_resolution_method TEXT DEFAULT 'manual' CHECK (conflict_resolution_method IN ('manual', 'auto', 'suggest')),
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique: un seul paramètre par store
  UNIQUE(store_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resource_conflict_settings_store_id ON public.resource_conflict_settings(store_id);

-- Trigger updated_at (supprimer d'abord s'il existe)
DROP TRIGGER IF EXISTS update_resource_conflict_settings_updated_at ON public.resource_conflict_settings;
CREATE TRIGGER update_resource_conflict_settings_updated_at
  BEFORE UPDATE ON public.resource_conflict_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.resource_conflict_settings IS 'Paramètres de détection et gestion des conflits de ressources';

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Activer RLS
ALTER TABLE public.resource_conflict_settings ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Vendeurs peuvent lire leurs paramètres" ON public.resource_conflict_settings;
DROP POLICY IF EXISTS "Vendeurs peuvent créer leurs paramètres" ON public.resource_conflict_settings;
DROP POLICY IF EXISTS "Vendeurs peuvent modifier leurs paramètres" ON public.resource_conflict_settings;
DROP POLICY IF EXISTS "Vendeurs peuvent supprimer leurs paramètres" ON public.resource_conflict_settings;

-- Policy: Les vendeurs peuvent lire leurs paramètres
CREATE POLICY "Vendeurs peuvent lire leurs paramètres"
  ON public.resource_conflict_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = resource_conflict_settings.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les vendeurs peuvent créer leurs paramètres
CREATE POLICY "Vendeurs peuvent créer leurs paramètres"
  ON public.resource_conflict_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = resource_conflict_settings.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les vendeurs peuvent modifier leurs paramètres
CREATE POLICY "Vendeurs peuvent modifier leurs paramètres"
  ON public.resource_conflict_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = resource_conflict_settings.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les vendeurs peuvent supprimer leurs paramètres
CREATE POLICY "Vendeurs peuvent supprimer leurs paramètres"
  ON public.resource_conflict_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = resource_conflict_settings.store_id
      AND stores.user_id = auth.uid()
    )
  );

