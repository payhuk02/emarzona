/**
 * Learning Path Card Component
 * Carte pour afficher un parcours d'apprentissage
 */

import React from 'react';
import { BookOpen, Clock, Users, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type LearningPath, type PathEnrollment } from '@/hooks/courses/useLearningPaths';
import { cn } from '@/lib/utils';

interface LearningPathCardProps {
  path: LearningPath;
  enrollment?: PathEnrollment | null;
  onView?: () => void;
  onEnroll?: () => void;
  className?: string;
}

export const LearningPathCard = ({
  path,
  enrollment,
  onView,
  onEnroll,
  className,
}: LearningPathCardProps) => {
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'completed';

  return (
    <Card className={cn('hover:shadow-lg transition-all', className)} style={{ willChange: 'transform' }}>
      {path.image_url && (
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
          <img
            src={path.image_url}
            alt={path.title}
            className="w-full h-full object-cover"
          />
          {path.is_featured && (
            <Badge className="absolute top-2 right-2 bg-orange-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              En vedette
            </Badge>
          )}
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{path.title}</CardTitle>
            {path.short_description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {path.short_description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métadonnées */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{path.total_courses} cours</span>
          </div>
          {path.estimated_duration_hours && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{path.estimated_duration_hours}h</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{path.total_students} étudiants</span>
          </div>
          <Badge variant="secondary" className="capitalize">
            {path.level.replace('_', ' ')}
          </Badge>
        </div>

        {/* Progression (si inscrit) */}
        {isEnrolled && enrollment && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{enrollment.progress_percentage.toFixed(1)}%</span>
            </div>
            <Progress value={enrollment.progress_percentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {enrollment.completed_courses_count}/{enrollment.total_courses_count} cours complétés
              </span>
              {isCompleted && (
                <Badge variant="default" className="bg-green-600">
                  <Award className="h-3 w-3 mr-1" />
                  Complété
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Prix */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {path.is_free ? (
              <span className="text-lg font-bold text-green-600">Gratuit</span>
            ) : (
              <span className="text-lg font-bold">
                {path.price.toLocaleString()} {path.currency}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant={isEnrolled ? 'outline' : 'default'}
            onClick={isEnrolled ? onView : onEnroll}
            className="flex-1"
          >
            {isEnrolled ? 'Continuer' : 'Commencer'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          {onView && (
            <Button
              variant="outline"
              onClick={onView}
              size="sm"
            >
              Détails
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

