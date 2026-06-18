/** Extrait les résultats détaillés stockés dans quiz_attempts.answers (JSONB). */
export function getQuizAttemptDetailedResults(answers: unknown): Array<{
  question_id: string;
  is_correct: boolean;
  user_answer: string | number | boolean | null;
  points_earned?: number;
}> {
  if (!answers || typeof answers !== 'object') {
    return [];
  }

  const payload = answers as Record<string, unknown>;
  const detailed = payload.detailed_results;

  if (!Array.isArray(detailed)) {
    return [];
  }

  return detailed as Array<{
    question_id: string;
    is_correct: boolean;
    user_answer: string | number | boolean | null;
    points_earned?: number;
  }>;
}
