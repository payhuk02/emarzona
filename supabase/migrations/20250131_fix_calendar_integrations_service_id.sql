-- =========================================================
-- Migration : Correction service_id dans service_calendar_integrations
-- Date : 31 Janvier 2025
-- Description : Correction des références à service_id dans service_bookings
-- =========================================================

-- Recréer la fonction create_calendar_event avec la bonne référence
CREATE OR REPLACE FUNCTION public.create_calendar_event(
  p_integration_id UUID,
  p_booking_id UUID,
  p_event_title TEXT,
  p_event_description TEXT,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_location TEXT DEFAULT NULL,
  p_attendees JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_integration public.service_calendar_integrations%ROWTYPE;
BEGIN
  -- Récupérer l'intégration
  SELECT * INTO v_integration
  FROM public.service_calendar_integrations
  WHERE id = p_integration_id
  AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intégration calendrier non trouvée ou inactive';
  END IF;
  
  -- Note: La création réelle dans le calendrier externe se fait côté application
  -- Cette fonction crée uniquement l'enregistrement local
  
  INSERT INTO public.service_calendar_events (
    integration_id,
    booking_id,
    service_id,
    external_event_id,
    external_calendar_id,
    event_title,
    event_description,
    event_start_time,
    event_end_time,
    event_location,
    sync_status,
    sync_direction
  ) VALUES (
    p_integration_id,
    p_booking_id,
    (SELECT product_id FROM public.service_bookings WHERE id = p_booking_id),
    'pending-' || gen_random_uuid()::TEXT,
    v_integration.calendar_id,
    p_event_title,
    p_event_description,
    p_start_time,
    p_end_time,
    p_location,
    'pending',
    'export'
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer la fonction detect_calendar_conflicts avec les bonnes références
CREATE OR REPLACE FUNCTION public.detect_calendar_conflicts(
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflict_type TEXT,
  conflict_event_id UUID,
  conflict_start_time TIMESTAMPTZ,
  conflict_end_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'booking'::TEXT,
    b.id,
    (b.scheduled_date + b.scheduled_start_time)::TIMESTAMPTZ,
    (b.scheduled_date + b.scheduled_end_time)::TIMESTAMPTZ
  FROM public.service_bookings b
  WHERE b.product_id = p_service_id
  AND b.status IN ('confirmed', 'pending')
  AND b.id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::UUID)
  AND (
    ((b.scheduled_date + b.scheduled_start_time)::TIMESTAMPTZ <= p_start_time AND (b.scheduled_date + b.scheduled_end_time)::TIMESTAMPTZ > p_start_time) OR
    ((b.scheduled_date + b.scheduled_start_time)::TIMESTAMPTZ < p_end_time AND (b.scheduled_date + b.scheduled_end_time)::TIMESTAMPTZ >= p_end_time) OR
    ((b.scheduled_date + b.scheduled_start_time)::TIMESTAMPTZ >= p_start_time AND (b.scheduled_date + b.scheduled_end_time)::TIMESTAMPTZ <= p_end_time)
  )
  
  UNION ALL
  
  SELECT
    'calendar_event'::TEXT,
    e.id,
    e.event_start_time,
    e.event_end_time
  FROM public.service_calendar_events e
  WHERE e.service_id = p_service_id
  AND e.sync_status = 'synced'
  AND (
    (e.event_start_time <= p_start_time AND e.event_end_time > p_start_time) OR
    (e.event_start_time < p_end_time AND e.event_end_time >= p_end_time) OR
    (e.event_start_time >= p_start_time AND e.event_end_time <= p_end_time)
  );
END;
$$ LANGUAGE plpgsql;

