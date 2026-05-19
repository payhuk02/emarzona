import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { smartNotificationEngine } from '@/lib/notifications/smart-notification-engine';
import {
  sendUnifiedNotification,
  type UnifiedNotification,
} from '@/lib/notifications/unified-notifications';

interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'in_app' | 'sms';
  trigger: 'behavioral' | 'time_based' | 'segment_based' | 'event_based';
  conditions: Record<string, unknown>;
  template_id: string;
  is_active: boolean;
  priority: number;
  cooldown_hours: number;
  max_sends_per_user: number;
  created_at: string;
}

interface CampaignPerformance {
  campaign_id: string;
  sent_count: number;
  open_count: number;
  click_count: number;
  conversion_count: number;
  revenue_generated: number;
  last_updated: string;
}

const MARKETING_CAMPAIGN_FIELDS =
  'id,name,type,trigger,conditions,template_id,is_active,priority,cooldown_hours,max_sends_per_user,created_at,updated_at';
const PROFILE_MARKETING_FIELDS = 'id,user_id,display_name,first_name,last_name,phone,timezone';
const CAMPAIGN_PERFORMANCE_FIELDS =
  'campaign_id,sent_count,open_count,click_count,conversion_count,revenue_generated,last_updated';

export class MarketingAutomationEngine {
  private readonly MAX_CAMPAIGNS_PER_TRIGGER = 5;
  private readonly DEFAULT_COOLDOWN_HOURS = 24;

  /**
   * Process user behavior and trigger relevant marketing campaigns
   */
  async processUserBehavior(userId: string, behaviorEvent: Record<string, unknown>): Promise<void> {
    try {
      // Get active campaigns for this behavior type
      const campaigns = await this.getActiveCampaignsForBehavior(behaviorEvent.event_type);

      for (const campaign of campaigns) {
        if (await this.shouldTriggerCampaign(userId, campaign, behaviorEvent)) {
          await this.executeCampaign(userId, campaign, behaviorEvent);
        }
      }
    } catch (error) {
      logger.error('Error processing user behavior for marketing', {
        error,
        userId,
        behaviorEvent,
      });
    }
  }

  /**
   * Get active campaigns that match the behavior type
   */
  private async getActiveCampaignsForBehavior(eventType: string): Promise<MarketingCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select(MARKETING_CAMPAIGN_FIELDS)
        .eq('is_active', true)
        .eq('trigger', 'behavioral')
        .contains('conditions', { event_types: [eventType] })
        .order('priority', { ascending: false })
        .limit(this.MAX_CAMPAIGNS_PER_TRIGGER);

      if (error) {
        logger.error('Error fetching marketing campaigns', { error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Exception in getActiveCampaignsForBehavior', { error });
      return [];
    }
  }

  /**
   * Check if campaign should be triggered for this user
   */
  private async shouldTriggerCampaign(
    userId: string,
    campaign: MarketingCampaign,
    behaviorEvent: Record<string, unknown>
  ): Promise<boolean> {
    try {
      // Check cooldown period
      const { data: lastSend } = await supabase
        .from('marketing_campaign_sends')
        .select('sent_at')
        .eq('user_id', userId)
        .eq('campaign_id', campaign.id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (lastSend) {
        const hoursSinceLastSend =
          (Date.now() - new Date(lastSend.sent_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastSend < campaign.cooldown_hours) {
          return false;
        }
      }

      // Check max sends per user
      const { count } = await supabase
        .from('marketing_campaign_sends')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('campaign_id', campaign.id);

      if (count && count >= campaign.max_sends_per_user) {
        return false;
      }

      // Evaluate campaign conditions
      return this.evaluateCampaignConditions(campaign.conditions, behaviorEvent);
    } catch (error) {
      logger.error('Error checking campaign trigger conditions', { error, userId, campaign });
      return false;
    }
  }

  /**
   * Evaluate if campaign conditions are met
   */
  private evaluateCampaignConditions(
    conditions: Record<string, unknown>,
    behaviorEvent: Record<string, unknown>
  ): boolean {
    try {
      // Example conditions evaluation
      if (conditions.min_cart_value && behaviorEvent.event_data?.totalAmount) {
        if (behaviorEvent.event_data.totalAmount < conditions.min_cart_value) {
          return false;
        }
      }

      if (conditions.product_categories && behaviorEvent.event_data?.category) {
        if (!conditions.product_categories.includes(behaviorEvent.event_data.category)) {
          return false;
        }
      }

      if (conditions.device_types && behaviorEvent.device_info?.device_type) {
        if (!conditions.device_types.includes(behaviorEvent.device_info.device_type)) {
          return false;
        }
      }

      if (conditions.time_windows) {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();

        if (conditions.time_windows.hours && !conditions.time_windows.hours.includes(hour)) {
          return false;
        }

        if (conditions.time_windows.days && !conditions.time_windows.days.includes(dayOfWeek)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Error evaluating campaign conditions', { error, conditions, behaviorEvent });
      return false;
    }
  }

  /**
   * Execute a marketing campaign for a user
   */
  private async executeCampaign(
    userId: string,
    campaign: MarketingCampaign,
    behaviorEvent: Record<string, unknown>
  ): Promise<void> {
    try {
      // Get user profile for personalization
      const { data: userProfile } = await supabase
        .from('profiles')
        .select(PROFILE_MARKETING_FIELDS)
        .eq('user_id', userId)
        .maybeSingle();

      if (!userProfile) {
        logger.warn('User profile not found for campaign execution', { userId });
        return;
      }

      const { data: userEmail } = await supabase.rpc('get_user_email', {
        p_user_id: userProfile.user_id,
      });

      // Prepare personalized content
      const userName =
        userProfile.display_name ||
        [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') ||
        userProfile.user_id;
      const personalizedData = {
        user_id: userProfile.user_id,
        user_name: userName,
        user_email: typeof userEmail === 'string' ? userEmail : '',
        user_phone: userProfile.phone,
        behavior_context: behaviorEvent,
        campaign_id: campaign.id,
        triggered_by: behaviorEvent.event_type,
      };

      // Send through appropriate channel
      await this.sendCampaignMessage(campaign, personalizedData);

      // Record the send
      await supabase.from('marketing_campaign_sends').insert({
        user_id: userId,
        campaign_id: campaign.id,
        sent_at: new Date().toISOString(),
        channel: campaign.type,
        metadata: personalizedData,
      });

      logger.info('Marketing campaign executed successfully', {
        userId,
        campaignId: campaign.id,
        campaignName: campaign.name,
        channel: campaign.type,
      });
    } catch (error) {
      logger.error('Error executing marketing campaign', { error, userId, campaign });
    }
  }

  private mapCampaignChannels(
    type: MarketingCampaign['type']
  ): NonNullable<UnifiedNotification['channels']> {
    switch (type) {
      case 'email':
        return ['email'];
      case 'push':
        return ['push'];
      case 'sms':
        return ['sms'];
      case 'in_app':
      default:
        return ['in_app'];
    }
  }

  /**
   * Envoie la campagne via le moteur de notifications unifié.
   */
  private async sendCampaignMessage(
    campaign: MarketingCampaign,
    personalizedData: Record<string, unknown>
  ): Promise<void> {
    const userId = personalizedData.user_id as string | undefined;
    if (!userId) {
      logger.error('Campaign send missing user_id', { campaignId: campaign.id });
      return;
    }

    const template = await smartNotificationEngine.getTemplate(campaign.template_id);
    if (!template) {
      logger.error('Campaign template not found', { templateId: campaign.template_id });
      return;
    }

    const personalizedContent = this.personalizeTemplate(template.body, personalizedData);
    const personalizedSubject = template.subject
      ? this.personalizeTemplate(template.subject, personalizedData)
      : campaign.name;

    const result = await sendUnifiedNotification({
      user_id: userId,
      type: 'system_announcement',
      title: personalizedSubject,
      message: personalizedContent,
      channels: this.mapCampaignChannels(campaign.type),
      priority: 'normal',
      metadata: {
        marketing_campaign: true,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        channel: campaign.type,
        triggered_by: personalizedData.triggered_by,
        user_email: personalizedData.user_email,
        user_phone: personalizedData.user_phone,
      },
    });

    if (!result.success) {
      logger.error('Marketing campaign notification failed', {
        campaignId: campaign.id,
        userId,
        error: result.error,
      });
    }
  }

  /**
   * Personalize template content with user data
   */
  private personalizeTemplate(template: string, data: Record<string, unknown>): string {
    let personalized = template;

    // Replace placeholders like {{user_name}}, {{user_email}}, etc.
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      personalized = personalized.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return personalized;
  }

  /**
   * Create user segments based on behavior patterns
   */
  async createUserSegments(): Promise<void> {
    try {
      // High-value customers (frequent buyers)
      await this.createSegment({
        name: 'High-Value Customers',
        criteria: {
          min_total_purchases: 5,
          min_avg_order_value: 50000, // 50,000 XAF
          recency_days: 90,
        },
      });

      // Cart abandoners
      await this.createSegment({
        name: 'Cart Abandoners',
        criteria: {
          has_abandoned_cart: true,
          last_cart_abandonment_days: 7,
        },
      });

      // New users (first purchase within 30 days)
      await this.createSegment({
        name: 'New Customers',
        criteria: {
          account_age_days: 30,
          has_completed_purchase: true,
        },
      });

      // Window shoppers (many product views, few purchases)
      await this.createSegment({
        name: 'Window Shoppers',
        criteria: {
          product_views_last_30_days: 10,
          purchases_last_30_days: 0,
        },
      });

      // Mobile users
      await this.createSegment({
        name: 'Mobile Users',
        criteria: {
          primary_device: 'mobile',
          sessions_last_30_days: 3,
        },
      });
    } catch (error) {
      logger.error('Error creating user segments', { error });
    }
  }

  /**
   * Create a user segment
   */
  private async createSegment(segmentData: {
    name: string;
    criteria: Record<string, unknown>;
  }): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_segments')
        .upsert({
          name: segmentData.name,
          criteria: segmentData.criteria,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating user segment', { error, segmentData });
        throw error;
      }

      // Update user count for the segment
      await this.updateSegmentUserCount(data.id);
    } catch (error) {
      logger.error('Exception in createSegment', { error });
    }
  }

  /**
   * Update user count for a segment
   */
  private async updateSegmentUserCount(segmentId: string): Promise<void> {
    try {
      // This would involve complex SQL queries to count users matching criteria
      // For now, we'll use a simplified approach
      const { error } = await supabase.rpc('update_segment_user_count', {
        segment_id: segmentId,
      });

      if (error) {
        logger.error('Error updating segment user count', { error, segmentId });
      }
    } catch (error) {
      logger.error('Exception in updateSegmentUserCount', { error });
    }
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(campaignId: string): Promise<CampaignPerformance | null> {
    try {
      const { data, error } = await supabase
        .from('campaign_performance')
        .select(CAMPAIGN_PERFORMANCE_FIELDS)
        .eq('campaign_id', campaignId)
        .single();

      if (error) {
        logger.error('Error fetching campaign performance', { error, campaignId });
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Exception in getCampaignPerformance', { error });
      return null;
    }
  }

  /**
   * Run time-based campaigns (daily, weekly triggers)
   */
  async runTimeBasedCampaigns(): Promise<void> {
    try {
      const campaigns = await this.getActiveTimeBasedCampaigns();

      for (const campaign of campaigns) {
        const targetUsers = await this.getCampaignTargetUsers(campaign);
        await this.executeBulkCampaign(campaign, targetUsers);
      }
    } catch (error) {
      logger.error('Error running time-based campaigns', { error });
    }
  }

  /**
   * Get active time-based campaigns
   */
  private async getActiveTimeBasedCampaigns(): Promise<MarketingCampaign[]> {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select(MARKETING_CAMPAIGN_FIELDS)
      .eq('is_active', true)
      .eq('trigger', 'time_based');

    if (error) {
      logger.error('Error fetching time-based campaigns', { error });
      return [];
    }

    return data || [];
  }

  /**
   * Get target users for a campaign
   */
  private async getCampaignTargetUsers(_campaign: MarketingCampaign): Promise<string[]> {
    // This would involve complex queries based on campaign conditions
    // For now, return a placeholder
    return [];
  }

  /**
   * Execute campaign for multiple users
   */
  private async executeBulkCampaign(campaign: MarketingCampaign, userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      await this.executeCampaign(userId, campaign, {});
    }
  }
}

export const marketingAutomationEngine = new MarketingAutomationEngine();
