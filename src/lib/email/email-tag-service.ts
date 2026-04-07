/**
 * Email Tag Service
 * Service complet pour la gestion des tags utilisateurs
 * Date: 2 Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

export interface EmailUserTag {
  id: string;
  user_id: string;
  store_id: string;
  tag: string;
  category: TagCategory;
  added_at: string;
  added_by?: string;
  context: Record<string, any>;
}

export type TagCategory = 'behavior' | 'segment' | 'custom' | 'system';

export interface CreateTagPayload {
  user_id: string;
  store_id: string;
  tag: string;
  context?: Record<string, any>;
  category?: TagCategory;
}

// ============================================================
// SERVICE
// ============================================================

export class EmailTagService {
  /**
   * Valide et normalise un tag
   */
  static validateAndNormalizeTag(tag: string): string {
    // Trim
    tag = tag.trim();
    
    // Vérifier longueur (1-50 caractères)
    if (tag.length < 1 || tag.length > 50) {
      throw new Error('Tag must be between 1 and 50 characters');
    }
    
    // Normaliser en lowercase
    tag = tag.toLowerCase();
    
    // Vérifier caractères valides (alphanumériques, underscore, tiret)
    if (!/^[a-z0-9_-]+$/.test(tag)) {
      throw new Error('Tag can only contain lowercase letters, numbers, underscores, and hyphens');
    }
    
    return tag;
  }

  /**
   * Ajouter un tag à un utilisateur
   */
  static async addTag(
    userId: string,
    storeId: string,
    tag: string,
    context?: Record<string, any>,
    category: TagCategory = 'custom',
    expiresInDays?: number
  ): Promise<string> {
    try {
      // Valider et normaliser le tag
      const normalizedTag = this.validateAndNormalizeTag(tag);

      // Valider la catégorie
      if (!['behavior', 'segment', 'custom', 'system'].includes(category)) {
        throw new Error('Invalid category. Must be one of: behavior, segment, custom, system');
      }

      // Appeler la fonction SQL
      const { data, error } = await supabase.rpc('add_user_tag', {
        p_user_id: userId,
        p_store_id: storeId,
        p_tag: normalizedTag,
        p_context: context || {},
        p_category: category,
        p_expires_in_days: expiresInDays || null,
      });

      if (error) {
        logger.error('Error adding tag', { error, userId, storeId, tag, category });
        throw error;
      }

      logger.info('Tag added successfully', { userId, storeId, tag: normalizedTag, category });
      return data as string;
    } catch ( _error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailTagService.addTag error', { error: errorMessage, userId, storeId, tag, category });
      throw new Error(`Failed to add tag: ${errorMessage}`);
    }
  }

  /**
   * Supprimer un tag d'un utilisateur
   */
  static async removeTag(
    userId: string,
    storeId: string,
    tag: string
  ): Promise<boolean> {
    try {
      // Normaliser le tag
      const normalizedTag = this.validateAndNormalizeTag(tag);

      // Appeler la fonction SQL
      const { data, error } = await supabase.rpc('remove_user_tag', {
        p_user_id: userId,
        p_store_id: storeId,
        p_tag: normalizedTag,
      });

      if (error) {
        logger.error('Error removing tag', { error, userId, storeId, tag });
        throw error;
      }

      const removed = data as boolean;
      if (removed) {
        logger.info('Tag removed successfully', { userId, storeId, tag: normalizedTag });
      } else {
        logger.warn('Tag not found or already removed', { userId, storeId, tag: normalizedTag });
      }

      return removed;
    } catch ( _error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailTagService.removeTag error', { error: errorMessage, userId, storeId, tag });
      throw new Error(`Failed to remove tag: ${errorMessage}`);
    }
  }

  /**
   * Récupérer tous les tags d'un utilisateur pour un store
   */
  static async getUserTags(
    userId: string,
    storeId: string,
    category?: TagCategory
  ): Promise<EmailUserTag[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_tags_by_category', {
        p_user_id: userId,
        p_store_id: storeId,
        p_category: category || null,
      });

      if (error) {
        logger.error('Error fetching user tags', { error, userId, storeId, category });
        throw error;
      }

      // Convertir les résultats en format EmailUserTag
      const  tags: EmailUserTag[] = (data || []).map((item: any) => ({
        id: '', // Non retourné par la fonction, mais nécessaire pour l'interface
        user_id: userId,
        store_id: storeId,
        tag: item.tag,
        category: item.category || 'custom',
        added_at: item.added_at,
        added_by: item.added_by,
        context: item.context || {},
      }));

      return tags;
    } catch ( _error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailTagService.getUserTags error', { error: errorMessage, userId, storeId, category });
      throw new Error(`Failed to get user tags: ${errorMessage}`);
    }
  }

  /**
   * Récupérer tous les utilisateurs ayant un tag spécifique
   */
  static async getUsersByTag(
    storeId: string,
    tag: string
  ): Promise<Array<{ user_id: string; email: string; added_at: string }>> {
    try {
      // Normaliser le tag
      const normalizedTag = this.validateAndNormalizeTag(tag);

      const { data, error } = await supabase.rpc('get_users_by_tag', {
        p_store_id: storeId,
        p_tag: normalizedTag,
      });

      if (error) {
        logger.error('Error fetching users by tag', { error, storeId, tag });
        throw error;
      }

      return (data || []) as Array<{ user_id: string; email: string; added_at: string }>;
    } catch ( _error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailTagService.getUsersByTag error', { error: errorMessage, storeId, tag });
      throw new Error(`Failed to get users by tag: ${errorMessage}`);
    }
  }

  /**
   * Vérifier si un utilisateur a un tag spécifique
   */
  static async hasTag(
    userId: string,
    storeId: string,
    tag: string
  ): Promise<boolean> {
    try {
      const tags = await this.getUserTags(userId, storeId);
      const normalizedTag = this.validateAndNormalizeTag(tag);
      return tags.some((t) => t.tag === normalizedTag);
    } catch ( _error: any) {
      logger.error('EmailTagService.hasTag error', { error, userId, storeId, tag });
      return false;
    }
  }

  /**
   * Ajouter plusieurs tags en une seule opération
   */
  static async addTags(
    userId: string,
    storeId: string,
    tags: string[],
    context?: Record<string, any>,
    category: TagCategory = 'custom'
  ): Promise<string[]> {
    try {
      const  results: string[] = [];
      
      for (const tag of tags) {
        try {
          const tagId = await this.addTag(userId, storeId, tag, context, category);
          results.push(tagId);
        } catch (error) {
          logger.warn('Failed to add tag in batch', { error, userId, storeId, tag, category });
          // Continue avec les autres tags même si un échoue
        }
      }

      return results;
    } catch ( _error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailTagService.addTags error', { error: errorMessage, userId, storeId, tags, category });
      throw new Error(`Failed to add tags: ${errorMessage}`);
    }
  }

  /**
   * Supprimer plusieurs tags en une seule opération
   */
  static async removeTags(
    userId: string,
    storeId: string,
    tags: string[]
  ): Promise<number> {
    try {
      let  removedCount= 0;
      
      for (const tag of tags) {
        try {
          const removed = await this.removeTag(userId, storeId, tag);
          if (removed) {
            removedCount++;
          }
        } catch (error) {
          logger.warn('Failed to remove tag in batch', { error, userId, storeId, tag });
          // Continue avec les autres tags même si un échoue
        }
      }

      return removedCount;
    } catch ( _error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailTagService.removeTags error', { error: errorMessage, userId, storeId, tags });
      throw new Error(`Failed to remove tags: ${errorMessage}`);
    }
  }

  /**
   * Récupérer tous les tags uniques d'un store
   */
  static async getStoreTags(storeId: string, category?: TagCategory): Promise<Array<{
    tag: string;
    category: TagCategory;
    user_count: number;
    last_used_at: string;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_store_tags_by_category', {
        p_store_id: storeId,
        p_category: category || null,
      });

      if (error) {
        logger.error('Error fetching store tags', { error, storeId, category });
        throw error;
      }

      return (data || []).map((item: any) => ({
        tag: item.tag,
        category: item.category || 'custom',
        user_count: item.user_count || 0,
        last_used_at: item.last_used_at,
      }));
    } catch ( _error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailTagService.getStoreTags error', { error: errorMessage, storeId, category });
      throw new Error(`Failed to get store tags: ${errorMessage}`);
    }
  }

  /**
   * Nettoyer les tags expirés
   */
  static async cleanupExpiredTags(): Promise<{
    deleted_count: number;
    deleted_tags: Array<{
      id: string;
      user_id: string;
      store_id: string;
      tag: string;
      category: string;
    }>;
  }> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_tags');

      if (error) {
        logger.error('Error cleaning up expired tags', { error });
        throw error;
      }

      const result = (data || [])[0] || { deleted_count: 0, deleted_tags: [] };

      logger.info('Expired tags cleaned up', {
        deleted_count: result.deleted_count,
      });

      return {
        deleted_count: result.deleted_count || 0,
        deleted_tags: (result.deleted_tags || []) as Array<{
          id: string;
          user_id: string;
          store_id: string;
          tag: string;
          category: string;
        }>,
      };
    } catch ( _error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailTagService.cleanupExpiredTags error', { error: errorMessage });
      throw new Error(`Failed to cleanup expired tags: ${errorMessage}`);
    }
  }

  /**
   * Nettoyer les tags non utilisés
   */
  static async cleanupUnusedTags(
    storeId?: string,
    unusedDays: number = 90
  ): Promise<{
    deleted_count: number;
    deleted_tags: Array<{
      id: string;
      user_id: string;
      store_id: string;
      tag: string;
      category: string;
      added_at: string;
    }>;
  }> {
    try {
      const { data, error } = await supabase.rpc('cleanup_unused_tags', {
        p_store_id: storeId || null,
        p_unused_days: unusedDays,
      });

      if (error) {
        logger.error('Error cleaning up unused tags', { error, storeId, unusedDays });
        throw error;
      }

      const result = (data || [])[0] || { deleted_count: 0, deleted_tags: [] };

      logger.info('Unused tags cleaned up', {
        deleted_count: result.deleted_count,
        storeId,
        unusedDays,
      });

      return {
        deleted_count: result.deleted_count || 0,
        deleted_tags: (result.deleted_tags || []) as Array<{
          id: string;
          user_id: string;
          store_id: string;
          tag: string;
          category: string;
          added_at: string;
        }>,
      };
    } catch ( _error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailTagService.cleanupUnusedTags error', {
        error: errorMessage,
        storeId,
        unusedDays,
      });
      throw new Error(`Failed to cleanup unused tags: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les tags expirant bientôt
   */
  static async getExpiringTags(
    storeId?: string,
    daysAhead: number = 7
  ): Promise<Array<{
    user_id: string;
    store_id: string;
    tag: string;
    category: string;
    expires_at: string;
    days_until_expiry: number;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_expiring_tags', {
        p_store_id: storeId || null,
        p_days_ahead: daysAhead,
      });

      if (error) {
        logger.error('Error fetching expiring tags', { error, storeId, daysAhead });
        throw error;
      }

      return (data || []) as Array<{
        user_id: string;
        store_id: string;
        tag: string;
        category: string;
        expires_at: string;
        days_until_expiry: number;
      }>;
    } catch ( _error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailTagService.getExpiringTags error', {
        error: errorMessage,
        storeId,
        daysAhead,
      });
      throw new Error(`Failed to get expiring tags: ${errorMessage}`);
    }
  }
}

// Export instance singleton
export const emailTagService = EmailTagService;







