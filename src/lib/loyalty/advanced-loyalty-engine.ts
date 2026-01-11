/**
 * Advanced Loyalty Engine
 * Moteur de fidélisation avancé avec points, niveaux et récompenses
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface LoyaltyRule {
  id: string;
  name: string;
  description: string;
  eventType: 'purchase' | 'review' | 'referral' | 'social_share' | 'login_streak' | 'birthday' | 'custom';
  points: number;
  multiplier?: number;
  conditions?: Record<string, unknown>;
  isActive: boolean;
  priority: number;
  storeId?: string;
  validFrom?: Date;
  validUntil?: Date;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  description: string;
  level: number;
  minPoints: number;
  maxPoints?: number;
  benefits: LoyaltyBenefit[];
  badgeColor: string;
  badgeIcon: string;
  storeId?: string;
}

export interface LoyaltyBenefit {
  type: 'discount_percentage' | 'discount_fixed' | 'free_shipping' | 'priority_support' | 'early_access' | 'exclusive_content' | 'bonus_points_multiplier';
  value: number;
  description: string;
  conditions?: Record<string, unknown>;
  validFrom?: Date;
  validUntil?: Date;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  points: number;
  type: 'earned' | 'spent' | 'expired' | 'bonus' | 'adjustment';
  reason: string;
  referenceId?: string; // order_id, review_id, etc.
  referenceType?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
  storeId?: string;
}

export interface UserLoyaltyProfile {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  spentPoints: number;
  currentTier: LoyaltyTier;
  nextTier?: LoyaltyTier;
  pointsToNextTier: number;
  badges: UserBadge[];
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
  };
  referralStats: {
    referralCode: string;
    totalReferrals: number;
    successfulReferrals: number;
    earnedFromReferrals: number;
  };
  preferences: {
    notificationsEnabled: boolean;
    emailUpdatesEnabled: boolean;
    smsUpdatesEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBadge {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ReferralProgram {
  id: string;
  name: string;
  description: string;
  referrerPoints: number;
  refereePoints: number;
  maxReferralsPerUser?: number;
  minPurchaseAmount?: number;
  expiryDays: number;
  isActive: boolean;
  storeId?: string;
  createdAt: Date;
}

/**
 * Moteur principal de fidélisation
 */
export class AdvancedLoyaltyEngine {
  private rulesCache: Map<string, LoyaltyRule[]> = new Map();
  private tiersCache: Map<string, LoyaltyTier[]> = new Map();
  private cacheTTL = 10 * 60 * 1000; // 10 minutes

  /**
   * Calcule les points à gagner pour un événement
   */
  async calculatePoints(
    userId: string,
    eventType: LoyaltyRule['eventType'],
    eventData: Record<string, unknown>,
    storeId?: string
  ): Promise<number> {
    try {
      const applicableRules = await this.getApplicableRules(eventType, storeId);

      let totalPoints = 0;

      for (const rule of applicableRules) {
        if (this.checkRuleConditions(rule, eventData)) {
          let points = rule.points;

          // Appliquer les multiplicateurs
          if (rule.multiplier) {
            points *= rule.multiplier;
          }

          // Vérifier les conditions spéciales
          points = await this.applySpecialConditions(userId, rule, points, eventData);

          totalPoints += points;
        }
      }

      return Math.round(totalPoints);
    } catch (error) {
      logger.error('Error calculating loyalty points', { userId, eventType, error });
      return 0;
    }
  }

  /**
   * Crédite des points à un utilisateur
   */
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    referenceId?: string,
    referenceType?: string,
    metadata?: Record<string, unknown>,
    storeId?: string
  ): Promise<LoyaltyTransaction> {
    try {
      // Vérifier que les points sont positifs
      if (points <= 0) {
        throw new Error('Points must be positive');
      }

      // Calculer la date d'expiration (par défaut 2 ans)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 2);

      // Créer la transaction
      const { data: transaction, error } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: userId,
          points,
          type: 'earned',
          reason,
          reference_id: referenceId,
          reference_type: referenceType,
          metadata,
          expires_at: expiresAt.toISOString(),
          store_id: storeId
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le profil utilisateur
      await this.updateUserProfile(userId);

      // Vérifier les nouveaux niveaux/badges
      await this.checkTierProgression(userId);
      await this.checkBadgeUnlocks(userId, reason);

      logger.info('Points awarded successfully', { userId, points, reason });

      return transaction as LoyaltyTransaction;
    } catch (error) {
      logger.error('Error awarding points', { userId, points, reason, error });
      throw error;
    }
  }

  /**
   * Utilise des points pour une récompense
   */
  async redeemPoints(
    userId: string,
    points: number,
    reason: string,
    metadata?: Record<string, unknown>,
    storeId?: string
  ): Promise<LoyaltyTransaction> {
    try {
      // Vérifier le solde disponible
      const profile = await this.getUserProfile(userId);
      if (profile.availablePoints < points) {
        throw new Error('Insufficient points balance');
      }

      // Créer la transaction de débit
      const { data: transaction, error } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: userId,
          points: -points, // Négatif pour le débit
          type: 'spent',
          reason,
          metadata,
          store_id: storeId
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le profil
      await this.updateUserProfile(userId);

      logger.info('Points redeemed successfully', { userId, points, reason });

      return transaction as LoyaltyTransaction;
    } catch (error) {
      logger.error('Error redeeming points', { userId, points, reason, error });
      throw error;
    }
  }

  /**
   * Obtient le profil de fidélité d'un utilisateur
   */
  async getUserProfile(userId: string): Promise<UserLoyaltyProfile> {
    try {
      // Récupérer les données de base
      const { data: profile, error } = await supabase
        .from('user_loyalty_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!profile) {
        // Créer un profil par défaut
        return await this.createDefaultProfile(userId);
      }

      // Calculer les statistiques
      const stats = await this.calculateUserStats(userId);

      // Déterminer le niveau actuel
      const currentTier = await this.getCurrentTier(userId, stats.totalPoints);

      return {
        ...profile,
        ...stats,
        currentTier,
        nextTier: await this.getNextTier(currentTier),
        pointsToNextTier: currentTier.maxPoints ? Math.max(0, currentTier.maxPoints - stats.totalPoints) : 0
      };
    } catch (error) {
      logger.error('Error getting user profile', { userId, error });
      throw error;
    }
  }

  /**
   * Traite un événement de fidélisation
   */
  async processLoyaltyEvent(
    userId: string,
    eventType: LoyaltyRule['eventType'],
    eventData: Record<string, unknown>,
    storeId?: string
  ): Promise<{ pointsAwarded: number; newTotalPoints: number; newTier?: LoyaltyTier }> {
    try {
      // Calculer les points
      const points = await this.calculatePoints(userId, eventType, eventData, storeId);

      if (points > 0) {
        // Créditer les points
        await this.awardPoints(userId, points, `Points for ${eventType}`, eventData.id, eventType, eventData, storeId);

        // Récupérer le nouveau profil
        const updatedProfile = await this.getUserProfile(userId);

        return {
          pointsAwarded: points,
          newTotalPoints: updatedProfile.totalPoints,
          newTier: updatedProfile.currentTier
        };
      }

      return { pointsAwarded: 0, newTotalPoints: (await this.getUserProfile(userId)).totalPoints };
    } catch (error) {
      logger.error('Error processing loyalty event', { userId, eventType, error });
      throw error;
    }
  }

  // Méthodes privées

  private async getApplicableRules(eventType: LoyaltyRule['eventType'], storeId?: string): Promise<LoyaltyRule[]> {
    const cacheKey = `rules_${eventType}_${storeId || 'global'}`;

    // Vérifier le cache
    const cached = this.rulesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // Récupérer depuis la base
    let query = supabase
      .from('loyalty_rules')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (storeId) {
      query = query.or(`store_id.eq.${storeId},store_id.is.null`);
    } else {
      query = query.is('store_id', null);
    }

    const { data: rules, error } = await query;

    if (error) throw error;

    const result = rules as LoyaltyRule[];

    // Mettre en cache
    this.rulesCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  }

  private checkRuleConditions(rule: LoyaltyRule, eventData: Record<string, unknown>): boolean {
    if (!rule.conditions) return true;

    // Implémenter la logique de vérification des conditions
    // Pour simplifier, on retourne true pour l'instant
    return true;
  }

  private async applySpecialConditions(
    userId: string,
    rule: LoyaltyRule,
    points: number,
    eventData: Record<string, unknown>
  ): Promise<number> {
    // Appliquer des conditions spéciales (multiplicateurs, etc.)
    // Pour l'instant, retourner les points inchangés
    return points;
  }

  private async calculateUserStats(userId: string): Promise<{
    totalPoints: number;
    availablePoints: number;
    spentPoints: number;
  }> {
    const { data: transactions, error } = await supabase
      .from('loyalty_transactions')
      .select('points, type, expires_at')
      .eq('user_id', userId);

    if (error) throw error;

    let totalEarned = 0;
    let totalSpent = 0;
    const now = new Date();

    for (const transaction of transactions || []) {
      if (transaction.type === 'earned' || transaction.type === 'bonus') {
        // Vérifier si les points n'ont pas expiré
        if (!transaction.expires_at || new Date(transaction.expires_at) > now) {
          totalEarned += transaction.points;
        }
      } else if (transaction.type === 'spent') {
        totalSpent += Math.abs(transaction.points);
      }
    }

    return {
      totalPoints: totalEarned,
      availablePoints: totalEarned - totalSpent,
      spentPoints: totalSpent
    };
  }

  private async getCurrentTier(userId: string, totalPoints: number): Promise<LoyaltyTier> {
    const cacheKey = 'tiers_global';

    let tiers = this.tiersCache.get(cacheKey)?.data;
    if (!tiers) {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('min_points', { ascending: true });

      if (error) throw error;
      tiers = data as LoyaltyTier[];
      this.tiersCache.set(cacheKey, { data: tiers, timestamp: Date.now() });
    }

    // Trouver le niveau approprié
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (totalPoints >= tiers[i].minPoints) {
        return tiers[i];
      }
    }

    // Retourner le niveau par défaut (premier)
    return tiers[0] || {
      id: 'default',
      name: 'Bronze',
      description: 'Niveau de départ',
      level: 1,
      minPoints: 0,
      benefits: [],
      badgeColor: '#CD7F32',
      badgeIcon: 'star'
    };
  }

  private async getNextTier(currentTier: LoyaltyTier): Promise<LoyaltyTier | undefined> {
    const tiers = this.tiersCache.get('tiers_global')?.data;
    if (!tiers) return undefined;

    const currentIndex = tiers.findIndex(t => t.id === currentTier.id);
    return tiers[currentIndex + 1];
  }

  private async createDefaultProfile(userId: string): Promise<UserLoyaltyProfile> {
    const defaultProfile = {
      userId,
      totalPoints: 0,
      availablePoints: 0,
      spentPoints: 0,
      currentTier: await this.getCurrentTier(userId, 0),
      pointsToNextTier: 100, // À configurer
      badges: [],
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date()
      },
      referralStats: {
        referralCode: this.generateReferralCode(),
        totalReferrals: 0,
        successfulReferrals: 0,
        earnedFromReferrals: 0
      },
      preferences: {
        notificationsEnabled: true,
        emailUpdatesEnabled: true,
        smsUpdatesEnabled: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Sauvegarder en base
    await supabase.from('user_loyalty_profiles').insert({
      user_id: userId,
      total_points: 0,
      available_points: 0,
      spent_points: 0,
      current_tier_id: defaultProfile.currentTier.id,
      referral_code: defaultProfile.referralStats.referralCode,
      preferences: defaultProfile.preferences
    });

    return defaultProfile;
  }

  private async updateUserProfile(userId: string): Promise<void> {
    const stats = await this.calculateUserStats(userId);
    const currentTier = await this.getCurrentTier(userId, stats.totalPoints);

    await supabase
      .from('user_loyalty_profiles')
      .update({
        total_points: stats.totalPoints,
        available_points: stats.availablePoints,
        spent_points: stats.spentPoints,
        current_tier_id: currentTier.id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }

  private async checkTierProgression(userId: string): Promise<void> {
    // Implémenter la logique de vérification de progression de niveau
    // Pour l'instant, juste logger
    logger.info('Checking tier progression', { userId });
  }

  private async checkBadgeUnlocks(userId: string, reason: string): Promise<void> {
    // Implémenter la logique de déblocage de badges
    // Pour l'instant, juste logger
    logger.info('Checking badge unlocks', { userId, reason });
  }

  private generateReferralCode(): string {
    return `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }
}

// Instance globale
export const loyaltyEngine = new AdvancedLoyaltyEngine();