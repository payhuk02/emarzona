/**
 * Email Segment Service
 * Service pour la gestion des segments d'audience email
 * Date: 1er Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

export type SegmentType = 'static' | 'dynamic';

export interface EmailSegment {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  type: SegmentType;
  criteria: Record<string, any>;
  member_count: number;
  last_calculated_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSegmentPayload {
  store_id: string;
  name: string;
  description?: string;
  type: SegmentType;
  criteria: Record<string, any>;
}

export interface SegmentMember {
  user_id: string;
  email: string;
  calculated_at: string;
}

// ============================================================
// SERVICE
// ============================================================

export class EmailSegmentService {
  /**
   * Créer un nouveau segment
   */
  static async createSegment(payload: CreateSegmentPayload): Promise<EmailSegment> {
    try {
      const { data, error } = await supabase
        .from('email_segments')
        .insert({
          ...payload,
          criteria: payload.criteria || {},
          member_count: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating segment', { error, payload });
        throw error;
      }

      return data as EmailSegment;
    } catch (error: any) {
      logger.error('EmailSegmentService.createSegment error', { error, payload });
      throw error;
    }
  }

  /**
   * Récupérer un segment par ID
   */
  static async getSegment(segmentId: string): Promise<EmailSegment | null> {
    try {
      const { data, error } = await supabase
        .from('email_segments')
        .select('*')
        .eq('id', segmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error fetching segment', { error, segmentId });
        throw error;
      }

      return data as EmailSegment;
    } catch (error: any) {
      logger.error('EmailSegmentService.getSegment error', { error, segmentId });
      throw error;
    }
  }

  /**
   * Récupérer tous les segments d'un store
   */
  static async getSegments(
    storeId: string,
    filters?: {
      type?: SegmentType;
      limit?: number;
      offset?: number;
    }
  ): Promise<EmailSegment[]> {
    try {
      let query = supabase
        .from('email_segments')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(
          filters.offset,
          (filters.offset || 0) + (filters.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching segments', { error, storeId, filters });
        throw error;
      }

      return (data || []) as EmailSegment[];
    } catch (error: any) {
      logger.error('EmailSegmentService.getSegments error', { error, storeId, filters });
      throw error;
    }
  }

  /**
   * Mettre à jour un segment
   */
  static async updateSegment(
    segmentId: string,
    payload: Partial<CreateSegmentPayload>
  ): Promise<EmailSegment> {
    try {
      const { data, error } = await supabase
        .from('email_segments')
        .update(payload)
        .eq('id', segmentId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating segment', { error, segmentId, payload });
        throw error;
      }

      return data as EmailSegment;
    } catch (error: any) {
      logger.error('EmailSegmentService.updateSegment error', { error, segmentId, payload });
      throw error;
    }
  }

  /**
   * Supprimer un segment
   */
  static async deleteSegment(segmentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_segments')
        .delete()
        .eq('id', segmentId);

      if (error) {
        logger.error('Error deleting segment', { error, segmentId });
        throw error;
      }

      return true;
    } catch (error: any) {
      logger.error('EmailSegmentService.deleteSegment error', { error, segmentId });
      throw error;
    }
  }

  /**
   * Calculer les membres d'un segment dynamique
   */
  static async calculateSegmentMembers(segmentId: string): Promise<SegmentMember[]> {
    try {
      const { data, error } = await supabase.rpc('calculate_dynamic_segment_members', {
        p_segment_id: segmentId,
      });

      if (error) {
        logger.error('Error calculating segment members', { error, segmentId });
        throw error;
      }

      return (data || []) as SegmentMember[];
    } catch (error: any) {
      logger.error('EmailSegmentService.calculateSegmentMembers error', { error, segmentId });
      throw error;
    }
  }

  /**
   * Mettre à jour le nombre de membres d'un segment
   */
  static async updateMemberCount(segmentId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('update_segment_member_count', {
        p_segment_id: segmentId,
      });

      if (error) {
        logger.error('Error updating member count', { error, segmentId });
        throw error;
      }

      return data as number;
    } catch (error: any) {
      logger.error('EmailSegmentService.updateMemberCount error', { error, segmentId });
      throw error;
    }
  }
}

// Export instance singleton
export const emailSegmentService = EmailSegmentService;

