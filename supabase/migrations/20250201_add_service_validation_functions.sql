-- =========================================================
-- Migration : Fonctions de Validation Service
-- Date : 1 Février 2025
-- Description : Fonctions SQL pour valider les règles métier côté serveur
-- =========================================================

-- ============================================================
-- 1. FONCTION: Vérifier conflits de réservation (staff et global)
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_booking_conflicts(
  p_product_id UUID,
  p_scheduled_date DATE,
  p_scheduled_start_time TIME,
  p_scheduled_end_time TIME,
  p_staff_member_id UUID DEFAULT NULL,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  has_conflict BOOLEAN,
  conflict_type TEXT,
  conflicting_booking_id UUID,
  conflict_message TEXT
) AS $$
DECLARE
  v_conflict_count INTEGER := 0;
  v_buffer_conflict BOOLEAN := FALSE;
  v_service_product RECORD;
BEGIN
  -- Récupérer les infos du service (pour buffer_time)
  SELECT 
    sp.id,
    sp.buffer_time_before,
    sp.buffer_time_after
  INTO v_service_product
  FROM public.service_products sp
  WHERE sp.product_id = p_product_id
  LIMIT 1;

  -- Vérifier conflits directs (chevauchement de temps)
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM public.service_bookings sb
  WHERE sb.product_id = p_product_id
    AND sb.scheduled_date = p_scheduled_date
    AND sb.status IN ('pending', 'confirmed', 'rescheduled')
    AND (p_exclude_booking_id IS NULL OR sb.id != p_exclude_booking_id)
    AND (
      (p_staff_member_id IS NULL) OR
      (p_staff_member_id IS NOT NULL AND sb.staff_member_id = p_staff_member_id)
    )
    AND (
      -- Chevauchement direct
      (
        (p_scheduled_start_time::TIME < sb.scheduled_end_time::TIME AND
         p_scheduled_end_time::TIME > sb.scheduled_start_time::TIME)
      )
    );

  IF v_conflict_count > 0 THEN
    RETURN QUERY
    SELECT 
      TRUE,
      CASE 
        WHEN p_staff_member_id IS NOT NULL THEN 'staff_conflict'
        ELSE 'time_conflict'
      END,
      sb.id,
      CASE 
        WHEN p_staff_member_id IS NOT NULL THEN 
          'Le membre du personnel est déjà réservé pour ce créneau'
        ELSE 
          'Ce créneau est déjà réservé'
      END
    FROM public.service_bookings sb
    WHERE sb.product_id = p_product_id
      AND sb.scheduled_date = p_scheduled_date
      AND sb.status IN ('pending', 'confirmed', 'rescheduled')
      AND (p_exclude_booking_id IS NULL OR sb.id != p_exclude_booking_id)
      AND (
        (p_staff_member_id IS NULL) OR
        (p_staff_member_id IS NOT NULL AND sb.staff_member_id = p_staff_member_id)
      )
      AND (
        (p_scheduled_start_time::TIME < sb.scheduled_end_time::TIME AND
         p_scheduled_end_time::TIME > sb.scheduled_start_time::TIME)
      )
    LIMIT 1;
    RETURN;
  END IF;

  -- Vérifier conflits avec buffer_time si configuré
  IF v_service_product.id IS NOT NULL AND 
     (v_service_product.buffer_time_before > 0 OR v_service_product.buffer_time_after > 0) THEN
    
    SELECT EXISTS (
      SELECT 1
      FROM public.service_bookings sb
      WHERE sb.product_id = p_product_id
        AND sb.scheduled_date = p_scheduled_date
        AND sb.status IN ('pending', 'confirmed', 'rescheduled')
        AND (p_exclude_booking_id IS NULL OR sb.id != p_exclude_booking_id)
        AND (
          (p_staff_member_id IS NULL) OR
          (p_staff_member_id IS NOT NULL AND sb.staff_member_id = p_staff_member_id)
        )
        AND (
          -- Buffer avant
          (p_scheduled_start_time::TIME - (v_service_product.buffer_time_before || ' minutes')::INTERVAL) < sb.scheduled_end_time::TIME
          AND
          p_scheduled_start_time::TIME > (sb.scheduled_start_time::TIME - (v_service_product.buffer_time_before || ' minutes')::INTERVAL)
        )
        OR
        (
          -- Buffer après
          p_scheduled_end_time::TIME < (sb.scheduled_end_time::TIME + (v_service_product.buffer_time_after || ' minutes')::INTERVAL)
          AND
          (p_scheduled_end_time::TIME + (v_service_product.buffer_time_after || ' minutes')::INTERVAL) > sb.scheduled_start_time::TIME
        )
    ) INTO v_buffer_conflict;

    IF v_buffer_conflict THEN
      RETURN QUERY
      SELECT 
        TRUE,
        'buffer_conflict',
        sb.id,
        format(
          'Ce créneau n''est pas disponible en raison du temps de préparation nécessaire (%s min avant, %s min après)',
          COALESCE(v_service_product.buffer_time_before, 0),
          COALESCE(v_service_product.buffer_time_after, 0)
        )
      FROM public.service_bookings sb
      WHERE sb.product_id = p_product_id
        AND sb.scheduled_date = p_scheduled_date
        AND sb.status IN ('pending', 'confirmed', 'rescheduled')
        AND (p_exclude_booking_id IS NULL OR sb.id != p_exclude_booking_id)
        AND (
          (p_staff_member_id IS NULL) OR
          (p_staff_member_id IS NOT NULL AND sb.staff_member_id = p_staff_member_id)
        )
        AND (
          (p_scheduled_start_time::TIME - (v_service_product.buffer_time_before || ' minutes')::INTERVAL) < sb.scheduled_end_time::TIME
          AND p_scheduled_start_time::TIME > (sb.scheduled_start_time::TIME - (v_service_product.buffer_time_before || ' minutes')::INTERVAL)
        )
        OR
        (
          p_scheduled_end_time::TIME < (sb.scheduled_end_time::TIME + (v_service_product.buffer_time_after || ' minutes')::INTERVAL)
          AND (p_scheduled_end_time::TIME + (v_service_product.buffer_time_after || ' minutes')::INTERVAL) > sb.scheduled_start_time::TIME
        )
      LIMIT 1;
      RETURN;
    END IF;
  END IF;

  -- Pas de conflit
  RETURN QUERY
  SELECT FALSE, NULL::TEXT, NULL::UUID, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. FONCTION: Vérifier max_bookings_per_day
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_max_bookings_per_day(
  p_product_id UUID,
  p_scheduled_date DATE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_within_limit BOOLEAN,
  current_count INTEGER,
  max_allowed INTEGER,
  message TEXT
) AS $$
DECLARE
  v_max_bookings INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Récupérer max_bookings_per_day du service
  SELECT sp.max_bookings_per_day
  INTO v_max_bookings
  FROM public.service_products sp
  WHERE sp.product_id = p_product_id
  LIMIT 1;

  -- Si pas de limite, toujours autoriser
  IF v_max_bookings IS NULL THEN
    RETURN QUERY
    SELECT TRUE, 0, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;

  -- Compter les bookings existants pour cette date
  SELECT COUNT(*)
  INTO v_current_count
  FROM public.service_bookings sb
  WHERE sb.product_id = p_product_id
    AND sb.scheduled_date = p_scheduled_date
    AND sb.status IN ('pending', 'confirmed', 'rescheduled')
    AND (p_exclude_booking_id IS NULL OR sb.id != p_exclude_booking_id);

  -- Vérifier si dans la limite
  IF v_current_count >= v_max_bookings THEN
    RETURN QUERY
    SELECT 
      FALSE,
      v_current_count,
      v_max_bookings,
      format(
        'Le nombre maximum de réservations pour ce jour (%s) est atteint. Veuillez choisir une autre date.',
        v_max_bookings
      );
  ELSE
    RETURN QUERY
    SELECT 
      TRUE,
      v_current_count,
      v_max_bookings,
      NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. FONCTION: Vérifier advance_booking_days
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_advance_booking_days(
  p_product_id UUID,
  p_scheduled_date DATE
)
RETURNS TABLE (
  is_valid BOOLEAN,
  days_difference INTEGER,
  max_days_allowed INTEGER,
  message TEXT
) AS $$
DECLARE
  v_max_days INTEGER;
  v_days_diff INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Récupérer advance_booking_days du service
  SELECT sp.advance_booking_days
  INTO v_max_days
  FROM public.service_products sp
  WHERE sp.product_id = p_product_id
  LIMIT 1;

  -- Si pas de limite, toujours autoriser
  IF v_max_days IS NULL THEN
    RETURN QUERY
    SELECT TRUE, NULL::INTEGER, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;

  -- Calculer différence en jours
  v_days_diff := p_scheduled_date - v_today;

  -- Vérifier si dans le passé
  IF v_days_diff < 0 THEN
    RETURN QUERY
    SELECT 
      FALSE,
      v_days_diff,
      v_max_days,
      'Impossible de réserver une date dans le passé.';
    RETURN;
  END IF;

  -- Vérifier si dépasse la limite
  IF v_days_diff > v_max_days THEN
    RETURN QUERY
    SELECT 
      FALSE,
      v_days_diff,
      v_max_days,
      format(
        'Vous ne pouvez réserver que jusqu''à %s jours à l''avance. La date demandée est dans %s jours.',
        v_max_days,
        v_days_diff
      );
  ELSE
    RETURN QUERY
    SELECT 
      TRUE,
      v_days_diff,
      v_max_days,
      NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. COMMENTAIRES POUR DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION public.check_booking_conflicts IS 
  'Vérifie les conflits de réservation (temps et buffer) pour un créneau donné. Retourne les détails du conflit si présent.';

COMMENT ON FUNCTION public.check_max_bookings_per_day IS 
  'Vérifie si une réservation respecte la limite quotidienne (max_bookings_per_day) du service.';

COMMENT ON FUNCTION public.check_advance_booking_days IS 
  'Vérifie si une date de réservation respecte la limite advance_booking_days et n''est pas dans le passé.';



