-- Migration: Ajout de la table quiz_questions
-- Date: 27 octobre 2025
-- Phase: 6 - Quiz et Certificats

-- Table pour les questions de quiz
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'text')),
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Pour les QCM : tableau d'options
  options JSONB,
  
  -- Réponse correcte (peut être string, boolean, ou JSON selon le type)
  correct_answer JSONB NOT NULL,
  
  -- Explication de la réponse (optionnel)
  explanation TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON public.quiz_questions(quiz_id, order_index);

-- Trigger pour updated_at
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Les instructeurs peuvent tout faire sur leurs questions
CREATE POLICY "Instructors can manage their quiz questions"
  ON public.quiz_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.course_quizzes cq
      JOIN public.courses c ON c.id = cq.course_id
      JOIN public.products p ON p.id = c.product_id
      JOIN public.stores s ON s.id = p.store_id
      WHERE cq.id = quiz_questions.quiz_id
      AND s.user_id = auth.uid()
    )
  );

-- Les étudiants inscrits peuvent voir les questions (mais pas les réponses correctes)
CREATE POLICY "Enrolled students can view questions"
  ON public.quiz_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_quizzes cq
      JOIN public.course_enrollments ce ON ce.course_id = cq.course_id
      WHERE cq.id = quiz_questions.quiz_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'active'
    )
  );

-- Admins peuvent tout voir
CREATE POLICY "Admins can manage all quiz questions"
  ON public.quiz_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Commentaires
COMMENT ON TABLE public.quiz_questions IS 'Questions pour les quiz de cours';
COMMENT ON COLUMN public.quiz_questions.question_type IS 'Type de question: multiple_choice, true_false, ou text';
COMMENT ON COLUMN public.quiz_questions.options IS 'Options pour les QCM (tableau JSON)';
COMMENT ON COLUMN public.quiz_questions.correct_answer IS 'Réponse correcte (format dépend du type de question)';

