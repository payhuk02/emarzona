/**
 * Badges Display Component
 * Affiche les badges gagnés par l'étudiant
 */

import { Award, Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentBadges, useCourseBadges } from '@/hooks/courses/useGamification';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BadgesDisplayProps {
  enrollmentId: string;
  courseId: string;
  className?: string;
  showLocked?: boolean; // Afficher aussi les badges non gagnés
}

export const BadgesDisplay = ({
  enrollmentId,
  courseId,
  className,
  showLocked = false,
}: BadgesDisplayProps) => {
  const { data: earnedBadges, isLoading: isLoadingEarned } = useStudentBadges(enrollmentId);
  const { data: allBadges, isLoading: isLoadingAll } = useCourseBadges(courseId);

  const isLoading = isLoadingEarned || isLoadingAll;

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedBadgeIds = new Set((earnedBadges || []).map((b) => b.badge_id));

  // Si showLocked, afficher tous les badges, sinon seulement ceux gagnés
  const badgesToShow = showLocked && allBadges
    ? allBadges.map((badge) => ({
        badge,
        earned: earnedBadgeIds.has(badge.id),
        earnedAt: earnedBadges?.find((eb) => eb.badge_id === badge.id)?.earned_at,
      }))
    : (earnedBadges || []).map((eb) => ({
        badge: eb.badge,
        earned: true,
        earnedAt: eb.earned_at,
      }));

  if (badgesToShow.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun badge gagné pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5" />
          Badges
          <Badge variant="secondary" className="ml-auto">
            {earnedBadges?.length || 0}
            {showLocked && allBadges && ` / ${allBadges.length}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
          <TooltipProvider>
            {badgesToShow.map(({ badge, earned, earnedAt }) => {
              if (!badge) return null;

              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'relative flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
                        earned
                          ? 'bg-primary/5 hover:bg-primary/10 cursor-pointer'
                          : 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {badge.icon_url ? (
                        <img
                          src={badge.icon_url}
                          alt={badge.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            'h-16 w-16 rounded-full flex items-center justify-center',
                            earned
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {earned ? (
                            <Award className="h-8 w-8" />
                          ) : (
                            <Lock className="h-8 w-8" />
                          )}
                        </div>
                      )}
                      {earned && (
                        <div className="absolute -top-1 -right-1">
                          <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      )}
                      <p className={cn('text-xs text-center font-medium', earned || 'text-muted-foreground')}>
                        {badge.name}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{badge.name}</p>
                      {badge.description && <p className="text-sm text-muted-foreground">{badge.description}</p>}
                      {earned && earnedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Gagné le {new Date(earnedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      {!earned && badge.points_required > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {badge.points_required} points requis
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

