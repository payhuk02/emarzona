-- =====================================================
-- PAYHUK COURSES LEARNING PATHS SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de parcours d'apprentissage (Learning Paths)
--              Permet de créer des parcours guidés à travers plusieurs cours
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: learning_paths
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'learning_paths'
  ) THEN
    CREATE TABLE public.learning_paths (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      created_by UUID NOT NULL REFERENCES auth.users(id),
      
      -- Informations parcours
      title TEXT NOT NULL,
      description TEXT,
      short_description TEXT,
      
      -- Métadonnées
      image_url TEXT,
      level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all_levels')) DEFAULT 'all_levels',
      estimated_duration_hours INTEGER,
      estimated_duration_days INTEGER,
      
      -- Paramètres
      is_active BOOLEAN DEFAULT true,
      is_featured BOOLEAN DEFAULT false,
      is_free BOOLEAN DEFAULT false,
      price NUMERIC(10, 2) DEFAULT 0,
      currency TEXT DEFAULT 'XOF',
      
      -- Objectifs
      learning_objectives TEXT[] DEFAULT '{}',
      target_audience TEXT[] DEFAULT '{}',
      
      -- Statistiques (calculées)
      total_courses INTEGER DEFAULT 0,
      total_students INTEGER DEFAULT 0,
      completion_rate NUMERIC DEFAULT 0,
      average_rating NUMERIC DEFAULT 0,
      
      -- Ordre d'affichage
      display_order INTEGER DEFAULT 0,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour learning_paths
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_paths_store_id'
  ) THEN
    CREATE INDEX idx_learning_paths_store_id ON public.learning_paths(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_paths_created_by'
  ) THEN
    CREATE INDEX idx_learning_paths_created_by ON public.learning_paths(created_by);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_paths_active'
  ) THEN
    CREATE INDEX idx_learning_paths_active ON public.learning_paths(is_active);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_learning_paths_updated_at'
  ) THEN
    CREATE TRIGGER update_learning_paths_updated_at
      BEFORE UPDATE ON public.learning_paths
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: learning_path_courses
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'learning_path_courses'
  ) THEN
    CREATE TABLE public.learning_path_courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Ordre dans le parcours
      order_index INTEGER NOT NULL,
      
      -- Prérequis
      is_required BOOLEAN DEFAULT true,
      unlock_after_completion BOOLEAN DEFAULT true, -- Déverrouiller après complétion du cours précédent
      
      -- Optionnel
      estimated_duration_hours INTEGER,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(learning_path_id, course_id),
      UNIQUE(learning_path_id, order_index)
    );
  END IF;
END $$;

-- Indexes pour learning_path_courses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_path_courses_path_id'
  ) THEN
    CREATE INDEX idx_path_courses_path_id ON public.learning_path_courses(learning_path_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_path_courses_course_id'
  ) THEN
    CREATE INDEX idx_path_courses_course_id ON public.learning_path_courses(course_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_path_courses_order'
  ) THEN
    CREATE INDEX idx_path_courses_order ON public.learning_path_courses(learning_path_id, order_index);
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: learning_path_enrollments
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'learning_path_enrollments'
  ) THEN
    CREATE TABLE public.learning_path_enrollments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Statut
      status TEXT CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
      
      -- Progression
      current_course_index INTEGER DEFAULT 0, -- Index du cours actuel dans le parcours
      completed_courses_count INTEGER DEFAULT 0,
      total_courses_count INTEGER DEFAULT 0,
      progress_percentage NUMERIC DEFAULT 0,
      
      -- Dates
      enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      last_accessed_at TIMESTAMPTZ,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(learning_path_id, user_id)
    );
  END IF;
END $$;

-- Indexes pour learning_path_enrollments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_path_enrollments_path_id'
  ) THEN
    CREATE INDEX idx_path_enrollments_path_id ON public.learning_path_enrollments(learning_path_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_path_enrollments_user_id'
  ) THEN
    CREATE INDEX idx_path_enrollments_user_id ON public.learning_path_enrollments(user_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_path_enrollments_updated_at'
  ) THEN
    CREATE TRIGGER update_path_enrollments_updated_at
      BEFORE UPDATE ON public.learning_path_enrollments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies pour learning_paths
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'learning_paths' AND policyname = 'Store owners can manage own paths'
  ) THEN
    CREATE POLICY "Store owners can manage own paths" ON public.learning_paths
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = learning_paths.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'learning_paths' AND policyname = 'Anyone can view active paths'
  ) THEN
    CREATE POLICY "Anyone can view active paths" ON public.learning_paths
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- Policies pour learning_path_courses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'learning_path_courses' AND policyname = 'Anyone can view path courses'
  ) THEN
    CREATE POLICY "Anyone can view path courses" ON public.learning_path_courses
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Policies pour learning_path_enrollments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'learning_path_enrollments' AND policyname = 'Users can view own enrollments'
  ) THEN
    CREATE POLICY "Users can view own enrollments" ON public.learning_path_enrollments
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'learning_path_enrollments' AND policyname = 'Users can create own enrollments'
  ) THEN
    CREATE POLICY "Users can create own enrollments" ON public.learning_path_enrollments
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'learning_path_enrollments' AND policyname = 'Users can update own enrollments'
  ) THEN
    CREATE POLICY "Users can update own enrollments" ON public.learning_path_enrollments
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function: Get next course in path
CREATE OR REPLACE FUNCTION public.get_next_course_in_path(
  p_path_enrollment_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment RECORD;
  v_next_course RECORD;
BEGIN
  -- Récupérer enrollment
  SELECT * INTO v_enrollment
  FROM public.learning_path_enrollments
  WHERE id = p_path_enrollment_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Récupérer prochain cours
  SELECT lpc.course_id
  INTO v_next_course
  FROM public.learning_path_courses lpc
  WHERE lpc.learning_path_id = v_enrollment.learning_path_id
  AND lpc.order_index = v_enrollment.current_course_index + 1
  LIMIT 1;
  
  RETURN v_next_course.course_id;
END;
$$;

-- Function: Update path progress
CREATE OR REPLACE FUNCTION public.update_path_progress(
  p_path_enrollment_id UUID,
  p_course_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment RECORD;
  v_path_course RECORD;
  v_completed_count INTEGER;
  v_total_count INTEGER;
  v_new_progress NUMERIC;
BEGIN
  -- Récupérer enrollment
  SELECT * INTO v_enrollment
  FROM public.learning_path_enrollments
  WHERE id = p_path_enrollment_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Récupérer cours dans path
  SELECT * INTO v_path_course
  FROM public.learning_path_courses
  WHERE learning_path_id = v_enrollment.learning_path_id
  AND course_id = p_course_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Vérifier si cours complété
  -- (On suppose que la complétion est vérifiée ailleurs)
  
  -- Calculer progression
  SELECT COUNT(*), COUNT(*) FILTER (WHERE order_index <= v_path_course.order_index)
  INTO v_total_count, v_completed_count
  FROM public.learning_path_courses
  WHERE learning_path_id = v_enrollment.learning_path_id;
  
  v_new_progress := (v_completed_count::NUMERIC / v_total_count::NUMERIC) * 100;
  
  -- Mettre à jour enrollment
  UPDATE public.learning_path_enrollments
  SET
    current_course_index = v_path_course.order_index,
    completed_courses_count = v_completed_count,
    total_courses_count = v_total_count,
    progress_percentage = v_new_progress,
    last_accessed_at = now(),
    updated_at = now()
  WHERE id = p_path_enrollment_id;
  
  -- Si parcours complété
  IF v_new_progress >= 100 THEN
    UPDATE public.learning_path_enrollments
    SET
      status = 'completed',
      completed_at = now()
    WHERE id = p_path_enrollment_id;
  END IF;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 6. COMMENTS
-- =====================================================
COMMENT ON TABLE public.learning_paths IS 'Parcours d''apprentissage (séquences de cours)';
COMMENT ON TABLE public.learning_path_courses IS 'Cours dans un parcours d''apprentissage';
COMMENT ON TABLE public.learning_path_enrollments IS 'Inscriptions aux parcours d''apprentissage';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

