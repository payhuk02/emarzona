/**
 * Cohorts List Component
 * Liste des cohorts pour un cours
 */

import React from 'react';
import { Users, Calendar, Lock, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCourseCohorts, type CourseCohort } from '@/hooks/courses/useCohorts';
import { cn } from '@/lib/utils';

interface CohortsListProps {
  courseId: string;
  onCohortClick?: (cohort: CourseCohort) => void;
  className?: string;
}

const CohortsListComponent = ({ courseId, onCohortClick, className }: CohortsListProps) => {
  const { data: cohorts = [], isLoading } = useCourseCohorts(courseId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  if (cohorts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Aucun cohort créé pour ce cours
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {cohorts.map((cohort) => (
        <Card
          key={cohort.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onCohortClick?.(cohort)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {cohort.name}
                    {cohort.is_private && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                  {cohort.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {cohort.description}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {cohort.cohort_type.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{cohort.member_count || 0} membres</span>
                {cohort.max_students && (
                  <span> / {cohort.max_students}</span>
                )}
              </div>
              {cohort.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Début: {new Date(cohort.start_date).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

CohortsListComponent.displayName = 'CohortsListComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const CohortsList = React.memo(CohortsListComponent, (prevProps, nextProps) => {
  return (
    prevProps.courseId === nextProps.courseId &&
    prevProps.onCohortClick === nextProps.onCohortClick &&
    prevProps.className === nextProps.className
  );
});

CohortsList.displayName = 'CohortsList';

