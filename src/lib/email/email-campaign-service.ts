/**
 * Email Campaign Service
 * Service pour la gestion des campagnes email marketing
 * Date: 1er Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/sendgrid';
import type { SendEmailPayload } from '@/types/email';

// ============================================================
// TYPES
// ============================================================

export type CampaignType = 'newsletter' | 'promotional' | 'transactional' | 'abandon_cart' | 'nurture';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'cancelled';
export type AudienceType = 'segment' | 'list' | 'filter';

export interface EmailCampaign {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  type: CampaignType;
  template_id?: string;
  status: CampaignStatus;
  scheduled_at?: string;
  send_at_timezone: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  recurrence_end_at?: string;
  audience_type: AudienceType;
  segment_id?: string;
  audience_filters: Record<string, string | number | boolean | null | undefined>;
  estimated_recipients?: number;
  ab_test_enabled: boolean;
  ab_test_variants?: Record<string, string | number | boolean | null | undefined>;
  ab_test_winner?: 'variant_a' | 'variant_b';
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    revenue: number;
  };
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignPayload {
  store_id: string;
  name: string;
  description?: string;
  type: CampaignType;
  template_id?: string;
  scheduled_at?: string;
  send_at_timezone?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  recurrence_end_at?: string;
  audience_type: AudienceType;
  segment_id?: string;
  audience_filters?: Record<string, string | number | boolean | null | undefined>;
  estimated_recipients?: number;
  ab_test_enabled?: boolean;
  ab_test_variants?: Record<string, string | number | boolean | null | undefined>;
}

export interface UpdateCampaignPayload {
  name?: string;
  description?: string;
  type?: CampaignType;
  template_id?: string;
  status?: CampaignStatus;
  scheduled_at?: string;
  send_at_timezone?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  recurrence_end_at?: string;
  audience_type?: AudienceType;
  segment_id?: string;
  audience_filters?: Record<string, string | number | boolean | null | undefined>;
  estimated_recipients?: number;
  ab_test_enabled?: boolean;
  ab_test_variants?: Record<string, string | number | boolean | null | undefined>;
}

// ============================================================
// SERVICE
// ============================================================

export class EmailCampaignService {
  /**
   * Créer une nouvelle campagne
   */
  static async createCampaign(payload: CreateCampaignPayload): Promise<EmailCampaign> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          ...payload,
          status: payload.scheduled_at ? 'scheduled' : 'draft',
          send_at_timezone: payload.send_at_timezone || 'Africa/Dakar',
          audience_filters: payload.audience_filters || {},
          metrics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0,
            revenue: 0,
          },
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating campaign', { error, payload });
        throw error;
      }

      return data as EmailCampaign;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.createCampaign error', { error, payload });
      throw error;
    }
  }

  /**
   * Récupérer une campagne par ID
   */
  static async getCampaign(campaignId: string): Promise<EmailCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error fetching campaign', { error, campaignId });
        throw error;
      }

      return data as EmailCampaign;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.getCampaign error', { error, campaignId });
      throw error;
    }
  }

  /**
   * Récupérer toutes les campagnes d'un store
   */
  static async getCampaigns(storeId: string, filters?: {
    status?: CampaignStatus;
    type?: CampaignType;
    limit?: number;
    offset?: number;
  }): Promise<EmailCampaign[]> {
    try {
      let  query= supabase
        .from('email_campaigns')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching campaigns', { error, storeId, filters });
        throw error;
      }

      return (data || []) as EmailCampaign[];
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.getCampaigns error', { error, storeId, filters });
      throw error;
    }
  }

  /**
   * Mettre à jour une campagne
   */
  static async updateCampaign(
    campaignId: string,
    payload: UpdateCampaignPayload
  ): Promise<EmailCampaign> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update(payload)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating campaign', { error, campaignId, payload });
        throw error;
      }

      return data as EmailCampaign;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.updateCampaign error', { error, campaignId, payload });
      throw error;
    }
  }

  /**
   * Supprimer une campagne
   */
  static async deleteCampaign(campaignId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        logger.error('Error deleting campaign', { error, campaignId });
        throw error;
      }

      return true;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.deleteCampaign error', { error, campaignId });
      throw error;
    }
  }

  /**
   * Programmer une campagne
   */
  static async scheduleCampaign(
    campaignId: string,
    scheduledAt: string
  ): Promise<EmailCampaign> {
    try {
      return await this.updateCampaign(campaignId, {
        status: 'scheduled',
        scheduled_at: scheduledAt,
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.scheduleCampaign error', { error, campaignId, scheduledAt });
      throw error;
    }
  }

  /**
   * Mettre en pause une campagne
   */
  static async pauseCampaign(campaignId: string): Promise<EmailCampaign> {
    try {
      return await this.updateCampaign(campaignId, {
        status: 'paused',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.pauseCampaign error', { error, campaignId });
      throw error;
    }
  }

  /**
   * Reprendre une campagne
   */
  static async resumeCampaign(campaignId: string): Promise<EmailCampaign> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Si la campagne était programmée, la remettre en scheduled
      // Sinon, la remettre en draft
      const newStatus = campaign.scheduled_at ? 'scheduled' : 'draft';

      return await this.updateCampaign(campaignId, {
        status: newStatus,
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.resumeCampaign error', { error, campaignId });
      throw error;
    }
  }

  /**
   * Annuler une campagne
   */
  static async cancelCampaign(campaignId: string): Promise<EmailCampaign> {
    try {
      return await this.updateCampaign(campaignId, {
        status: 'cancelled',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.cancelCampaign error', { error, campaignId });
      throw error;
    }
  }

  /**
   * Mettre à jour les métriques d'une campagne
   */
  static async updateCampaignMetrics(
    campaignId: string,
    metrics: Partial<EmailCampaign['metrics']>
  ): Promise<EmailCampaign> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const updatedMetrics = {
        ...campaign.metrics,
        ...metrics,
      };

      const { data, error } = await supabase
        .from('email_campaigns')
        .update({ metrics: updatedMetrics })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating campaign metrics', { error, campaignId, metrics });
        throw error;
      }

      return data as EmailCampaign;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.updateCampaignMetrics error', { error, campaignId, metrics });
      throw error;
    }
  }

  /**
   * Dupliquer une campagne
   */
  static async duplicateCampaign(campaignId: string): Promise<EmailCampaign> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const { id, created_at, updated_at, metrics, ...campaignData } = campaign;

      return await this.createCampaign({
        ...campaignData,
        name: `${campaign.name} (Copie)`,
        status: 'draft' as CampaignStatus,
        scheduled_at: undefined,
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.duplicateCampaign error', { error, campaignId });
      throw error;
    }
  }

  /**
   * Envoyer une campagne manuellement
   * Appelle l'Edge Function send-email-campaign pour déclencher l'envoi
   */
  static async sendCampaign(campaignId: string): Promise<boolean> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Vérifier que la campagne peut être envoyée
      if (campaign.status === 'sending') {
        throw new Error('Campaign is already being sent');
      }

      if (campaign.status === 'completed') {
        throw new Error('Campaign is already completed');
      }

      if (campaign.status === 'cancelled') {
        throw new Error('Campaign is cancelled and cannot be sent');
      }

      if (!campaign.template_id) {
        throw new Error('Campaign must have a template to be sent');
      }

      // Appeler l'Edge Function send-email-campaign
      const { data, error } = await supabase.functions.invoke('send-email-campaign', {
        body: {
          campaign_id: campaignId,
          batch_size: 100,
          batch_index: 0,
        },
      });

      if (error) {
        logger.error('Error invoking send-email-campaign Edge Function', { error, campaignId });
        throw error;
      }

      // Mettre à jour le statut de la campagne
      await this.updateCampaign(campaignId, {
        status: 'sending',
      });

      logger.info('Campaign sent successfully', { campaignId, data });
      return true;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailCampaignService.sendCampaign error', { error, campaignId });
      throw new Error(errorMessage);
    }
  }
}

// Export instance singleton
export const emailCampaignService = EmailCampaignService;







