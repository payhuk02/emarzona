-- =====================================================
-- STAFF AVAILABILITY MANAGEMENT - Phase 6
-- Date: 2025-01-30
-- Description: Gestion avancée de la disponibilité du staff
-- =====================================================

-- =====================================================
-- 1. TABLE: staff_time_off (Congés)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.staff_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES public.service_staff_members(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Période de congé
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- Optionnel pour congés partiels
  end_time TIME,   -- Optionnel pour congés partiels
  
  -- Type de congé
  time_off_type TEXT NOT NULL CHECK (time_off_type IN (
    'vacation',      -- Vacances
    'sick',          -- Maladie
    'personal',      -- Personnel
    'holiday',       -- Jour férié
    'training',      -- Formation
    'other'          -- Autre
  )) DEFAULT 'vacation',
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN (
    'pending',       -- En attente d'approbation
    'approved',     -- Approuvé
    'rejected',     -- Rejeté
    'cancelled'      -- Annulé
  )) DEFAULT 'pending',
  
  -- Détails
  reason TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  
  -- Auto-bloquage des réservations
  auto_block_bookings BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CHECK (end_date >= start_date),
  CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_time_off_staff_id ON public.staff_time_off(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_store_id ON public.staff_time_off(store_id);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_dates ON public.staff_time_off(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_status ON public.staff_time_off(status);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_type ON public.staff_time_off(time_off_type);

-- Trigger updated_at
CREATE TRIGGER update_staff_time_off_updated_at
  BEFORE UPDATE ON public.staff_time_off
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.staff_time_off IS 'Congés et absences du staff';

-- =====================================================
-- 2. TABLE: staff_custom_hours (Heures personnalisées)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.staff_custom_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES public.service_staff_members(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Date spécifique ou récurrente
  specific_date DATE, -- Si NULL, appliqué à tous les jours de la semaine
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Dimanche, 6 = Samedi
  
  -- Heures personnalisées
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Type
  is_override BOOLEAN DEFAULT FALSE, -- Override les heures normales
  is_unavailable BOOLEAN DEFAULT FALSE, -- Indisponible pendant ces heures
  
  -- Priorité (si plusieurs règles)
  priority INTEGER DEFAULT 0,
  
  -- Validité
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CHECK (end_time > start_time),
  CHECK (specific_date IS NOT NULL OR day_of_week IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_custom_hours_staff_id ON public.staff_custom_hours(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_custom_hours_store_id ON public.staff_custom_hours(store_id);
CREATE INDEX IF NOT EXISTS idx_staff_custom_hours_date ON public.staff_custom_hours(specific_date);
CREATE INDEX IF NOT EXISTS idx_staff_custom_hours_day ON public.staff_custom_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_staff_custom_hours_active ON public.staff_custom_hours(is_active);

-- Trigger updated_at
CREATE TRIGGER update_staff_custom_hours_updated_at
  BEFORE UPDATE ON public.staff_custom_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.staff_custom_hours IS 'Heures de travail personnalisées pour le staff';

-- =====================================================
-- 3. TABLE: staff_workload_alerts (Alertes de surcharge)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.staff_workload_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES public.service_staff_members(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Période concernée
  alert_date DATE NOT NULL,
  alert_period_start TIME,
  alert_period_end TIME,
  
  -- Métriques
  current_bookings_count INTEGER NOT NULL DEFAULT 0,
  max_recommended_bookings INTEGER NOT NULL DEFAULT 8,
  booking_density_percentage NUMERIC(5, 2) NOT NULL, -- Pourcentage de la journée occupée
  
  -- Type d'alerte
  alert_level TEXT NOT NULL CHECK (alert_level IN (
    'info',      -- Information (50-70%)
    'warning',   -- Avertissement (70-85%)
    'critical'   -- Critique (>85%)
  )) DEFAULT 'info',
  
  -- Statut
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Suggestions
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_workload_alerts_staff_id ON public.staff_workload_alerts(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_workload_alerts_store_id ON public.staff_workload_alerts(store_id);
CREATE INDEX IF NOT EXISTS idx_staff_workload_alerts_date ON public.staff_workload_alerts(alert_date);
CREATE INDEX IF NOT EXISTS idx_staff_workload_alerts_level ON public.staff_workload_alerts(alert_level);
CREATE INDEX IF NOT EXISTS idx_staff_workload_alerts_resolved ON public.staff_workload_alerts(is_resolved);

-- Trigger updated_at
CREATE TRIGGER update_staff_workload_alerts_updated_at
  BEFORE UPDATE ON public.staff_workload_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.staff_workload_alerts IS 'Alertes de surcharge de travail pour le staff';

-- =====================================================
-- 4. TABLE: resource_conflicts (Conflits de ressources)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.resource_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Conflit
  conflict_type TEXT NOT NULL CHECK (conflict_type IN (
    'staff_double_booking',    -- Staff double réservation
    'resource_unavailable',    -- Ressource indisponible
    'time_overlap',             -- Chevauchement temporel
    'capacity_exceeded',        -- Capacité dépassée
    'location_conflict'         -- Conflit de localisation
  )),
  
  -- Réservations en conflit
  booking_ids UUID[] NOT NULL,
  
  -- Détails
  conflict_date DATE NOT NULL,
  conflict_start_time TIME NOT NULL,
  conflict_end_time TIME NOT NULL,
  
  -- Ressources concernées
  staff_member_ids UUID[],
  resource_ids UUID[],
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN (
    'detected',     -- Détecté automatiquement
    'resolved',     -- Résolu
    'ignored'       -- Ignoré
  )) DEFAULT 'detected',
  
  -- Résolution
  resolution_method TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  
  -- Suggestions
  suggested_resolutions JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_store_id ON public.resource_conflicts(store_id);
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_date ON public.resource_conflicts(conflict_date);
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_type ON public.resource_conflicts(conflict_type);
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_status ON public.resource_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_booking_ids ON public.resource_conflicts USING GIN(booking_ids);
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_staff_ids ON public.resource_conflicts USING GIN(staff_member_ids);

-- Trigger updated_at
CREATE TRIGGER update_resource_conflicts_updated_at
  BEFORE UPDATE ON public.resource_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.resource_conflicts IS 'Conflits de ressources détectés automatiquement';

-- =====================================================
-- 5. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour vérifier si un staff est disponible à une date/heure
CREATE OR REPLACE FUNCTION public.check_staff_availability(
  p_staff_member_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_time_off BOOLEAN;
  v_has_custom_unavailable BOOLEAN;
BEGIN
  -- Vérifier les congés
  SELECT EXISTS (
    SELECT 1 FROM public.staff_time_off
    WHERE staff_member_id = p_staff_member_id
      AND status = 'approved'
      AND p_date >= start_date
      AND p_date <= end_date
      AND (
        (start_time IS NULL AND end_time IS NULL) OR
        (start_time IS NOT NULL AND end_time IS NOT NULL AND
         p_start_time >= start_time AND p_end_time <= end_time)
      )
  ) INTO v_has_time_off;
  
  IF v_has_time_off THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier les heures personnalisées (indisponible)
  SELECT EXISTS (
    SELECT 1 FROM public.staff_custom_hours
    WHERE staff_member_id = p_staff_member_id
      AND is_active = TRUE
      AND is_unavailable = TRUE
      AND (
        (specific_date IS NOT NULL AND specific_date = p_date) OR
        (day_of_week IS NOT NULL AND day_of_week = EXTRACT(DOW FROM p_date)::INTEGER)
      )
      AND (
        valid_from IS NULL OR p_date >= valid_from
      )
      AND (
        valid_until IS NULL OR p_date <= valid_until
      )
      AND p_start_time >= start_time
      AND p_end_time <= end_time
  ) INTO v_has_custom_unavailable;
  
  IF v_has_custom_unavailable THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour détecter les conflits de ressources
CREATE OR REPLACE FUNCTION public.detect_resource_conflicts(
  p_store_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS INTEGER AS $$
DECLARE
  v_conflict_count INTEGER := 0;
  v_booking RECORD;
  v_conflicting_booking RECORD;
BEGIN
  -- Détecter les doubles réservations de staff
  FOR v_booking IN
    SELECT 
      sb1.id as booking1_id,
      sb1.staff_member_id,
      sb1.scheduled_date,
      sb1.scheduled_start_time,
      sb1.scheduled_end_time
    FROM public.service_bookings sb1
    WHERE sb1.staff_member_id IS NOT NULL
      AND sb1.scheduled_date >= p_start_date
      AND sb1.scheduled_date <= p_end_date
      AND sb1.status IN ('pending', 'confirmed')
  LOOP
    -- Chercher les conflits
    FOR v_conflicting_booking IN
      SELECT sb2.id as booking2_id
      FROM public.service_bookings sb2
      WHERE sb2.id != v_booking.booking1_id
        AND sb2.staff_member_id = v_booking.staff_member_id
        AND sb2.scheduled_date = v_booking.scheduled_date
        AND sb2.status IN ('pending', 'confirmed')
        AND (
          (sb2.scheduled_start_time < v_booking.scheduled_end_time AND
           sb2.scheduled_end_time > v_booking.scheduled_start_time)
        )
    LOOP
      -- Insérer le conflit si pas déjà détecté
      INSERT INTO public.resource_conflicts (
        store_id,
        conflict_type,
        booking_ids,
        conflict_date,
        conflict_start_time,
        conflict_end_time,
        staff_member_ids,
        status,
        suggested_resolutions
      )
      SELECT 
        p_store_id,
        'staff_double_booking',
        ARRAY[v_booking.booking1_id, v_conflicting_booking.booking2_id],
        v_booking.scheduled_date,
        LEAST(v_booking.scheduled_start_time, v_conflicting_booking.scheduled_start_time),
        GREATEST(v_booking.scheduled_end_time, v_conflicting_booking.scheduled_end_time),
        ARRAY[v_booking.staff_member_id],
        'detected',
        jsonb_build_array(
          jsonb_build_object('action', 'reschedule', 'booking_id', v_booking.booking1_id),
          jsonb_build_object('action', 'reschedule', 'booking_id', v_conflicting_booking.booking2_id),
          jsonb_build_object('action', 'assign_different_staff', 'staff_id', v_booking.staff_member_id)
        )
      WHERE NOT EXISTS (
        SELECT 1 FROM public.resource_conflicts
        WHERE store_id = p_store_id
          AND conflict_type = 'staff_double_booking'
          AND booking_ids @> ARRAY[v_booking.booking1_id]
          AND status = 'detected'
      );
      
      v_conflict_count := v_conflict_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN v_conflict_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer la charge de travail du staff
CREATE OR REPLACE FUNCTION public.calculate_staff_workload(
  p_staff_member_id UUID,
  p_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_total_bookings INTEGER;
  v_total_duration_minutes INTEGER;
  v_workday_hours INTEGER := 8; -- Heures de travail par jour
  v_density_percentage NUMERIC;
BEGIN
  -- Compter les réservations
  SELECT 
    COUNT(*),
    COALESCE(SUM(EXTRACT(EPOCH FROM (scheduled_end_time - scheduled_start_time)) / 60), 0)::INTEGER
  INTO v_total_bookings, v_total_duration_minutes
  FROM public.service_bookings
  WHERE staff_member_id = p_staff_member_id
    AND scheduled_date = p_date
    AND status IN ('pending', 'confirmed', 'in_progress');
  
  -- Calculer le pourcentage de densité
  v_density_percentage := (v_total_duration_minutes::NUMERIC / (v_workday_hours * 60)) * 100;
  
  -- Construire le résultat
  SELECT json_build_object(
    'staff_member_id', p_staff_member_id,
    'date', p_date,
    'total_bookings', v_total_bookings,
    'total_duration_minutes', v_total_duration_minutes,
    'density_percentage', ROUND(v_density_percentage, 2),
    'alert_level', CASE
      WHEN v_density_percentage >= 85 THEN 'critical'
      WHEN v_density_percentage >= 70 THEN 'warning'
      ELSE 'info'
    END
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.staff_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_custom_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_workload_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_conflicts ENABLE ROW LEVEL SECURITY;

-- Policies: staff_time_off
DROP POLICY IF EXISTS "store_owners_manage_time_off" ON public.staff_time_off;
CREATE POLICY "store_owners_manage_time_off" ON public.staff_time_off
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = staff_time_off.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: staff_custom_hours
DROP POLICY IF EXISTS "store_owners_manage_custom_hours" ON public.staff_custom_hours;
CREATE POLICY "store_owners_manage_custom_hours" ON public.staff_custom_hours
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = staff_custom_hours.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: staff_workload_alerts
DROP POLICY IF EXISTS "store_owners_view_workload_alerts" ON public.staff_workload_alerts;
CREATE POLICY "store_owners_view_workload_alerts" ON public.staff_workload_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = staff_workload_alerts.store_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "store_owners_update_workload_alerts" ON public.staff_workload_alerts;
CREATE POLICY "store_owners_update_workload_alerts" ON public.staff_workload_alerts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = staff_workload_alerts.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: resource_conflicts
DROP POLICY IF EXISTS "store_owners_manage_conflicts" ON public.resource_conflicts;
CREATE POLICY "store_owners_manage_conflicts" ON public.resource_conflicts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = resource_conflicts.store_id
        AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. VÉRIFICATION
-- =====================================================

-- Afficher les tables créées
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN (
  'staff_time_off',
  'staff_custom_hours',
  'staff_workload_alerts',
  'resource_conflicts'
)
  AND schemaname = 'public';

