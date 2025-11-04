-- =====================================================
-- PAYHUK COURSES ASSIGNMENTS SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système complet de devoirs/assignments pour cours en ligne
--              Avec upload fichiers, notation, feedback
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: course_assignments
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_assignments'
  ) THEN
    CREATE TABLE public.course_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      section_id UUID REFERENCES public.course_sections(id) ON DELETE SET NULL,
      
      -- Informations devoir
      title TEXT NOT NULL,
      description TEXT,
      instructions TEXT,
      
      -- Type de soumission
      assignment_type TEXT NOT NULL CHECK (assignment_type IN ('file_upload', 'text', 'url', 'code', 'mixed')) DEFAULT 'text',
      
      -- Fichiers
      max_file_size INTEGER DEFAULT 10485760, -- 10MB par défaut
      allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'txt', 'zip', 'jpg', 'png'],
      max_files INTEGER DEFAULT 5,
      
      -- Évaluation
      points_possible INTEGER DEFAULT 100 CHECK (points_possible >= 0),
      grading_type TEXT CHECK (grading_type IN ('points', 'percentage', 'letter', 'pass_fail')) DEFAULT 'points',
      
      -- Échéances
      due_date TIMESTAMPTZ,
      allow_late_submission BOOLEAN DEFAULT true,
      late_penalty_percentage INTEGER DEFAULT 10 CHECK (late_penalty_percentage >= 0 AND late_penalty_percentage <= 100),
      
      -- Réglages
      is_required BOOLEAN DEFAULT true,
      is_visible BOOLEAN DEFAULT true,
      order_index INTEGER DEFAULT 0,
      
      -- Rubrique (critères d'évaluation)
      rubric JSONB DEFAULT '[]', -- [{criterion: string, points: number, description?: string}]
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_assignments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_assignments_course_id'
  ) THEN
    CREATE INDEX idx_course_assignments_course_id ON public.course_assignments(course_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_assignments_section_id'
  ) THEN
    CREATE INDEX idx_course_assignments_section_id ON public.course_assignments(section_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_assignments_due_date'
  ) THEN
    CREATE INDEX idx_course_assignments_due_date ON public.course_assignments(due_date);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_course_assignments_updated_at'
  ) THEN
    CREATE TRIGGER update_course_assignments_updated_at
      BEFORE UPDATE ON public.course_assignments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: course_assignment_submissions
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_assignment_submissions'
  ) THEN
    CREATE TABLE public.course_assignment_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assignment_id UUID NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Soumission
      submission_text TEXT,
      submission_files JSONB DEFAULT '[]', -- [{url: string, name: string, size: number, type: string}]
      submission_url TEXT,
      submission_code TEXT, -- Pour code assignments
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'resubmitted')) DEFAULT 'draft',
      
      -- Dates
      submitted_at TIMESTAMPTZ,
      graded_at TIMESTAMPTZ,
      returned_at TIMESTAMPTZ,
      
      -- Notation
      grade INTEGER, -- Points obtenus
      grade_percentage NUMERIC, -- Pourcentage
      grade_letter TEXT, -- A, B, C, etc.
      is_passed BOOLEAN, -- Pour pass/fail
      
      -- Feedback
      feedback TEXT,
      feedback_files JSONB DEFAULT '[]', -- Fichiers de feedback de l'instructeur
      rubric_scores JSONB DEFAULT '{}', -- Scores par critère de rubrique
      
      -- Retour pour corrections
      needs_revision BOOLEAN DEFAULT false,
      revision_notes TEXT,
      
      -- Retard
      is_late BOOLEAN DEFAULT false,
      late_hours INTEGER DEFAULT 0,
      penalty_applied INTEGER DEFAULT 0, -- Points de pénalité appliqués
      
      -- Version
      version INTEGER DEFAULT 1,
      previous_submission_id UUID REFERENCES public.course_assignment_submissions(id),
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(assignment_id, enrollment_id, version)
    );
  END IF;
END $$;

-- Indexes pour course_assignment_submissions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignment_submissions_assignment_id'
  ) THEN
    CREATE INDEX idx_assignment_submissions_assignment_id ON public.course_assignment_submissions(assignment_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignment_submissions_enrollment_id'
  ) THEN
    CREATE INDEX idx_assignment_submissions_enrollment_id ON public.course_assignment_submissions(enrollment_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignment_submissions_user_id'
  ) THEN
    CREATE INDEX idx_assignment_submissions_user_id ON public.course_assignment_submissions(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignment_submissions_status'
  ) THEN
    CREATE INDEX idx_assignment_submissions_status ON public.course_assignment_submissions(status);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_assignment_submissions_updated_at'
  ) THEN
    CREATE TRIGGER update_assignment_submissions_updated_at
      BEFORE UPDATE ON public.course_assignment_submissions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: course_assignment_grading
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_assignment_grading'
  ) THEN
    CREATE TABLE public.course_assignment_grading (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_id UUID NOT NULL REFERENCES public.course_assignment_submissions(id) ON DELETE CASCADE,
      graded_by UUID NOT NULL REFERENCES auth.users(id),
      
      -- Notation
      grade INTEGER NOT NULL,
      grade_percentage NUMERIC,
      grade_letter TEXT,
      is_passed BOOLEAN,
      
      -- Feedback
      feedback TEXT,
      feedback_files JSONB DEFAULT '[]',
      rubric_scores JSONB DEFAULT '{}',
      
      -- Notes privées instructeur
      private_notes TEXT,
      
      -- Dates
      graded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_assignment_grading
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignment_grading_submission_id'
  ) THEN
    CREATE INDEX idx_assignment_grading_submission_id ON public.course_assignment_grading(submission_id);
  END IF;
END $$;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignment_grading ENABLE ROW LEVEL SECURITY;

-- Policies pour course_assignments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_assignments' AND policyname = 'Students can view visible assignments'
  ) THEN
    CREATE POLICY "Students can view visible assignments" ON public.course_assignments
      FOR SELECT
      USING (
        is_visible = true AND course_id IN (
          SELECT ce.course_id FROM public.course_enrollments ce
          WHERE ce.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_assignments' AND policyname = 'Instructors can manage assignments'
  ) THEN
    CREATE POLICY "Instructors can manage assignments" ON public.course_assignments
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.courses c
          JOIN public.products p ON p.id = c.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE c.id = course_assignments.course_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour course_assignment_submissions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_assignment_submissions' AND policyname = 'Students can view own submissions'
  ) THEN
    CREATE POLICY "Students can view own submissions" ON public.course_assignment_submissions
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_assignment_submissions' AND policyname = 'Students can create own submissions'
  ) THEN
    CREATE POLICY "Students can create own submissions" ON public.course_assignment_submissions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_assignment_submissions' AND policyname = 'Students can update own draft submissions'
  ) THEN
    CREATE POLICY "Students can update own draft submissions" ON public.course_assignment_submissions
      FOR UPDATE
      USING (auth.uid() = user_id AND status = 'draft');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_assignment_submissions' AND policyname = 'Instructors can view all submissions'
  ) THEN
    CREATE POLICY "Instructors can view all submissions" ON public.course_assignment_submissions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.courses c
          JOIN public.products p ON p.id = c.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE c.id = course_assignment_submissions.course_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_assignment_submissions' AND policyname = 'Instructors can grade submissions'
  ) THEN
    CREATE POLICY "Instructors can grade submissions" ON public.course_assignment_submissions
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.courses c
          JOIN public.products p ON p.id = c.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE c.id = course_assignment_submissions.course_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour course_assignment_grading
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_assignment_grading' AND policyname = 'Students can view own grading'
  ) THEN
    CREATE POLICY "Students can view own grading" ON public.course_assignment_grading
      FOR SELECT
      USING (
        submission_id IN (
          SELECT id FROM public.course_assignment_submissions
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_assignment_grading' AND policyname = 'Instructors can manage grading'
  ) THEN
    CREATE POLICY "Instructors can manage grading" ON public.course_assignment_grading
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.course_assignment_submissions cas
          JOIN public.courses c ON c.id = cas.course_id
          JOIN public.products p ON p.id = c.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE cas.id = course_assignment_grading.submission_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function: Check if assignment is late
CREATE OR REPLACE FUNCTION public.check_assignment_late(
  p_assignment_id UUID,
  p_submitted_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_due_date TIMESTAMPTZ;
  v_allow_late BOOLEAN;
BEGIN
  SELECT due_date, allow_late_submission
  INTO v_due_date, v_allow_late
  FROM public.course_assignments
  WHERE id = p_assignment_id;
  
  IF v_due_date IS NULL THEN
    RETURN false;
  END IF;
  
  IF NOT v_allow_late AND p_submitted_at > v_due_date THEN
    RETURN true;
  END IF;
  
  RETURN p_submitted_at > v_due_date;
END;
$$;

-- Function: Calculate late penalty
CREATE OR REPLACE FUNCTION public.calculate_late_penalty(
  p_assignment_id UUID,
  p_grade INTEGER,
  p_late_hours INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_penalty_percentage INTEGER;
  v_penalty_amount INTEGER;
BEGIN
  SELECT late_penalty_percentage
  INTO v_penalty_percentage
  FROM public.course_assignments
  WHERE id = p_assignment_id;
  
  IF v_penalty_percentage IS NULL OR v_penalty_percentage = 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculer pénalité (pourcentage de la note)
  v_penalty_amount := ROUND(p_grade * v_penalty_percentage / 100.0);
  
  RETURN GREATEST(0, v_penalty_amount);
END;
$$;

-- Function: Submit assignment
CREATE OR REPLACE FUNCTION public.submit_assignment(
  p_assignment_id UUID,
  p_enrollment_id UUID,
  p_user_id UUID,
  p_submission_text TEXT DEFAULT NULL,
  p_submission_files JSONB DEFAULT '[]',
  p_submission_url TEXT DEFAULT NULL,
  p_submission_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment RECORD;
  v_course_id UUID;
  v_submission_id UUID;
  v_is_late BOOLEAN;
  v_late_hours INTEGER;
  v_version INTEGER;
  v_previous_submission_id UUID;
BEGIN
  -- Récupérer infos assignment
  SELECT a.*, c.id as course_id
  INTO v_assignment
  FROM public.course_assignments a
  JOIN public.courses c ON c.id = a.course_id
  WHERE a.id = p_assignment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment non trouvé';
  END IF;
  
  -- Vérifier si déjà soumis
  SELECT id, version
  INTO v_previous_submission_id, v_version
  FROM public.course_assignment_submissions
  WHERE assignment_id = p_assignment_id
  AND enrollment_id = p_enrollment_id
  ORDER BY version DESC
  LIMIT 1;
  
  IF v_version IS NULL THEN
    v_version := 1;
  ELSE
    v_version := v_version + 1;
  END IF;
  
  -- Vérifier si en retard
  v_is_late := public.check_assignment_late(p_assignment_id, now());
  IF v_is_late THEN
    v_late_hours := EXTRACT(EPOCH FROM (now() - v_assignment.due_date)) / 3600;
  ELSE
    v_late_hours := 0;
  END IF;
  
  -- Créer soumission
  INSERT INTO public.course_assignment_submissions (
    assignment_id,
    enrollment_id,
    course_id,
    user_id,
    submission_text,
    submission_files,
    submission_url,
    submission_code,
    status,
    submitted_at,
    is_late,
    late_hours,
    version,
    previous_submission_id
  )
  VALUES (
    p_assignment_id,
    p_enrollment_id,
    v_assignment.course_id,
    p_user_id,
    p_submission_text,
    p_submission_files,
    p_submission_url,
    p_submission_code,
    'submitted',
    now(),
    v_is_late,
    v_late_hours,
    v_version,
    v_previous_submission_id
  )
  RETURNING id INTO v_submission_id;
  
  -- Attribuer des points pour soumission (gamification)
  IF v_is_late = false THEN
    PERFORM public.award_points(
      p_enrollment_id,
      p_user_id,
      5, -- 5 points pour soumission à temps
      'assignment',
      p_assignment_id,
      'Assignment soumis: ' || v_assignment.title
    );
  END IF;
  
  RETURN v_submission_id;
END;
$$;

-- Function: Grade assignment
CREATE OR REPLACE FUNCTION public.grade_assignment(
  p_submission_id UUID,
  p_graded_by UUID,
  p_grade INTEGER,
  p_feedback TEXT DEFAULT NULL,
  p_feedback_files JSONB DEFAULT '[]',
  p_rubric_scores JSONB DEFAULT '{}',
  p_private_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_submission RECORD;
  v_assignment RECORD;
  v_grade_percentage NUMERIC;
  v_grade_letter TEXT;
  v_is_passed BOOLEAN;
  v_penalty_applied INTEGER;
BEGIN
  -- Récupérer soumission
  SELECT cas.*, ca.*
  INTO v_submission
  FROM public.course_assignment_submissions cas
  JOIN public.course_assignments ca ON ca.id = cas.assignment_id
  WHERE cas.id = p_submission_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Soumission non trouvée';
  END IF;
  
  -- Calculer pourcentage
  v_grade_percentage := (p_grade::NUMERIC / v_submission.points_possible) * 100;
  
  -- Calculer lettre (si applicable)
  IF v_submission.grading_type = 'letter' THEN
    IF v_grade_percentage >= 90 THEN
      v_grade_letter := 'A';
    ELSIF v_grade_percentage >= 80 THEN
      v_grade_letter := 'B';
    ELSIF v_grade_percentage >= 70 THEN
      v_grade_letter := 'C';
    ELSIF v_grade_percentage >= 60 THEN
      v_grade_letter := 'D';
    ELSE
      v_grade_letter := 'F';
    END IF;
  END IF;
  
  -- Calculer pass/fail
  IF v_submission.grading_type = 'pass_fail' THEN
    v_is_passed := v_grade_percentage >= 60;
  END IF;
  
  -- Appliquer pénalité retard si applicable
  IF v_submission.is_late AND v_submission.late_penalty_percentage > 0 THEN
    v_penalty_applied := public.calculate_late_penalty(
      v_submission.assignment_id,
      p_grade,
      v_submission.late_hours
    );
    p_grade := p_grade - v_penalty_applied;
    v_grade_percentage := (p_grade::NUMERIC / v_submission.points_possible) * 100;
  END IF;
  
  -- Mettre à jour soumission
  UPDATE public.course_assignment_submissions
  SET
    status = 'graded',
    grade = p_grade,
    grade_percentage = v_grade_percentage,
    grade_letter = v_grade_letter,
    is_passed = v_is_passed,
    feedback = p_feedback,
    feedback_files = p_feedback_files,
    rubric_scores = p_rubric_scores,
    penalty_applied = v_penalty_applied,
    graded_at = now()
  WHERE id = p_submission_id;
  
  -- Enregistrer dans grading history
  INSERT INTO public.course_assignment_grading (
    submission_id,
    graded_by,
    grade,
    grade_percentage,
    grade_letter,
    is_passed,
    feedback,
    feedback_files,
    rubric_scores,
    private_notes
  )
  VALUES (
    p_submission_id,
    p_graded_by,
    p_grade,
    v_grade_percentage,
    v_grade_letter,
    v_is_passed,
    p_feedback,
    p_feedback_files,
    p_rubric_scores,
    p_private_notes
  );
  
  -- Attribuer points pour note (gamification) - bonus si note parfaite
  IF p_grade = v_submission.points_possible THEN
    PERFORM public.award_points(
      v_submission.enrollment_id,
      v_submission.user_id,
      10, -- 10 points bonus pour note parfaite
      'assignment',
      v_submission.assignment_id,
      'Assignment note parfaite: ' || v_submission.title
    );
  END IF;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 6. COMMENTS
-- =====================================================
COMMENT ON TABLE public.course_assignments IS 'Devoirs/assignments pour les cours';
COMMENT ON TABLE public.course_assignment_submissions IS 'Soumissions des étudiants pour les assignments';
COMMENT ON TABLE public.course_assignment_grading IS 'Historique des notations pour les assignments';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

