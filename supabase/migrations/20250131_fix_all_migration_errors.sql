-- =========================================================
-- Migration : Correction finale de toutes les erreurs de migration
-- Date : 31 Janvier 2025
-- Description : Corrige toutes les erreurs identifiées dans les migrations
-- =========================================================

-- ============================================================
-- 1. Corriger les fonctions (s'assurer qu'elles sont correctes)
-- ============================================================

-- Fonction create_calendar_event
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

-- Fonction detect_calendar_conflicts
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

-- ============================================================
-- 2. S'assurer que tous les triggers existent correctement
-- ============================================================

DO $$
BEGIN
  -- Triggers pour service_calendar_integrations
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_calendar_integrations_updated_at'
  ) THEN
    CREATE TRIGGER update_calendar_integrations_updated_at
      BEFORE UPDATE ON public.service_calendar_integrations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_calendar_events_updated_at'
  ) THEN
    CREATE TRIGGER update_calendar_events_updated_at
      BEFORE UPDATE ON public.service_calendar_events
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  -- Triggers pour course_cohorts (vérifier que les tables existent d'abord)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'course_cohorts'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_cohorts_updated_at'
    ) THEN
      CREATE TRIGGER update_cohorts_updated_at
        BEFORE UPDATE ON public.course_cohorts
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cohort_enrollments'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_enrollments_updated_at'
    ) THEN
      CREATE TRIGGER update_enrollments_updated_at
        BEFORE UPDATE ON public.cohort_enrollments
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_cohort_student_count_trigger'
    ) THEN
      CREATE TRIGGER update_cohort_student_count_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public.cohort_enrollments
        FOR EACH ROW
        EXECUTE FUNCTION update_cohort_student_count();
    END IF;
  END IF;
END $$;

-- ============================================================
-- 3. S'assurer que toutes les politiques RLS existent correctement
-- ============================================================

-- Service Calendar Integrations Policies (vérifier que la table existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_calendar_integrations'
  ) THEN
    DROP POLICY IF EXISTS "Store owners can manage their calendar integrations" ON public.service_calendar_integrations;
    CREATE POLICY "Store owners can manage their calendar integrations"
    ON public.service_calendar_integrations FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = service_calendar_integrations.store_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_calendar_events'
  ) THEN
    DROP POLICY IF EXISTS "Store owners can view their calendar events" ON public.service_calendar_events;
    CREATE POLICY "Store owners can view their calendar events"
    ON public.service_calendar_events FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.service_calendar_integrations
        JOIN public.stores ON stores.id = service_calendar_integrations.store_id
        WHERE service_calendar_integrations.id = service_calendar_events.integration_id
        AND stores.user_id = auth.uid()
      )
    );
    
    DROP POLICY IF EXISTS "Store owners can manage their calendar events" ON public.service_calendar_events;
    CREATE POLICY "Store owners can manage their calendar events"
    ON public.service_calendar_events FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.service_calendar_integrations
        JOIN public.stores ON stores.id = service_calendar_integrations.store_id
        WHERE service_calendar_integrations.id = service_calendar_events.integration_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_calendar_sync_logs'
  ) THEN
    DROP POLICY IF EXISTS "Store owners can view their sync logs" ON public.service_calendar_sync_logs;
    CREATE POLICY "Store owners can view their sync logs"
    ON public.service_calendar_sync_logs FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.service_calendar_integrations
        JOIN public.stores ON stores.id = service_calendar_integrations.store_id
        WHERE service_calendar_integrations.id = service_calendar_sync_logs.integration_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
  
  -- Course Cohorts Policies (vérifier que les tables existent)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'course_cohorts'
  ) THEN
    DROP POLICY IF EXISTS "Public can view public cohorts" ON public.course_cohorts;
    CREATE POLICY "Public can view public cohorts"
    ON public.course_cohorts FOR SELECT
    USING (is_public = true OR status IN ('open', 'in_progress'));
    
    DROP POLICY IF EXISTS "Store owners can manage their cohorts" ON public.course_cohorts;
    CREATE POLICY "Store owners can manage their cohorts"
    ON public.course_cohorts FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = course_cohorts.store_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cohort_enrollments'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their enrollments" ON public.cohort_enrollments;
    CREATE POLICY "Users can view their enrollments"
    ON public.cohort_enrollments FOR SELECT
    USING (student_id = auth.uid());
    
    DROP POLICY IF EXISTS "Users can create enrollments" ON public.cohort_enrollments;
    CREATE POLICY "Users can create enrollments"
    ON public.cohort_enrollments FOR INSERT
    WITH CHECK (student_id = auth.uid());
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cohort_analytics'
  ) THEN
    DROP POLICY IF EXISTS "Store owners can view cohort analytics" ON public.cohort_analytics;
    CREATE POLICY "Store owners can view cohort analytics"
    ON public.cohort_analytics FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.course_cohorts
        JOIN public.stores ON stores.id = course_cohorts.store_id
        WHERE course_cohorts.id = cohort_analytics.cohort_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cohort_progress_snapshots'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their progress snapshots" ON public.cohort_progress_snapshots;
    CREATE POLICY "Users can view their progress snapshots"
    ON public.cohort_progress_snapshots FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.cohort_enrollments
        WHERE cohort_enrollments.id = cohort_progress_snapshots.enrollment_id
        AND cohort_enrollments.student_id = auth.uid()
      )
    );
  END IF;
END $$;

