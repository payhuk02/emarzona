/**
 * Course Gamification Dashboard
 * Date: 31 Janvier 2025
 * 
 * Dashboard complet de gamification pour étudiants :
 * - Points et niveau
 * - Badges obtenus
 * - Achievements
 * - Leaderboard
 * - Historique des points
 * - Streaks
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Award,
  Star,
  TrendingUp,
  Flame,
  Target,
  Medal,
  Crown,
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  ArrowLeft,
} from 'lucide-react';
import {
  useStudentPoints,
  useStudentBadges,
  useStudentAchievements,
  usePointsHistory,
  useCourseLeaderboard,
  useCourseBadges,
  useCourseAchievements,
} from '@/hooks/courses/useGamification';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

export default function CourseGamificationDashboard() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'achievements' | 'leaderboard' | 'history'>('overview');

  // Get enrollment
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['course-enrollment', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID manquant');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const enrollmentId = enrollment?.id;

  // Gamification data
  const { data: points, isLoading: pointsLoading } = useStudentPoints(enrollmentId);
  const { data: badges = [], isLoading: badgesLoading } = useStudentBadges(enrollmentId);
  const { data: achievements = [], isLoading: achievementsLoading } = useStudentAchievements(enrollmentId);
  const { data: pointsHistory = [], isLoading: historyLoading } = usePointsHistory(enrollmentId, 50);
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useCourseLeaderboard(courseId, 20);
  const { data: availableBadges = [] } = useCourseBadges(courseId);
  const { data: availableAchievements = [] } = useCourseAchievements(courseId);

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Calculate level progress
  const calculateLevelProgress = () => {
    if (!points) return { currentLevel: 1, progress: 0, xpForNextLevel: 100 };

    const currentLevel = points.current_level || 1;
    const currentXP = points.experience_points || 0;
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpForNextLevel = currentLevel * 100;
    const progress = ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

    return {
      currentLevel,
      progress: Math.max(0, Math.min(100, progress)),
      xpForNextLevel,
      currentXP,
    };
  };

  const levelInfo = calculateLevelProgress();

  // Get user rank
  const userRank = leaderboard.findIndex((entry) => entry.user_id === enrollment?.user_id) + 1;

  if (enrollmentLoading || pointsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!enrollment) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6">
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">Vous n'êtes pas inscrit à ce cours</p>
                  <Button onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gamification
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Suivez votre progression, gagnez des badges et montez dans le classement
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>

            {/* Stats Cards */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Points</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{points?.total_points || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {points?.points_earned_today || 0} aujourd'hui
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Niveau</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{levelInfo.currentLevel}</div>
                  <p className="text-xs text-muted-foreground">
                    {levelInfo.currentXP} / {levelInfo.xpForNextLevel} XP
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Streak</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{points?.current_streak_days || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Record: {points?.longest_streak_days || 0} jours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Classement</CardTitle>
                  <Trophy className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">
                    {userRank > 0 ? `#${userRank}` : '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {leaderboard.length} participants
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="leaderboard">Classement</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                {/* Level Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Progression du Niveau
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Niveau {levelInfo.currentLevel}</span>
                        <span>{levelInfo.currentXP} / {levelInfo.xpForNextLevel} XP</span>
                      </div>
                      <Progress value={levelInfo.progress} className="h-3" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {levelInfo.xpForNextLevel - levelInfo.currentXP} XP nécessaires pour le niveau {levelInfo.currentLevel + 1}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recent Badges */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Badges Récents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {badges.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucun badge obtenu
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {badges.slice(0, 3).map((badge) => (
                            <div key={badge.id} className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                                <Award className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{badge.badge?.name || 'Badge'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(badge.earned_at), 'dd MMM yyyy', { locale: fr })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Achievements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Achievements Récents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {achievements.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucun achievement obtenu
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {achievements.slice(0, 3).map((achievement) => (
                            <div key={achievement.id} className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                <Trophy className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{achievement.achievement?.title || 'Achievement'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(achievement.earned_at), 'dd MMM yyyy', { locale: fr })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Badges Tab */}
              <TabsContent value="badges" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mes Badges ({badges.length} / {availableBadges.length})</CardTitle>
                    <CardDescription>
                      Badges obtenus dans ce cours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {badgesLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <Skeleton key={i} className="h-32" />
                        ))}
                      </div>
                    ) : badges.length === 0 ? (
                      <div className="text-center py-12">
                        <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucun badge obtenu</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {badges.map((badge) => (
                          <Card key={badge.id} className="text-center">
                            <CardContent className="pt-6">
                              <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/20 w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                                {badge.badge?.icon_url ? (
                                  <img src={badge.badge.icon_url} alt={badge.badge.name} className="w-full h-full object-contain" />
                                ) : (
                                  <Award className="h-10 w-10 text-yellow-600" />
                                )}
                              </div>
                              <div className="font-medium mb-1">{badge.badge?.name || 'Badge'}</div>
                              {badge.badge?.description && (
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                  {badge.badge.description}
                                </div>
                              )}
                              <Badge variant="secondary" className="mt-2">
                                {format(new Date(badge.earned_at), 'dd MMM yyyy', { locale: fr })}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Badges */}
                {availableBadges.length > badges.length && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Badges Disponibles</CardTitle>
                      <CardDescription>
                        Badges que vous pouvez encore obtenir
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {availableBadges
                          .filter((badge) => !badges.some((b) => b.badge_id === badge.id))
                          .map((badge) => (
                            <Card key={badge.id} className="text-center opacity-60">
                              <CardContent className="pt-6">
                                <div className="p-4 rounded-full bg-muted w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                                  {badge.icon_url ? (
                                    <img src={badge.icon_url} alt={badge.name} className="w-full h-full object-contain grayscale" />
                                  ) : (
                                    <Award className="h-10 w-10 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="font-medium mb-1">{badge.name}</div>
                                {badge.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-2">
                                    {badge.description}
                                  </div>
                                )}
                                <Badge variant="outline" className="mt-2">
                                  {badge.points_required} pts requis
                                </Badge>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mes Achievements ({achievements.length} / {availableAchievements.length})</CardTitle>
                    <CardDescription>
                      Achievements obtenus dans ce cours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {achievementsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20" />
                        ))}
                      </div>
                    ) : achievements.length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucun achievement obtenu</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {achievements.map((achievement) => (
                          <Card key={achievement.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                  {achievement.achievement?.icon_url ? (
                                    <img
                                      src={achievement.achievement.icon_url}
                                      alt={achievement.achievement.title}
                                      className="w-10 h-10 object-contain"
                                    />
                                  ) : (
                                    <Trophy className="h-10 w-10 text-purple-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold">{achievement.achievement?.title || 'Achievement'}</div>
                                  {achievement.achievement?.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {achievement.achievement.description}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Obtenu le {format(new Date(achievement.earned_at), 'dd MMM yyyy', { locale: fr })}
                                  </div>
                                </div>
                                {achievement.achievement?.reward_points && (
                                  <Badge variant="default" className="bg-green-600">
                                    +{achievement.achievement.reward_points} pts
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Classement
                    </CardTitle>
                    <CardDescription>
                      Top {leaderboard.length} étudiants
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {leaderboardLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-16" />
                        ))}
                      </div>
                    ) : leaderboard.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucun participant</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {leaderboard.map((entry) => {
                          const isCurrentUser = entry.user_id === enrollment?.user_id;
                          return (
                            <Card
                              key={entry.user_id}
                              className={cn(
                                'transition-all',
                                isCurrentUser && 'border-primary bg-primary/5'
                              )}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold">
                                      {entry.rank === 1 ? (
                                        <Crown className="h-6 w-6 text-yellow-500" />
                                      ) : entry.rank === 2 ? (
                                        <Medal className="h-6 w-6 text-gray-400" />
                                      ) : entry.rank === 3 ? (
                                        <Medal className="h-6 w-6 text-orange-400" />
                                      ) : (
                                        <span className="text-sm">#{entry.rank}</span>
                                      )}
                                    </div>
                                    <Avatar>
                                      <AvatarImage src={entry.user_avatar} />
                                      <AvatarFallback>
                                        {entry.user_name?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="font-medium flex items-center gap-2">
                                        {entry.user_name || 'Utilisateur'}
                                        {isCurrentUser && (
                                          <Badge variant="default" className="bg-primary">
                                            Vous
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                          <Star className="h-3 w-3" />
                                          {entry.total_points} pts
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Flame className="h-3 w-3" />
                                          {entry.current_streak_days} jours
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <CheckCircle2 className="h-3 w-3" />
                                          {entry.total_lessons_completed} leçons
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Historique des Points</CardTitle>
                    <CardDescription>
                      Dernières activités et points gagnés
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-16" />
                        ))}
                      </div>
                    ) : pointsHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucun historique</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pointsHistory.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <Zap className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium">+{entry.points_earned} points</div>
                                <div className="text-xs text-muted-foreground">
                                  {entry.source_description || entry.source_type}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

