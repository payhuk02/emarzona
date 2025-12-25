/**
 * Gamification Dashboard Component
 * Date: 30 Janvier 2025
 *
 * Composant pour afficher le dashboard de gamification (points, badges, achievements, leaderboard)
 */

import {
  useUserGamification,
  useUserBadges,
  useUserAchievements,
  useGlobalLeaderboard,
  usePointsHistory,
} from '@/hooks/gamification/useGlobalGamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, Star, Users, Zap, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export const GamificationDashboard = () => {
  // Utiliser useAuth normalement comme dans les autres composants
  const { user, loading: authLoading } = useAuth();

  // Extraire user?.id une seule fois pour éviter les recalculs
  // S'assurer que userId est défini avant d'appeler les hooks
  const userId = user?.id;

  // Appeler tous les hooks AVANT le return conditionnel (règle de React)
  // Les hooks React Query sont automatiquement désactivés si userId est undefined grâce à 'enabled'
  // Passer userId explicitement pour éviter les appels multiples à useAuth dans les hooks
  // Le leaderboard ne nécessite pas d'userId, donc on peut toujours l'appeler
  const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useGlobalLeaderboard(10);
  const { data: gamification, isLoading: isLoadingGamification } = useUserGamification(userId);
  const { data: badges = [], isLoading: isLoadingBadges } = useUserBadges(userId);
  const { data: achievements = [], isLoading: isLoadingAchievements } = useUserAchievements(userId);
  const { data: pointsHistory = [], isLoading: isLoadingPoints } = usePointsHistory(userId, 10);

  // Hooks pour les animations (doivent être appelés avant tout early return)
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const progressRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();
  const historyRef = useScrollAnimation<HTMLDivElement>();

  // Si l'utilisateur n'est pas encore chargé, afficher un skeleton
  // Cette vérification doit être faite APRÈS tous les appels de hooks
  if (authLoading || !user || !userId) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // Combiner tous les états de chargement
  const isLoading =
    isLoadingGamification ||
    isLoadingBadges ||
    isLoadingAchievements ||
    isLoadingLeaderboard ||
    isLoadingPoints;

  // Afficher le skeleton pendant le chargement
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!gamification) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="pt-6 px-3 sm:px-6">
          <p className="text-center text-xs sm:text-sm md:text-base text-muted-foreground py-6 sm:py-8">
            Aucune donnée de gamification disponible. Vos statistiques apparaîtront ici une fois que
            vous commencerez à utiliser la plateforme.
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage =
    gamification.experience_points_to_next_level > 0
      ? (gamification.experience_points / gamification.experience_points_to_next_level) * 100
      : 100;

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Stats principales */}
      <div
        ref={statsRef}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {[
          {
            label: 'Points totaux',
            value: gamification.total_points.toLocaleString(),
            description: `+${gamification.points_earned_today} aujourd'hui`,
            icon: Star,
            gradient: 'from-yellow-500 to-orange-500',
            iconBg: 'from-yellow-500/10 to-orange-500/5',
            iconBorder: 'border-yellow-500/20',
            iconColor: 'text-yellow-500',
          },
          {
            label: 'Niveau',
            value: `Niveau ${gamification.current_level}`,
            description: `${gamification.experience_points}/${gamification.experience_points_to_next_level} XP`,
            icon: Trophy,
            gradient: 'from-purple-600 to-pink-600',
            iconBg: 'from-purple-500/10 to-pink-500/5',
            iconBorder: 'border-purple-500/20',
            iconColor: 'text-purple-500',
          },
          {
            label: 'Série',
            value: `${gamification.current_streak_days} jours`,
            description: `Record: ${gamification.longest_streak_days} jours`,
            icon: Zap,
            gradient: 'from-orange-500 to-red-500',
            iconBg: 'from-orange-500/10 to-red-500/5',
            iconBorder: 'border-orange-500/20',
            iconColor: 'text-orange-500',
          },
          {
            label: 'Classement',
            value: `#${gamification.global_rank || 'N/A'}`,
            description: 'Global',
            icon: Crown,
            gradient: 'from-blue-600 to-cyan-600',
            iconBg: 'from-blue-500/10 to-cyan-500/5',
            iconBorder: 'border-blue-500/20',
            iconColor: 'text-blue-500',
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon
                  className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 ${stat.iconColor}`}
                  aria-hidden="true"
                />
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                <div
                  className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold ${stat.gradient.includes('from-') ? `bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent` : ''}`}
                >
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress bar pour le niveau */}
      <Card
        ref={progressRef}
        className="border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      >
        <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">
            Progression vers le niveau {gamification.current_level + 1}
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs md:text-sm">
            {gamification.experience_points} / {gamification.experience_points_to_next_level} XP
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          <Progress value={progressPercentage} className="h-2 sm:h-3 bg-muted/60" />
        </CardContent>
      </Card>

      {/* Tabs pour badges, achievements, leaderboard */}
      <Tabs
        ref={tabsRef}
        defaultValue="badges"
        className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 gap-1.5 sm:gap-2">
          <TabsTrigger
            value="badges"
            className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
          >
            <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            Badges {badges.length > 0 && <span className="ml-1">({badges.length})</span>}
          </TabsTrigger>
          <TabsTrigger
            value="achievements"
            className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
          >
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            Achievements{' '}
            {achievements.length > 0 && <span className="ml-1">({achievements.length})</span>}
          </TabsTrigger>
          <TabsTrigger
            value="leaderboard"
            className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
          >
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">
                Mes Badges
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                {badges.length} badge{badges.length > 1 ? 's' : ''} obtenu
                {badges.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {badges.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-xs sm:text-sm md:text-base text-muted-foreground">
                  Aucun badge obtenu pour le moment
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {badges.map(userBadge => (
                    <div
                      key={userBadge.id}
                      className="flex flex-col items-center p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors touch-manipulation"
                    >
                      {userBadge.badge?.icon_url ? (
                        <img
                          src={userBadge.badge.icon_url}
                          alt={userBadge.badge.name}
                          className="h-12 w-12 sm:h-16 sm:w-16 mb-2 rounded"
                        />
                      ) : (
                        <Award className="h-12 w-12 sm:h-16 sm:w-16 mb-2 text-primary flex-shrink-0" />
                      )}
                      <div className="text-[10px] sm:text-xs md:text-sm font-medium text-center text-gray-900 dark:text-gray-50 break-words">
                        {userBadge.badge?.name || 'Badge'}
                      </div>
                      <div className="text-[10px] xs:text-xs text-muted-foreground text-center mt-1">
                        {format(new Date(userBadge.earned_at), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">
                Mes Achievements
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                {achievements.length} achievement{achievements.length > 1 ? 's' : ''} débloqué
                {achievements.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {achievements.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-xs sm:text-sm md:text-base text-muted-foreground">
                  Aucun achievement débloqué pour le moment
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {achievements.map(userAchievement => (
                    <div
                      key={userAchievement.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                    >
                      {userAchievement.achievement?.icon_url ? (
                        <img
                          src={userAchievement.achievement.icon_url}
                          alt={userAchievement.achievement.title}
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded flex-shrink-0"
                        />
                      ) : (
                        <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-primary flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs sm:text-sm md:text-base text-gray-900 dark:text-gray-50 break-words">
                          {userAchievement.achievement?.title || 'Achievement'}
                        </div>
                        <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-1 break-words">
                          {userAchievement.achievement?.description}
                        </div>
                        <div className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                          {format(new Date(userAchievement.earned_at), 'dd MMM yyyy', {
                            locale: fr,
                          })}
                        </div>
                      </div>
                      {userAchievement.achievement?.reward_points && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          +{userAchievement.achievement.reward_points} points
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">
                Leaderboard Global
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                Top 10 des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {leaderboard.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-xs sm:text-sm md:text-base text-muted-foreground">
                  Aucun classement disponible pour le moment
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {leaderboard.map(entry => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 border border-border/50 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors ${
                        entry.user_id === user?.id
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 border-purple-400/40'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted font-bold text-xs sm:text-sm flex-shrink-0">
                        {entry.rank}
                      </div>
                      {entry.user_avatar ? (
                        <img
                          src={entry.user_avatar}
                          alt={entry.user_name}
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs sm:text-sm">
                          {entry.user_name?.[0] || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-50 flex items-center gap-2 flex-wrap">
                          <span className="truncate">{entry.user_name}</span>
                          {entry.user_id === user?.id && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              Vous
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                          Niveau {entry.current_level} • {entry.total_points.toLocaleString()}{' '}
                          points
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-50">
                          {entry.total_points.toLocaleString()}
                        </div>
                        <div className="text-[10px] xs:text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Historique des points */}
      <Card
        ref={historyRef}
        className="border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      >
        <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">
            Historique des Points
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs md:text-sm">
            Dernières activités
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {pointsHistory.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-xs sm:text-sm md:text-base text-muted-foreground">
              Aucun historique disponible
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {pointsHistory.map(entry => (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 border border-border/50 rounded-lg bg-muted/40"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm text-foreground break-words">
                        {entry.source_description || 'Points gagnés'}
                      </div>
                      <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(entry.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-medium text-xs sm:text-sm bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                      +{entry.points_earned} points
                    </div>
                    <div className="text-[10px] xs:text-xs text-muted-foreground">
                      Total: {entry.points_after.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
