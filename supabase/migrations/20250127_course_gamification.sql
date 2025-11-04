-- =====================================================
-- PAYHUK COURSES GAMIFICATION SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système complet de gamification pour cours en ligne
--              Points, badges, achievements, leaderboard, streaks
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: course_student_points
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_student_points'
  ) THEN
    CREATE TABLE public.course_student_points (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Points
      total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
      points_earned_today INTEGER DEFAULT 0 CHECK (points_earned_today >= 0),
      
      -- Streak
      current_streak_days INTEGER DEFAULT 0 CHECK (current_streak_days >= 0),
      longest_streak_days INTEGER DEFAULT 0 CHECK (longest_streak_days >= 0),
      last_activity_date DATE,
      
      -- Stats
      total_lessons_completed INTEGER DEFAULT 0 CHECK (total_lessons_completed >= 0),
      total_quizzes_passed INTEGER DEFAULT 0 CHECK (total_quizzes_passed >= 0),
      total_quizzes_perfect_score INTEGER DEFAULT 0 CHECK (total_quizzes_perfect_score >= 0),
      total_discussions_participated INTEGER DEFAULT 0 CHECK (total_discussions_participated >= 0),
      total_assignments_submitted INTEGER DEFAULT 0 CHECK (total_assignments_submitted >= 0),
      
      -- Level (calculé automatiquement)
      current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),
      experience_points INTEGER DEFAULT 0 CHECK (experience_points >= 0),
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(enrollment_id),
      UNIQUE(course_id, user_id)
    );
  END IF;
END $$;

-- Indexes pour course_student_points
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_student_points_enrollment_id'
  ) THEN
    CREATE INDEX idx_course_student_points_enrollment_id ON public.course_student_points(enrollment_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_student_points_course_id'
  ) THEN
    CREATE INDEX idx_course_student_points_course_id ON public.course_student_points(course_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_student_points_user_id'
  ) THEN
    CREATE INDEX idx_course_student_points_user_id ON public.course_student_points(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_student_points_total_points'
  ) THEN
    CREATE INDEX idx_course_student_points_total_points ON public.course_student_points(total_points DESC);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_student_points_streak'
  ) THEN
    CREATE INDEX idx_course_student_points_streak ON public.course_student_points(current_streak_days DESC);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_course_student_points_updated_at'
  ) THEN
    CREATE TRIGGER update_course_student_points_updated_at
      BEFORE UPDATE ON public.course_student_points
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: course_badges
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_badges'
  ) THEN
    CREATE TABLE public.course_badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Badge info
      name TEXT NOT NULL,
      description TEXT,
      icon_url TEXT,
      badge_type TEXT NOT NULL CHECK (badge_type IN ('lesson_completion', 'quiz_perfect', 'streak', 'engagement', 'custom')),
      
      -- Criteria
      points_required INTEGER DEFAULT 0 CHECK (points_required >= 0),
      criteria JSONB DEFAULT '{}', -- {lesson_count: 5, quiz_score: 100, streak_days: 7, etc.}
      
      -- Display
      display_order INTEGER DEFAULT 0,
      is_visible BOOLEAN DEFAULT true,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_badges
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_badges_course_id'
  ) THEN
    CREATE INDEX idx_course_badges_course_id ON public.course_badges(course_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_badges_type'
  ) THEN
    CREATE INDEX idx_course_badges_type ON public.course_badges(badge_type);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_course_badges_updated_at'
  ) THEN
    CREATE TRIGGER update_course_badges_updated_at
      BEFORE UPDATE ON public.course_badges
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: course_student_badges
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_student_badges'
  ) THEN
    CREATE TABLE public.course_student_badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      badge_id UUID NOT NULL REFERENCES public.course_badges(id) ON DELETE CASCADE,
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      notification_sent BOOLEAN DEFAULT false,
      
      UNIQUE(badge_id, enrollment_id)
    );
  END IF;
END $$;

-- Indexes pour course_student_badges
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_student_badges_badge_id'
  ) THEN
    CREATE INDEX idx_course_student_badges_badge_id ON public.course_student_badges(badge_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_student_badges_enrollment_id'
  ) THEN
    CREATE INDEX idx_course_student_badges_enrollment_id ON public.course_student_badges(enrollment_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_student_badges_user_id'
  ) THEN
    CREATE INDEX idx_course_student_badges_user_id ON public.course_student_badges(user_id);
  END IF;
END $$;

-- =====================================================
-- 4. TABLE: course_achievements
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_achievements'
  ) THEN
    CREATE TABLE public.course_achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Achievement info
      title TEXT NOT NULL,
      description TEXT,
      icon_url TEXT,
      achievement_type TEXT NOT NULL CHECK (achievement_type IN ('completion', 'perfect_score', 'speed', 'engagement', 'streak', 'custom')),
      
      -- Criteria & Rewards
      criteria JSONB DEFAULT '{}', -- {completion_percentage: 100, quiz_score: 100, completion_days: 30, etc.}
      reward_points INTEGER DEFAULT 0 CHECK (reward_points >= 0),
      
      -- Display
      display_order INTEGER DEFAULT 0,
      is_visible BOOLEAN DEFAULT true,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_achievements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_achievements_course_id'
  ) THEN
    CREATE INDEX idx_course_achievements_course_id ON public.course_achievements(course_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_course_achievements_updated_at'
  ) THEN
    CREATE TRIGGER update_course_achievements_updated_at
      BEFORE UPDATE ON public.course_achievements
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 5. TABLE: course_student_achievements
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_student_achievements'
  ) THEN
    CREATE TABLE public.course_student_achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      achievement_id UUID NOT NULL REFERENCES public.course_achievements(id) ON DELETE CASCADE,
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      notification_sent BOOLEAN DEFAULT false,
      
      UNIQUE(achievement_id, enrollment_id)
    );
  END IF;
END $$;

-- Indexes pour course_student_achievements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_student_achievements_enrollment_id'
  ) THEN
    CREATE INDEX idx_course_student_achievements_enrollment_id ON public.course_student_achievements(enrollment_id);
  END IF;
END $$;

-- =====================================================
-- 6. TABLE: course_points_history
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_points_history'
  ) THEN
    CREATE TABLE public.course_points_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Points transaction
      points_earned INTEGER NOT NULL CHECK (points_earned > 0),
      points_before INTEGER DEFAULT 0,
      points_after INTEGER DEFAULT 0,
      
      -- Source
      source_type TEXT NOT NULL CHECK (source_type IN ('lesson_completed', 'quiz_passed', 'quiz_perfect', 'discussion', 'assignment', 'streak', 'achievement', 'badge', 'manual')),
      source_id UUID, -- lesson_id, quiz_id, discussion_id, etc.
      source_description TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour course_points_history
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_points_history_enrollment_id'
  ) THEN
    CREATE INDEX idx_course_points_history_enrollment_id ON public.course_points_history(enrollment_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_points_history_user_id'
  ) THEN
    CREATE INDEX idx_course_points_history_user_id ON public.course_points_history(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_course_points_history_created_at'
  ) THEN
    CREATE INDEX idx_course_points_history_created_at ON public.course_points_history(created_at DESC);
  END IF;
END $$;

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.course_student_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_points_history ENABLE ROW LEVEL SECURITY;

-- Policies pour course_student_points
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_student_points' AND policyname = 'Students can view own points'
  ) THEN
    CREATE POLICY "Students can view own points" ON public.course_student_points
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_student_points' AND policyname = 'Instructors can view all points'
  ) THEN
    CREATE POLICY "Instructors can view all points" ON public.course_student_points
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.courses c
          JOIN public.products p ON p.id = c.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE c.id = course_student_points.course_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour course_badges
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_badges' AND policyname = 'Anyone can view visible badges'
  ) THEN
    CREATE POLICY "Anyone can view visible badges" ON public.course_badges
      FOR SELECT
      USING (is_visible = true OR course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.products p ON p.id = c.product_id
        JOIN public.stores s ON s.id = p.store_id
        WHERE s.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Policies pour course_student_badges
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_student_badges' AND policyname = 'Students can view own badges'
  ) THEN
    CREATE POLICY "Students can view own badges" ON public.course_student_badges
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_student_badges' AND policyname = 'Instructors can view all badges'
  ) THEN
    CREATE POLICY "Instructors can view all badges" ON public.course_student_badges
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.courses c
          JOIN public.products p ON p.id = c.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE c.id = course_student_badges.course_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour course_achievements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_achievements' AND policyname = 'Anyone can view visible achievements'
  ) THEN
    CREATE POLICY "Anyone can view visible achievements" ON public.course_achievements
      FOR SELECT
      USING (is_visible = true OR course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.products p ON p.id = c.product_id
        JOIN public.stores s ON s.id = p.store_id
        WHERE s.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Policies pour course_student_achievements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_student_achievements' AND policyname = 'Students can view own achievements'
  ) THEN
    CREATE POLICY "Students can view own achievements" ON public.course_student_achievements
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies pour course_points_history
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_points_history' AND policyname = 'Students can view own points history'
  ) THEN
    CREATE POLICY "Students can view own points history" ON public.course_points_history
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 8. FUNCTIONS
-- =====================================================

-- Function: Initialize student points
CREATE OR REPLACE FUNCTION public.initialize_student_points(
  p_enrollment_id UUID,
  p_course_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points_id UUID;
BEGIN
  INSERT INTO public.course_student_points (
    enrollment_id,
    course_id,
    user_id,
    total_points,
    current_level,
    experience_points
  )
  VALUES (
    p_enrollment_id,
    p_course_id,
    p_user_id,
    0,
    1,
    0
  )
  ON CONFLICT (enrollment_id) DO NOTHING
  RETURNING id INTO v_points_id;
  
  RETURN v_points_id;
END;
$$;

-- Function: Award points
CREATE OR REPLACE FUNCTION public.award_points(
  p_enrollment_id UUID,
  p_user_id UUID,
  p_points INTEGER,
  p_source_type TEXT,
  p_source_id UUID DEFAULT NULL,
  p_source_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_id UUID;
  v_points_before INTEGER;
  v_points_after INTEGER;
  v_points_record_id UUID;
BEGIN
  -- Get course_id
  SELECT course_id INTO v_course_id
  FROM public.course_enrollments
  WHERE id = p_enrollment_id;
  
  -- Initialize points if not exists
  PERFORM public.initialize_student_points(p_enrollment_id, v_course_id, p_user_id);
  
  -- Get current points
  SELECT total_points INTO v_points_before
  FROM public.course_student_points
  WHERE enrollment_id = p_enrollment_id;
  
  v_points_after := v_points_before + p_points;
  
  -- Update points
  UPDATE public.course_student_points
  SET
    total_points = v_points_after,
    points_earned_today = points_earned_today + p_points,
    updated_at = now()
  WHERE enrollment_id = p_enrollment_id;
  
  -- Record in history
  INSERT INTO public.course_points_history (
    enrollment_id,
    user_id,
    points_earned,
    points_before,
    points_after,
    source_type,
    source_id,
    source_description
  )
  VALUES (
    p_enrollment_id,
    p_user_id,
    p_points,
    v_points_before,
    v_points_after,
    p_source_type,
    p_source_id,
    p_source_description
  )
  RETURNING id INTO v_points_record_id;
  
  -- Update streak
  PERFORM public.update_streak(p_enrollment_id, p_user_id);
  
  -- Check for badge/achievement eligibility
  PERFORM public.check_badges_and_achievements(p_enrollment_id, p_user_id);
  
  RETURN true;
END;
$$;

-- Function: Update streak
CREATE OR REPLACE FUNCTION public.update_streak(
  p_enrollment_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE;
BEGIN
  v_today := CURRENT_DATE;
  
  SELECT last_activity_date, current_streak_days, longest_streak_days
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.course_student_points
  WHERE enrollment_id = p_enrollment_id;
  
  -- Initialize if first time
  IF v_last_activity IS NULL THEN
    UPDATE public.course_student_points
    SET
      last_activity_date = v_today,
      current_streak_days = 1,
      longest_streak_days = 1,
      updated_at = now()
    WHERE enrollment_id = p_enrollment_id;
    RETURN true;
  END IF;
  
  -- If activity today, no change
  IF v_last_activity = v_today THEN
    RETURN true;
  END IF;
  
  -- If activity yesterday, increment streak
  IF v_last_activity = v_today - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;
    
    UPDATE public.course_student_points
    SET
      last_activity_date = v_today,
      current_streak_days = v_current_streak,
      longest_streak_days = v_longest_streak,
      updated_at = now()
    WHERE enrollment_id = p_enrollment_id;
    
    RETURN true;
  END IF;
  
  -- If gap > 1 day, reset streak
  UPDATE public.course_student_points
  SET
    last_activity_date = v_today,
    current_streak_days = 1,
    updated_at = now()
  WHERE enrollment_id = p_enrollment_id;
  
  RETURN true;
END;
$$;

-- Function: Check badges and achievements
CREATE OR REPLACE FUNCTION public.check_badges_and_achievements(
  p_enrollment_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_id UUID;
  v_points_record RECORD;
  v_badge RECORD;
  v_achievement RECORD;
  v_lesson_count INTEGER;
  v_quiz_perfect_count INTEGER;
  v_streak_days INTEGER;
BEGIN
  -- Get course_id and points
  SELECT ce.course_id, csp.total_points, csp.total_lessons_completed,
         csp.total_quizzes_perfect_score, csp.current_streak_days
  INTO v_course_id, v_points_record.total_points, v_lesson_count,
       v_quiz_perfect_count, v_streak_days
  FROM public.course_enrollments ce
  JOIN public.course_student_points csp ON csp.enrollment_id = ce.id
  WHERE ce.id = p_enrollment_id;
  
  -- Check badges
  FOR v_badge IN
    SELECT * FROM public.course_badges
    WHERE course_id = v_course_id
    AND is_visible = true
    AND id NOT IN (
      SELECT badge_id FROM public.course_student_badges
      WHERE enrollment_id = p_enrollment_id
    )
  LOOP
    -- Check if criteria met
    IF (v_badge.points_required > 0 AND v_points_record.total_points >= v_badge.points_required)
       OR (v_badge.criteria->>'lesson_count' IS NOT NULL AND v_lesson_count >= (v_badge.criteria->>'lesson_count')::INTEGER)
       OR (v_badge.criteria->>'quiz_perfect_count' IS NOT NULL AND v_quiz_perfect_count >= (v_badge.criteria->>'quiz_perfect_count')::INTEGER)
       OR (v_badge.criteria->>'streak_days' IS NOT NULL AND v_streak_days >= (v_badge.criteria->>'streak_days')::INTEGER)
    THEN
      -- Award badge
      INSERT INTO public.course_student_badges (
        badge_id,
        enrollment_id,
        course_id,
        user_id
      )
      VALUES (
        v_badge.id,
        p_enrollment_id,
        v_course_id,
        p_user_id
      )
      ON CONFLICT DO NOTHING;
      
      -- Award bonus points if badge has points
      IF v_badge.criteria->>'reward_points' IS NOT NULL THEN
        PERFORM public.award_points(
          p_enrollment_id,
          p_user_id,
          (v_badge.criteria->>'reward_points')::INTEGER,
          'badge',
          v_badge.id,
          'Badge: ' || v_badge.name
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Check achievements
  FOR v_achievement IN
    SELECT * FROM public.course_achievements
    WHERE course_id = v_course_id
    AND is_visible = true
    AND id NOT IN (
      SELECT achievement_id FROM public.course_student_achievements
      WHERE enrollment_id = p_enrollment_id
    )
  LOOP
    -- Check if criteria met (simplified - can be expanded)
    IF v_achievement.reward_points > 0 AND v_points_record.total_points >= (v_achievement.criteria->>'points_required')::INTEGER THEN
      -- Award achievement
      INSERT INTO public.course_student_achievements (
        achievement_id,
        enrollment_id,
        course_id,
        user_id
      )
      VALUES (
        v_achievement.id,
        p_enrollment_id,
        v_course_id,
        p_user_id
      )
      ON CONFLICT DO NOTHING;
      
      -- Award reward points
      IF v_achievement.reward_points > 0 THEN
        PERFORM public.award_points(
          p_enrollment_id,
          p_user_id,
          v_achievement.reward_points,
          'achievement',
          v_achievement.id,
          'Achievement: ' || v_achievement.title
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Function: Reset daily points
CREATE OR REPLACE FUNCTION public.reset_daily_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.course_student_points
  SET points_earned_today = 0
  WHERE last_activity_date < CURRENT_DATE;
END;
$$;

-- Schedule reset daily points (via cron job or scheduled task)
-- This would typically be set up in Supabase dashboard or via pg_cron

-- =====================================================
-- 9. TRIGGERS - Auto-initialize points on enrollment
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_initialize_points_on_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.initialize_student_points(
    NEW.id,
    NEW.course_id,
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'auto_initialize_points_on_enrollment'
  ) THEN
    CREATE TRIGGER auto_initialize_points_on_enrollment
      AFTER INSERT ON public.course_enrollments
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_initialize_points_on_enrollment();
  END IF;
END $$;

-- =====================================================
-- 10. COMMENTS
-- =====================================================
COMMENT ON TABLE public.course_student_points IS 'Points et stats des étudiants pour gamification';
COMMENT ON TABLE public.course_badges IS 'Badges disponibles pour les cours';
COMMENT ON TABLE public.course_student_badges IS 'Badges gagnés par les étudiants';
COMMENT ON TABLE public.course_achievements IS 'Achievements disponibles pour les cours';
COMMENT ON TABLE public.course_student_achievements IS 'Achievements gagnés par les étudiants';
COMMENT ON TABLE public.course_points_history IS 'Historique des points gagnés';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

