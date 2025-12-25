/**
 * Marketing Automation System
 * Système d'automatisation marketing pour emails, campagnes et workflows
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { sendEmail as sendEmailViaSendGrid } from '@/lib/sendgrid';
import type { SendEmailPayload } from '@/types/email';

export interface EmailCampaign {
  id: string;
  name: string;
  type: 'transactional' | 'marketing' | 'newsletter' | 'abandoned_cart' | 'welcome';
  subject: string;
  template: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  scheduledAt?: string;
  targetAudience?: {
    segment?: string;
    filters?: Record<string, any>;
  };
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
}

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'condition';
  event?: string;
  schedule?: string;
  condition?: Record<string, any>;
}

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'update_tag' | 'add_to_segment' | 'webhook';
  config: Record<string, any>;
}

export interface MarketingWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
  updatedAt: string;
}

/**
 * Classe principale pour le marketing automation
 */
export class MarketingAutomation {
  /**
   * Envoyer un email transactionnel
   */
  async sendTransactionalEmail(
    to: string,
    template: string,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      const result = await sendEmailViaSendGrid({
        to,
        templateSlug: template,
        variables: data,
        type: 'transactional',
      } as SendEmailPayload);
      const emailSent = result.success;

      // Logger l'envoi
      await this.logEmailEvent({
        email: to,
        type: 'transactional',
        template,
        status: emailSent ? 'sent' : 'failed',
        data,
      });

      return emailSent;
    } catch (error) {
      logger.error('MarketingAutomation.sendTransactionalEmail error', { error, to, template });
      return false;
    }
  }

  /**
   * Envoyer un email marketing
   */
  async sendMarketingEmail(
    to: string,
    campaignId: string,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      // Vérifier si l'utilisateur a désabonné
      const isUnsubscribed = await this.isUnsubscribed(to);
      if (isUnsubscribed) {
        logger.warn('User unsubscribed, skipping email', { email: to });
        return false;
      }

      // Récupérer la campagne
      const campaign = await this.getCampaign(campaignId);
      if (!campaign || campaign.status !== 'active') {
        logger.warn('Campaign not found or not active', { campaignId });
        return false;
      }

      const result = await sendEmailViaSendGrid({
        to,
        templateSlug: campaign.template,
        variables: {
          ...data,
          unsubscribeUrl: typeof window !== 'undefined' 
            ? `${window.location.origin}/unsubscribe?email=${encodeURIComponent(to)}&campaign=${campaignId}`
            : `/unsubscribe?email=${encodeURIComponent(to)}&campaign=${campaignId}`,
        },
        type: 'marketing',
      } as SendEmailPayload);
      const emailSent = result.success;

      // Logger l'envoi
      await this.logEmailEvent({
        email: to,
        type: 'marketing',
        campaignId,
        template: campaign.template,
        status: emailSent ? 'sent' : 'failed',
        data,
      });

      // Mettre à jour les métriques de la campagne
      if (emailSent) {
        await this.updateCampaignMetrics(campaignId, 'sent');
      }

      return emailSent;
    } catch (error) {
      logger.error('MarketingAutomation.sendMarketingEmail error', { error, to, campaignId });
      return false;
    }
  }

  /**
   * Envoyer un email d'abandon de panier
   */
  async sendAbandonedCartEmail(userId: string, cartItems: any[]): Promise<boolean> {
    try {
      // Récupérer les informations utilisateur depuis profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        logger.warn('Profile not found for user', { userId });
        return false;
      }

      // Récupérer l'email depuis auth.users via RPC ou utiliser le service email
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user || user.id !== userId) {
        // Si l'utilisateur actuel n'est pas celui demandé, on ne peut pas récupérer son email
        // Utiliser une Edge Function ou RPC pour cela
        logger.warn('Cannot get email for different user', { userId });
        return false;
      }

      const userEmail = user.email || undefined;
      if (!userEmail) {
        return false;
      }

      // Vérifier si l'utilisateur a désabonné
      const isUnsubscribed = await this.isUnsubscribed(userEmail);
      if (isUnsubscribed) {
        return false;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const result = await sendEmailViaSendGrid({
        to: userEmail,
        templateSlug: 'abandoned_cart',
        variables: {
          userName: profile.display_name || profile.first_name || 'Client',
          cartItems,
          cartUrl: origin ? `${origin}/cart` : '/cart',
        },
        type: 'transactional',
      } as SendEmailPayload);
      const emailSent = result.success;

      // Logger l'envoi
      await this.logEmailEvent({
        email: userEmail,
        type: 'abandoned_cart',
        userId,
        status: emailSent ? 'sent' : 'failed',
        data: { cartItemsCount: cartItems.length },
      });

      return emailSent;
    } catch (error) {
      logger.error('MarketingAutomation.sendAbandonedCartEmail error', { error, userId });
      return false;
    }
  }

  /**
   * Envoyer un email de bienvenue
   */
  async sendWelcomeEmail(userId: string): Promise<boolean> {
    try {
      // Récupérer les informations utilisateur depuis profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        logger.warn('Profile not found for user', { userId });
        return false;
      }

      // Récupérer l'email depuis auth.users
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user || user.id !== userId) {
        logger.warn('Cannot get email for different user', { userId });
        return false;
      }

      const userEmail = user.email || undefined;
      if (!userEmail) {
        return false;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const result = await sendEmailViaSendGrid({
        to: userEmail,
        templateSlug: 'welcome',
        variables: {
          userName: profile.display_name || profile.first_name || 'Client',
          dashboardUrl: origin ? `${origin}/dashboard` : '/dashboard',
        },
        type: 'transactional',
      } as SendEmailPayload);
      const emailSent = result.success;

      // Logger l'envoi
      await this.logEmailEvent({
        email: userEmail,
        type: 'welcome',
        userId,
        status: emailSent ? 'sent' : 'failed',
      });

      return emailSent;
    } catch (error) {
      logger.error('MarketingAutomation.sendWelcomeEmail error', { error, userId });
      return false;
    }
  }

  /**
   * Créer une campagne email
   * Note: Utilisez EmailCampaignService.createCampaign() à la place
   */
  async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'metrics'>): Promise<string> {
    try {
      // Utiliser le service dédié si disponible
      const { EmailCampaignService } = await import('@/lib/email/email-campaign-service');
      const created = await EmailCampaignService.createCampaign({
        store_id: campaign.targetAudience?.segment || '', // Nécessite store_id
        name: campaign.name,
        type: campaign.type as any,
        template_id: campaign.template as any,
        status: campaign.status as any,
        scheduled_at: campaign.scheduledAt,
        audience_type: 'segment' as any,
        segment_id: campaign.targetAudience?.segment as any,
        audience_filters: campaign.targetAudience?.filters || {},
      });
      return created.id;
    } catch (error) {
      logger.error('MarketingAutomation.createCampaign error', { error, campaign });
      throw error;
    }
  }

  /**
   * Exécuter un workflow
   */
  async executeWorkflow(workflowId: string, context: Record<string, any>): Promise<boolean> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow || workflow.status !== 'active') {
        logger.warn('Workflow not found or not active', { workflowId });
        return false;
      }

      // Vérifier le trigger
      const shouldExecute = await this.checkTrigger(workflow.trigger, context);
      if (!shouldExecute) {
        return false;
      }

      // Exécuter les actions
      for (const action of workflow.actions) {
        await this.executeAction(action, context);
      }

      return true;
    } catch (error) {
      logger.error('MarketingAutomation.executeWorkflow error', { error, workflowId, context });
      return false;
    }
  }

  /**
   * Vérifier si un utilisateur a désabonné
   */
  private async isUnsubscribed(email: string): Promise<boolean> {
    try {
      // @ts-expect-error - email_unsubscribes table not in generated types
      const { data, error } = await supabase
        .from('email_unsubscribes')
        .select('id')
        .eq('email', email)
        .single();

      return !error && !!data;
    } catch (error) {
      logger.error('MarketingAutomation.isUnsubscribed error', { error, email });
      return false;
    }
  }

  /**
   * Récupérer une campagne
   * Note: Utilisez EmailCampaignService.getCampaign() à la place
   */
  private async getCampaign(campaignId: string): Promise<EmailCampaign | null> {
    try {
      const { EmailCampaignService } = await import('@/lib/email/email-campaign-service');
      const campaign = await EmailCampaignService.getCampaign(campaignId);
      if (!campaign) {
        return null;
      }

      // Convertir au format legacy
      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type as any,
        subject: '', // Non disponible dans le nouveau format
        template: campaign.template_id || '',
        status: campaign.status as any,
        scheduledAt: campaign.scheduled_at || undefined,
        targetAudience: {
          segment: campaign.segment_id,
          filters: campaign.audience_filters,
        },
        metrics: campaign.metrics,
      };
    } catch (error) {
      logger.error('MarketingAutomation.getCampaign error', { error, campaignId });
      return null;
    }
  }

  /**
   * Récupérer un workflow
   * Note: Utilisez EmailWorkflowService.getWorkflow() à la place
   */
  private async getWorkflow(workflowId: string): Promise<MarketingWorkflow | null> {
    try {
      const { EmailWorkflowService } = await import('@/lib/email/email-workflow-service');
      const workflow = await EmailWorkflowService.getWorkflow(workflowId);
      if (!workflow) {
        return null;
      }

      // Convertir au format legacy
      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        trigger: {
          type: workflow.trigger_type as any,
          event: workflow.trigger_config?.event,
          schedule: workflow.trigger_config?.schedule,
          condition: workflow.conditions,
        },
        actions: workflow.actions.map((action) => ({
          type: action.type as any,
          config: action.config,
        })),
        status: workflow.status as any,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at,
      };
    } catch (error) {
      logger.error('MarketingAutomation.getWorkflow error', { error, workflowId });
      return null;
    }
  }

  /**
   * Vérifier un trigger
   */
  private async checkTrigger(trigger: WorkflowTrigger, context: Record<string, any>): Promise<boolean> {
    switch (trigger.type) {
      case 'event':
        return context.event === trigger.event;
      case 'schedule':
        // TODO: Implémenter la vérification de schedule
        return true;
      case 'condition':
        // TODO: Implémenter la vérification de condition
        return true;
      default:
        return false;
    }
  }

  /**
   * Exécuter une action
   */
  private async executeAction(action: WorkflowAction, context: Record<string, any>): Promise<void> {
    switch (action.type) {
      case 'send_email':
        await this.sendMarketingEmail(
          context.email || context.user?.email,
          action.config.campaignId,
          { ...context, ...action.config.data }
        );
        break;
      case 'send_sms':
        // TODO: Implémenter l'envoi SMS
        logger.warn('SMS sending not implemented yet');
        break;
      case 'update_tag':
        // Utiliser le nouveau service de tags
        await this.updateTag(context, action.config);
        break;
      case 'add_to_segment':
        // TODO: Implémenter l'ajout à un segment
        logger.warn('Segment addition not implemented yet');
        break;
      case 'webhook':
        // TODO: Implémenter l'appel webhook
        logger.warn('Webhook call not implemented yet');
        break;
    }
  }

  /**
   * Mettre à jour un tag (ajouter ou supprimer)
   */
  private async updateTag(context: Record<string, any>, config: Record<string, any>): Promise<void> {
    try {
      const { emailTagService } = await import('@/lib/email/email-tag-service');
      const userId = context.userId || context.user_id || context.user?.id;
      const storeId = context.storeId || context.store_id;

      if (!userId || !storeId) {
        logger.warn('Cannot update tag: userId or storeId missing', { context, config });
        return;
      }

      const tag = config.tag;
      if (!tag) {
        logger.warn('Cannot update tag: tag missing in config', { config });
        return;
      }

      if (config.action === 'remove' || config.remove === true) {
        await emailTagService.removeTag(userId, storeId, tag);
        logger.info('Tag removed via automation', { userId, storeId, tag });
      } else {
        await emailTagService.addTag(userId, storeId, tag, config.context);
        logger.info('Tag added via automation', { userId, storeId, tag });
      }
    } catch (error) {
      logger.error('Error updating tag in automation', { error, context, config });
    }
  }

  /**
   * Logger un événement email
   * Note: Utilisez email_logs à la place de email_events
   */
  private async logEmailEvent(event: {
    email: string;
    type: string;
    campaignId?: string;
    userId?: string;
    template?: string;
    status: string;
    data?: Record<string, any>;
  }): Promise<void> {
    try {
      // Utiliser email_logs au lieu de email_events
      // @ts-expect-error - email_logs table not in generated types
      await supabase.from('email_logs').insert({
        recipient_email: event.email,
        template_slug: event.template,
        user_id: event.userId,
        campaign_id: event.campaignId,
        sendgrid_status: event.status,
        variables: event.data,
      });
    } catch (error) {
      logger.error('MarketingAutomation.logEmailEvent error', { error, event });
    }
  }

  /**
   * Mettre à jour les métriques d'une campagne
   * Note: Utilisez EmailCampaignService ou la fonction RPC increment_campaign_metric
   */
  private async updateCampaignMetrics(campaignId: string, metric: string): Promise<void> {
    try {
      // Utiliser la fonction RPC pour incrémenter les métriques
      // @ts-expect-error - increment_campaign_metric function not in generated types
      await supabase.rpc('increment_campaign_metric', {
        p_campaign_id: campaignId,
        p_metric_name: metric,
        p_increment: 1,
      });
    } catch (error) {
      logger.error('MarketingAutomation.updateCampaignMetrics error', { error, campaignId, metric });
    }
  }
}

// Instance singleton
export const marketingAutomation = new MarketingAutomation();

