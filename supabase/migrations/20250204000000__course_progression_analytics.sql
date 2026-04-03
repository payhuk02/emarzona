-- =====================================================
-- EMARZONA COURSE PROGRESSION ANALYTICS SYSTEM
-- Date: 4 Février 2025
-- Description: Système de tracking détaillé et analytics de progression pour cours
-- =====================================================

-- =====================================================
-- 1. TABLE: course_progression_snapshots
-- =====================================================
-- Snapshots quotidiens de progression pour analytics
CREATE TABLE IF NOT EXISTS public.course_progression_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  enrollment_id UUID,
  user_id UUID NOT NULL,
  
  -- Date du snapshot
  snapshot_date DATE NOT NULL,
  
  -- Métriques de progression
  progress_percentage NUMERIC(5, 2) DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  completed_sections INTEGER DEFAULT 0,
  total_sections INTEGER DEFAULT 0,
  
  -- Métriques de temps
  total_watch_time_minutes INTEGER DEFAULT 0,
  average_lesson_watch_time_minutes NUMERIC(5, 2) DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  days_since_enrollment INTEGER DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  
  -- Métriques de performance
  average_quiz_score NUMERIC(5, 2),
  quizzes_completed INTEGER DEFAULT 0,
  quizzes_passed INTEGER DEFAULT 0,
  assignments_submitted INTEGER DEFAULT 0,
  assignments_passed INTEGER DEFAULT 0,
  
  -- Métriques d'engagement
  notes_count INTEGER DEFAULT 0,
  forum_posts_count INTEGER DEFAULT 0,
  forum_replies_count INTEGER DEFAULT 0,
  
  -- Statut
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'dropped')) DEFAULT 'not_started',
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(course_id, enrollment_id, snapshot_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_progression_snapshots_course_id ON public.course_progression_snapshots(course_id);
CREATE INDEX IF NOT EXISTS idx_progression_snapshots_enrollment_id ON public.course_progression_snapshots(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_progression_snapshots_user_id ON public.course_progression_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_progression_snapshots_date ON public.course_progression_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_progression_snapshots_status ON public.course_progression_snapshots(status);

-- =====================================================
-- 2. TABLE: course_progression_analytics
-- =====================================================
-- Analytics agrégées par cours et par date
CREATE TABLE IF NOT EXISTS public.course_progression_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  
  -- Date de l'analytics
  analytics_date DATE NOT NULL,
  
  -- Métriques d'inscription
  total_enrollments INTEGER DEFAULT 0,
  active_enrollments INTEGER DEFAULT 0,
  completed_enrollments INTEGER DEFAULT 0,
  dropped_enrollments INTEGER DEFAULT 0,
  new_enrollments INTEGER DEFAULT 0,
  
  -- Métriques de progression moyenne
  average_progress NUMERIC(5, 2) DEFAULT 0,
  median_progress NUMERIC(5, 2) DEFAULT 0,
  average_completion_time_days INTEGER,
  median_completion_time_days INTEGER,
  
  -- Distribution de progression
  students_0_25_percent INTEGER DEFAULT 0,
  students_25_50_percent INTEGER DEFAULT 0,
  students_50_75_percent INTEGER DEFAULT 0,
  students_75_100_percent INTEGER DEFAULT 0,
  students_completed INTEGER DEFAULT 0,
  
  -- Métriques de temps
  average_watch_time_minutes NUMERIC(10, 2) DEFAULT 0,
  total_watch_time_minutes INTEGER DEFAULT 0,
  average_session_duration_minutes NUMERIC(5, 2) DEFAULT 0,
  
  -- Métriques de performance
  average_quiz_score NUMERIC(5, 2),
  average_assignment_score NUMERIC(5, 2),
  pass_rate NUMERIC(5, 2), -- Pourcentage de réussite
  
  -- Métriques d'engagement
  average_notes_per_student NUMERIC(5, 2) DEFAULT 0,
  total_forum_posts INTEGER DEFAULT 0,
  active_students_count INTEGER DEFAULT 0, -- Étudiants actifs dans les 7 derniers jours
  
  -- Métriques de rétention
  retention_rate_7d NUMERIC(5, 2), -- Taux de rétention 7 jours
  retention_rate_30d NUMERIC(5, 2), -- Taux de rétention 30 jours
  dropout_rate NUMERIC(5, 2), -- Taux d'abandon
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(course_id, analytics_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_progression_analytics_course_id ON public.course_progression_analytics(course_id);
CREATE INDEX IF NOT EXISTS idx_progression_analytics_date ON public.course_progression_analytics(analytics_date);

-- =====================================================
-- 3. TABLE: course_lesson_analytics
-- =====================================================
-- Analytics par leçon
CREATE TABLE IF NOT EXISTS public.course_lesson_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  
  -- Date de l'analytics
  analytics_date DATE NOT NULL,
  
  -- Métriques de vue
  total_views INTEGER DEFAULT 0,
  unique_students_viewed INTEGER DEFAULT 0,
  completion_rate NUMERIC(5, 2) DEFAULT 0, -- Pourcentage qui complète la leçon
  
  -- Métriques de temps
  average_watch_time_minutes NUMERIC(5, 2) DEFAULT 0,
  total_watch_time_minutes INTEGER DEFAULT 0,
  average_completion_time_minutes NUMERIC(5, 2) DEFAULT 0,
  
  -- Métriques d'engagement
  average_rewatches NUMERIC(3, 1) DEFAULT 0, -- Nombre moyen de fois qu'une leçon est revue
  notes_count INTEGER DEFAULT 0,
  
  -- Points de sortie (où les étudiants arrêtent de regarder)
  exit_points JSONB DEFAULT '[]'::jsonb, -- [{time_seconds: 120, count: 5}, ...]
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(lesson_id, analytics_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_analytics_course_id ON public.course_lesson_analytics(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_analytics_lesson_id ON public.course_lesson_analytics(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_analytics_date ON public.course_lesson_analytics(analytics_date);

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Fonction pour créer un snapshot de progression quotidien
CREATE OR REPLACE FUNCTION create_daily_progression_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment RECORD;
  v_course RECORD;
  v_progress_data RECORD;
  v_quiz_stats RECORD;
  v_assignment_stats RECORD;
  v_engagement_stats RECORD;
  v_snapshot_date DATE := CURRENT_DATE;
BEGIN
  -- Vérifier si les tables nécessaires existent
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_enrollments') THEN
    RETURN;
  END IF;
  
  -- Parcourir tous les enrollments actifs
  FOR v_enrollment IN
    SELECT 
      ce.*,
      c.id as course_id,
      c.total_lessons,
      (SELECT COUNT(*) FROM public.course_sections WHERE course_id = c.id) as total_sections
    FROM public.course_enrollments ce
    INNER JOIN public.courses c ON c.id = ce.course_id
    WHERE ce.status IN ('active', 'in_progress', 'completed')
  LOOP
    -- Calculer les métriques de progression
    SELECT 
      COUNT(*) FILTER (WHERE is_completed = true) as completed_lessons,
      SUM(watch_time_seconds) / 60 as total_watch_time_minutes,
      AVG(watch_time_seconds) FILTER (WHERE is_completed = true) / 60 as avg_lesson_watch_time,
      MAX(updated_at) as last_activity
    INTO v_progress_data
    FROM public.course_lesson_progress
    WHERE enrollment_id = v_enrollment.id;
    
    -- Calculer les sections complétées
    SELECT COUNT(DISTINCT cs.id) as completed_sections
    INTO v_progress_data
    FROM public.course_sections cs
    INNER JOIN public.course_lessons cl ON cl.section_id = cs.id
    INNER JOIN public.course_lesson_progress clp ON clp.lesson_id = cl.id
    WHERE cs.course_id = v_enrollment.course_id
      AND clp.enrollment_id = v_enrollment.id
      AND clp.is_completed = true;
    
    -- Calculer les stats de quiz (si la table existe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_attempts') THEN
      SELECT 
        COUNT(*) as quizzes_completed,
        COUNT(*) FILTER (WHERE passed = true) as quizzes_passed,
        AVG(score) as avg_quiz_score
      INTO v_quiz_stats
      FROM public.quiz_attempts
      WHERE enrollment_id = v_enrollment.id;
    ELSE
      v_quiz_stats.quizzes_completed := 0;
      v_quiz_stats.quizzes_passed := 0;
      v_quiz_stats.avg_quiz_score := NULL;
    END IF;
    
    -- Calculer les stats d'engagement (notes, forum)
    SELECT 
      COUNT(*) FILTER (WHERE personal_notes IS NOT NULL AND personal_notes != '') as notes_count
    INTO v_engagement_stats
    FROM public.course_lesson_progress
    WHERE enrollment_id = v_enrollment.id;
    
    -- Calculer jours depuis inscription et jours actifs
    SELECT 
      EXTRACT(DAY FROM (CURRENT_DATE - DATE(v_enrollment.enrolled_at)))::INTEGER as days_since_enrollment,
      COUNT(DISTINCT DATE(clp.updated_at)) as days_active
    INTO v_engagement_stats
    FROM public.course_lesson_progress clp
    WHERE clp.enrollment_id = v_enrollment.id;
    
    -- Insérer ou mettre à jour le snapshot
    INSERT INTO public.course_progression_snapshots (
      course_id,
      enrollment_id,
      user_id,
      snapshot_date,
      progress_percentage,
      completed_lessons,
      total_lessons,
      completed_sections,
      total_sections,
      total_watch_time_minutes,
      average_lesson_watch_time_minutes,
      last_activity_at,
      days_since_enrollment,
      days_active,
      average_quiz_score,
      quizzes_completed,
      quizzes_passed,
      notes_count,
      status
    ) VALUES (
      v_enrollment.course_id,
      v_enrollment.id,
      v_enrollment.user_id,
      v_snapshot_date,
      v_enrollment.progress_percentage,
      COALESCE(v_progress_data.completed_lessons, 0),
      v_enrollment.total_lessons,
      COALESCE(v_progress_data.completed_sections, 0),
      v_enrollment.total_sections,
      COALESCE(v_progress_data.total_watch_time_minutes, 0),
      COALESCE(v_progress_data.avg_lesson_watch_time, 0),
      COALESCE(v_progress_data.last_activity, v_enrollment.updated_at),
      COALESCE(v_engagement_stats.days_since_enrollment, 0),
      COALESCE(v_engagement_stats.days_active, 0),
      v_quiz_stats.avg_quiz_score,
      COALESCE(v_quiz_stats.quizzes_completed, 0),
      COALESCE(v_quiz_stats.quizzes_passed, 0),
      COALESCE(v_engagement_stats.notes_count, 0),
      v_enrollment.status
    )
    ON CONFLICT (course_id, enrollment_id, snapshot_date)
    DO UPDATE SET
      progress_percentage = EXCLUDED.progress_percentage,
      completed_lessons = EXCLUDED.completed_lessons,
      total_lessons = EXCLUDED.total_lessons,
      completed_sections = EXCLUDED.completed_sections,
      total_sections = EXCLUDED.total_sections,
      total_watch_time_minutes = EXCLUDED.total_watch_time_minutes,
      average_lesson_watch_time_minutes = EXCLUDED.average_lesson_watch_time_minutes,
      last_activity_at = EXCLUDED.last_activity_at,
      days_since_enrollment = EXCLUDED.days_since_enrollment,
      days_active = EXCLUDED.days_active,
      average_quiz_score = EXCLUDED.average_quiz_score,
      quizzes_completed = EXCLUDED.quizzes_completed,
      quizzes_passed = EXCLUDED.quizzes_passed,
      notes_count = EXCLUDED.notes_count,
      status = EXCLUDED.status;
  END LOOP;
END;
$$;

-- Fonction pour calculer les analytics agrégées d'un cours
CREATE OR REPLACE FUNCTION calculate_course_progression_analytics(p_course_id UUID, p_analytics_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshots RECORD;
  v_analytics RECORD;
BEGIN
  -- Vérifier si les tables nécessaires existent
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_progression_snapshots') THEN
    RETURN;
  END IF;
  
  -- Calculer les métriques agrégées depuis les snapshots du jour
  SELECT 
    COUNT(*) as total_enrollments,
    COUNT(*) FILTER (WHERE status = 'active' OR status = 'in_progress') as active_enrollments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_enrollments,
    COUNT(*) FILTER (WHERE status = 'dropped') as dropped_enrollments,
    AVG(progress_percentage) as avg_progress,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY progress_percentage) as median_progress,
    AVG(total_watch_time_minutes) as avg_watch_time,
    SUM(total_watch_time_minutes) as total_watch_time,
    AVG(average_quiz_score) as avg_quiz_score,
    COUNT(*) FILTER (WHERE progress_percentage < 25) as students_0_25,
    COUNT(*) FILTER (WHERE progress_percentage >= 25 AND progress_percentage < 50) as students_25_50,
    COUNT(*) FILTER (WHERE progress_percentage >= 50 AND progress_percentage < 75) as students_50_75,
    COUNT(*) FILTER (WHERE progress_percentage >= 75 AND progress_percentage < 100) as students_75_100,
    COUNT(*) FILTER (WHERE progress_percentage = 100) as students_completed,
    AVG(notes_count) as avg_notes
  INTO v_analytics
  FROM public.course_progression_snapshots
  WHERE course_id = p_course_id
    AND snapshot_date = p_analytics_date;
  
  -- Insérer ou mettre à jour les analytics
  INSERT INTO public.course_progression_analytics (
    course_id,
    analytics_date,
    total_enrollments,
    active_enrollments,
    completed_enrollments,
    dropped_enrollments,
    average_progress,
    median_progress,
    average_watch_time_minutes,
    total_watch_time_minutes,
    average_quiz_score,
    students_0_25_percent,
    students_25_50_percent,
    students_50_75_percent,
    students_75_100_percent,
    students_completed,
    average_notes_per_student
  ) VALUES (
    p_course_id,
    p_analytics_date,
    COALESCE(v_analytics.total_enrollments, 0),
    COALESCE(v_analytics.active_enrollments, 0),
    COALESCE(v_analytics.completed_enrollments, 0),
    COALESCE(v_analytics.dropped_enrollments, 0),
    COALESCE(v_analytics.avg_progress, 0),
    COALESCE(v_analytics.median_progress, 0),
    COALESCE(v_analytics.avg_watch_time, 0),
    COALESCE(v_analytics.total_watch_time, 0),
    v_analytics.avg_quiz_score,
    COALESCE(v_analytics.students_0_25, 0),
    COALESCE(v_analytics.students_25_50, 0),
    COALESCE(v_analytics.students_50_75, 0),
    COALESCE(v_analytics.students_75_100, 0),
    COALESCE(v_analytics.students_completed, 0),
    COALESCE(v_analytics.avg_notes, 0)
  )
  ON CONFLICT (course_id, analytics_date)
  DO UPDATE SET
    total_enrollments = EXCLUDED.total_enrollments,
    active_enrollments = EXCLUDED.active_enrollments,
    completed_enrollments = EXCLUDED.completed_enrollments,
    dropped_enrollments = EXCLUDED.dropped_enrollments,
    average_progress = EXCLUDED.average_progress,
    median_progress = EXCLUDED.median_progress,
    average_watch_time_minutes = EXCLUDED.average_watch_time_minutes,
    total_watch_time_minutes = EXCLUDED.total_watch_time_minutes,
    average_quiz_score = EXCLUDED.average_quiz_score,
    students_0_25_percent = EXCLUDED.students_0_25_percent,
    students_25_50_percent = EXCLUDED.students_25_50_percent,
    students_50_75_percent = EXCLUDED.students_50_75_percent,
    students_75_100_percent = EXCLUDED.students_75_100_percent,
    students_completed = EXCLUDED.students_completed,
    average_notes_per_student = EXCLUDED.average_notes_per_student;
END;
$$;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE public.course_progression_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progression_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lesson_analytics ENABLE ROW LEVEL SECURITY;

-- Créer les RLS policies seulement si les tables nécessaires existent
DO $$ 
BEGIN
  -- Users can view their own progression snapshots
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'course_progression_snapshots'
    AND policyname = 'Users can view their own progression snapshots'
  ) THEN
    EXECUTE '
      CREATE POLICY "Users can view their own progression snapshots"
        ON public.course_progression_snapshots
        FOR SELECT
        USING (auth.uid() = user_id)';
  END IF;

  -- Store owners can view analytics for their courses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'course_progression_analytics'
      AND policyname = 'Store owners can view course progression analytics'
    ) THEN
      EXECUTE '
        CREATE POLICY "Store owners can view course progression analytics"
          ON public.course_progression_analytics
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.courses c
              INNER JOIN public.products p ON p.id = c.product_id
              INNER JOIN public.stores s ON s.id = p.store_id
              WHERE c.id = course_progression_analytics.course_id
              AND (s.user_id = auth.uid() OR s.owner_id = auth.uid())
            )
          )';
    END IF;
  END IF;

  -- Store owners can view lesson analytics for their courses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_lessons') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'course_lesson_analytics'
      AND policyname = 'Store owners can view lesson analytics'
    ) THEN
      EXECUTE '
        CREATE POLICY "Store owners can view lesson analytics"
          ON public.course_lesson_analytics
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.course_lessons cl
              INNER JOIN public.courses c ON c.id = cl.course_id
              INNER JOIN public.products p ON p.id = c.product_id
              INNER JOIN public.stores s ON s.id = p.store_id
              WHERE cl.id = course_lesson_analytics.lesson_id
              AND (s.user_id = auth.uid() OR s.owner_id = auth.uid())
            )
          )';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE public.course_progression_snapshots IS 'Snapshots quotidiens de progression des étudiants';
COMMENT ON TABLE public.course_progression_analytics IS 'Analytics agrégées de progression par cours';
COMMENT ON TABLE public.course_lesson_analytics IS 'Analytics détaillées par leçon';
COMMENT ON FUNCTION create_daily_progression_snapshot IS 'Crée un snapshot quotidien de progression pour tous les enrollments actifs';
COMMENT ON FUNCTION calculate_course_progression_analytics IS 'Calcule les analytics agrégées d''un cours pour une date donnée';

