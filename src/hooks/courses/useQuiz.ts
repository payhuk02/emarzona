/**
 * Hooks pour gérer les quiz
 * Date : 27 octobre 2025
 * Phase : 6 - Quiz et Certificats
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook pour récupérer un quiz par son ID
 */
export const useQuiz = (quizId: string | undefined) => {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      if (!quizId) return null;

      const { data, error } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!quizId,
  });
};

/**
 * Hook pour récupérer tous les quiz d'un cours
 */
export const useCourseQuizzes = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-quizzes', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
};

/**
 * Hook pour créer un quiz
 */
export const useCreateQuiz = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      courseId,
      title,
      description,
      passingScore,
      timeLimit,
      questionsData,
      orderIndex,
    }: {
      courseId: string;
      title: string;
      description?: string;
      passingScore: number;
      timeLimit?: number;
      questionsData: any[];
      orderIndex: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // 1. Créer le quiz
      const { data: quiz, error: quizError } = await supabase
        .from('course_quizzes')
        .insert({
          course_id: courseId,
          title,
          description,
          passing_score: passingScore,
          time_limit_minutes: timeLimit,
          total_questions: questionsData.length,
          order_index: orderIndex,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // 2. Créer les questions avec leurs réponses
      const questionsToInsert = questionsData.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.text,
        question_type: q.type,
        points: q.points || 1,
        order_index: index,
        options: q.options, // JSON array pour les QCM
        correct_answer: q.correctAnswer, // String ou JSON
        explanation: q.explanation,
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        // Rollback : supprimer le quiz
        await supabase.from('course_quizzes').delete().eq('id', quiz.id);
        throw questionsError;
      }

      return quiz;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-quizzes', variables.courseId] });
      toast({
        title: 'Quiz créé ! 🎉',
        description: 'Le quiz a été créé avec succès.',
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
 * Hook pour récupérer les questions d'un quiz
 */
export const useQuizQuestions = (quizId: string | undefined) => {
  return useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => {
      if (!quizId) return [];

      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!quizId,
  });
};

/**
 * Hook pour soumettre un quiz
 */
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      quizId,
      enrollmentId,
      answers,
    }: {
      quizId: string;
      enrollmentId: string;
      answers: Record<string, any>; // questionId -> answer
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // 1. Récupérer les questions avec réponses correctes
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId);

      if (questionsError) throw questionsError;

      // 2. Calculer le score
      let score = 0;
      let totalPoints = 0;
      const detailedResults: any[] = [];

      questions?.forEach((question) => {
        const userAnswer = answers[question.id];
        const isCorrect = checkAnswer(question, userAnswer);
        
        totalPoints += question.points;
        if (isCorrect) {
          score += question.points;
        }

        detailedResults.push({
          question_id: question.id,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: isCorrect ? question.points : 0,
        });
      });

      const scorePercentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

      // 3. Récupérer le passing score du quiz
      const { data: quiz } = await supabase
        .from('course_quizzes')
        .select('passing_score')
        .eq('id', quizId)
        .single();

      const passed = scorePercentage >= (quiz?.passing_score || 70);

      // 4. Enregistrer la tentative
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          enrollment_id: enrollmentId,
          user_id: user.id,
          score: scorePercentage,
          passed,
          answers: answers, // JSON
          detailed_results: detailedResults, // JSON
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      return {
        attempt,
        score: scorePercentage,
        passed,
        totalPoints,
        earnedPoints: score,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      
      if (result.passed) {
        toast({
          title: 'Félicitations ! 🎉',
          description: `Vous avez réussi avec ${result.score}% !`,
        });
      } else {
        toast({
          title: 'Pas encore réussi',
          description: `Score : ${result.score}%. Réessayez !`,
          variant: 'destructive',
        });
      }
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
 * Fonction helper pour vérifier une réponse
 */
function checkAnswer(question: any, userAnswer: any): boolean {
  switch (question.question_type) {
    case 'multiple_choice':
      return userAnswer === question.correct_answer;
    
    case 'true_false':
      return userAnswer === question.correct_answer;
    
    case 'text':
      // Comparaison simple (à améliorer avec fuzzy matching)
      return userAnswer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim();
    
    default:
      return false;
  }
}

/**
 * Hook pour récupérer les tentatives d'un quiz
 */
export const useQuizAttempts = (quizId: string | undefined, enrollmentId: string | undefined) => {
  return useQuery({
    queryKey: ['quiz-attempts', quizId, enrollmentId],
    queryFn: async () => {
      if (!quizId || !enrollmentId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('enrollment_id', enrollmentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!quizId && !!enrollmentId,
  });
};

/**
 * Hook pour récupérer la meilleure tentative
 */
export const useBestQuizAttempt = (quizId: string | undefined, enrollmentId: string | undefined) => {
  const { data: attempts } = useQuizAttempts(quizId, enrollmentId);
  
  if (!attempts || attempts.length === 0) return null;
  
  // Retourner la tentative avec le meilleur score
  return attempts.reduce((best, current) => 
    current.score > best.score ? current : best
  );
};

