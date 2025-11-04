/**
 * Quick Note Button Component
 * Bouton flottant pour ajouter rapidement une note pendant la lecture
 */

import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddNote } from '@/hooks/courses/useCourseNotes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QuickNoteButtonProps {
  enrollmentId: string;
  lessonId: string;
  courseId: string;
  currentTimeSeconds: number;
  className?: string;
}

export const QuickNoteButton = ({
  enrollmentId,
  lessonId,
  courseId,
  currentTimeSeconds,
  className,
}: QuickNoteButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const addNote = useAddNote();

  const handleQuickNote = () => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté',
        variant: 'destructive',
      });
      return;
    }

    const content = prompt('Saisissez votre note rapide:');
    if (!content || !content.trim()) return;

    addNote.mutate({
      userId: user.id,
      noteData: {
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        course_id: courseId,
        content: content.trim(),
        timestamp_seconds: currentTimeSeconds,
      },
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleQuickNote}
      disabled={addNote.isPending}
      className={cn('gap-2', className)}
      title="Ajouter une note rapide"
    >
      <FileText className="h-4 w-4" />
      <span className="hidden sm:inline">Note</span>
    </Button>
  );
};

