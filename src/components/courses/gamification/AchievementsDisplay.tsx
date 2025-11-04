/**
 * Achievements Display Component
 * Affiche les achievements gagnés par l'étudiant
 */

import { Star, Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentAchievements, useCourseAchievements } from '@/hooks/courses/useGamification';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AchievementsDisplayProps {
  enrollmentId: string;
  courseId: string;
  className?: string;
  showLocked?: boolean; // Afficher aussi les achievements non gagnés
}

export const AchievementsDisplay = ({
  enrollmentId,
  courseId,
  className,
  showLocked = false,
}: AchievementsDisplayProps) => {
  const { data: earnedAchievements, isLoading: isLoadingEarned } = useStudentAchievements(enrollmentId);
  const { data: allAchievements, isLoading: isLoadingAll } = useCourseAchievements(courseId);

  const isLoading = isLoadingEarned || isLoadingAll;

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedAchievementIds = new Set((earnedAchievements || []).map((a) => a.achievement_id));

  // Si showLocked, afficher tous les achievements, sinon seulement ceux gagnés
  const achievementsToShow = showLocked && allAchievements
    ? allAchievements.map((achievement) => ({
        achievement,
        earned: earnedAchievementIds.has(achievement.id),
        earnedAt: earnedAchievements?.find((ea) => ea.achievement_id === achievement.id)?.earned_at,
      }))
    : (earnedAchievements || []).map((ea) => ({
        achievement: ea.achievement,
        earned: true,
        earnedAt: ea.earned_at,
      }));

  if (achievementsToShow.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun achievement gagné pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5" />
          Achievements
          <Badge variant="secondary" className="ml-auto">
            {earnedAchievements?.length || 0}
            {showLocked && allAchievements && ` / ${allAchievements.length}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <TooltipProvider>
            {achievementsToShow.map(({ achievement, earned, earnedAt }) => {
              if (!achievement) return null;

              return (
                <Tooltip key={achievement.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg transition-all',
                        earned
                          ? 'bg-primary/5 hover:bg-primary/10 cursor-pointer border border-primary/20'
                          : 'bg-muted/50 opacity-60 cursor-not-allowed'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0',
                          earned
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {achievement.icon_url ? (
                          <img
                            src={achievement.icon_url}
                            alt={achievement.title}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          earned ? (
                            <Star className="h-6 w-6 fill-primary" />
                          ) : (
                            <Lock className="h-6 w-6" />
                          )
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn('font-semibold', earned || 'text-muted-foreground')}>
                            {achievement.title}
                          </p>
                          {earned && (
                            <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {achievement.description && (
                          <p className={cn('text-sm mt-1', earned ? 'text-muted-foreground' : 'text-muted-foreground/70')}>
                            {achievement.description}
                          </p>
                        )}
                        {earned && earnedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Gagné le {new Date(earnedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>

                      {/* Reward */}
                      {achievement.reward_points > 0 && (
                        <div className="text-right flex-shrink-0">
                          <Badge variant={earned ? 'default' : 'secondary'}>
                            +{achievement.reward_points} pts
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{achievement.title}</p>
                      {achievement.description && (
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      )}
                      {achievement.reward_points > 0 && (
                        <p className="text-xs text-primary mt-2">
                          Récompense : {achievement.reward_points} points
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

