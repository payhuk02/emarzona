-- =====================================================
-- STAFF AVAILABILITY SETTINGS
-- Date: 2025-01-28
-- Description: Paramètres de disponibilité du staff
-- =====================================================

-- Table pour les paramètres de disponibilité du staff
CREATE TABLE IF NOT EXISTS public.staff_availability_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.service_products(id) ON DELETE CASCADE,
  
  -- Paramètres de blocage automatique
  auto_block_on_time_off BOOLEAN DEFAULT TRUE,
  
  -- Limites de réservation
  max_bookings_per_day INTEGER DEFAULT 8 CHECK (max_bookings_per_day > 0 AND max_bookings_per_day <= 50),
  
  -- Seuils de charge
  booking_density_warning_threshold INTEGER DEFAULT 70 CHECK (booking_density_warning_threshold >= 0 AND booking_density_warning_threshold <= 100),
  booking_density_critical_threshold INTEGER DEFAULT 85 CHECK (booking_density_critical_threshold >= 0 AND booking_density_critical_threshold <= 100),
  
  -- Heures de travail par défaut
  default_work_hours_start TIME DEFAULT '09:00',
  default_work_hours_end TIME DEFAULT '18:00',
  
  -- Temps de transition
  buffer_time_between_bookings INTEGER DEFAULT 15 CHECK (buffer_time_between_bookings >= 0 AND buffer_time_between_bookings <= 120),
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique: un seul paramètre par store/service
  UNIQUE(store_id, service_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_availability_settings_store_id ON public.staff_availability_settings(store_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_settings_service_id ON public.staff_availability_settings(service_id);

-- Trigger updated_at (supprimer d'abord s'il existe)
DROP TRIGGER IF EXISTS update_staff_availability_settings_updated_at ON public.staff_availability_settings;
CREATE TRIGGER update_staff_availability_settings_updated_at
  BEFORE UPDATE ON public.staff_availability_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.staff_availability_settings IS 'Paramètres de disponibilité du staff pour chaque store/service';

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Activer RLS
ALTER TABLE public.staff_availability_settings ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Vendeurs peuvent lire leurs paramètres" ON public.staff_availability_settings;
DROP POLICY IF EXISTS "Vendeurs peuvent créer leurs paramètres" ON public.staff_availability_settings;
DROP POLICY IF EXISTS "Vendeurs peuvent modifier leurs paramètres" ON public.staff_availability_settings;
DROP POLICY IF EXISTS "Vendeurs peuvent supprimer leurs paramètres" ON public.staff_availability_settings;

-- Policy: Les vendeurs peuvent lire leurs propres paramètres
CREATE POLICY "Vendeurs peuvent lire leurs paramètres"
  ON public.staff_availability_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = staff_availability_settings.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les vendeurs peuvent créer leurs paramètres
CREATE POLICY "Vendeurs peuvent créer leurs paramètres"
  ON public.staff_availability_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = staff_availability_settings.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les vendeurs peuvent modifier leurs paramètres
CREATE POLICY "Vendeurs peuvent modifier leurs paramètres"
  ON public.staff_availability_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = staff_availability_settings.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les vendeurs peuvent supprimer leurs paramètres
CREATE POLICY "Vendeurs peuvent supprimer leurs paramètres"
  ON public.staff_availability_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = staff_availability_settings.store_id
      AND stores.user_id = auth.uid()
    )
  );

