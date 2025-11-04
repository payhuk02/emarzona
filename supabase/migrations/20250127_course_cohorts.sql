-- =====================================================
-- PAYHUK COURSES COHORTS SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de cohorts (groupes d'étudiants) pour cours en ligne
--              Permet de créer des groupes d'étudiants pour classes virtuelles,
--              groupes de travail, discussions, etc.
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: course_cohorts
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_cohorts'
  ) THEN
    CREATE TABLE public.course_cohorts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Informations cohort
      name TEXT NOT NULL,
      description TEXT,
      
      -- Type de cohort
      cohort_type TEXT NOT NULL CHECK (cohort_type IN ('enrollment_date', 'manual', 'assignment', 'skill_level', 'custom')) DEFAULT 'manual',
      
      -- Paramètres
      max_students INTEGER,
      is_active BOOLEAN DEFAULT true,
      is_private BOOLEAN DEFAULT false, -- Cohorts privés (invitation seulement)
      
      -- Dates
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ,
      
      -- Règles automatiques (pour enrollment_date)
      enrollment_date_range_start TIMESTAMPTZ,
      enrollment_date_range_end TIMESTAMPTZ,
      
      -- Métadonnées
      metadata JSONB DEFAULT '{}', -- Données supplémentaires selon le type
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_cohorts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_cohorts_course_id'
  ) THEN
    CREATE INDEX idx_course_cohorts_course_id ON public.course_cohorts(course_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_cohorts_type'
  ) THEN
    CREATE INDEX idx_course_cohorts_type ON public.course_cohorts(cohort_type);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_cohorts_active'
  ) THEN
    CREATE INDEX idx_course_cohorts_active ON public.course_cohorts(is_active);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_course_cohorts_updated_at'
  ) THEN
    CREATE TRIGGER update_course_cohorts_updated_at
      BEFORE UPDATE ON public.course_cohorts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: course_cohort_members
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_cohort_members'
  ) THEN
    CREATE TABLE public.course_cohort_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cohort_id UUID NOT NULL REFERENCES public.course_cohorts(id) ON DELETE CASCADE,
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Rôle dans le cohort
      role TEXT CHECK (role IN ('student', 'mentor', 'leader', 'moderator')) DEFAULT 'student',
      
      -- Statut
      status TEXT CHECK (status IN ('active', 'inactive', 'removed')) DEFAULT 'active',
      
      -- Dates
      joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      left_at TIMESTAMPTZ,
      
      -- Métadonnées
      metadata JSONB DEFAULT '{}',
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(cohort_id, enrollment_id)
    );
  END IF;
END $$;

-- Indexes pour course_cohort_members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cohort_members_cohort_id'
  ) THEN
    CREATE INDEX idx_cohort_members_cohort_id ON public.course_cohort_members(cohort_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cohort_members_enrollment_id'
  ) THEN
    CREATE INDEX idx_cohort_members_enrollment_id ON public.course_cohort_members(enrollment_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cohort_members_user_id'
  ) THEN
    CREATE INDEX idx_cohort_members_user_id ON public.course_cohort_members(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cohort_members_status'
  ) THEN
    CREATE INDEX idx_cohort_members_status ON public.course_cohort_members(status);
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: course_cohort_discussions
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_cohort_discussions'
  ) THEN
    CREATE TABLE public.course_cohort_discussions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cohort_id UUID NOT NULL REFERENCES public.course_cohorts(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Discussion
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      discussion_type TEXT CHECK (discussion_type IN ('general', 'assignment', 'project', 'question', 'announcement')) DEFAULT 'general',
      
      -- Statut
      is_pinned BOOLEAN DEFAULT false,
      is_locked BOOLEAN DEFAULT false,
      
      -- Métriques
      views_count INTEGER DEFAULT 0,
      replies_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_cohort_discussions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cohort_discussions_cohort_id'
  ) THEN
    CREATE INDEX idx_cohort_discussions_cohort_id ON public.course_cohort_discussions(cohort_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cohort_discussions_course_id'
  ) THEN
    CREATE INDEX idx_cohort_discussions_course_id ON public.course_cohort_discussions(course_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_cohort_discussions_updated_at'
  ) THEN
    CREATE TRIGGER update_cohort_discussions_updated_at
      BEFORE UPDATE ON public.course_cohort_discussions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 4. TABLE: course_cohort_invitations
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_cohort_invitations'
  ) THEN
    CREATE TABLE public.course_cohort_invitations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cohort_id UUID NOT NULL REFERENCES public.course_cohorts(id) ON DELETE CASCADE,
      invited_by UUID NOT NULL REFERENCES auth.users(id),
      
      -- Invitation
      email TEXT,
      user_id UUID REFERENCES auth.users(id),
      invitation_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
      
      -- Statut
      status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
      
      -- Dates
      expires_at TIMESTAMPTZ,
      accepted_at TIMESTAMPTZ,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_cohort_invitations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cohort_invitations_cohort_id'
  ) THEN
    CREATE INDEX idx_cohort_invitations_cohort_id ON public.course_cohort_invitations(cohort_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cohort_invitations_token'
  ) THEN
    CREATE INDEX idx_cohort_invitations_token ON public.course_cohort_invitations(invitation_token);
  END IF;
END $$;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.course_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_cohort_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_cohort_invitations ENABLE ROW LEVEL SECURITY;

-- Policies pour course_cohorts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_cohorts' AND policyname = 'Instructors can manage cohorts'
  ) THEN
    CREATE POLICY "Instructors can manage cohorts" ON public.course_cohorts
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.courses c
          JOIN public.products p ON p.id = c.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE c.id = course_cohorts.course_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_cohorts' AND policyname = 'Students can view active cohorts'
  ) THEN
    CREATE POLICY "Students can view active cohorts" ON public.course_cohorts
      FOR SELECT
      USING (
        is_active = true AND course_id IN (
          SELECT ce.course_id FROM public.course_enrollments ce
          WHERE ce.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour course_cohort_members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_cohort_members' AND policyname = 'Students can view own cohorts'
  ) THEN
    CREATE POLICY "Students can view own cohorts" ON public.course_cohort_members
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_cohort_members' AND policyname = 'Instructors can manage members'
  ) THEN
    CREATE POLICY "Instructors can manage members" ON public.course_cohort_members
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.course_cohorts cc
          JOIN public.courses c ON c.id = cc.course_id
          JOIN public.products p ON p.id = c.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE cc.id = course_cohort_members.cohort_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour course_cohort_discussions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_cohort_discussions' AND policyname = 'Cohort members can view discussions'
  ) THEN
    CREATE POLICY "Cohort members can view discussions" ON public.course_cohort_discussions
      FOR SELECT
      USING (
        cohort_id IN (
          SELECT cohort_id FROM public.course_cohort_members
          WHERE user_id = auth.uid()
          AND status = 'active'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_cohort_discussions' AND policyname = 'Cohort members can create discussions'
  ) THEN
    CREATE POLICY "Cohort members can create discussions" ON public.course_cohort_discussions
      FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        cohort_id IN (
          SELECT cohort_id FROM public.course_cohort_members
          WHERE user_id = auth.uid()
          AND status = 'active'
        )
      );
  END IF;
END $$;

-- Policies pour course_cohort_invitations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_cohort_invitations' AND policyname = 'Users can view own invitations'
  ) THEN
    CREATE POLICY "Users can view own invitations" ON public.course_cohort_invitations
      FOR SELECT
      USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR user_id = auth.uid()
      );
  END IF;
END $$;

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function: Auto-assign students to cohorts by enrollment date
CREATE OR REPLACE FUNCTION public.auto_assign_cohort_by_enrollment_date()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cohort RECORD;
  v_enrollment RECORD;
BEGIN
  -- Parcourir tous les cohorts de type enrollment_date
  FOR v_cohort IN
    SELECT * FROM public.course_cohorts
    WHERE cohort_type = 'enrollment_date'
    AND is_active = true
    AND enrollment_date_range_start IS NOT NULL
    AND enrollment_date_range_end IS NOT NULL
  LOOP
    -- Parcourir les enrollments dans la plage de dates
    FOR v_enrollment IN
      SELECT ce.* FROM public.course_enrollments ce
      WHERE ce.course_id = v_cohort.course_id
      AND ce.enrollment_date >= v_cohort.enrollment_date_range_start
      AND ce.enrollment_date <= v_cohort.enrollment_date_range_end
      AND NOT EXISTS (
        SELECT 1 FROM public.course_cohort_members ccm
        WHERE ccm.cohort_id = v_cohort.id
        AND ccm.enrollment_id = ce.id
      )
    LOOP
      -- Vérifier limite max_students
      IF v_cohort.max_students IS NULL OR
         (SELECT COUNT(*) FROM public.course_cohort_members WHERE cohort_id = v_cohort.id) < v_cohort.max_students
      THEN
        -- Ajouter au cohort
        INSERT INTO public.course_cohort_members (
          cohort_id,
          enrollment_id,
          user_id,
          role,
          status
        )
        VALUES (
          v_cohort.id,
          v_enrollment.id,
          v_enrollment.user_id,
          'student',
          'active'
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Function: Get student cohorts for a course
CREATE OR REPLACE FUNCTION public.get_student_cohorts(
  p_course_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  cohort_id UUID,
  cohort_name TEXT,
  cohort_type TEXT,
  role TEXT,
  member_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id as cohort_id,
    cc.name as cohort_name,
    cc.cohort_type,
    ccm.role,
    (SELECT COUNT(*) FROM public.course_cohort_members WHERE cohort_id = cc.id AND status = 'active')::INTEGER as member_count
  FROM public.course_cohorts cc
  JOIN public.course_cohort_members ccm ON ccm.cohort_id = cc.id
  WHERE cc.course_id = p_course_id
  AND ccm.user_id = p_user_id
  AND ccm.status = 'active'
  AND cc.is_active = true;
END;
$$;

-- =====================================================
-- 7. COMMENTS
-- =====================================================
COMMENT ON TABLE public.course_cohorts IS 'Cohorts (groupes d''étudiants) pour les cours';
COMMENT ON TABLE public.course_cohort_members IS 'Membres des cohorts';
COMMENT ON TABLE public.course_cohort_discussions IS 'Discussions spécifiques aux cohorts';
COMMENT ON TABLE public.course_cohort_invitations IS 'Invitations aux cohorts privés';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

