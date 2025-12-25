/**
 * Gamification System
 * Système de gamification avec points, badges, niveaux et leaderboard
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface PointsTransaction {
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'expire';
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points?: number;
}

export interface UserBadge {
  badgeId: string;
  userId: string;
  earnedAt: string;
  progress?: number;
  maxProgress?: number;
}

export interface Level {
  level: number;
  name: string;
  pointsRequired: number;
  rewards?: string[];
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  points: number;
  level: number;
  rank: number;
  badges: number;
}

/**
 * Classe principale pour la gamification
 */
export class GamificationSystem {
  /**
   * Ajouter des points à un utilisateur
   */
  async addPoints(transaction: PointsTransaction): Promise<number> {
    try {
      // Ajouter la transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: transaction.userId,
          amount: transaction.amount,
          type: transaction.type,
          reason: transaction.reason,
          metadata: transaction.metadata,
        })
        .select()
        .single();

      if (transactionError || !transactionData) {
        throw new Error(`Failed to add points transaction: ${transactionError?.message || 'Unknown error'}`);
      }

      // Mettre à jour le total de points de l'utilisateur
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', transaction.userId)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        throw new Error(`Failed to get user points: ${pointsError.message}`);
      }

      const currentPoints = userPoints?.total_points || 0;
      const newTotal = transaction.type === 'earn' ? currentPoints + transaction.amount : currentPoints - transaction.amount;

      const { error: updateError } = await supabase.from('user_points').upsert(
        {
          user_id: transaction.userId,
          total_points: newTotal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (updateError) {
        throw new Error(`Failed to update user points: ${updateError.message}`);
      }

      // Vérifier les badges et niveaux
      await this.checkBadges(transaction.userId);
      await this.checkLevelUp(transaction.userId);

      return newTotal;
    } catch (error) {
      logger.error('GamificationSystem.addPoints error', { error, transaction });
      throw error;
    }
  }

  /**
   * Obtenir les points d'un utilisateur
   */
  async getUserPoints(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get user points: ${error.message}`);
      }

      return data?.total_points || 0;
    } catch (error) {
      logger.error('GamificationSystem.getUserPoints error', { error, userId });
      return 0;
    }
  }

  /**
   * Obtenir le niveau d'un utilisateur
   */
  async getUserLevel(userId: string): Promise<number> {
    try {
      const points = await this.getUserPoints(userId);
      return this.calculateLevel(points);
    } catch (error) {
      logger.error('GamificationSystem.getUserLevel error', { error, userId });
      return 1;
    }
  }

  /**
   * Obtenir les badges d'un utilisateur
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user badges: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('GamificationSystem.getUserBadges error', { error, userId });
      return [];
    }
  }

  /**
   * Attribuer un badge à un utilisateur
   */
  async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      // Vérifier si l'utilisateur a déjà ce badge
      const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single();

      if (existing) {
        return false; // Badge déjà attribué
      }

      // Attribuer le badge
      const { error } = await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(`Failed to award badge: ${error.message}`);
      }

      // Ajouter des points si le badge en donne
      const { data: badge } = await supabase.from('badges').select('points').eq('id', badgeId).single();
      if (badge?.points) {
        await this.addPoints({
          userId,
          amount: badge.points,
          type: 'earn',
          reason: `Badge: ${badgeId}`,
        });
      }

      return true;
    } catch (error) {
      logger.error('GamificationSystem.awardBadge error', { error, userId, badgeId });
      return false;
    }
  }

  /**
   * Obtenir le leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      const { data: users, error } = await supabase
        .from('user_points')
        .select(
          `
          user_id,
          total_points,
          profiles!inner (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get leaderboard: ${error.message}`);
      }

      const leaderboard: LeaderboardEntry[] = [];

      for (let i = 0; i < (users || []).length; i++) {
        const user = users[i];
        const points = user.total_points || 0;
        const level = this.calculateLevel(points);
        const badges = await this.getUserBadgesCount(user.user_id);

        type ProfileData = { full_name?: string; avatar_url?: string };
        const profile = user.profiles as ProfileData | null;
        leaderboard.push({
          userId: user.user_id,
          userName: profile?.full_name || 'Anonymous',
          userAvatar: profile?.avatar_url,
          points,
          level,
          rank: i + 1,
          badges,
        });
      }

      return leaderboard;
    } catch (error) {
      logger.error('GamificationSystem.getLeaderboard error', { error, limit });
      return [];
    }
  }

  /**
   * Vérifier les badges à attribuer
   */
  private async checkBadges(userId: string): Promise<void> {
    try {
      const points = await this.getUserPoints(userId);
      const level = this.calculateLevel(points);

      // Badge "Premier pas" - 10 points
      if (points >= 10) {
        await this.awardBadge(userId, 'first_steps');
      }

      // Badge "Niveau 5" - Niveau 5
      if (level >= 5) {
        await this.awardBadge(userId, 'level_5');
      }

      // Badge "Niveau 10" - Niveau 10
      if (level >= 10) {
        await this.awardBadge(userId, 'level_10');
      }

      // Badge "100 points" - 100 points
      if (points >= 100) {
        await this.awardBadge(userId, 'points_100');
      }

      // Badge "500 points" - 500 points
      if (points >= 500) {
        await this.awardBadge(userId, 'points_500');
      }

      // Badge "1000 points" - 1000 points
      if (points >= 1000) {
        await this.awardBadge(userId, 'points_1000');
      }
    } catch (error) {
      logger.error('GamificationSystem.checkBadges error', { error, userId });
    }
  }

  /**
   * Vérifier si l'utilisateur monte de niveau
   */
  private async checkLevelUp(userId: string): Promise<void> {
    try {
      const points = await this.getUserPoints(userId);
      const currentLevel = this.calculateLevel(points);

      // TODO: Envoyer une notification de montée de niveau
      // TODO: Attribuer des récompenses de niveau
    } catch (error) {
      logger.error('GamificationSystem.checkLevelUp error', { error, userId });
    }
  }

  /**
   * Calculer le niveau à partir des points
   */
  private calculateLevel(points: number): number {
    // Formule: level = floor(sqrt(points / 100)) + 1
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }

  /**
   * Obtenir le nombre de badges d'un utilisateur
   */
  private async getUserBadgesCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        return 0;
      }

      return count || 0;
    } catch (error) {
      return 0;
    }
  }
}

// Instance singleton
export const gamificationSystem = new GamificationSystem();


