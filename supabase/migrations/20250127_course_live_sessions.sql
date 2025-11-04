-- =====================================================
-- PAYHUK COURSES LIVE SESSIONS SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de sessions en direct (webinaires) pour cours en ligne
--              Support intégration Zoom, Google Meet, ou streaming natif
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: course_live_sessions
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_live_sessions'
  ) THEN
    CREATE TABLE public.course_live_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      cohort_id UUID REFERENCES public.course_cohorts(id) ON DELETE SET NULL, -- Optionnel: session pour un cohort spécifique
      
      -- Informations session
      title TEXT NOT NULL,
      description TEXT,
      
      -- Type de session
      session_type TEXT NOT NULL CHECK (session_type IN ('webinar', 'workshop', 'qna', 'office_hours', 'review')) DEFAULT 'webinar',
      
      -- Plateforme
      platform TEXT NOT NULL CHECK (platform IN ('zoom', 'google_meet', 'teams', 'native', 'custom')) DEFAULT 'native',
      
      -- URLs et identifiants
      meeting_url TEXT,
      meeting_id TEXT,
      meeting_password TEXT,
      streaming_url TEXT, -- Pour streaming natif
      
      -- Dates et heures
      scheduled_start TIMESTAMPTZ NOT NULL,
      scheduled_end TIMESTAMPTZ NOT NULL,
      actual_start TIMESTAMPTZ,
      actual_end TIMESTAMPTZ,
      duration_minutes INTEGER,
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled', 'postponed')) DEFAULT 'scheduled',
      
      -- Capacité
      max_participants INTEGER,
      is_public BOOLEAN DEFAULT true, -- Session publique ou privée
      
      -- Enregistrement
      recording_enabled BOOLEAN DEFAULT false,
      recording_url TEXT,
      recording_available_until TIMESTAMPTZ,
      
      -- Paramètres
      allow_questions BOOLEAN DEFAULT true,
      allow_chat BOOLEAN DEFAULT true,
      allow_screen_share BOOLEAN DEFAULT false,
      require_registration BOOLEAN DEFAULT false,
      
      -- Métadonnées
      metadata JSONB DEFAULT '{}', -- Données spécifiques à la plateforme
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_live_sessions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_live_sessions_course_id'
  ) THEN
    CREATE INDEX idx_live_sessions_course_id ON public.course_live_sessions(course_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_live_sessions_cohort_id'
  ) THEN
    CREATE INDEX idx_live_sessions_cohort_id ON public.course_live_sessions(cohort_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_live_sessions_status'
  ) THEN
    CREATE INDEX idx_live_sessions_status ON public.course_live_sessions(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_live_sessions_scheduled_start'
  ) THEN
    CREATE INDEX idx_live_sessions_scheduled_start ON public.course_live_sessions(scheduled_start);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_live_sessions_updated_at'
  ) THEN
    CREATE TRIGGER update_live_sessions_updated_at
      BEFORE UPDATE ON public.course_live_sessions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: course_live_session_registrations
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_live_session_registrations'
  ) THEN
    CREATE TABLE public.course_live_session_registrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES public.course_live_sessions(id) ON DELETE CASCADE,
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Statut
      status TEXT CHECK (status IN ('registered', 'attended', 'absent', 'cancelled')) DEFAULT 'registered',
      
      -- Reminders
      reminder_sent_24h BOOLEAN DEFAULT false,
      reminder_sent_1h BOOLEAN DEFAULT false,
      
      -- Participation
      joined_at TIMESTAMPTZ,
      left_at TIMESTAMPTZ,
      attendance_duration_minutes INTEGER DEFAULT 0,
      
      -- Feedback
      feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
      feedback_comment TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(session_id, enrollment_id)
    );
  END IF;
END $$;

-- Indexes pour course_live_session_registrations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_registrations_session_id'
  ) THEN
    CREATE INDEX idx_session_registrations_session_id ON public.course_live_session_registrations(session_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_registrations_user_id'
  ) THEN
    CREATE INDEX idx_session_registrations_user_id ON public.course_live_session_registrations(user_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_registrations_updated_at'
  ) THEN
    CREATE TRIGGER update_session_registrations_updated_at
      BEFORE UPDATE ON public.course_live_session_registrations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: course_live_session_questions
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_live_session_questions'
  ) THEN
    CREATE TABLE public.course_live_session_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES public.course_live_sessions(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Question
      question TEXT NOT NULL,
      is_answered BOOLEAN DEFAULT false,
      answer TEXT,
      answered_by UUID REFERENCES auth.users(id),
      answered_at TIMESTAMPTZ,
      
      -- Upvotes
      upvotes_count INTEGER DEFAULT 0,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_live_session_questions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_questions_session_id'
  ) THEN
    CREATE INDEX idx_session_questions_session_id ON public.course_live_session_questions(session_id);
  END IF;
END $$;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.course_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_live_session_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_live_session_questions ENABLE ROW LEVEL SECURITY;

-- Policies pour course_live_sessions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_live_sessions' AND policyname = 'Instructors can manage sessions'
  ) THEN
    CREATE POLICY "Instructors can manage sessions" ON public.course_live_sessions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.courses c
          JOIN public.products p ON p.id = c.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE c.id = course_live_sessions.course_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_live_sessions' AND policyname = 'Students can view public sessions'
  ) THEN
    CREATE POLICY "Students can view public sessions" ON public.course_live_sessions
      FOR SELECT
      USING (
        is_public = true AND course_id IN (
          SELECT ce.course_id FROM public.course_enrollments ce
          WHERE ce.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour course_live_session_registrations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_live_session_registrations' AND policyname = 'Users can view own registrations'
  ) THEN
    CREATE POLICY "Users can view own registrations" ON public.course_live_session_registrations
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_live_session_registrations' AND policyname = 'Users can register for sessions'
  ) THEN
    CREATE POLICY "Users can register for sessions" ON public.course_live_session_registrations
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policies pour course_live_session_questions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_live_session_questions' AND policyname = 'Users can manage own questions'
  ) THEN
    CREATE POLICY "Users can manage own questions" ON public.course_live_session_questions
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function: Get upcoming sessions for a course
CREATE OR REPLACE FUNCTION public.get_upcoming_sessions(
  p_course_id UUID
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  scheduled_start TIMESTAMPTZ,
  status TEXT,
  registered_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ls.id,
    ls.title,
    ls.scheduled_start,
    ls.status,
    (SELECT COUNT(*) FROM public.course_live_session_registrations WHERE session_id = ls.id AND status = 'registered')::BIGINT as registered_count
  FROM public.course_live_sessions ls
  WHERE ls.course_id = p_course_id
  AND ls.status IN ('scheduled', 'live')
  AND ls.scheduled_start > now()
  ORDER BY ls.scheduled_start ASC;
END;
$$;

-- Function: Register for a session
CREATE OR REPLACE FUNCTION public.register_for_session(
  p_session_id UUID,
  p_enrollment_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_registration_id UUID;
  v_registered_count INTEGER;
BEGIN
  -- Récupérer infos session
  SELECT * INTO v_session
  FROM public.course_live_sessions
  WHERE id = p_session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session non trouvée';
  END IF;
  
  -- Vérifier capacité
  IF v_session.max_participants IS NOT NULL THEN
    SELECT COUNT(*) INTO v_registered_count
    FROM public.course_live_session_registrations
    WHERE session_id = p_session_id
    AND status = 'registered';
    
    IF v_registered_count >= v_session.max_participants THEN
      RAISE EXCEPTION 'Session complète';
    END IF;
  END IF;
  
  -- Enregistrer
  INSERT INTO public.course_live_session_registrations (
    session_id,
    enrollment_id,
    user_id,
    status
  )
  VALUES (
    p_session_id,
    p_enrollment_id,
    p_user_id,
    'registered'
  )
  ON CONFLICT (session_id, enrollment_id) DO NOTHING
  RETURNING id INTO v_registration_id;
  
  RETURN v_registration_id;
END;
$$;

-- =====================================================
-- 6. COMMENTS
-- =====================================================
COMMENT ON TABLE public.course_live_sessions IS 'Sessions en direct (webinaires) pour les cours';
COMMENT ON TABLE public.course_live_session_registrations IS 'Inscriptions aux sessions en direct';
COMMENT ON TABLE public.course_live_session_questions IS 'Questions posées pendant les sessions en direct';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

