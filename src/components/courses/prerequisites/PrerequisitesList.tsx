/**
 * Prerequisites List Component
 * Liste des prérequis avec statut de validation
 */

import { CheckCircle2, XCircle, Clock, BookOpen, FileText, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCoursePrerequisites, usePrerequisiteValidations, type CoursePrerequisite, type PrerequisiteValidation } from '@/hooks/courses/usePrerequisites';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PrerequisitesListProps {
  courseId: string;
  enrollmentId?: string;
  className?: string;
}

export const PrerequisitesList = ({ courseId, enrollmentId, className }: PrerequisitesListProps) => {
  const { data: prerequisites = [], isLoading } = useCoursePrerequisites(courseId);
  const { data: validations = [] } = usePrerequisiteValidations(courseId, enrollmentId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  if (prerequisites.length === 0) {
    return null;
  }

  const getPrerequisiteIcon = (type: CoursePrerequisite['prerequisite_type']) => {
    switch (type) {
      case 'course':
        return BookOpen;
      case 'quiz':
        return FileText;
      case 'assignment':
        return Target;
      default:
        return Clock;
    }
  };

  const getValidationStatus = (prerequisite: CoursePrerequisite) => {
    if (!enrollmentId) return null;
    
    const validation = validations.find(v => v.prerequisite_id === prerequisite.id);
    return validation?.is_validated || false;
  };

  const requiredPrerequisites = prerequisites.filter(p => p.is_required);
  const allValidated = requiredPrerequisites.every(p => getValidationStatus(p));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Prérequis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!allValidated && enrollmentId && (
          <Alert variant="destructive">
            <AlertDescription>
              Vous devez compléter tous les prérequis requis pour accéder à ce cours.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {prerequisites.map((prerequisite) => {
            const Icon = getPrerequisiteIcon(prerequisite.prerequisite_type);
            const isValidated = getValidationStatus(prerequisite);
            const validation = validations.find(v => v.prerequisite_id === prerequisite.id);

            return (
              <div
                key={prerequisite.id}
                className={cn(
                  'flex items-start gap-3 p-3 border rounded-lg',
                  isValidated ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-muted/50'
                )}
              >
                <div className="shrink-0 mt-0.5">
                  {isValidated ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {prerequisite.prerequisite_type === 'course' && prerequisite.required_course?.product?.name
                        ? prerequisite.required_course.product.name
                        : `Prérequis: ${prerequisite.prerequisite_type}`}
                    </span>
                    {prerequisite.is_required && (
                      <Badge variant="destructive" className="text-xs">Requis</Badge>
                    )}
                  </div>
                  
                  {prerequisite.prerequisite_type === 'course' && (
                    <div className="text-sm text-muted-foreground">
                      {prerequisite.require_completion && (
                        <span>Doit être complété à {prerequisite.minimum_progress_percentage}%</span>
                      )}
                      {prerequisite.required_course?.product?.slug && (
                        <Link
                          to={`/courses/${prerequisite.required_course.product.slug}`}
                          className="ml-2 text-primary hover:underline"
                        >
                          Voir le cours →
                        </Link>
                      )}
                    </div>
                  )}

                  {validation && validation.validation_details && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {validation.validation_details.progress !== undefined && (
                        <span>Progression: {validation.validation_details.progress}%</span>
                      )}
                      {validation.validation_details.score !== undefined && (
                        <span>Score: {validation.validation_details.score}/{validation.validation_details.required_score}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

