-- =========================================================
-- Migration : Système de Cohorts Avancé pour Cours (CORRIGÉE)
-- Date : 31 Janvier 2025
-- Description : Gestion avancée des cohorts avec analytics et progression
-- =========================================================

-- ============================================================
-- 1. TABLE: course_cohorts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.course_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Informations cohort
  cohort_name TEXT NOT NULL,
  cohort_slug TEXT NOT NULL,
  cohort_description TEXT,
  cohort_number INTEGER, -- Numéro de cohort (1, 2, 3, etc.)
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  enrollment_start_date DATE,
  enrollment_end_date DATE,
  
  -- Capacité
  max_students INTEGER,
  current_students INTEGER DEFAULT 0,
  waitlist_enabled BOOLEAN DEFAULT false,
  waitlist_capacity INTEGER DEFAULT 0,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Brouillon
    'open',            -- Inscriptions ouvertes
    'full',            -- Complet
    'in_progress',     -- En cours
    'completed',       -- Terminé
    'cancelled'        -- Annulé
  )),
  
  -- Options
  is_public BOOLEAN DEFAULT true, -- Visible publiquement
  allow_late_enrollment BOOLEAN DEFAULT false, -- Inscriptions tardives
  auto_start BOOLEAN DEFAULT true, -- Démarrage automatique à la date de début
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(course_id, cohort_slug),
  CHECK (end_date IS NULL OR end_date >= start_date),
  CHECK (enrollment_end_date IS NULL OR enrollment_end_date >= enrollment_start_date)
);

-- ============================================================
-- 2. TABLE: cohort_enrollments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cohort_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.course_cohorts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Statut
  enrollment_status TEXT NOT NULL DEFAULT 'pending' CHECK (enrollment_status IN (
    'pending',         -- En attente
    'confirmed',       -- Confirmé
    'active',          -- Actif
    'completed',       -- Terminé
    'dropped',         -- Abandonné
    'cancelled'        -- Annulé
  )),
  
  -- Dates
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  dropped_at TIMESTAMPTZ,
  
  -- Progression
  progress_percentage NUMERIC(5, 2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_accessed_at TIMESTAMPTZ,
  
  -- Notes et évaluations
  final_grade NUMERIC(5, 2),
  certificate_issued BOOLEAN DEFAULT false,
  certificate_issued_at TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(cohort_id, student_id)
);

-- ============================================================
-- 3. TABLE: cohort_analytics
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cohort_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.course_cohorts(id) ON DELETE CASCADE,
  
  -- Date de l'analytics
  analytics_date DATE NOT NULL,
  
  -- Métriques d'inscription
  total_enrollments INTEGER DEFAULT 0,
  active_enrollments INTEGER DEFAULT 0,
  completed_enrollments INTEGER DEFAULT 0,
  dropped_enrollments INTEGER DEFAULT 0,
  
  -- Métriques de progression
  average_progress NUMERIC(5, 2) DEFAULT 0,
  median_progress NUMERIC(5, 2) DEFAULT 0,
  students_completed INTEGER DEFAULT 0,
  students_in_progress INTEGER DEFAULT 0,
  students_not_started INTEGER DEFAULT 0,
  
  -- Métriques d'engagement
  average_time_spent_minutes INTEGER DEFAULT 0,
  total_lessons_completed INTEGER DEFAULT 0,
  total_assignments_submitted INTEGER DEFAULT 0,
  total_quizzes_completed INTEGER DEFAULT 0,
  
  -- Métriques de performance
  average_grade NUMERIC(5, 2),
  median_grade NUMERIC(5, 2),
  pass_rate NUMERIC(5, 2), -- Pourcentage de réussite
  
  -- Métriques de rétention
  retention_rate NUMERIC(5, 2), -- Taux de rétention
  dropout_rate NUMERIC(5, 2), -- Taux d'abandon
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(cohort_id, analytics_date)
);

-- ============================================================
-- 4. TABLE: cohort_progress_snapshots
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cohort_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.course_cohorts(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.cohort_enrollments(id) ON DELETE CASCADE,
  
  -- Date du snapshot
  snapshot_date DATE NOT NULL,
  
  -- Progression
  progress_percentage NUMERIC(5, 2) DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  assignments_submitted INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  
  -- Temps
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Notes
  current_grade NUMERIC(5, 2),
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(enrollment_id, snapshot_date)
);

-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cohorts_course_id ON public.course_cohorts(course_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_store_id ON public.course_cohorts(store_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON public.course_cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_start_date ON public.course_cohorts(start_date);
CREATE INDEX IF NOT EXISTS idx_cohorts_slug ON public.course_cohorts(cohort_slug);

CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON public.cohort_enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.cohort_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.cohort_enrollments(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_progress ON public.cohort_enrollments(progress_percentage);

CREATE INDEX IF NOT EXISTS idx_analytics_cohort_id ON public.cohort_analytics(cohort_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.cohort_analytics(analytics_date DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_cohort_id ON public.cohort_progress_snapshots(cohort_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_enrollment_id ON public.cohort_progress_snapshots(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON public.cohort_progress_snapshots(snapshot_date DESC);

-- ============================================================
-- 6. FUNCTIONS
-- ============================================================

-- Fonction pour calculer les analytics d'une cohort
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

-- Fonction pour mettre à jour le nombre d'étudiants d'une cohort
CREATE OR REPLACE FUNCTION public.update_cohort_student_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.course_cohorts
  SET current_students = (
    SELECT COUNT(*)
    FROM public.cohort_enrollments
    WHERE cohort_id = NEW.cohort_id
    AND enrollment_status IN ('confirmed', 'active', 'completed')
  )
  WHERE id = NEW.cohort_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

-- Trigger pour updated_at (vérifier que les tables existent d'abord)
DO $$
BEGIN
  -- Vérifier que course_cohorts existe avant de créer le trigger
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
  
  -- Vérifier que cohort_enrollments existe avant de créer les triggers
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
END $$;

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

-- Activer RLS seulement si les tables existent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_cohorts') THEN
    ALTER TABLE public.course_cohorts ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cohort_enrollments') THEN
    ALTER TABLE public.cohort_enrollments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cohort_analytics') THEN
    ALTER TABLE public.cohort_analytics ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cohort_progress_snapshots') THEN
    ALTER TABLE public.cohort_progress_snapshots ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Cohorts : Lecture publique pour les cohorts publics
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_cohorts') THEN
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
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cohort_enrollments') THEN
    DROP POLICY IF EXISTS "Users can view their enrollments" ON public.cohort_enrollments;
    CREATE POLICY "Users can view their enrollments"
    ON public.cohort_enrollments FOR SELECT
    USING (student_id = auth.uid());
    
    DROP POLICY IF EXISTS "Users can create enrollments" ON public.cohort_enrollments;
    CREATE POLICY "Users can create enrollments"
    ON public.cohort_enrollments FOR INSERT
    WITH CHECK (student_id = auth.uid());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cohort_analytics') THEN
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
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cohort_progress_snapshots') THEN
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

-- ============================================================
-- 9. COMMENTS
-- ============================================================

COMMENT ON TABLE public.course_cohorts IS 'Cohorts de cours avec gestion avancée';
COMMENT ON TABLE public.cohort_enrollments IS 'Inscriptions aux cohorts';
COMMENT ON TABLE public.cohort_analytics IS 'Analytics par cohort';
COMMENT ON TABLE public.cohort_progress_snapshots IS 'Snapshots de progression par cohort';

