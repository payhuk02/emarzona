/**
 * Email Campaign Service
 * Service pour la gestion des campagnes email marketing
 * Date: 1er Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/sendgrid';
import { getErrorMessage } from '@/types/errors';
import type { SendEmailPayload } from '@/types/email';

// ============================================================
// TYPES
// ============================================================

export type CampaignType =
  | 'newsletter'
  | 'promotional'
  | 'transactional'
  | 'abandon_cart'
  | 'nurture';
export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'paused'
  | 'completed'
  | 'cancelled';
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

const EMAIL_CAMPAIGN_FIELDS =
  'id,store_id,name,description,type,template_id,status,scheduled_at,send_at_timezone,recurrence,recurrence_end_at,audience_type,segment_id,audience_filters,estimated_recipients,ab_test_enabled,ab_test_variants,ab_test_winner,metrics,created_by,created_at,updated_at';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CAMPAIGN_TYPES = new Set<CampaignType>([
  'newsletter',
  'promotional',
  'transactional',
  'abandon_cart',
  'nurture',
]);

const AUDIENCE_TYPES = new Set<AudienceType>(['segment', 'list', 'filter']);

function normalizeCampaignType(value?: string): CampaignType {
  return value && CAMPAIGN_TYPES.has(value as CampaignType)
    ? (value as CampaignType)
    : 'newsletter';
}

function normalizeAudienceType(value?: string): AudienceType {
  return value && AUDIENCE_TYPES.has(value as AudienceType) ? (value as AudienceType) : 'filter';
}

function toIsoTimestamp(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function optionalUuid(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !UUID_RE.test(trimmed)) return undefined;
  return trimmed;
}

function buildCampaignInsertRow(payload: CreateCampaignPayload): Record<string, unknown> {
  const storeId = optionalUuid(payload.store_id);
  if (!storeId) {
    throw new Error('Boutique invalide. Rechargez la page et réessayez.');
  }

  const name = payload.name?.trim();
  if (!name) {
    throw new Error('Le nom de la campagne est obligatoire.');
  }

  const scheduledAt = toIsoTimestamp(payload.scheduled_at);
  const row: Record<string, unknown> = {
    store_id: storeId,
    name,
    type: normalizeCampaignType(payload.type),
    audience_type: normalizeAudienceType(payload.audience_type),
    status: scheduledAt ? 'scheduled' : 'draft',
    send_at_timezone: payload.send_at_timezone?.trim() || 'Africa/Dakar',
    audience_filters: payload.audience_filters ?? {},
  };

  const description = payload.description?.trim();
  if (description) row.description = description;

  const templateId = optionalUuid(payload.template_id);
  if (templateId) row.template_id = templateId;

  const segmentId = optionalUuid(payload.segment_id);
  if (segmentId) row.segment_id = segmentId;

  if (scheduledAt) row.scheduled_at = scheduledAt;
  if (payload.recurrence) row.recurrence = payload.recurrence;
  if (payload.recurrence_end_at) row.recurrence_end_at = payload.recurrence_end_at;
  if (payload.estimated_recipients != null) row.estimated_recipients = payload.estimated_recipients;
  if (payload.ab_test_enabled != null) row.ab_test_enabled = payload.ab_test_enabled;
  if (payload.ab_test_variants) row.ab_test_variants = payload.ab_test_variants;

  return row;
}

function sanitizeCampaignUpdatePayload(payload: UpdateCampaignPayload): UpdateCampaignPayload {
  const next: UpdateCampaignPayload = { ...payload };

  if ('name' in next && typeof next.name === 'string') {
    next.name = next.name.trim();
  }
  if ('description' in next) {
    const description = next.description?.trim();
    next.description = description || undefined;
  }
  if ('template_id' in next) {
    const templateId = optionalUuid(next.template_id);
    next.template_id = templateId ?? null;
  }
  if ('segment_id' in next) {
    const segmentId = optionalUuid(next.segment_id);
    next.segment_id = segmentId ?? null;
  }
  if ('type' in next) {
    next.type = normalizeCampaignType(next.type);
  }
  if ('audience_type' in next) {
    next.audience_type = normalizeAudienceType(next.audience_type);
  }
  if ('scheduled_at' in next) {
    next.scheduled_at = toIsoTimestamp(next.scheduled_at);
  }

  return next;
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
        .insert(buildCampaignInsertRow(payload))
        .select(EMAIL_CAMPAIGN_FIELDS)
        .single();

      if (error) {
        logger.error('Error creating campaign', { error, payload });
        throw error;
      }

      return data as EmailCampaign;
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.createCampaign error', { error: caught, payload });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
    }
  }

  /**
   * Récupérer une campagne par ID
   */
  static async getCampaign(campaignId: string): Promise<EmailCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select(EMAIL_CAMPAIGN_FIELDS)
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
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.getCampaign error', { error: caught, campaignId });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
    }
  }

  /**
   * Récupérer toutes les campagnes d'un store
   */
  static async getCampaigns(
    storeId: string,
    filters?: {
      status?: CampaignStatus;
      type?: CampaignType;
      limit?: number;
      offset?: number;
    }
  ): Promise<EmailCampaign[]> {
    try {
      let query = supabase
        .from('email_campaigns')
        .select(EMAIL_CAMPAIGN_FIELDS)
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
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.getCampaigns error', { error: caught, storeId, filters });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
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
        .update(sanitizeCampaignUpdatePayload(payload))
        .eq('id', campaignId)
        .select(EMAIL_CAMPAIGN_FIELDS)
        .single();

      if (error) {
        logger.error('Error updating campaign', { error, campaignId, payload });
        throw error;
      }

      return data as EmailCampaign;
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.updateCampaign error', {
        error: caught,
        campaignId,
        payload,
      });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
    }
  }

  /**
   * Supprimer une campagne
   */
  static async deleteCampaign(campaignId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('email_campaigns').delete().eq('id', campaignId);

      if (error) {
        logger.error('Error deleting campaign', { error, campaignId });
        throw error;
      }

      return true;
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.deleteCampaign error', { error: caught, campaignId });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
    }
  }

  /**
   * Programmer une campagne
   */
  static async scheduleCampaign(campaignId: string, scheduledAt: string): Promise<EmailCampaign> {
    try {
      return await this.updateCampaign(campaignId, {
        status: 'scheduled',
        scheduled_at: scheduledAt,
      });
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.scheduleCampaign error', {
        error: caught,
        campaignId,
        scheduledAt,
      });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
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
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.pauseCampaign error', { error: caught, campaignId });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
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
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.resumeCampaign error', { error: caught, campaignId });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
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
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.cancelCampaign error', { error: caught, campaignId });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
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
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.updateCampaignMetrics error', {
        error: caught,
        campaignId,
        metrics,
      });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
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
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.duplicateCampaign error', { error: caught, campaignId });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
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
    } catch (caught: unknown) {
      logger.error('EmailCampaignService.sendCampaign error', { error: caught, campaignId });
      throw caught instanceof Error ? caught : new Error(getErrorMessage(caught));
    }
  }
}

// Export instance singleton
export const emailCampaignService = EmailCampaignService;
