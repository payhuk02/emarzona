/**
 * Assignments List Component
 * Liste des assignments pour un cours avec soumissions étudiant
 */

import React from 'react';
import { FileText } from '@/components/icons';
import { useStudentAssignments } from '@/hooks/courses/useAssignments';
import { AssignmentCard } from './AssignmentCard';
import { Skeleton } from '@/components/ui/skeleton';

interface AssignmentsListProps {
  courseId: string;
  enrollmentId: string;
  onAssignmentClick?: (assignmentId: string) => void;
}

const AssignmentsListComponent = ({ 
  courseId, 
  enrollmentId,
  onAssignmentClick 
}: AssignmentsListProps) => {
  const { data: assignmentsData, isLoading } = useStudentAssignments(courseId, enrollmentId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!assignmentsData || assignmentsData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Aucun devoir assigné pour ce cours</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignmentsData.map((assignment: any) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          submission={assignment.submission}
          enrollmentId={enrollmentId}
          onView={() => onAssignmentClick?.(assignment.id)}
          onSubmit={() => onAssignmentClick?.(assignment.id)}
        />
      ))}
    </div>
  );
};

AssignmentsListComponent.displayName = 'AssignmentsListComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const AssignmentsList = React.memo(AssignmentsListComponent, (prevProps, nextProps) => {
  return (
    prevProps.courseId === nextProps.courseId &&
    prevProps.enrollmentId === nextProps.enrollmentId &&
    prevProps.onAssignmentClick === nextProps.onAssignmentClick
  );
});

AssignmentsList.displayName = 'AssignmentsList';

