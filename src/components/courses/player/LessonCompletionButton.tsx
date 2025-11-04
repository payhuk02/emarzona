/**
 * Bouton pour marquer une leçon comme complétée
 * Date : 27 octobre 2025
 * Phase : 5 - Progression
 */

import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import { useLessonProgress } from '@/hooks/courses/useCourseProgress';
import { useMarkLessonCompleteWithPoints } from '@/hooks/courses/useGamification';
import { useAuth } from '@/contexts/AuthContext';

interface LessonCompletionButtonProps {
  enrollmentId: string;
  lessonId: string;
  variant?: 'default' | 'outline' | 'ghost';
  showText?: boolean;
  points?: number; // Points à attribuer (défaut: 10)
}

export const LessonCompletionButton = ({ 
  enrollmentId, 
  lessonId, 
  variant = 'default',
  showText = true,
  points = 10
}: LessonCompletionButtonProps) => {
  const { data: progress, isLoading } = useLessonProgress(enrollmentId, lessonId);
  const { user } = useAuth();
  const markComplete = useMarkLessonCompleteWithPoints();

  const isCompleted = progress?.is_completed || false;

  const handleToggleComplete = () => {
    if (!isCompleted && user) {
      markComplete.mutate({ 
        enrollmentId, 
        lessonId,
        userId: user.id,
        points
      });
    }
  };

  if (isLoading) {
    return (
      <Button variant={variant} disabled>
        <Circle className="w-5 h-5 mr-2 animate-pulse" />
        {showText && 'Chargement...'}
      </Button>
    );
  }

  return (
    <Button
      variant={isCompleted ? 'outline' : variant}
      onClick={handleToggleComplete}
      disabled={isCompleted || markComplete.isPending}
      className={isCompleted ? 'border-green-600 text-green-600' : ''}
    >
      {isCompleted ? (
        <>
          <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
          {showText && 'Leçon complétée'}
        </>
      ) : (
        <>
          <Circle className="w-5 h-5 mr-2" />
          {showText && 'Marquer comme complétée'}
        </>
      )}
    </Button>
  );
};

