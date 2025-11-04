-- =====================================================
-- PAYHUK COURSES NOTES WITH TIMESTAMPS SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de notes personnelles avec timestamps multiples
--              Permet aux étudiants de prendre plusieurs notes avec timestamps
--              pendant la lecture des vidéos
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: course_notes
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_notes'
  ) THEN
    CREATE TABLE public.course_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Note avec timestamp
      content TEXT NOT NULL,
      timestamp_seconds INTEGER NOT NULL DEFAULT 0 CHECK (timestamp_seconds >= 0),
      
      -- Métadonnées
      note_type TEXT CHECK (note_type IN ('text', 'bookmark', 'highlight', 'question')) DEFAULT 'text',
      
      -- Tags et catégories
      tags TEXT[] DEFAULT '{}',
      
      -- Visibilité (pour partage futur)
      is_private BOOLEAN DEFAULT true,
      
      -- Organisé
      order_index INTEGER DEFAULT 0,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(enrollment_id, lesson_id, timestamp_seconds, order_index)
    );
  END IF;
END $$;

-- Indexes pour course_notes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_notes_enrollment_id'
  ) THEN
    CREATE INDEX idx_course_notes_enrollment_id ON public.course_notes(enrollment_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_notes_lesson_id'
  ) THEN
    CREATE INDEX idx_course_notes_lesson_id ON public.course_notes(lesson_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_notes_user_id'
  ) THEN
    CREATE INDEX idx_course_notes_user_id ON public.course_notes(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_notes_timestamp'
  ) THEN
    CREATE INDEX idx_course_notes_timestamp ON public.course_notes(lesson_id, timestamp_seconds);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_course_notes_updated_at'
  ) THEN
    CREATE TRIGGER update_course_notes_updated_at
      BEFORE UPDATE ON public.course_notes
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: course_note_bookmarks
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_note_bookmarks'
  ) THEN
    CREATE TABLE public.course_note_bookmarks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Bookmark
      timestamp_seconds INTEGER NOT NULL CHECK (timestamp_seconds >= 0),
      title TEXT,
      description TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(enrollment_id, lesson_id, timestamp_seconds)
    );
  END IF;
END $$;

-- Indexes pour course_note_bookmarks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_note_bookmarks_enrollment_id'
  ) THEN
    CREATE INDEX idx_note_bookmarks_enrollment_id ON public.course_note_bookmarks(enrollment_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_note_bookmarks_lesson_id'
  ) THEN
    CREATE INDEX idx_note_bookmarks_lesson_id ON public.course_note_bookmarks(lesson_id);
  END IF;
END $$;

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_note_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies pour course_notes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_notes' AND policyname = 'Students can view own notes'
  ) THEN
    CREATE POLICY "Students can view own notes" ON public.course_notes
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_notes' AND policyname = 'Students can create own notes'
  ) THEN
    CREATE POLICY "Students can create own notes" ON public.course_notes
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_notes' AND policyname = 'Students can update own notes'
  ) THEN
    CREATE POLICY "Students can update own notes" ON public.course_notes
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_notes' AND policyname = 'Students can delete own notes'
  ) THEN
    CREATE POLICY "Students can delete own notes" ON public.course_notes
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies pour course_note_bookmarks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_note_bookmarks' AND policyname = 'Students can manage own bookmarks'
  ) THEN
    CREATE POLICY "Students can manage own bookmarks" ON public.course_note_bookmarks
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Function: Get notes for a lesson with timestamps
CREATE OR REPLACE FUNCTION public.get_lesson_notes(
  p_enrollment_id UUID,
  p_lesson_id UUID
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  timestamp_seconds INTEGER,
  note_type TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cn.id,
    cn.content,
    cn.timestamp_seconds,
    cn.note_type,
    cn.tags,
    cn.created_at
  FROM public.course_notes cn
  WHERE cn.enrollment_id = p_enrollment_id
  AND cn.lesson_id = p_lesson_id
  ORDER BY cn.timestamp_seconds ASC, cn.created_at ASC;
END;
$$;

-- Function: Add note with timestamp
CREATE OR REPLACE FUNCTION public.add_lesson_note(
  p_enrollment_id UUID,
  p_lesson_id UUID,
  p_course_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_timestamp_seconds INTEGER DEFAULT 0,
  p_note_type TEXT DEFAULT 'text',
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_note_id UUID;
  v_order_index INTEGER;
BEGIN
  -- Calculer order_index pour ce timestamp
  SELECT COALESCE(MAX(order_index), 0) + 1
  INTO v_order_index
  FROM public.course_notes
  WHERE enrollment_id = p_enrollment_id
  AND lesson_id = p_lesson_id
  AND timestamp_seconds = p_timestamp_seconds;
  
  -- Créer la note
  INSERT INTO public.course_notes (
    enrollment_id,
    lesson_id,
    course_id,
    user_id,
    content,
    timestamp_seconds,
    note_type,
    tags,
    order_index
  )
  VALUES (
    p_enrollment_id,
    p_lesson_id,
    p_course_id,
    p_user_id,
    p_content,
    p_timestamp_seconds,
    p_note_type,
    p_tags,
    v_order_index
  )
  RETURNING id INTO v_note_id;
  
  RETURN v_note_id;
END;
$$;

-- =====================================================
-- 5. COMMENTS
-- =====================================================
COMMENT ON TABLE public.course_notes IS 'Notes personnelles avec timestamps pour les étudiants';
COMMENT ON TABLE public.course_note_bookmarks IS 'Marque-pages dans les vidéos';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

