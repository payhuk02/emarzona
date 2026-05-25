/**
 * Email A/B Test Service
 * Service pour la gestion des tests A/B email
 * Date: 1er Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

export interface ABTestVariant {
  subject: string;
  template_id?: string;
  send_percentage: number;
  name?: string;
}

export interface ABTestResults {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  revenue: number;
}

export interface EmailABTest {
  id: string;
  campaign_id: string;
  variant_a: ABTestVariant;
  variant_b: ABTestVariant;
  variant_a_results: ABTestResults;
  variant_b_results: ABTestResults;
  winner?: 'variant_a' | 'variant_b' | null;
  confidence_level?: number;
  decided_at?: string;
  decision_criteria?: string;
  test_started_at?: string;
  test_duration_hours: number;
  min_recipients_per_variant: number;
  created_at: string;
  updated_at: string;
}

export interface CreateABTestPayload {
  campaign_id: string;
  variant_a: ABTestVariant;
  variant_b: ABTestVariant;
  test_duration_hours?: number;
  min_recipients_per_variant?: number;
}

const EMAIL_AB_TEST_FIELDS =
  'id,campaign_id,variant_a,variant_b,variant_a_results,variant_b_results,winner,confidence_level,decided_at,decision_criteria,test_started_at,test_duration_hours,min_recipients_per_variant,created_at,updated_at';

// ============================================================
// SERVICE
// ============================================================

export class EmailABTestService {
  /**
   * Créer un test A/B
   */
  static async createABTest(payload: CreateABTestPayload): Promise<EmailABTest> {
    try {
      const { data, error } = await supabase
        .from('email_ab_tests')
        .insert({
          campaign_id: payload.campaign_id,
          variant_a: payload.variant_a,
          variant_b: payload.variant_b,
          test_duration_hours: payload.test_duration_hours || 24,
          min_recipients_per_variant: payload.min_recipients_per_variant || 100,
          test_started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating AB test', { error, payload });
        throw error;
      }
      return data as EmailABTest;
    } catch (caught: unknown) {
      const err = caught instanceof Error ? caught : new Error('Failed to create AB test');
      logger.error('EmailABTestService.createABTest error', { error: err.message, payload });
      throw err;
    }
  }

  /**
   * Récupérer un test A/B
   */
  static async getABTest(abTestId: string): Promise<EmailABTest | null> {
    try {
      const { data, error } = await supabase
        .from('email_ab_tests')
        .select(EMAIL_AB_TEST_FIELDS)
        .eq('id', abTestId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error('Error fetching AB test', { error, abTestId });
        throw error;
      }
      return data as EmailABTest;
    } catch (caught: unknown) {
      const err = caught instanceof Error ? caught : new Error('Failed to fetch AB test');
      logger.error('EmailABTestService.getABTest error', { error: err.message, abTestId });
      throw err;
    }
  }

  /**
   * Récupérer les tests A/B d'une campagne
   */
  static async getABTestsByCampaign(campaignId: string): Promise<EmailABTest[]> {
    try {
      const { data, error } = await supabase
        .from('email_ab_tests')
        .select(EMAIL_AB_TEST_FIELDS)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching AB tests', { error, campaignId });
        throw error;
      }
      return (data || []) as EmailABTest[];
    } catch (caught: unknown) {
      const err = caught instanceof Error ? caught : new Error('Failed to fetch AB tests');
      logger.error('EmailABTestService.getABTestsByCampaign error', {
        error: err.message,
        campaignId,
      });
      throw err;
    }
  }

  /**
   * Mettre à jour les résultats d'un test A/B
   */
  static async updateABTestResults(
    abTestId: string,
    variant: 'variant_a' | 'variant_b',
    results: Partial<ABTestResults>
  ): Promise<boolean> {
    try {
      // Récupérer le test actuel
      const test = await this.getABTest(abTestId);
      if (!test) {
        throw new Error('AB test not found');
      }

      // Fusionner les résultats
      const currentResults =
        variant === 'variant_a' ? test.variant_a_results : test.variant_b_results;
      const updatedResults = { ...currentResults, ...results };

      const { error } = await supabase.rpc('update_ab_test_results', {
        p_ab_test_id: abTestId,
        p_variant: variant,
        p_results: updatedResults,
      });

      if (error) {
        logger.error('Error updating AB test results', { error, abTestId, variant, results });
        throw error;
      }
      return true;
    } catch (caught: unknown) {
      const err = caught instanceof Error ? caught : new Error('Failed to update AB test results');
      logger.error('EmailABTestService.updateABTestResults error', {
        error: err.message,
        abTestId,
        variant,
      });
      throw err;
    }
  }

  /**
   * Calculer le gagnant d'un test A/B
   */
  static async calculateWinner(abTestId: string): Promise<'variant_a' | 'variant_b' | null> {
    try {
      const { data, error } = await supabase.rpc('calculate_ab_test_winner', {
        p_ab_test_id: abTestId,
      });

      if (error) {
        logger.error('Error calculating AB test winner', { error, abTestId });
        throw error;
      }
      return data as 'variant_a' | 'variant_b' | null;
    } catch (caught: unknown) {
      const err = caught instanceof Error ? caught : new Error('Failed to calculate winner');
      logger.error('EmailABTestService.calculateWinner error', { error: err.message, abTestId });
      throw err;
    }
  }

  /**
   * Supprimer un test A/B
   */
  static async deleteABTest(abTestId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('email_ab_tests').delete().eq('id', abTestId);

      if (error) {
        logger.error('Error deleting AB test', { error, abTestId });
        throw error;
      }
      return true;
    } catch (caught: unknown) {
      const err = caught instanceof Error ? caught : new Error('Failed to delete AB test');
      logger.error('EmailABTestService.deleteABTest error', { error: err.message, abTestId });
      throw err;
    }
  }
}

// Export instance singleton
export const emailABTestService = EmailABTestService;
