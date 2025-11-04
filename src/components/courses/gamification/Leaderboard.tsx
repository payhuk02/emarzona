/**
 * Leaderboard Component
 * Affiche le classement des étudiants d'un cours
 */

import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCourseLeaderboard } from '@/hooks/courses/useGamification';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardProps {
  courseId: string;
  className?: string;
  limit?: number;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400 fill-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600 fill-amber-600" />;
  return <Award className="h-4 w-4 text-muted-foreground" />;
};

const getRankBadgeVariant = (rank: number): 'default' | 'secondary' | 'outline' => {
  if (rank === 1) return 'default';
  if (rank === 2 || rank === 3) return 'secondary';
  return 'outline';
};

export const Leaderboard = ({ courseId, className, limit = 10 }: LeaderboardProps) => {
  const { data: leaderboard, isLoading } = useCourseLeaderboard(courseId, limit);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Classement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun classement disponible pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Classement
          <Badge variant="secondary" className="ml-auto">
            Top {limit}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.user_id === user?.id;
            const initials = entry.user_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '??';

            return (
              <div
                key={entry.user_id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  isCurrentUser
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-muted/50 hover:bg-muted'
                )}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-10">
                  {entry.rank <= 3 ? (
                    getRankIcon(entry.rank)
                  ) : (
                    <Badge variant={getRankBadgeVariant(entry.rank)} className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                      {entry.rank}
                    </Badge>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.user_avatar} alt={entry.user_name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                {/* Name & Stats */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('font-medium truncate', isCurrentUser && 'text-primary')}>
                      {entry.user_name}
                    </p>
                    {isCurrentUser && (
                      <Badge variant="default" className="text-xs">
                        Vous
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{entry.total_points} pts</span>
                    <span>{entry.total_lessons_completed} leçons</span>
                    {entry.current_streak_days > 0 && (
                      <span className="flex items-center gap-1">
                        🔥 {entry.current_streak_days}j
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="font-bold text-lg">{entry.total_points}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

