/**
 * Préférences email et désabonnements (source unique frontend)
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { EmailPreferences } from '@/types/email';

export type UnsubscribeType = 'all' | 'marketing' | 'newsletter' | 'transactional';

export const EMAIL_PREFERENCES_SELECT =
  'user_id, transactional_emails, marketing_emails, notification_emails, order_updates, product_updates, affiliate_updates, course_updates, unsubscribed_at, created_at, updated_at';

export interface RecordUnsubscribeParams {
  email: string;
  unsubscribeType: UnsubscribeType;
  reason?: string;
  campaignId?: string;
  userId?: string;
}

export class EmailPreferencesService {
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static buildUnsubscribeUrl(
    email: string,
    unsubscribeType: UnsubscribeType = 'marketing',
    campaignId?: string
  ): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://emarzona.com';
    const params = new URLSearchParams({
      email: this.normalizeEmail(email),
      type: unsubscribeType,
    });
    if (campaignId) params.set('campaign_id', campaignId);
    return `${origin}/unsubscribe?${params.toString()}`;
  }

  static preferencesPatchFromUnsubscribe(type: UnsubscribeType): Partial<EmailPreferences> {
    const now = new Date().toISOString();
    switch (type) {
      case 'all':
        return {
          marketing_emails: false,
          notification_emails: false,
          order_updates: false,
          product_updates: false,
          unsubscribed_at: now,
        };
      case 'marketing':
        return { marketing_emails: false, unsubscribed_at: now };
      case 'newsletter':
        return { marketing_emails: false, unsubscribed_at: now };
      case 'transactional':
        return { transactional_emails: false, unsubscribed_at: now };
      default:
        return { marketing_emails: false };
    }
  }

  static async getOrCreateForUser(userId: string): Promise<EmailPreferences> {
    const { data, error } = await supabase
      .from('email_preferences')
      .select(EMAIL_PREFERENCES_SELECT)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching email preferences', { error, userId });
      throw error;
    }

    if (data) {
      return data as EmailPreferences;
    }

    const { data: created, error: insertError } = await supabase
      .from('email_preferences')
      .insert({ user_id: userId })
      .select(EMAIL_PREFERENCES_SELECT)
      .single();

    if (insertError) {
      logger.error('Error creating email preferences', { error: insertError, userId });
      throw insertError;
    }

    return created as EmailPreferences;
  }

  static async updateForUser(
    userId: string,
    preferences: Partial<EmailPreferences>
  ): Promise<EmailPreferences> {
    const { data, error } = await supabase
      .from('email_preferences')
      .update(preferences)
      .eq('user_id', userId)
      .select(EMAIL_PREFERENCES_SELECT)
      .single();

    if (error) {
      logger.error('Error updating email preferences', { error, userId });
      throw error;
    }

    return data as EmailPreferences;
  }

  /**
   * Enregistre un désabonnement public + synchronise email_preferences si l'utilisateur connecté correspond.
   */
  static async recordUnsubscribe(params: RecordUnsubscribeParams): Promise<void> {
    const email = this.normalizeEmail(params.email);

    const { error: rpcError } = await supabase.rpc('record_email_unsubscribe', {
      p_email: email,
      p_unsubscribe_type: params.unsubscribeType,
      p_reason: params.reason || null,
      p_campaign_id: params.campaignId || null,
    });

    if (rpcError) {
      logger.error('Error recording unsubscribe', { error: rpcError, email });
      throw rpcError;
    }

    await this.syncAuthUserPreferences(email, params.unsubscribeType);
  }

  static async syncAuthUserPreferences(
    email: string,
    unsubscribeType: UnsubscribeType
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) return;
    if (this.normalizeEmail(user.email) !== this.normalizeEmail(email)) return;

    try {
      await this.getOrCreateForUser(user.id);
      await this.updateForUser(user.id, this.preferencesPatchFromUnsubscribe(unsubscribeType));
    } catch (caught: unknown) {
      logger.warn('Could not sync email_preferences after unsubscribe', {
        error: caught instanceof Error ? caught.message : String(caught),
        userId: user.id,
      });
    }
  }

  static async getUnsubscribesForEmail(email: string) {
    const { data, error } = await supabase
      .from('email_unsubscribes')
      .select('email, unsubscribe_type, unsubscribed_at, reason, campaign_id')
      .eq('email', this.normalizeEmail(email))
      .order('unsubscribed_at', { ascending: false });

    if (error) {
      logger.error('Error fetching unsubscribes', { error, email });
      throw error;
    }

    return data ?? [];
  }
}

export const emailPreferencesService = EmailPreferencesService;
