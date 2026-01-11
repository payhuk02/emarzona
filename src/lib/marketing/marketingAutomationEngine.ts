import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { smartNotificationEngine } from '@/lib/notifications/smart-notification-engine';

interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'in_app' | 'sms';
  trigger: 'behavioral' | 'time_based' | 'segment_based' | 'event_based';
  conditions: Record<string, any>;
  template_id: string;
  is_active: boolean;
  priority: number;
  cooldown_hours: number;
  max_sends_per_user: number;
  created_at: string;
}

interface UserSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  user_count: number;
  last_updated: string;
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

export class MarketingAutomationEngine {
  private readonly MAX_CAMPAIGNS_PER_TRIGGER = 5;
  private readonly DEFAULT_COOLDOWN_HOURS = 24;

  /**
   * Process user behavior and trigger relevant marketing campaigns
   */
  async processUserBehavior(userId: string, behaviorEvent: any): Promise<void> {
    try {
      // Get active campaigns for this behavior type
      const campaigns = await this.getActiveCampaignsForBehavior(behaviorEvent.event_type);

      for (const campaign of campaigns) {
        if (await this.shouldTriggerCampaign(userId, campaign, behaviorEvent)) {
          await this.executeCampaign(userId, campaign, behaviorEvent);
        }
      }
    } catch (error) {
      logger.error('Error processing user behavior for marketing', { error, userId, behaviorEvent });
    }
  }

  /**
   * Get active campaigns that match the behavior type
   */
  private async getActiveCampaignsForBehavior(eventType: string): Promise<MarketingCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
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
    behaviorEvent: any
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
        const hoursSinceLastSend = (Date.now() - new Date(lastSend.sent_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastSend < campaign.cooldown_hours) {
          return false;
        }
      }

      // Check max sends per user
      const { count } = await supabase
        .from('marketing_campaign_sends')
        .select('*', { count: 'exact' })
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
  private evaluateCampaignConditions(conditions: Record<string, any>, behaviorEvent: any): boolean {
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

        if (conditions.time_windows.hours &&
            !conditions.time_windows.hours.includes(hour)) {
          return false;
        }

        if (conditions.time_windows.days &&
            !conditions.time_windows.days.includes(dayOfWeek)) {
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
    behaviorEvent: any
  ): Promise<void> {
    try {
      // Get user profile for personalization
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!userProfile) {
        logger.warn('User profile not found for campaign execution', { userId });
        return;
      }

      // Prepare personalized content
      const personalizedData = {
        user_name: userProfile.full_name || userProfile.username,
        user_email: userProfile.email,
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
        channel: campaign.type
      });

    } catch (error) {
      logger.error('Error executing marketing campaign', { error, userId, campaign });
    }
  }

  /**
   * Send campaign message through appropriate channel
   */
  private async sendCampaignMessage(
    campaign: MarketingCampaign,
    personalizedData: Record<string, any>
  ): Promise<void> {
    const template = await smartNotificationEngine.getTemplate(campaign.template_id);

    if (!template) {
      logger.error('Campaign template not found', { templateId: campaign.template_id });
      return;
    }

    // Personalize template content
    const personalizedContent = this.personalizeTemplate(template.body, personalizedData);
    const personalizedSubject = template.subject ?
      this.personalizeTemplate(template.subject, personalizedData) : '';

    switch (campaign.type) {
      case 'email':
        // Use email service (SendGrid, etc.)
        await this.sendEmail({
          to: personalizedData.user_email,
          subject: personalizedSubject,
          html: personalizedContent,
          campaignId: campaign.id,
        });
        break;

      case 'push':
        // Use push notification service
        await smartNotificationEngine.processEvent(
          'custom_event',
          personalizedData.user_id,
          {
            campaign_id: campaign.id,
            message: personalizedContent,
            title: personalizedSubject,
          }
        );
        break;

      case 'in_app':
        // Insert into in-app notifications
        await supabase.from('in_app_notifications').insert({
          user_id: personalizedData.user_id,
          title: personalizedSubject,
          content: personalizedContent,
          type: 'marketing',
          metadata: { campaign_id: campaign.id },
        });
        break;

      case 'sms':
        // Use SMS service (Twilio, etc.)
        await this.sendSMS({
          to: personalizedData.user_phone, // Would need to get from user profile
          message: personalizedContent,
          campaignId: campaign.id,
        });
        break;
    }
  }

  /**
   * Personalize template content with user data
   */
  private personalizeTemplate(template: string, data: Record<string, any>): string {
    let personalized = template;

    // Replace placeholders like {{user_name}}, {{user_email}}, etc.
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      personalized = personalized.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return personalized;
  }

  /**
   * Send email (placeholder - integrate with actual email service)
   */
  private async sendEmail(data: { to: string; subject: string; html: string; campaignId: string }): Promise<void> {
    logger.info('Sending marketing email', { to: data.to, campaignId: data.campaignId });
    // TODO: Integrate with email service like SendGrid, Mailgun, etc.
  }

  /**
   * Send SMS (placeholder - integrate with actual SMS service)
   */
  private async sendSMS(data: { to: string; message: string; campaignId: string }): Promise<void> {
    logger.info('Sending marketing SMS', { to: data.to, campaignId: data.campaignId });
    // TODO: Integrate with SMS service like Twilio, etc.
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
  private async createSegment(segmentData: { name: string; criteria: Record<string, any> }): Promise<void> {
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
        .select('*')
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
      .select('*')
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
  private async getCampaignTargetUsers(campaign: MarketingCampaign): Promise<string[]> {
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