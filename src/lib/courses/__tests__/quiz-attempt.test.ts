import { describe, it, expect } from 'vitest';
import { getQuizAttemptDetailedResults } from '@/lib/courses/quiz-attempt';

describe('getQuizAttemptDetailedResults', () => {
  it('extrait detailed_results depuis answers JSONB', () => {
    const results = getQuizAttemptDetailedResults({
      responses: { q1: 'a' },
      detailed_results: [{ question_id: 'q1', is_correct: true, user_answer: 'a' }],
    });

    expect(results).toHaveLength(1);
    expect(results[0].question_id).toBe('q1');
    expect(results[0].is_correct).toBe(true);
  });

  it('retourne un tableau vide si answers invalide', () => {
    expect(getQuizAttemptDetailedResults(null)).toEqual([]);
    expect(getQuizAttemptDetailedResults({ responses: {} })).toEqual([]);
  });
});
