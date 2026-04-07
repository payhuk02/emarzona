
-- =====================================================
-- MIGRATION 4: COURS EN LIGNE
-- =====================================================

-- Cours
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  instructor_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  short_description text,
  thumbnail_url text,
  preview_video_url text,
  price numeric DEFAULT 0,
  promotional_price numeric,
  currency text DEFAULT 'XOF',
  difficulty text DEFAULT 'beginner',
  language text DEFAULT 'fr',
  duration_hours numeric DEFAULT 0,
  total_lessons integer DEFAULT 0,
  total_enrollments integer DEFAULT 0,
  rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  certificate_enabled boolean DEFAULT false,
  tags text[],
  category text,
  requirements text[],
  objectives text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Sections de cours
CREATE TABLE IF NOT EXISTS public.course_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Leçons
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content text,
  video_url text,
  video_duration integer DEFAULT 0,
  lesson_type text DEFAULT 'video',
  sort_order integer DEFAULT 0,
  is_free boolean DEFAULT false,
  is_published boolean DEFAULT true,
  attachments jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inscriptions aux cours
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status text DEFAULT 'active',
  progress_percentage numeric DEFAULT 0,
  completed_lessons integer DEFAULT 0,
  total_lessons integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  last_accessed_at timestamptz DEFAULT now(),
  certificate_issued boolean DEFAULT false,
  certificate_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- Progression des leçons
CREATE TABLE IF NOT EXISTS public.course_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  total_watch_time_seconds integer DEFAULT 0,
  last_position_seconds integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

-- Quiz
CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  passing_score integer DEFAULT 70,
  max_attempts integer,
  time_limit_minutes integer,
  questions jsonb DEFAULT '[]',
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tentatives de quiz
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '{}',
  score numeric,
  passed boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Certificats
CREATE TABLE IF NOT EXISTS public.course_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  certificate_number text UNIQUE,
  certificate_url text,
  issued_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notes de cours
CREATE TABLE IF NOT EXISTS public.course_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  content text NOT NULL,
  timestamp_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;

-- Policies: courses (public read)
DROP POLICY IF EXISTS "Published courses viewable by everyone" ON public.courses;
CREATE POLICY "Published courses viewable by everyone" ON public.courses FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Instructors can view own courses" ON public.courses;
CREATE POLICY "Instructors can view own courses" ON public.courses FOR SELECT USING (auth.uid() = instructor_id);
DROP POLICY IF EXISTS "Instructors can manage courses" ON public.courses;
CREATE POLICY "Instructors can manage courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = instructor_id AND EXISTS (SELECT 1 FROM stores WHERE stores.id = courses.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
CREATE POLICY "Instructors can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = instructor_id);
DROP POLICY IF EXISTS "Instructors can delete own courses" ON public.courses;
CREATE POLICY "Instructors can delete own courses" ON public.courses FOR DELETE USING (auth.uid() = instructor_id);

-- Policies: course_sections
DROP POLICY IF EXISTS "Sections of published courses viewable" ON public.course_sections;
CREATE POLICY "Sections of published courses viewable" ON public.course_sections FOR SELECT USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_sections.course_id AND (courses.is_published = true OR courses.instructor_id = auth.uid())));
DROP POLICY IF EXISTS "Instructors can manage sections" ON public.course_sections;
CREATE POLICY "Instructors can manage sections" ON public.course_sections FOR ALL USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_sections.course_id AND courses.instructor_id = auth.uid()));

-- Policies: course_lessons
DROP POLICY IF EXISTS "Lessons viewable by enrolled or free" ON public.course_lessons;
CREATE POLICY "Lessons viewable by enrolled or free" ON public.course_lessons FOR SELECT USING (
  is_free = true OR
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_lessons.course_id AND courses.instructor_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM course_enrollments WHERE course_enrollments.course_id = course_lessons.course_id AND course_enrollments.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Instructors can manage lessons" ON public.course_lessons;
CREATE POLICY "Instructors can manage lessons" ON public.course_lessons FOR ALL USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_lessons.course_id AND courses.instructor_id = auth.uid()));

-- Policies: course_enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Instructors can view course enrollments" ON public.course_enrollments;
CREATE POLICY "Instructors can view course enrollments" ON public.course_enrollments FOR SELECT USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_enrollments.course_id AND courses.instructor_id = auth.uid()));
DROP POLICY IF EXISTS "Users can enroll" ON public.course_enrollments;
CREATE POLICY "Users can enroll" ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own enrollment" ON public.course_enrollments;
CREATE POLICY "Users can update own enrollment" ON public.course_enrollments FOR UPDATE USING (auth.uid() = user_id);

-- Policies: course_lesson_progress
DROP POLICY IF EXISTS "Users can manage own progress" ON public.course_lesson_progress;
CREATE POLICY "Users can manage own progress" ON public.course_lesson_progress FOR ALL USING (EXISTS (SELECT 1 FROM course_enrollments WHERE course_enrollments.id = course_lesson_progress.enrollment_id AND course_enrollments.user_id = auth.uid()));

-- Policies: course_quizzes
DROP POLICY IF EXISTS "Quizzes viewable by enrolled" ON public.course_quizzes;
CREATE POLICY "Quizzes viewable by enrolled" ON public.course_quizzes FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_quizzes.course_id AND courses.instructor_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM course_enrollments WHERE course_enrollments.course_id = course_quizzes.course_id AND course_enrollments.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Instructors can manage quizzes" ON public.course_quizzes;
CREATE POLICY "Instructors can manage quizzes" ON public.course_quizzes FOR ALL USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_quizzes.course_id AND courses.instructor_id = auth.uid()));

-- Policies: quiz_attempts
DROP POLICY IF EXISTS "Users can manage own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can manage own attempts" ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Instructors can view attempts" ON public.quiz_attempts;
CREATE POLICY "Instructors can view attempts" ON public.quiz_attempts FOR SELECT USING (EXISTS (SELECT 1 FROM course_quizzes JOIN courses ON courses.id = course_quizzes.course_id WHERE course_quizzes.id = quiz_attempts.quiz_id AND courses.instructor_id = auth.uid()));

-- Policies: course_certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON public.course_certificates;
CREATE POLICY "Users can view own certificates" ON public.course_certificates FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Certificates are publicly verifiable" ON public.course_certificates;
CREATE POLICY "Certificates are publicly verifiable" ON public.course_certificates FOR SELECT USING (true);
DROP POLICY IF EXISTS "System can issue certificates" ON public.course_certificates;
CREATE POLICY "System can issue certificates" ON public.course_certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: course_notes
DROP POLICY IF EXISTS "Users can manage own notes" ON public.course_notes;
CREATE POLICY "Users can manage own notes" ON public.course_notes FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_courses_store_id ON public.courses(store_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON public.course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_section_id ON public.course_lessons(section_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_lesson_progress_enrollment_id ON public.course_lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_lesson_progress_lesson_id ON public.course_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);

-- Triggers
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_course_sections_updated_at ON public.course_sections;
CREATE TRIGGER update_course_sections_updated_at BEFORE UPDATE ON public.course_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_course_lessons_updated_at ON public.course_lessons;
CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_course_enrollments_updated_at ON public.course_enrollments;
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_course_lesson_progress_updated_at ON public.course_lesson_progress;
CREATE TRIGGER update_course_lesson_progress_updated_at BEFORE UPDATE ON public.course_lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_course_quizzes_updated_at ON public.course_quizzes;
CREATE TRIGGER update_course_quizzes_updated_at BEFORE UPDATE ON public.course_quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_course_notes_updated_at ON public.course_notes;
CREATE TRIGGER update_course_notes_updated_at BEFORE UPDATE ON public.course_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
