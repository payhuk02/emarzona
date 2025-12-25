/**
 * Assignment Card Component
 * Affiche un assignment dans une carte
 */

import React from 'react';
import { FileText, Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCourseAssignments, type CourseAssignment, type AssignmentSubmission } from '@/hooks/courses/useAssignments';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AssignmentCardProps {
  assignment: CourseAssignment;
  submission?: AssignmentSubmission | null;
  enrollmentId?: string;
  onView?: () => void;
  onSubmit?: () => void;
  className?: string;
}

const AssignmentCardComponent = ({
  assignment,
  submission,
  enrollmentId,
  onView,
  onSubmit,
  className,
}: AssignmentCardProps) => {
  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && !submission;
  const isSubmitted = submission && submission.status !== 'draft';
  const isGraded = submission?.status === 'graded';
  const isLate = submission?.is_late || false;

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              {assignment.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {assignment.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {assignment.is_required && (
              <Badge variant="destructive" className="text-xs">Requis</Badge>
            )}
            {isGraded && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Noté
              </Badge>
            )}
            {isSubmitted && !isGraded && (
              <Badge variant="secondary">Soumis</Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                En retard
              </Badge>
            )}
            {isLate && (
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                Retard
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{assignment.points_possible} points</span>
            </div>
            {assignment.due_date && (
              <div className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-destructive font-medium'
              )}>
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(assignment.due_date), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="capitalize">{assignment.assignment_type}</span>
            </div>
          </div>

          {/* Grade (si noté) */}
          {isGraded && submission?.grade !== undefined && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Note obtenue</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {submission.grade}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {assignment.points_possible}
                  </span>
                  {submission.grade_percentage && (
                    <Badge variant="secondary" className="ml-2">
                      {submission.grade_percentage.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
              {submission.feedback && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {submission.feedback}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="flex-1"
            >
              {isGraded ? 'Voir la note' : isSubmitted ? 'Voir soumission' : 'Voir détails'}
            </Button>
            {!isSubmitted && enrollmentId && (
              <Button
                size="sm"
                onClick={onSubmit}
                className="flex-1"
                variant={isOverdue ? 'destructive' : 'default'}
              >
                {isOverdue ? 'Soumettre (retard)' : 'Soumettre'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const AssignmentCard = React.memo(AssignmentCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.assignment.id === nextProps.assignment.id &&
    prevProps.assignment.title === nextProps.assignment.title &&
    prevProps.assignment.due_date === nextProps.assignment.due_date &&
    prevProps.assignment.points_possible === nextProps.assignment.points_possible &&
    prevProps.assignment.is_required === nextProps.assignment.is_required &&
    prevProps.submission?.id === nextProps.submission?.id &&
    prevProps.submission?.status === nextProps.submission?.status &&
    prevProps.submission?.is_late === nextProps.submission?.is_late &&
    prevProps.enrollmentId === nextProps.enrollmentId &&
    prevProps.onView === nextProps.onView &&
    prevProps.onSubmit === nextProps.onSubmit
  );
});

AssignmentCard.displayName = 'AssignmentCard';

