-- =====================================================
-- PAYHUK COURSES SYSTEM - COMPLETE MIGRATION
-- Date: 27 Octobre 2025
-- Description: Système complet LMS pour cours en ligne
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: courses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Métadonnées cours
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all_levels')) DEFAULT 'all_levels',
  language TEXT NOT NULL DEFAULT 'fr',
  subtitles TEXT[] DEFAULT '{}',
  total_duration_minutes INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  total_quizzes INTEGER DEFAULT 0,
  total_resources INTEGER DEFAULT 0,
  
  -- Contenu
  learning_objectives TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  target_audience TEXT[] DEFAULT '{}',
  
  -- Certificat
  certificate_enabled BOOLEAN DEFAULT true,
  certificate_template_url TEXT,
  certificate_passing_score INTEGER DEFAULT 80 CHECK (certificate_passing_score >= 0 AND certificate_passing_score <= 100),
  
  -- Drip content
  drip_enabled BOOLEAN DEFAULT false,
  drip_type TEXT CHECK (drip_type IN ('daily', 'weekly', 'none')) DEFAULT 'none',
  drip_interval INTEGER DEFAULT 1,
  
  -- Settings
  enable_qa BOOLEAN DEFAULT true,
  enable_discussions BOOLEAN DEFAULT true,
  enable_notes BOOLEAN DEFAULT true,
  enable_downloads BOOLEAN DEFAULT true,
  auto_play_next BOOLEAN DEFAULT true,
  
  -- Stats (calculées)
  total_enrollments INTEGER DEFAULT 0,
  average_completion_rate NUMERIC DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour courses
CREATE INDEX IF NOT EXISTS idx_courses_product_id ON public.courses(product_id);
CREATE INDEX IF NOT EXISTS idx_courses_level ON public.courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_language ON public.courses(language);
CREATE INDEX IF NOT EXISTS idx_courses_enrollments ON public.courses(total_enrollments DESC);
CREATE INDEX IF NOT EXISTS idx_courses_rating ON public.courses(average_rating DESC);

-- Trigger updated_at pour courses
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.courses IS 'Table principale des cours en ligne - extension de products';

-- =====================================================
-- 2. TABLE: course_sections
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  
  -- Drip
  is_locked BOOLEAN DEFAULT false,
  unlock_after_days INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(course_id, order_index)
);

-- Indexes pour course_sections
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON public.course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_order ON public.course_sections(course_id, order_index);

-- Trigger pour course_sections
CREATE TRIGGER update_course_sections_updated_at
  BEFORE UPDATE ON public.course_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.course_sections IS 'Sections/chapitres d''un cours';

-- =====================================================
-- 3. TABLE: course_lessons
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  
  -- Contenu vidéo
  video_type TEXT NOT NULL CHECK (video_type IN ('upload', 'youtube', 'vimeo', 'external')) DEFAULT 'upload',
  video_url TEXT NOT NULL,
  video_duration_seconds INTEGER DEFAULT 0,
  video_thumbnail_url TEXT,
  
  -- Contenu additionnel
  transcript TEXT,
  notes TEXT,
  
  -- Ressources téléchargeables
  downloadable_resources JSONB DEFAULT '[]',
  
  -- Progression
  is_preview BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT true,
  
  -- Quiz
  has_quiz BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(section_id, order_index)
);

-- Indexes pour course_lessons
CREATE INDEX IF NOT EXISTS idx_course_lessons_section_id ON public.course_lessons(section_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_is_preview ON public.course_lessons(is_preview);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON public.course_lessons(section_id, order_index);

-- Trigger pour course_lessons
CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.course_lessons IS 'Leçons individuelles avec contenu vidéo';

-- =====================================================
-- 4. TABLE: course_quizzes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  max_attempts INTEGER,
  time_limit_minutes INTEGER,
  shuffle_questions BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT true,
  
  -- Questions stockées en JSONB
  questions JSONB NOT NULL DEFAULT '[]',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour course_quizzes
CREATE INDEX IF NOT EXISTS idx_course_quizzes_lesson_id ON public.course_quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_quizzes_course_id ON public.course_quizzes(course_id);

-- Trigger pour course_quizzes
CREATE TRIGGER update_course_quizzes_updated_at
  BEFORE UPDATE ON public.course_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.course_quizzes IS 'Quiz et évaluations';

-- =====================================================
-- 5. TABLE: course_enrollments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled', 'expired')) DEFAULT 'active',
  enrollment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  completion_date TIMESTAMPTZ,
  
  -- Progression
  progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_lessons INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  last_accessed_lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  last_accessed_at TIMESTAMPTZ,
  
  -- Temps
  total_watch_time_minutes INTEGER DEFAULT 0,
  
  -- Certificat
  certificate_earned BOOLEAN DEFAULT false,
  certificate_url TEXT,
  certificate_issued_at TIMESTAMPTZ,
  
  -- Notes et favoris
  notes JSONB DEFAULT '[]',
  bookmarks JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(course_id, user_id)
);

-- Indexes pour course_enrollments
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON public.course_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_progress ON public.course_enrollments(progress_percentage);

-- Trigger pour course_enrollments
CREATE TRIGGER update_course_enrollments_updated_at
  BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.course_enrollments IS 'Inscriptions étudiants aux cours';

-- =====================================================
-- 6. TABLE: course_lesson_progress
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progression
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  watch_time_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  times_watched INTEGER DEFAULT 0,
  
  -- Notes
  personal_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(enrollment_id, lesson_id)
);

-- Indexes pour course_lesson_progress
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_id ON public.course_lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.course_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.course_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON public.course_lesson_progress(is_completed);

-- Trigger pour course_lesson_progress
CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON public.course_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.course_lesson_progress IS 'Progression détaillée par leçon';

-- =====================================================
-- 7. TABLE: quiz_attempts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  
  -- Résultats
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  
  -- Réponses
  answers JSONB NOT NULL,
  
  -- Temps
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  time_taken_seconds INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour quiz_attempts
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_enrollment_id ON public.quiz_attempts(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_passed ON public.quiz_attempts(passed);

-- Commentaire
COMMENT ON TABLE public.quiz_attempts IS 'Tentatives de quiz des étudiants';

-- =====================================================
-- 8. TABLE: course_discussions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contenu
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Type
  discussion_type TEXT NOT NULL CHECK (discussion_type IN ('question', 'discussion', 'announcement')) DEFAULT 'question',
  
  -- Status
  is_answered BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_at TIMESTAMPTZ,
  
  -- Engagement
  upvotes INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  
  -- Video timestamp
  video_timestamp_seconds INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour course_discussions
CREATE INDEX IF NOT EXISTS idx_course_discussions_course_id ON public.course_discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_discussions_lesson_id ON public.course_discussions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_discussions_user_id ON public.course_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_discussions_type ON public.course_discussions(discussion_type);
CREATE INDEX IF NOT EXISTS idx_course_discussions_answered ON public.course_discussions(is_answered);

-- Trigger pour course_discussions
CREATE TRIGGER update_discussions_updated_at
  BEFORE UPDATE ON public.course_discussions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.course_discussions IS 'Discussions et Q&A par cours';

-- =====================================================
-- 9. TABLE: course_discussion_replies
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.course_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  is_instructor_reply BOOLEAN DEFAULT false,
  is_solution BOOLEAN DEFAULT false,
  
  upvotes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour course_discussion_replies
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON public.course_discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_user_id ON public.course_discussion_replies(user_id);

-- Trigger pour course_discussion_replies
CREATE TRIGGER update_replies_updated_at
  BEFORE UPDATE ON public.course_discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.course_discussion_replies IS 'Réponses aux discussions';

-- =====================================================
-- 10. TABLE: course_certificates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  
  -- Certificat
  certificate_number TEXT NOT NULL UNIQUE,
  certificate_url TEXT NOT NULL,
  certificate_pdf_url TEXT,
  
  -- Détails
  student_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  completion_date DATE NOT NULL,
  final_score NUMERIC,
  
  -- Validation
  is_valid BOOLEAN DEFAULT true,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  -- Partage
  is_public BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour course_certificates
CREATE INDEX IF NOT EXISTS idx_course_certificates_course_id ON public.course_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_user_id ON public.course_certificates(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_certificates_number ON public.course_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_course_certificates_valid ON public.course_certificates(is_valid, revoked);

-- Commentaire
COMMENT ON TABLE public.course_certificates IS 'Certificats de complétion';

-- =====================================================
-- 11. TABLE: instructor_profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  
  -- Profil public
  display_name TEXT NOT NULL,
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- Expertise
  expertise_areas TEXT[] DEFAULT '{}',
  years_of_experience INTEGER,
  
  -- Réseaux sociaux
  website_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  
  -- Stats (calculées)
  total_students INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Badges
  is_verified BOOLEAN DEFAULT false,
  is_top_instructor BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour instructor_profiles
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user_id ON public.instructor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_store_id ON public.instructor_profiles(store_id);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_verified ON public.instructor_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_rating ON public.instructor_profiles(average_rating DESC);

-- Trigger pour instructor_profiles
CREATE TRIGGER update_instructor_profiles_updated_at
  BEFORE UPDATE ON public.instructor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.instructor_profiles IS 'Profils publics des instructeurs';

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

-- Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
CREATE POLICY "Anyone can view active courses"
  ON public.courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = courses.product_id
      AND p.is_active = true
      AND p.is_draft = false
    )
  );

DROP POLICY IF EXISTS "Instructors can manage their courses" ON public.courses;
CREATE POLICY "Instructors can manage their courses"
  ON public.courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = courses.product_id
      AND s.user_id = auth.uid()
    )
  );

-- Course sections
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sections visible with course" ON public.course_sections;
CREATE POLICY "Sections visible with course"
  ON public.course_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.products p ON p.id = c.product_id
      WHERE c.id = course_sections.course_id
      AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Instructors can manage sections" ON public.course_sections;
CREATE POLICY "Instructors can manage sections"
  ON public.course_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.products p ON p.id = c.product_id
      JOIN public.stores s ON s.id = p.store_id
      WHERE c.id = course_sections.course_id
      AND s.user_id = auth.uid()
    )
  );

-- Course lessons
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Preview lessons are public" ON public.course_lessons;
CREATE POLICY "Preview lessons are public"
  ON public.course_lessons FOR SELECT
  USING (is_preview = true);

DROP POLICY IF EXISTS "Enrolled users can view lessons" ON public.course_lessons;
CREATE POLICY "Enrolled users can view lessons"
  ON public.course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = course_lessons.course_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Instructors can manage lessons" ON public.course_lessons;
CREATE POLICY "Instructors can manage lessons"
  ON public.course_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.products p ON p.id = c.product_id
      JOIN public.stores s ON s.id = p.store_id
      WHERE c.id = course_lessons.course_id
      AND s.user_id = auth.uid()
    )
  );

-- Course quizzes
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled users can view quizzes" ON public.course_quizzes;
CREATE POLICY "Enrolled users can view quizzes"
  ON public.course_quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = course_quizzes.course_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Instructors can manage quizzes" ON public.course_quizzes;
CREATE POLICY "Instructors can manage quizzes"
  ON public.course_quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.products p ON p.id = c.product_id
      JOIN public.stores s ON s.id = p.store_id
      WHERE c.id = course_quizzes.course_id
      AND s.user_id = auth.uid()
    )
  );

-- Course enrollments
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can view their own enrollments"
  ON public.course_enrollments FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON public.course_enrollments;
CREATE POLICY "Instructors can view enrollments for their courses"
  ON public.course_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.products p ON p.id = c.product_id
      JOIN public.stores s ON s.id = p.store_id
      WHERE c.id = course_enrollments.course_id
      AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create enrollments" ON public.course_enrollments;
CREATE POLICY "System can create enrollments"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can update their own enrollments"
  ON public.course_enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- Lesson progress
ALTER TABLE public.course_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own progress" ON public.course_lesson_progress;
CREATE POLICY "Users can manage their own progress"
  ON public.course_lesson_progress FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can view progress" ON public.course_lesson_progress;
CREATE POLICY "Instructors can view progress"
  ON public.course_lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      JOIN public.courses c ON c.id = ce.course_id
      JOIN public.products p ON p.id = c.product_id
      JOIN public.stores s ON s.id = p.store_id
      WHERE ce.id = course_lesson_progress.enrollment_id
      AND s.user_id = auth.uid()
    )
  );

-- Quiz attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view their own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create attempts" ON public.quiz_attempts;
CREATE POLICY "Users can create attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can view all attempts" ON public.quiz_attempts;
CREATE POLICY "Instructors can view all attempts"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_quizzes cq
      JOIN public.courses c ON c.id = cq.course_id
      JOIN public.products p ON p.id = c.product_id
      JOIN public.stores s ON s.id = p.store_id
      WHERE cq.id = quiz_attempts.quiz_id
      AND s.user_id = auth.uid()
    )
  );

-- Discussions
ALTER TABLE public.course_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled users can view discussions" ON public.course_discussions;
CREATE POLICY "Enrolled users can view discussions"
  ON public.course_discussions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = course_discussions.course_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.products p ON p.id = c.product_id
      JOIN public.stores s ON s.id = p.store_id
      WHERE c.id = course_discussions.course_id
      AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enrolled users can create discussions" ON public.course_discussions;
CREATE POLICY "Enrolled users can create discussions"
  ON public.course_discussions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = course_discussions.course_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authors can update their discussions" ON public.course_discussions;
CREATE POLICY "Authors can update their discussions"
  ON public.course_discussions FOR UPDATE
  USING (user_id = auth.uid());

-- Discussion replies
ALTER TABLE public.course_discussion_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Replies visible with discussion" ON public.course_discussion_replies;
CREATE POLICY "Replies visible with discussion"
  ON public.course_discussion_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_discussions cd
      WHERE cd.id = course_discussion_replies.discussion_id
    )
  );

DROP POLICY IF EXISTS "Enrolled users can reply" ON public.course_discussion_replies;
CREATE POLICY "Enrolled users can reply"
  ON public.course_discussion_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_discussions cd
      JOIN public.course_enrollments ce ON ce.course_id = cd.course_id
      WHERE cd.id = course_discussion_replies.discussion_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authors can update replies" ON public.course_discussion_replies;
CREATE POLICY "Authors can update replies"
  ON public.course_discussion_replies FOR UPDATE
  USING (user_id = auth.uid());

-- Certificates
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own certificates" ON public.course_certificates;
CREATE POLICY "Users can view their own certificates"
  ON public.course_certificates FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public certificates are visible to all" ON public.course_certificates;
CREATE POLICY "Public certificates are visible to all"
  ON public.course_certificates FOR SELECT
  USING (is_public = true AND is_valid = true AND revoked = false);

-- Instructor profiles
ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructor profiles are public" ON public.instructor_profiles;
CREATE POLICY "Instructor profiles are public"
  ON public.instructor_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Instructors can manage their own profile" ON public.instructor_profiles;
CREATE POLICY "Instructors can manage their own profile"
  ON public.instructor_profiles FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- FONCTIONS SQL UTILITAIRES
-- =====================================================

-- Fonction: Calculer progression cours
CREATE OR REPLACE FUNCTION public.calculate_course_progress(p_enrollment_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_progress NUMERIC;
BEGIN
  -- Compter leçons totales
  SELECT COUNT(*)
  INTO v_total_lessons
  FROM public.course_lessons cl
  JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
  WHERE ce.id = p_enrollment_id;
  
  -- Compter leçons complétées
  SELECT COUNT(*)
  INTO v_completed_lessons
  FROM public.course_lesson_progress clp
  WHERE clp.enrollment_id = p_enrollment_id
  AND clp.is_completed = true;
  
  -- Calculer pourcentage
  IF v_total_lessons > 0 THEN
    v_progress := (v_completed_lessons::NUMERIC / v_total_lessons) * 100;
  ELSE
    v_progress := 0;
  END IF;
  
  -- Mettre à jour enrollment
  UPDATE public.course_enrollments
  SET 
    progress_percentage = v_progress,
    completed_lessons = v_completed_lessons,
    total_lessons = v_total_lessons,
    status = CASE
      WHEN v_progress = 100 THEN 'completed'
      ELSE status
    END,
    completion_date = CASE
      WHEN v_progress = 100 AND completion_date IS NULL THEN now()
      ELSE completion_date
    END,
    updated_at = now()
  WHERE id = p_enrollment_id;
  
  RETURN v_progress;
END;
$$;

-- Fonction: Générer numéro certificat
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_number TEXT;
  v_certificate_number TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT LPAD((COUNT(*) + 1)::TEXT, 6, '0')
  INTO v_number
  FROM public.course_certificates
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_certificate_number := 'CERT-' || v_year || '-' || v_number;
  
  RETURN v_certificate_number;
END;
$$;

-- Fonction: Marquer leçon complétée
CREATE OR REPLACE FUNCTION public.mark_lesson_complete(
  p_enrollment_id UUID,
  p_lesson_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update progress
  INSERT INTO public.course_lesson_progress (
    enrollment_id,
    lesson_id,
    user_id,
    is_completed,
    completed_at,
    times_watched
  )
  VALUES (
    p_enrollment_id,
    p_lesson_id,
    p_user_id,
    true,
    now(),
    1
  )
  ON CONFLICT (enrollment_id, lesson_id)
  DO UPDATE SET
    is_completed = true,
    completed_at = COALESCE(public.course_lesson_progress.completed_at, now()),
    times_watched = public.course_lesson_progress.times_watched + 1,
    updated_at = now();
  
  -- Recalculer progression
  PERFORM public.calculate_course_progress(p_enrollment_id);
  
  RETURN true;
END;
$$;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

