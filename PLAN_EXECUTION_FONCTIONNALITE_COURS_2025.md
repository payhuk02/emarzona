# 🎯 PLAN D'EXÉCUTION TECHNIQUE - FONCTIONNALITÉ COURS PAYHUK 2025

---

**Date** : 27 Octobre 2025  
**Projet** : Ajout fonctionnalité e-commerce de Cours  
**Plateforme** : Payhuk SaaS  
**Durée estimée** : 14 semaines (3.5 mois)

---

## 📋 CHECKLIST MASTER - VUE D'ENSEMBLE

### ✅ Phase 1: Fondations (Semaines 1-2)
- [ ] Base de données et migrations SQL
- [ ] Types TypeScript
- [ ] Hooks de base
- [ ] Routes de navigation
- [ ] Composants UI de base

### ✅ Phase 2: Création de Cours (Semaines 3-4)
- [ ] Interface de création
- [ ] Gestion curriculum
- [ ] Upload vidéos
- [ ] Ressources téléchargeables

### ✅ Phase 3: Quiz & Évaluations (Semaine 5)
- [ ] Création quiz
- [ ] Prise de quiz
- [ ] Évaluation automatique

### ✅ Phase 4: Lecteur de Cours (Semaines 6-7)
- [ ] Player vidéo custom
- [ ] Sidebar curriculum
- [ ] Prise de notes
- [ ] Tracking progression

### ✅ Phase 5: Discussions & Communauté (Semaine 8)
- [ ] Système Q&A
- [ ] Threads de discussion
- [ ] Upvotes/solutions

### ✅ Phase 6: Certificats (Semaine 9)
- [ ] Génération PDF
- [ ] Vérification publique
- [ ] Partage social

### ✅ Phase 7: Dashboards (Semaine 10)
- [ ] Dashboard enseignant
- [ ] Dashboard étudiant
- [ ] Analytics

### ✅ Phase 8: Marketplace (Semaine 11)
- [ ] Page catalogue
- [ ] Filtres avancés
- [ ] Page détail cours

### ✅ Phase 9: Optimisations (Semaine 12)
- [ ] Performance
- [ ] UX polish
- [ ] Caching

### ✅ Phase 10: Tests & Déploiement (Semaines 13-14)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Documentation
- [ ] Déploiement

---

## 🗓️ PHASE 1: FONDATIONS (Semaines 1-2)

### 📊 Base de Données - Migration SQL

#### Fichier: `supabase/migrations/20251027_courses_system_complete.sql`

```sql
-- =====================================================
-- PAYHUK COURSES SYSTEM - COMPLETE MIGRATION
-- Date: 27 Octobre 2025
-- Description: Système complet LMS pour cours en ligne
-- =====================================================

-- =====================================================
-- 1. TABLE: courses
-- =====================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  
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

-- Indexes
CREATE INDEX idx_courses_product_id ON courses(product_id);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_language ON courses(language);
CREATE INDEX idx_courses_enrollments ON courses(total_enrollments DESC);
CREATE INDEX idx_courses_rating ON courses(average_rating DESC);

-- Trigger updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active courses"
  ON courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = courses.product_id
      AND p.is_active = true
      AND p.is_draft = false
    )
  );

CREATE POLICY "Instructors can manage their courses"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = courses.product_id
      AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. TABLE: course_sections
-- =====================================================
CREATE TABLE course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
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

CREATE INDEX idx_course_sections_course_id ON course_sections(course_id);
CREATE INDEX idx_course_sections_order ON course_sections(course_id, order_index);

-- Trigger
CREATE TRIGGER update_course_sections_updated_at
  BEFORE UPDATE ON course_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sections visible with course"
  ON course_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN products p ON p.id = c.product_id
      WHERE c.id = course_sections.course_id
      AND p.is_active = true
    )
  );

CREATE POLICY "Instructors can manage sections"
  ON course_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN products p ON p.id = c.product_id
      JOIN stores s ON s.id = p.store_id
      WHERE c.id = course_sections.course_id
      AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. TABLE: course_lessons
-- =====================================================
CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  
  -- Contenu vidéo
  video_type TEXT NOT NULL CHECK (video_type IN ('upload', 'youtube', 'vimeo')) DEFAULT 'upload',
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

CREATE INDEX idx_course_lessons_section_id ON course_lessons(section_id);
CREATE INDEX idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX idx_course_lessons_is_preview ON course_lessons(is_preview);
CREATE INDEX idx_course_lessons_order ON course_lessons(section_id, order_index);

-- Trigger
CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preview lessons are public"
  ON course_lessons FOR SELECT
  USING (is_preview = true);

CREATE POLICY "Enrolled users can view lessons"
  ON course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.course_id = course_lessons.course_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
  );

CREATE POLICY "Instructors can manage lessons"
  ON course_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN products p ON p.id = c.product_id
      JOIN stores s ON s.id = p.store_id
      WHERE c.id = course_lessons.course_id
      AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TABLE: course_quizzes
-- =====================================================
CREATE TABLE course_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
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

CREATE INDEX idx_course_quizzes_lesson_id ON course_quizzes(lesson_id);
CREATE INDEX idx_course_quizzes_course_id ON course_quizzes(course_id);

-- Trigger
CREATE TRIGGER update_course_quizzes_updated_at
  BEFORE UPDATE ON course_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE course_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users can view quizzes"
  ON course_quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.course_id = course_quizzes.course_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
  );

CREATE POLICY "Instructors can manage quizzes"
  ON course_quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN products p ON p.id = c.product_id
      JOIN stores s ON s.id = p.store_id
      WHERE c.id = course_quizzes.course_id
      AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. TABLE: course_enrollments
-- =====================================================
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled', 'expired')) DEFAULT 'active',
  enrollment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  completion_date TIMESTAMPTZ,
  
  -- Progression
  progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_lessons INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  last_accessed_lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
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

CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_status ON course_enrollments(status);
CREATE INDEX idx_course_enrollments_progress ON course_enrollments(progress_percentage);

-- Trigger
CREATE TRIGGER update_course_enrollments_updated_at
  BEFORE UPDATE ON course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments"
  ON course_enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view enrollments for their courses"
  ON course_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN products p ON p.id = c.product_id
      JOIN stores s ON s.id = p.store_id
      WHERE c.id = course_enrollments.course_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create enrollments"
  ON course_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own enrollments"
  ON course_enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- 6. TABLE: course_lesson_progress
-- =====================================================
CREATE TABLE course_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
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

CREATE INDEX idx_lesson_progress_enrollment_id ON course_lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson_id ON course_lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_user_id ON course_lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_completed ON course_lesson_progress(is_completed);

-- Trigger
CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON course_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE course_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own progress"
  ON course_lesson_progress FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view progress"
  ON course_lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments ce
      JOIN courses c ON c.id = ce.course_id
      JOIN products p ON p.id = c.product_id
      JOIN stores s ON s.id = p.store_id
      WHERE ce.id = course_lesson_progress.enrollment_id
      AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. TABLE: quiz_attempts
-- =====================================================
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  
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

CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_enrollment_id ON quiz_attempts(enrollment_id);
CREATE INDEX idx_quiz_attempts_passed ON quiz_attempts(passed);

-- RLS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts"
  ON quiz_attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can view all attempts"
  ON quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_quizzes cq
      JOIN courses c ON c.id = cq.course_id
      JOIN products p ON p.id = c.product_id
      JOIN stores s ON s.id = p.store_id
      WHERE cq.id = quiz_attempts.quiz_id
      AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 8. TABLE: course_discussions
-- =====================================================
CREATE TABLE course_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
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

CREATE INDEX idx_course_discussions_course_id ON course_discussions(course_id);
CREATE INDEX idx_course_discussions_lesson_id ON course_discussions(lesson_id);
CREATE INDEX idx_course_discussions_user_id ON course_discussions(user_id);
CREATE INDEX idx_course_discussions_type ON course_discussions(discussion_type);
CREATE INDEX idx_course_discussions_answered ON course_discussions(is_answered);

-- Trigger
CREATE TRIGGER update_discussions_updated_at
  BEFORE UPDATE ON course_discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE course_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users can view discussions"
  ON course_discussions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.course_id = course_discussions.course_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM courses c
      JOIN products p ON p.id = c.product_id
      JOIN stores s ON s.id = p.store_id
      WHERE c.id = course_discussions.course_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Enrolled users can create discussions"
  ON course_discussions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.course_id = course_discussions.course_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Authors can update their discussions"
  ON course_discussions FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- 9. TABLE: course_discussion_replies
-- =====================================================
CREATE TABLE course_discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES course_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  is_instructor_reply BOOLEAN DEFAULT false,
  is_solution BOOLEAN DEFAULT false,
  
  upvotes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discussion_replies_discussion_id ON course_discussion_replies(discussion_id);
CREATE INDEX idx_discussion_replies_user_id ON course_discussion_replies(user_id);

-- Trigger
CREATE TRIGGER update_replies_updated_at
  BEFORE UPDATE ON course_discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE course_discussion_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies visible with discussion"
  ON course_discussion_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_discussions cd
      WHERE cd.id = course_discussion_replies.discussion_id
    )
  );

CREATE POLICY "Enrolled users can reply"
  ON course_discussion_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_discussions cd
      JOIN course_enrollments ce ON ce.course_id = cd.course_id
      WHERE cd.id = course_discussion_replies.discussion_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Authors can update replies"
  ON course_discussion_replies FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- 10. TABLE: course_certificates
-- =====================================================
CREATE TABLE course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  
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

CREATE INDEX idx_course_certificates_course_id ON course_certificates(course_id);
CREATE INDEX idx_course_certificates_user_id ON course_certificates(user_id);
CREATE UNIQUE INDEX idx_course_certificates_number ON course_certificates(certificate_number);
CREATE INDEX idx_course_certificates_valid ON course_certificates(is_valid, revoked);

-- RLS
ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates"
  ON course_certificates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Public certificates are visible to all"
  ON course_certificates FOR SELECT
  USING (is_public = true AND is_valid = true AND revoked = false);

-- =====================================================
-- 11. TABLE: instructor_profiles
-- =====================================================
CREATE TABLE instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  
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

CREATE INDEX idx_instructor_profiles_user_id ON instructor_profiles(user_id);
CREATE INDEX idx_instructor_profiles_store_id ON instructor_profiles(store_id);
CREATE INDEX idx_instructor_profiles_verified ON instructor_profiles(is_verified);
CREATE INDEX idx_instructor_profiles_rating ON instructor_profiles(average_rating DESC);

-- Trigger
CREATE TRIGGER update_instructor_profiles_updated_at
  BEFORE UPDATE ON instructor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor profiles are public"
  ON instructor_profiles FOR SELECT
  USING (true);

CREATE POLICY "Instructors can manage their own profile"
  ON instructor_profiles FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- FONCTIONS SQL UTILITAIRES
-- =====================================================

-- Fonction: Calculer progression cours
CREATE OR REPLACE FUNCTION calculate_course_progress(p_enrollment_id UUID)
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
  FROM course_lessons cl
  JOIN course_enrollments ce ON ce.course_id = cl.course_id
  WHERE ce.id = p_enrollment_id;
  
  -- Compter leçons complétées
  SELECT COUNT(*)
  INTO v_completed_lessons
  FROM course_lesson_progress clp
  WHERE clp.enrollment_id = p_enrollment_id
  AND clp.is_completed = true;
  
  -- Calculer pourcentage
  IF v_total_lessons > 0 THEN
    v_progress := (v_completed_lessons::NUMERIC / v_total_lessons) * 100;
  ELSE
    v_progress := 0;
  END IF;
  
  -- Mettre à jour enrollment
  UPDATE course_enrollments
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
CREATE OR REPLACE FUNCTION generate_certificate_number()
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
  FROM course_certificates
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_certificate_number := 'CERT-' || v_year || '-' || v_number;
  
  RETURN v_certificate_number;
END;
$$;

-- Fonction: Marquer leçon complétée
CREATE OR REPLACE FUNCTION mark_lesson_complete(
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
  INSERT INTO course_lesson_progress (
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
    completed_at = COALESCE(course_lesson_progress.completed_at, now()),
    times_watched = course_lesson_progress.times_watched + 1,
    updated_at = now();
  
  -- Recalculer progression
  PERFORM calculate_course_progress(p_enrollment_id);
  
  RETURN true;
END;
$$;

-- Fonction: Vérifier éligibilité certificat
CREATE OR REPLACE FUNCTION check_certificate_eligibility(p_enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_progress NUMERIC;
  v_passing_score INTEGER;
  v_average_quiz_score NUMERIC;
BEGIN
  -- Récupérer progression et passing score
  SELECT ce.progress_percentage, c.certificate_passing_score
  INTO v_progress, v_passing_score
  FROM course_enrollments ce
  JOIN courses c ON c.id = ce.course_id
  WHERE ce.id = p_enrollment_id;
  
  -- Vérifier progression 100%
  IF v_progress < 100 THEN
    RETURN false;
  END IF;
  
  -- Calculer moyenne quiz (uniquement tentatives réussies)
  SELECT AVG(score)
  INTO v_average_quiz_score
  FROM quiz_attempts qa
  WHERE qa.enrollment_id = p_enrollment_id
  AND qa.passed = true;
  
  -- Si pas de quiz, considérer éligible
  IF v_average_quiz_score IS NULL THEN
    RETURN true;
  END IF;
  
  -- Vérifier score minimum
  RETURN v_average_quiz_score >= v_passing_score;
END;
$$;

-- =====================================================
-- TRIGGERS AUTOMATIQUES
-- =====================================================

-- Trigger: Auto-update course stats on enrollment
CREATE OR REPLACE FUNCTION update_course_stats_on_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Nouveau enrollment
    UPDATE courses
    SET total_enrollments = total_enrollments + 1
    WHERE id = NEW.course_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Statut changé (pas d'action pour l'instant)
    NULL;
  ELSIF TG_OP = 'DELETE' THEN
    -- Enrollment supprimé
    UPDATE courses
    SET total_enrollments = GREATEST(total_enrollments - 1, 0)
    WHERE id = OLD.course_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_course_stats
  AFTER INSERT OR UPDATE OR DELETE ON course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_stats_on_enrollment();

-- Trigger: Auto-update discussion replies count
CREATE OR REPLACE FUNCTION update_discussion_replies_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE course_discussions
    SET replies_count = replies_count + 1
    WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE course_discussions
    SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = OLD.discussion_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_replies_count
  AFTER INSERT OR DELETE ON course_discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_replies_count();

-- =====================================================
-- DONNÉES DE TEST (OPTIONNEL - À SUPPRIMER EN PROD)
-- =====================================================

-- Insérer un profil instructeur test (décommentez si besoin)
/*
INSERT INTO instructor_profiles (
  user_id,
  display_name,
  headline,
  bio,
  expertise_areas
)
SELECT 
  id,
  'John Doe',
  'Expert Marketing Digital',
  'Plus de 10 ans d''expérience en marketing digital et formation en ligne.',
  ARRAY['marketing', 'social-media', 'seo']
FROM auth.users
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;
*/

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Commentaires pour documentation
COMMENT ON TABLE courses IS 'Table principale des cours en ligne - extension de products';
COMMENT ON TABLE course_sections IS 'Sections/chapitres d''un cours';
COMMENT ON TABLE course_lessons IS 'Leçons individuelles avec contenu vidéo';
COMMENT ON TABLE course_quizzes IS 'Quiz et évaluations';
COMMENT ON TABLE course_enrollments IS 'Inscriptions étudiants aux cours';
COMMENT ON TABLE course_lesson_progress IS 'Progression détaillée par leçon';
COMMENT ON TABLE quiz_attempts IS 'Tentatives de quiz des étudiants';
COMMENT ON TABLE course_discussions IS 'Discussions et Q&A par cours';
COMMENT ON TABLE course_discussion_replies IS 'Réponses aux discussions';
COMMENT ON TABLE course_certificates IS 'Certificats de complétion';
COMMENT ON TABLE instructor_profiles IS 'Profils publics des instructeurs';
```

#### ✅ Checklist Migration SQL
- [ ] Créer le fichier de migration
- [ ] Tester localement avec Supabase CLI
- [ ] Vérifier que toutes les tables sont créées
- [ ] Vérifier les indexes
- [ ] Tester les RLS policies
- [ ] Tester les fonctions SQL
- [ ] Documenter les changements

---

### 📘 Types TypeScript

#### Fichier: `src/types/courses.ts`

```typescript
// Ce fichier est déjà inclus dans ANALYSE_APPROFONDIE_POUR_AJOUT_FONCTIONNALITE_COURS.md
// Voir section "TYPES TYPESCRIPT" pour le contenu complet
```

#### ✅ Checklist Types
- [ ] Créer `src/types/courses.ts`
- [ ] Exporter tous les types
- [ ] Importer dans les composants qui en ont besoin
- [ ] Valider avec TypeScript (pas d'erreurs)

---

### 🎣 Hooks de base

#### Fichier: `src/hooks/courses/useCourses.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '@/types/courses';

/**
 * Hook pour récupérer tous les cours
 */
export const useCourses = (storeId?: string) => {
  return useQuery({
    queryKey: ['courses', storeId],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select(`
          *,
          product:products(
            id,
            name,
            slug,
            price,
            currency,
            image_url,
            is_active,
            store_id
          )
        `)
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('product.store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Course[];
    },
  });
};

/**
 * Hook pour récupérer un cours par ID
 */
export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          product:products(*),
          sections:course_sections(
            *,
            lessons:course_lessons(*)
          )
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });
};

/**
 * Hook pour créer un cours
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseData: Partial<Course>) => {
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Succès',
        description: 'Le cours a été créé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour un cours
 */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ courseId, updates }: { courseId: string; updates: Partial<Course> }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Succès',
        description: 'Le cours a été mis à jour.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer un cours
 */
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Succès',
        description: 'Le cours a été supprimé.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
```

#### ✅ Checklist Hooks
- [ ] Créer dossier `src/hooks/courses/`
- [ ] Créer `useCourses.ts`
- [ ] Créer `useCourseEnrollment.ts`
- [ ] Créer `useCourseProgress.ts`
- [ ] Créer `useQuizzes.ts`
- [ ] Créer `useDiscussions.ts`
- [ ] Créer `useCertificates.ts`
- [ ] Tester chaque hook isolément

---

### 🛣️ Routes de navigation

#### Fichier: `src/App.tsx` (mise à jour)

```typescript
// Dans la section lazy imports
const CreateCourse = lazy(() => import("./pages/courses/CreateCourse"));
const EditCourse = lazy(() => import("./pages/courses/EditCourse"));
const CourseDetail = lazy(() => import("./pages/courses/CourseDetail"));
const CoursePlayer = lazy(() => import("./pages/courses/CoursePlayer"));
const MyCourses = lazy(() => import("./pages/courses/MyCourses"));
const InstructorDashboard = lazy(() => import("./pages/courses/InstructorDashboard"));

// Dans le return, ajouter les routes
<Route path="/dashboard/courses" element={<ProtectedRoute><InstructorDashboard /></ProtectedRoute>} />
<Route path="/dashboard/courses/new" element={<ProtectedRoute><CreateCourse /></ProtectedRoute>} />
<Route path="/dashboard/courses/:id/edit" element={<ProtectedRoute><EditCourse /></ProtectedRoute>} />
<Route path="/dashboard/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
<Route path="/courses/:slug" element={<CourseDetail />} />
<Route path="/courses/:slug/learn" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
```

#### ✅ Checklist Routes
- [ ] Ajouter imports lazy
- [ ] Ajouter routes protégées
- [ ] Ajouter routes publiques
- [ ] Tester navigation
- [ ] Vérifier breadcrumbs

---

### 🧩 Composants UI de base

#### Fichier: `src/components/courses/marketplace/CourseCard.tsx`

```typescript
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, Users, BookOpen, Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { Course } from "@/types/courses";

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const { product } = course;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {product?.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Preview badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="gap-1">
            <Play className="w-3 h-3" />
            Preview
          </Badge>
        </div>
        
        {/* Level badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={
            course.level === 'beginner' ? 'default' :
            course.level === 'intermediate' ? 'secondary' :
            'destructive'
          }>
            {course.level}
          </Badge>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-2">
          {product?.name || 'Cours sans titre'}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {product?.short_description || product?.description || 'Aucune description'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {Math.floor(course.total_duration_minutes / 60)}h{course.total_duration_minutes % 60}m
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {course.total_lessons} leçons
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {course.total_enrollments} étudiants
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{course.average_rating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            (basé sur les avis)
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">
            {product?.promotional_price || product?.price} {product?.currency}
          </div>
          {product?.promotional_price && (
            <div className="text-sm text-muted-foreground line-through">
              {product.price} {product.currency}
            </div>
          )}
        </div>

        <Button asChild>
          <Link to={`/courses/${product?.slug}`}>
            Voir le cours
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
```

#### ✅ Checklist Composants UI
- [ ] Créer `CourseCard.tsx`
- [ ] Créer `CourseFilters.tsx`
- [ ] Créer `InstructorCard.tsx`
- [ ] Créer `CourseProgress.tsx` (barre de progression)
- [ ] Tester affichage responsive
- [ ] Vérifier accessibilité

---

## 🎓 SUITE DES PHASES (2-10)

Le plan complet des phases 2 à 10 est décrit en détail dans le document `ANALYSE_APPROFONDIE_POUR_AJOUT_FONCTIONNALITE_COURS.md`.

Pour chaque phase, suivre :
1. **Créer les composants** listés
2. **Implémenter les fonctionnalités** décrites
3. **Tester** chaque fonctionnalité isolément
4. **Intégrer** avec les autres parties
5. **Documenter** les changements

---

## 📊 OUTILS DE SUIVI

### GitHub Project / Notion Board

Créer un tableau Kanban avec colonnes :
- 📝 **TODO** : Tâches à faire
- 🚧 **IN PROGRESS** : En cours
- ✅ **DONE** : Terminées
- 🐛 **BUGS** : Bugs identifiés
- 📚 **DOCS** : Documentation

### Métriques de progression

Tracker chaque semaine :
- ✅ Tâches complétées / Total tâches
- ⏱️ Temps estimé vs temps réel
- 🐛 Nombre de bugs identifiés/résolus
- 📝 Couverture de tests (%)
- 🚀 Fonctionnalités déployées

---

## 🎯 PROCHAINES ACTIONS IMMÉDIATES

### Cette semaine (Semaine 1)

- [ ] **Jour 1** : Valider ce plan avec l'équipe
- [ ] **Jour 2-3** : Créer migration SQL et tester localement
- [ ] **Jour 4** : Créer types TypeScript
- [ ] **Jour 5** : Créer hooks de base + routes

### Semaine prochaine (Semaine 2)

- [ ] Créer composants UI de base
- [ ] Tester navigation entre pages
- [ ] Commencer Phase 2 (Création de cours)

---

## 📞 SUPPORT & RESSOURCES

### Documentation
- Supabase: https://supabase.com/docs
- React Query: https://tanstack.com/query/latest
- ShadCN UI: https://ui.shadcn.com

### Communauté
- Discord Payhuk (si existe)
- GitHub Issues pour bugs

---

**Document préparé le** : 27 Octobre 2025  
**Mise à jour** : À mettre à jour chaque semaine  
**Responsable** : Équipe Payhuk Dev

---

🚀 **Prêt à construire la meilleure plateforme de cours en ligne !**

