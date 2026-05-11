
-- =====================================================
-- 4. COURSES SYSTEM: Create missing tables
-- =====================================================

-- course_cohorts
CREATE TABLE IF NOT EXISTS public.course_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  cohort_name text NOT NULL,
  cohort_slug text NOT NULL,
  cohort_description text,
  cohort_number integer,
  start_date date NOT NULL,
  end_date date,
  enrollment_start_date date,
  enrollment_end_date date,
  max_students integer,
  current_students integer DEFAULT 0,
  waitlist_enabled boolean DEFAULT false,
  waitlist_capacity integer DEFAULT 0,
  status text DEFAULT 'draft',
  is_public boolean DEFAULT true,
  allow_late_enrollment boolean DEFAULT false,
  auto_start boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_cohorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public cohorts viewable" ON public.course_cohorts;
CREATE POLICY "Public cohorts viewable" ON public.course_cohorts FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Instructors can manage cohorts" ON public.course_cohorts;
CREATE POLICY "Instructors can manage cohorts" ON public.course_cohorts FOR ALL USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_cohorts.course_id AND courses.instructor_id = auth.uid())
);

-- cohort_enrollments
CREATE TABLE IF NOT EXISTS public.cohort_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES public.course_cohorts(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  enrollment_status text DEFAULT 'pending',
  enrolled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  dropped_at timestamptz,
  progress_percentage numeric DEFAULT 0,
  last_accessed_at timestamptz,
  final_grade numeric,
  certificate_issued boolean DEFAULT false,
  certificate_issued_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cohort_id, student_id)
);

ALTER TABLE public.cohort_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own enrollment" ON public.cohort_enrollments;
CREATE POLICY "Students can view own enrollment" ON public.cohort_enrollments FOR SELECT USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "Students can enroll" ON public.cohort_enrollments;
CREATE POLICY "Students can enroll" ON public.cohort_enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "Instructors can manage enrollments" ON public.cohort_enrollments;
CREATE POLICY "Instructors can manage enrollments" ON public.cohort_enrollments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM course_cohorts cc JOIN courses c ON c.id = cc.course_id
    WHERE cc.id = cohort_enrollments.cohort_id AND c.instructor_id = auth.uid()
  )
);

-- course_assignments
CREATE TABLE IF NOT EXISTS public.course_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  section_id uuid REFERENCES public.course_sections(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  instructions text,
  assignment_type text DEFAULT 'text',
  max_file_size integer DEFAULT 10485760,
  allowed_file_types text[] DEFAULT '{}',
  max_files integer DEFAULT 5,
  points_possible numeric DEFAULT 100,
  grading_type text DEFAULT 'points',
  due_date timestamptz,
  allow_late_submission boolean DEFAULT false,
  late_penalty_percentage numeric DEFAULT 0,
  is_required boolean DEFAULT true,
  is_visible boolean DEFAULT true,
  order_index integer DEFAULT 0,
  rubric jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can manage assignments" ON public.course_assignments;
CREATE POLICY "Instructors can manage assignments" ON public.course_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_assignments.course_id AND courses.instructor_id = auth.uid())
);
DROP POLICY IF EXISTS "Enrolled students can view assignments" ON public.course_assignments;
CREATE POLICY "Enrolled students can view assignments" ON public.course_assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM course_enrollments ce WHERE ce.course_id = course_assignments.course_id AND ce.user_id = auth.uid()
  )
);

-- assignment_submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.course_assignments(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  submission_text text,
  submission_files jsonb DEFAULT '[]'::jsonb,
  submission_url text,
  submission_code text,
  status text DEFAULT 'draft',
  submitted_at timestamptz,
  graded_at timestamptz,
  graded_by uuid,
  grade numeric,
  feedback text,
  feedback_files jsonb DEFAULT '[]'::jsonb,
  is_late boolean DEFAULT false,
  late_penalty_applied numeric DEFAULT 0,
  attempt_number integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own submissions" ON public.assignment_submissions;
CREATE POLICY "Students can manage own submissions" ON public.assignment_submissions FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Instructors can manage submissions" ON public.assignment_submissions;
CREATE POLICY "Instructors can manage submissions" ON public.assignment_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = assignment_submissions.course_id AND courses.instructor_id = auth.uid())
);

-- learning_paths
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  short_description text,
  image_url text,
  level text DEFAULT 'all_levels',
  estimated_duration_hours numeric,
  estimated_duration_days numeric,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_free boolean DEFAULT false,
  price numeric DEFAULT 0,
  currency text DEFAULT 'XOF',
  learning_objectives text[] DEFAULT '{}',
  target_audience text[] DEFAULT '{}',
  total_courses integer DEFAULT 0,
  total_students integer DEFAULT 0,
  completion_rate numeric DEFAULT 0,
  average_rating numeric DEFAULT 0,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active paths viewable" ON public.learning_paths;
CREATE POLICY "Active paths viewable" ON public.learning_paths FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Creators can manage paths" ON public.learning_paths;
CREATE POLICY "Creators can manage paths" ON public.learning_paths FOR ALL USING (auth.uid() = created_by);

-- learning_path_courses
CREATE TABLE IF NOT EXISTS public.learning_path_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id uuid REFERENCES public.learning_paths(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  order_index integer DEFAULT 0,
  is_required boolean DEFAULT true,
  unlock_after_completion boolean DEFAULT false,
  estimated_duration_hours numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(learning_path_id, course_id)
);

ALTER TABLE public.learning_path_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Path courses viewable" ON public.learning_path_courses;
CREATE POLICY "Path courses viewable" ON public.learning_path_courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Path creators can manage" ON public.learning_path_courses;
CREATE POLICY "Path creators can manage" ON public.learning_path_courses FOR ALL USING (
  EXISTS (SELECT 1 FROM learning_paths WHERE learning_paths.id = learning_path_courses.learning_path_id AND learning_paths.created_by = auth.uid())
);

-- live_sessions
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  cohort_id uuid REFERENCES public.course_cohorts(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  session_type text DEFAULT 'webinar',
  platform text DEFAULT 'zoom',
  meeting_url text,
  meeting_id text,
  meeting_password text,
  streaming_url text,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  duration_minutes integer,
  status text DEFAULT 'scheduled',
  max_participants integer,
  is_public boolean DEFAULT false,
  recording_enabled boolean DEFAULT true,
  recording_url text,
  recording_available_until timestamptz,
  allow_questions boolean DEFAULT true,
  allow_chat boolean DEFAULT true,
  allow_screen_share boolean DEFAULT false,
  require_registration boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sessions viewable by enrolled" ON public.live_sessions;
CREATE POLICY "Sessions viewable by enrolled" ON public.live_sessions FOR SELECT USING (
  is_public = true OR
  EXISTS (SELECT 1 FROM courses WHERE courses.id = live_sessions.course_id AND courses.instructor_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM course_enrollments WHERE course_enrollments.course_id = live_sessions.course_id AND course_enrollments.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Instructors can manage sessions" ON public.live_sessions;
CREATE POLICY "Instructors can manage sessions" ON public.live_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = live_sessions.course_id AND courses.instructor_id = auth.uid())
);

-- session_registrations
CREATE TABLE IF NOT EXISTS public.session_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES public.course_enrollments(id),
  user_id uuid NOT NULL,
  registered_at timestamptz DEFAULT now(),
  attended boolean DEFAULT false,
  joined_at timestamptz,
  left_at timestamptz,
  attendance_duration_minutes integer DEFAULT 0,
  feedback_rating integer,
  feedback_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.session_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own registrations" ON public.session_registrations;
CREATE POLICY "Users can manage own registrations" ON public.session_registrations FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Instructors can view registrations" ON public.session_registrations;
CREATE POLICY "Instructors can view registrations" ON public.session_registrations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM live_sessions ls JOIN courses c ON c.id = ls.course_id
    WHERE ls.id = session_registrations.session_id AND c.instructor_id = auth.uid()
  )
);

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_course_cohorts_updated_at ON public.course_cohorts;
CREATE TRIGGER update_course_cohorts_updated_at BEFORE UPDATE ON public.course_cohorts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_cohort_enrollments_updated_at ON public.cohort_enrollments;
CREATE TRIGGER update_cohort_enrollments_updated_at BEFORE UPDATE ON public.cohort_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_course_assignments_updated_at ON public.course_assignments;
CREATE TRIGGER update_course_assignments_updated_at BEFORE UPDATE ON public.course_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON public.assignment_submissions;
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON public.learning_paths;
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON public.learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON public.live_sessions;
CREATE TRIGGER update_live_sessions_updated_at BEFORE UPDATE ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
