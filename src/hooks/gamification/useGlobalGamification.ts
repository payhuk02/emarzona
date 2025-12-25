/**
 * Global Gamification Hook
 * Date: 30 Janvier 2025
 * 
 * Hook pour gérer la gamification globale (points, badges, achievements, leaderboard)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

// =====================================================
// TYPES
// =====================================================

export interface UserGamification {
  id: string;
  user_id: string;
  total_points: number;
  points_earned_today: number;
  points_earned_this_week: number;
  points_earned_this_month: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
  current_level: number;
  experience_points: number;
  experience_points_to_next_level: number;
  total_products_purchased: number;
  total_orders_completed: number;
  total_reviews_written: number;
  total_referrals: number;
  total_badges_earned: number;
  total_achievements_unlocked: number;
  global_rank: number | null;
  monthly_rank: number | null;
  weekly_rank: number | null;
  created_at: string;
  updated_at: string;
}

export interface GlobalBadge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  badge_type: 'purchase' | 'review' | 'referral' | 'streak' | 'level' | 'engagement' | 'custom';
  points_required: number;
  criteria: Record<string, any>;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  notification_sent: boolean;
  badge?: GlobalBadge;
}

export interface GlobalAchievement {
  id: string;
  title: string;
  description?: string;
  icon_url?: string;
  achievement_type: 'milestone' | 'challenge' | 'special' | 'custom';
  criteria: Record<string, any>;
  reward_points: number;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  notification_sent: boolean;
  achievement?: GlobalAchievement;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  points_earned: number;
  points_before: number;
  points_after: number;
  source_type: 'purchase' | 'review' | 'referral' | 'streak' | 'achievement' | 'badge' | 'engagement' | 'manual';
  source_id?: string;
  source_description?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  total_points: number;
  current_level: number;
  current_streak_days: number;
  total_products_purchased: number;
  rank: number;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useUserGamification - Récupère la gamification d'un utilisateur
 */
export const useUserGamification = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-gamification', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID manquant');

      // Essayer d'abord de récupérer l'entrée existante
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        // Si l'utilisateur n'a pas encore de gamification, utiliser la fonction RPC ou l'insert direct
        if (error.code === 'PGRST116') {
          // Essayer d'abord l'insert direct (plus simple)
          const { data: insertData, error: insertError } = await supabase
            .from('user_gamification')
            .insert([{
              user_id: targetUserId,
              total_points: 0,
              experience_points: 0,
              current_level: 1,
              experience_points_to_next_level: 100,
              points_earned_today: 0,
              points_earned_this_week: 0,
              points_earned_this_month: 0,
              current_streak_days: 0,
              longest_streak_days: 0,
              last_activity_date: new Date().toISOString().split('T')[0],
              total_products_purchased: 0,
              total_orders_completed: 0,
              total_reviews_written: 0,
              total_referrals: 0,
              total_badges_earned: 0,
              total_achievements_unlocked: 0,
            }])
            .select()
            .single();

          if (insertError) {
            // Si l'insert échoue (peut-être race condition), réessayer de récupérer
            const { data: retryData, error: retryError } = await supabase
              .from('user_gamification')
              .select('*')
              .eq('user_id', targetUserId)
              .single();

            if (retryError) {
              // Si la récupération échoue aussi, essayer la fonction RPC
              const { data: rpcData, error: rpcError } = await supabase
                .rpc('initialize_user_gamification', { p_user_id: targetUserId });

              if (rpcError) {
                // Si la fonction RPC échoue, logger l'erreur et relancer l'erreur d'insert
                logger.error('Error initializing gamification via RPC', { error: rpcError, userId: targetUserId });
                throw insertError; // Relancer l'erreur d'insert original
              }
              
              // La fonction RPC retourne un SETOF (tableau), prendre le premier élément
              if (Array.isArray(rpcData) && rpcData.length > 0) {
                return rpcData[0] as UserGamification;
              }
              // Si le tableau est vide, relancer l'erreur
              throw new Error('Failed to initialize user gamification');
            }

            return retryData as UserGamification;
          }

          return insertData as UserGamification;
        }
        throw error;
      }

      return data as UserGamification;
    },
    enabled: !!targetUserId,
  });
};

/**
 * useUserBadges - Récupère les badges d'un utilisateur
 */
export const useUserBadges = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-badges', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID manquant');

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:global_badges(*)
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });

      if (error) {
        // Si erreur 400/403/406, retourner un tableau vide au lieu de throw
        if (error.code === 'PGRST116' || error.code === 'PGRST301') {
          return [] as UserBadge[];
        }
        logger.warn('Error fetching user badges', { error, userId: targetUserId });
        return [] as UserBadge[];
      }
      return (data || []) as UserBadge[];
    },
    enabled: !!targetUserId,
  });
};

/**
 * useUserAchievements - Récupère les achievements d'un utilisateur
 */
export const useUserAchievements = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-achievements', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID manquant');

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:global_achievements(*)
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });

      if (error) {
        // Si erreur 400/403/406, retourner un tableau vide au lieu de throw
        if (error.code === 'PGRST116' || error.code === 'PGRST301') {
          return [] as UserAchievement[];
        }
        logger.warn('Error fetching user achievements', { error, userId: targetUserId });
        return [] as UserAchievement[];
      }
      return (data || []) as UserAchievement[];
    },
    enabled: !!targetUserId,
  });
};

/**
 * useGlobalLeaderboard - Récupère le leaderboard global
 * Note: Essaie d'abord d'utiliser la vue optimisée, sinon récupère les données séparément
 */
export const useGlobalLeaderboard = (limit: number = 10, period: 'all' | 'monthly' | 'weekly' = 'all') => {
  return useQuery({
    queryKey: ['global-leaderboard', limit, period],
    queryFn: async () => {
      // Essayer d'abord d'utiliser la vue optimisée si elle existe
      try {
        const { data: viewData, error: viewError } = await supabase
          .from('gamification_leaderboard_view')
          .select('*')
          .limit(limit);

        if (!viewError && viewData && viewData.length > 0) {
          // Transformer les données de la vue
          const leaderboard: LeaderboardEntry[] = viewData.map((entry: any, index: number) => ({
            user_id: entry.user_id,
            user_name: entry.user_name || 'Utilisateur',
            user_avatar: entry.avatar_url || undefined,
            total_points: entry.total_points || 0,
            current_level: entry.current_level || 1,
            current_streak_days: entry.current_streak_days || 0,
            total_products_purchased: entry.total_products_purchased || 0,
            rank: index + 1,
          }));
          return leaderboard;
        }
      } catch (viewErr) {
        // Si la vue n'existe pas ou échoue, continuer avec la méthode normale
        logger.debug('Leaderboard view not available, using direct query');
      }

      // Méthode de fallback : récupérer les données de gamification (sans jointure)
      const { data: gamificationData, error: gamificationError } = await supabase
        .from('user_gamification')
        .select(`
          user_id,
          total_points,
          current_level,
          current_streak_days,
          total_products_purchased
        `)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (gamificationError) {
        // Gérer toutes les erreurs possibles de manière gracieuse
        // Erreur 400 peut être due à une syntaxe incorrecte ou RLS
        // Erreur 403 peut être due à RLS qui bloque
        // Erreur 406 peut être due à un header Accept incorrect
        logger.warn('Leaderboard: Error fetching data', {
          error: gamificationError,
          code: gamificationError.code,
          message: gamificationError.message,
          details: gamificationError.details,
          hint: gamificationError.hint,
        });
        
        // Pour toutes les erreurs, retourner un tableau vide pour éviter de casser l'UI
        // L'utilisateur verra simplement "Aucun classement disponible"
        return [] as LeaderboardEntry[];
      }

      // Si pas de données, retourner un tableau vide
      if (!gamificationData || gamificationData.length === 0) {
        return [] as LeaderboardEntry[];
      }

      // Récupérer les profils séparément pour les user_id trouvés
      const userIds = gamificationData.map(entry => entry.user_id).filter(Boolean) as string[];
      
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, first_name, last_name, avatar_url')
          .in('user_id', userIds);

        // Ignorer les erreurs de profils (pas critique si les profils ne sont pas disponibles)
        if (!profilesError && profilesData) {
          profilesMap = new Map(
            profilesData.map(profile => [profile.user_id, profile])
          );
        }
      }

      // Transformer les données en combinant gamification et profils
      const leaderboard: LeaderboardEntry[] = gamificationData.map((entry, index) => {
        const profile = profilesMap.get(entry.user_id);
        return {
          user_id: entry.user_id,
          user_name: profile?.display_name || 
                    (profile?.first_name || profile?.last_name 
                      ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
                      : 'Utilisateur'),
          user_avatar: profile?.avatar_url || undefined,
          total_points: entry.total_points || 0,
          current_level: entry.current_level || 1,
          current_streak_days: entry.current_streak_days || 0,
          total_products_purchased: entry.total_products_purchased || 0,
          rank: index + 1,
        };
      });

      return leaderboard;
    },
  });
};

/**
 * usePointsHistory - Récupère l'historique des points
 */
export const usePointsHistory = (userId?: string, limit: number = 20) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['points-history', targetUserId, limit],
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID manquant');

      const { data, error } = await supabase
        .from('user_points_history')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Si erreur 400/403/406, retourner un tableau vide au lieu de throw
        if (error.code === 'PGRST116' || error.code === 'PGRST301') {
          return [] as PointsHistory[];
        }
        logger.warn('Error fetching points history', { error, userId: targetUserId });
        return [] as PointsHistory[];
      }
      return (data || []) as PointsHistory[];
    },
    enabled: !!targetUserId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useAwardGlobalPoints - Attribuer des points globaux
 */
export const useAwardGlobalPoints = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      points,
      sourceType,
      sourceId,
      sourceDescription,
    }: {
      userId: string;
      points: number;
      sourceType: PointsHistory['source_type'];
      sourceId?: string;
      sourceDescription?: string;
    }) => {
      const { data, error } = await supabase.rpc('award_global_points', {
        p_user_id: userId,
        p_points: points,
        p_source_type: sourceType,
        p_source_id: sourceId || null,
        p_source_description: sourceDescription || null,
      });

      if (error) {
        logger.error('Error awarding global points', { error, userId, points });
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-gamification', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['points-history', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements', variables.userId] });

      // Afficher une notification si level up
      if (data?.leveled_up) {
        toast({
          title: '🎉 Level Up !',
          description: `Vous êtes maintenant niveau ${data.level_after} !`,
        });
      } else {
        toast({
          title: `+ ${variables.points} points !`,
          description: variables.sourceDescription || 'Points gagnés',
        });
      }
    },
    onError: (error: any) => {
      logger.error('Error in useAwardGlobalPoints', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'attribuer les points',
        variant: 'destructive',
      });
    },
  });
};

