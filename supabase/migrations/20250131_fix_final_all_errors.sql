-- =========================================================
-- Migration : Correction finale de toutes les erreurs
-- Date : 31 Janvier 2025
-- Description : Corrige toutes les erreurs restantes
-- =========================================================

-- ============================================================
-- 1. Vérifier et corriger les fonctions si nécessaire
-- ============================================================

-- Fonction update_cohort_student_count (s'assurer qu'elle est correcte)
CREATE OR REPLACE FUNCTION public.update_cohort_student_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que la table course_cohorts existe avant de mettre à jour
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'course_cohorts'
  ) THEN
    UPDATE public.course_cohorts
    SET current_students = (
      SELECT COUNT(*)
      FROM public.cohort_enrollments
      WHERE cohort_id = NEW.cohort_id
      AND enrollment_status IN ('confirmed', 'active', 'completed')
    )
    WHERE id = NEW.cohort_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction calculate_cohort_analytics (s'assurer qu'elle est correcte)
CREATE OR REPLACE FUNCTION public.calculate_cohort_analytics(p_cohort_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
  v_analytics_id UUID;
  v_total_enrollments INTEGER;
  v_active_enrollments INTEGER;
  v_completed_enrollments INTEGER;
  v_dropped_enrollments INTEGER;
  v_avg_progress NUMERIC;
  v_median_progress NUMERIC;
  v_avg_grade NUMERIC;
  v_median_grade NUMERIC;
BEGIN
  -- Vérifier que les tables existent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cohort_enrollments'
  ) THEN
    RAISE EXCEPTION 'Table cohort_enrollments does not exist';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cohort_analytics'
  ) THEN
    RAISE EXCEPTION 'Table cohort_analytics does not exist';
  END IF;
  
  -- Compter les inscriptions
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE enrollment_status = 'active')::INTEGER,
    COUNT(*) FILTER (WHERE enrollment_status = 'completed')::INTEGER,
    COUNT(*) FILTER (WHERE enrollment_status = 'dropped')::INTEGER
  INTO v_total_enrollments, v_active_enrollments, v_completed_enrollments, v_dropped_enrollments
  FROM public.cohort_enrollments
  WHERE cohort_id = p_cohort_id;
  
  -- Calculer la progression moyenne et médiane
  SELECT 
    COALESCE(AVG(progress_percentage), 0),
    COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY progress_percentage), 0)
  INTO v_avg_progress, v_median_progress
  FROM public.cohort_enrollments
  WHERE cohort_id = p_cohort_id
  AND enrollment_status IN ('active', 'completed');
  
  -- Calculer les notes moyennes et médianes
  SELECT 
    COALESCE(AVG(final_grade), 0),
    COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY final_grade), 0)
  INTO v_avg_grade, v_median_grade
  FROM public.cohort_enrollments
  WHERE cohort_id = p_cohort_id
  AND enrollment_status = 'completed'
  AND final_grade IS NOT NULL;
  
  -- Insérer ou mettre à jour les analytics
  INSERT INTO public.cohort_analytics (
    cohort_id,
    analytics_date,
    total_enrollments,
    active_enrollments,
    completed_enrollments,
    dropped_enrollments,
    average_progress,
    median_progress,
    average_grade,
    median_grade,
    pass_rate,
    retention_rate
  ) VALUES (
    p_cohort_id,
    p_date,
    v_total_enrollments,
    v_active_enrollments,
    v_completed_enrollments,
    v_dropped_enrollments,
    v_avg_progress,
    v_median_progress,
    v_avg_grade,
    v_median_grade,
    CASE 
      WHEN v_total_enrollments > 0 
      THEN (v_completed_enrollments::NUMERIC / v_total_enrollments::NUMERIC) * 100
      ELSE 0
    END,
    CASE 
      WHEN v_total_enrollments > 0 
      THEN ((v_total_enrollments - v_dropped_enrollments)::NUMERIC / v_total_enrollments::NUMERIC) * 100
      ELSE 0
    END
  )
  ON CONFLICT (cohort_id, analytics_date)
  DO UPDATE SET
    total_enrollments = EXCLUDED.total_enrollments,
    active_enrollments = EXCLUDED.active_enrollments,
    completed_enrollments = EXCLUDED.completed_enrollments,
    dropped_enrollments = EXCLUDED.dropped_enrollments,
    average_progress = EXCLUDED.average_progress,
    median_progress = EXCLUDED.median_progress,
    average_grade = EXCLUDED.average_grade,
    median_grade = EXCLUDED.median_grade,
    pass_rate = EXCLUDED.pass_rate,
    retention_rate = EXCLUDED.retention_rate
  RETURNING id INTO v_analytics_id;
  
  RETURN v_analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. S'assurer que tous les triggers sont créés correctement
-- ============================================================

DO $$
BEGIN
  -- Triggers pour course_cohorts
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
  
  -- Triggers pour cohort_enrollments
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
        EXECUTE FUNCTION public.update_cohort_student_count();
    END IF;
  END IF;
  
  -- Triggers pour service_calendar_integrations
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_calendar_integrations'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_calendar_integrations_updated_at'
    ) THEN
      CREATE TRIGGER update_calendar_integrations_updated_at
        BEFORE UPDATE ON public.service_calendar_integrations
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
  
  -- Triggers pour service_calendar_events
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_calendar_events'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_calendar_events_updated_at'
    ) THEN
      CREATE TRIGGER update_calendar_events_updated_at
        BEFORE UPDATE ON public.service_calendar_events
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
END $$;

-- ============================================================
-- 3. S'assurer que toutes les politiques RLS sont correctes
-- ============================================================

-- Les politiques sont déjà gérées dans les migrations principales
-- Cette section est pour référence uniquement

