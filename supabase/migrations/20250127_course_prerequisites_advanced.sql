-- =====================================================
-- PAYHUK COURSES ADVANCED PREREQUISITES SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de prérequis avancés avec validation automatique
--              Permet de définir des prérequis (cours, quiz, assignments) et
--              de valider automatiquement l'accès
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: course_prerequisites
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_prerequisites'
  ) THEN
    CREATE TABLE public.course_prerequisites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Type de prérequis
      prerequisite_type TEXT NOT NULL CHECK (prerequisite_type IN ('course', 'quiz', 'assignment', 'skill_level', 'custom')) DEFAULT 'course',
      
      -- Référence selon le type
      required_course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
      required_quiz_id UUID REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
      required_assignment_id UUID REFERENCES public.course_assignments(id) ON DELETE CASCADE,
      required_skill_level TEXT, -- Pour skill_level
      custom_requirement TEXT, -- Pour custom
      
      -- Conditions
      require_completion BOOLEAN DEFAULT true, -- Cours doit être complété
      require_passing_score BOOLEAN DEFAULT false, -- Pour quiz/assignment
      minimum_score INTEGER, -- Score minimum requis (pour quiz/assignment)
      minimum_progress_percentage INTEGER DEFAULT 100 CHECK (minimum_progress_percentage >= 0 AND minimum_progress_percentage <= 100),
      
      -- Paramètres
      is_required BOOLEAN DEFAULT true,
      order_index INTEGER DEFAULT 0,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_prerequisites
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prerequisites_course_id'
  ) THEN
    CREATE INDEX idx_prerequisites_course_id ON public.course_prerequisites(course_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prerequisites_type'
  ) THEN
    CREATE INDEX idx_prerequisites_type ON public.course_prerequisites(prerequisite_type);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_prerequisites_updated_at'
  ) THEN
    CREATE TRIGGER update_prerequisites_updated_at
      BEFORE UPDATE ON public.course_prerequisites
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: course_prerequisite_validations
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_prerequisite_validations'
  ) THEN
    CREATE TABLE public.course_prerequisite_validations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      prerequisite_id UUID NOT NULL REFERENCES public.course_prerequisites(id) ON DELETE CASCADE,
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Validation
      is_validated BOOLEAN DEFAULT false,
      validation_type TEXT CHECK (validation_type IN ('automatic', 'manual', 'waived')) DEFAULT 'automatic',
      validated_at TIMESTAMPTZ,
      validated_by UUID REFERENCES auth.users(id),
      
      -- Détails
      validation_details JSONB DEFAULT '{}', -- {score: number, progress: number, etc.}
      
      -- Notes
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(prerequisite_id, enrollment_id)
    );
  END IF;
END $$;

-- Indexes pour course_prerequisite_validations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prerequisite_validations_prerequisite_id'
  ) THEN
    CREATE INDEX idx_prerequisite_validations_prerequisite_id ON public.course_prerequisite_validations(prerequisite_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prerequisite_validations_enrollment_id'
  ) THEN
    CREATE INDEX idx_prerequisite_validations_enrollment_id ON public.course_prerequisite_validations(enrollment_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_prerequisite_validations_updated_at'
  ) THEN
    CREATE TRIGGER update_prerequisite_validations_updated_at
      BEFORE UPDATE ON public.course_prerequisite_validations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_prerequisite_validations ENABLE ROW LEVEL SECURITY;

-- Policies pour course_prerequisites
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_prerequisites' AND policyname = 'Instructors can manage prerequisites'
  ) THEN
    CREATE POLICY "Instructors can manage prerequisites" ON public.course_prerequisites
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.courses c
          JOIN public.products p ON p.id = c.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE c.id = course_prerequisites.course_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_prerequisites' AND policyname = 'Students can view prerequisites'
  ) THEN
    CREATE POLICY "Students can view prerequisites" ON public.course_prerequisites
      FOR SELECT
      USING (
        course_id IN (
          SELECT ce.course_id FROM public.course_enrollments ce
          WHERE ce.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour course_prerequisite_validations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_prerequisite_validations' AND policyname = 'Users can view own validations'
  ) THEN
    CREATE POLICY "Users can view own validations" ON public.course_prerequisite_validations
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Function: Validate course prerequisite
CREATE OR REPLACE FUNCTION public.validate_course_prerequisite(
  p_prerequisite_id UUID,
  p_enrollment_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prerequisite RECORD;
  v_required_enrollment RECORD;
  v_quiz_attempt RECORD;
  v_assignment_submission RECORD;
  v_is_valid BOOLEAN := false;
  v_validation_details JSONB := '{}';
BEGIN
  -- Récupérer le prérequis
  SELECT * INTO v_prerequisite
  FROM public.course_prerequisites
  WHERE id = p_prerequisite_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prérequis non trouvé';
  END IF;
  
  -- Validation selon le type
  IF v_prerequisite.prerequisite_type = 'course' AND v_prerequisite.required_course_id IS NOT NULL THEN
    -- Vérifier enrollment et progression
    SELECT * INTO v_required_enrollment
    FROM public.course_enrollments
    WHERE course_id = v_prerequisite.required_course_id
    AND user_id = p_user_id
    AND status = 'active';
    
    IF FOUND THEN
      IF v_prerequisite.require_completion THEN
        v_is_valid := v_required_enrollment.progress_percentage >= v_prerequisite.minimum_progress_percentage;
        v_validation_details := jsonb_build_object(
          'progress', v_required_enrollment.progress_percentage,
          'required_progress', v_prerequisite.minimum_progress_percentage
        );
      ELSE
        v_is_valid := true;
      END IF;
    ELSE
      v_is_valid := false;
    END IF;
    
  ELSIF v_prerequisite.prerequisite_type = 'quiz' AND v_prerequisite.required_quiz_id IS NOT NULL THEN
    -- Vérifier quiz passé
    SELECT * INTO v_quiz_attempt
    FROM public.quiz_attempts
    WHERE quiz_id = v_prerequisite.required_quiz_id
    AND user_id = p_user_id
    AND passed = true
    ORDER BY completed_at DESC
    LIMIT 1;
    
    IF FOUND THEN
      IF v_prerequisite.require_passing_score AND v_prerequisite.minimum_score IS NOT NULL THEN
        v_is_valid := v_quiz_attempt.score >= v_prerequisite.minimum_score;
        v_validation_details := jsonb_build_object(
          'score', v_quiz_attempt.score,
          'required_score', v_prerequisite.minimum_score
        );
      ELSE
        v_is_valid := v_quiz_attempt.passed;
      END IF;
    ELSE
      v_is_valid := false;
    END IF;
    
  ELSIF v_prerequisite.prerequisite_type = 'assignment' AND v_prerequisite.required_assignment_id IS NOT NULL THEN
    -- Vérifier assignment soumis et noté
    SELECT * INTO v_assignment_submission
    FROM public.course_assignment_submissions
    WHERE assignment_id = v_prerequisite.required_assignment_id
    AND user_id = p_user_id
    AND status = 'graded'
    ORDER BY graded_at DESC
    LIMIT 1;
    
    IF FOUND THEN
      IF v_prerequisite.require_passing_score AND v_prerequisite.minimum_score IS NOT NULL THEN
        v_is_valid := COALESCE(v_assignment_submission.grade, 0) >= v_prerequisite.minimum_score;
        v_validation_details := jsonb_build_object(
          'grade', v_assignment_submission.grade,
          'required_grade', v_prerequisite.minimum_score
        );
      ELSE
        v_is_valid := v_assignment_submission.status = 'graded';
      END IF;
    ELSE
      v_is_valid := false;
    END IF;
    
  ELSIF v_prerequisite.prerequisite_type = 'skill_level' THEN
    -- Validation basée sur le niveau de compétence (à implémenter)
    v_is_valid := false; -- TODO: Implémenter logique de skill level
    
  ELSE
    -- Custom requirement (validation manuelle)
    v_is_valid := false;
  END IF;
  
  -- Créer ou mettre à jour validation
  INSERT INTO public.course_prerequisite_validations (
    prerequisite_id,
    enrollment_id,
    user_id,
    is_validated,
    validation_type,
    validated_at,
    validation_details
  )
  VALUES (
    p_prerequisite_id,
    p_enrollment_id,
    p_user_id,
    v_is_valid,
    'automatic',
    CASE WHEN v_is_valid THEN now() ELSE NULL END,
    v_validation_details
  )
  ON CONFLICT (prerequisite_id, enrollment_id)
  DO UPDATE SET
    is_validated = v_is_valid,
    validated_at = CASE WHEN v_is_valid THEN now() ELSE validated_at END,
    validation_details = v_validation_details,
    updated_at = now();
  
  RETURN v_is_valid;
END;
$$;

-- Function: Check if user has access to course (all prerequisites validated)
CREATE OR REPLACE FUNCTION public.check_course_access(
  p_course_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment RECORD;
  v_prerequisite RECORD;
  v_validation_count INTEGER;
  v_required_count INTEGER;
BEGIN
  -- Récupérer enrollment
  SELECT * INTO v_enrollment
  FROM public.course_enrollments
  WHERE course_id = p_course_id
  AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Compter prérequis requis
  SELECT COUNT(*) INTO v_required_count
  FROM public.course_prerequisites
  WHERE course_id = p_course_id
  AND is_required = true;
  
  -- Si pas de prérequis, accès autorisé
  IF v_required_count = 0 THEN
    RETURN true;
  END IF;
  
  -- Compter validations réussies
  SELECT COUNT(*) INTO v_validation_count
  FROM public.course_prerequisite_validations pv
  JOIN public.course_prerequisites p ON p.id = pv.prerequisite_id
  WHERE p.course_id = p_course_id
  AND pv.enrollment_id = v_enrollment.id
  AND pv.is_validated = true
  AND p.is_required = true;
  
  -- Accès si tous les prérequis requis sont validés
  RETURN v_validation_count >= v_required_count;
END;
$$;

-- Function: Auto-validate prerequisites on enrollment
CREATE OR REPLACE FUNCTION public.auto_validate_prerequisites_on_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_prerequisite RECORD;
BEGIN
  -- Pour chaque prérequis du cours
  FOR v_prerequisite IN
    SELECT * FROM public.course_prerequisites
    WHERE course_id = NEW.course_id
    AND is_required = true
  LOOP
    -- Valider automatiquement
    PERFORM public.validate_course_prerequisite(
      v_prerequisite.id,
      NEW.id,
      NEW.user_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger pour validation automatique à l'inscription
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_auto_validate_prerequisites'
  ) THEN
    CREATE TRIGGER trigger_auto_validate_prerequisites
      AFTER INSERT ON public.course_enrollments
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_validate_prerequisites_on_enrollment();
  END IF;
END $$;

-- =====================================================
-- 5. COMMENTS
-- =====================================================
COMMENT ON TABLE public.course_prerequisites IS 'Prérequis avancés pour les cours';
COMMENT ON TABLE public.course_prerequisite_validations IS 'Validations des prérequis par étudiant';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

