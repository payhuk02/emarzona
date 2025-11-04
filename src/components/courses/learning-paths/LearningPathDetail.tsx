/**
 * Learning Path Detail Component
 * Vue détaillée d'un parcours d'apprentissage avec liste des cours
 */

import { BookOpen, Clock, Users, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLearningPath, usePathEnrollment, useEnrollInPath, type PathCourse } from '@/hooks/courses/useLearningPaths';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LearningPathDetailProps {
  pathId: string;
}

export const LearningPathDetail = ({ pathId }: LearningPathDetailProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: path, isLoading } = useLearningPath(pathId);
  const { data: enrollment } = usePathEnrollment(pathId, user?.id);
  const enrollInPath = useEnrollInPath();

  const isEnrolled = !!enrollment;
  const currentCourseIndex = enrollment?.current_course_index || 0;

  const handleEnroll = () => {
    if (!user || !path) return;

    enrollInPath.mutate({
      pathId: path.id,
      userId: user.id,
      totalCourses: path.courses?.length || 0,
    });
  };

  const handleCourseClick = (course: PathCourse) => {
    if (course.course?.product?.slug) {
      navigate(`/courses/${course.course.product.slug}`);
    }
  };

  const isCourseUnlocked = (courseIndex: number) => {
    if (!isEnrolled) return false;
    if (courseIndex === 0) return true;
    if (!enrollment) return false;
    
    // Vérifier si le cours précédent est complété
    const previousCourse = path?.courses?.find(c => c.order_index === courseIndex - 1);
    if (!previousCourse?.unlock_after_completion) return true;
    
    return enrollment.current_course_index >= courseIndex;
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  if (!path) {
    return <div className="text-center py-8">Parcours non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{path.title}</CardTitle>
              {path.description && (
                <p className="text-muted-foreground mb-4">{path.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{path.total_courses} cours</span>
                </div>
                {path.estimated_duration_hours && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{path.estimated_duration_hours} heures</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{path.total_students} étudiants</span>
                </div>
              </div>
            </div>
            {!isEnrolled && (
              <Button onClick={handleEnroll} disabled={enrollInPath.isPending}>
                {path.is_free ? 'Commencer gratuitement' : `S'inscrire - ${path.price} ${path.currency}`}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Progression (si inscrit) */}
      {isEnrolled && enrollment && (
        <Card>
          <CardHeader>
            <CardTitle>Votre Progression</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Parcours complété</span>
                <span className="font-medium">{enrollment.progress_percentage.toFixed(1)}%</span>
              </div>
              <Progress value={enrollment.progress_percentage} className="h-3" />
            </div>
            <div className="text-sm text-muted-foreground">
              {enrollment.completed_courses_count}/{enrollment.total_courses_count} cours complétés
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des cours */}
      <Card>
        <CardHeader>
          <CardTitle>Plan du Parcours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {path.courses?.map((pathCourse, index) => {
              const course = pathCourse.course;
              const isUnlocked = isCourseUnlocked(pathCourse.order_index);
              const isCurrent = isEnrolled && pathCourse.order_index === currentCourseIndex;
              const isCompleted = isEnrolled && pathCourse.order_index < currentCourseIndex;

              return (
                <div
                  key={pathCourse.id}
                  className={cn(
                    'flex items-start gap-4 p-4 border rounded-lg transition-all',
                    isUnlocked ? 'hover:bg-muted/50' : 'opacity-60',
                    isCurrent && 'border-primary bg-primary/5'
                  )}
                >
                  {/* Numéro */}
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full font-bold shrink-0',
                    isCompleted ? 'bg-green-600 text-white' :
                    isCurrent ? 'bg-primary text-white' :
                    isUnlocked ? 'bg-muted' : 'bg-muted opacity-50'
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span>{pathCourse.order_index + 1}</span>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold flex items-center gap-2">
                          {course?.product?.name || 'Cours'}
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              En cours
                            </Badge>
                          )}
                          {!isUnlocked && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </h3>
                        {course && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{course.total_lessons} leçons</span>
                            {course.total_duration_minutes && (
                              <span>{Math.round(course.total_duration_minutes / 60)}h</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {isUnlocked ? (
                      <Button
                        variant={isCurrent ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => course && handleCourseClick(pathCourse)}
                      >
                        {isCompleted ? 'Revoir' : isCurrent ? 'Continuer' : 'Commencer'}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        <Lock className="h-4 w-4 mr-1" />
                        Verrouillé
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

