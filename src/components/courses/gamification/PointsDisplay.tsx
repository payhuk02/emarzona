/**
 * Points Display Component
 * Affiche les points, streak, et niveau de l'étudiant
 */

import { Trophy, Flame, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentPoints } from '@/hooks/courses/useGamification';
import { cn } from '@/lib/utils';

interface PointsDisplayProps {
  enrollmentId: string;
  className?: string;
  compact?: boolean;
}

export const PointsDisplay = ({ enrollmentId, className, compact = false }: PointsDisplayProps) => {
  const { data: points, isLoading } = useStudentPoints(enrollmentId);

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className={cn('p-4', compact && 'p-3')}>
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!points) {
    return null;
  }

  // Calculer le niveau (100 points par niveau)
  const level = Math.floor(points.experience_points / 100) + 1;
  const expInCurrentLevel = points.experience_points % 100;
  const expNeededForNextLevel = 100;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-bold text-lg">{points.total_points}</span>
          <span className="text-sm text-muted-foreground">pts</span>
        </div>
        {points.current_streak_days > 0 && (
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">{points.current_streak_days}</span>
          </div>
        )}
        <Badge variant="secondary" className="text-xs">
          Niveau {level}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Points et Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points totaux</p>
                <p className="text-2xl font-bold">{points.total_points.toLocaleString()}</p>
              </div>
            </div>

            {points.current_streak_days > 0 && (
              <div className="flex items-center gap-2">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Série</p>
                  <p className="text-2xl font-bold">{points.current_streak_days}</p>
                  <p className="text-xs text-muted-foreground">jours</p>
                </div>
              </div>
            )}
          </div>

          {/* Niveau et Expérience */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Niveau {level}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {expInCurrentLevel} / {expNeededForNextLevel} XP
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${(expInCurrentLevel / expNeededForNextLevel) * 100}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Leçons complétées</p>
              <p className="text-lg font-semibold">{points.total_lessons_completed}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quiz réussis</p>
              <p className="text-lg font-semibold">{points.total_quizzes_passed}</p>
            </div>
            {points.points_earned_today > 0 && (
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Aujourd'hui :</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    +{points.points_earned_today} points
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

