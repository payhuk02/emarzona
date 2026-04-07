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
    } catch ( _error: any) {
      logger.error('EmailABTestService.createABTest error', { error, payload });
      throw error;
    }
  }

  /**
   * Récupérer un test A/B
   */
  static async getABTest(abTestId: string): Promise<EmailABTest | null> {
    try {
      const { data, error } = await supabase
        .from('email_ab_tests')
        .select('*')
        .eq('id', abTestId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error('Error fetching AB test', { error, abTestId });
        throw error;
      }
      return data as EmailABTest;
    } catch ( _error: any) {
      logger.error('EmailABTestService.getABTest error', { error, abTestId });
      throw error;
    }
  }

  /**
   * Récupérer les tests A/B d'une campagne
   */
  static async getABTestsByCampaign(campaignId: string): Promise<EmailABTest[]> {
    try {
      const { data, error } = await supabase
        .from('email_ab_tests')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching AB tests', { error, campaignId });
        throw error;
      }
      return (data || []) as EmailABTest[];
    } catch ( _error: any) {
      logger.error('EmailABTestService.getABTestsByCampaign error', { error, campaignId });
      throw error;
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
      const currentResults = variant === 'variant_a' ? test.variant_a_results : test.variant_b_results;
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
    } catch ( _error: any) {
      logger.error('EmailABTestService.updateABTestResults error', { error, abTestId, variant, results });
      throw error;
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
    } catch ( _error: any) {
      logger.error('EmailABTestService.calculateWinner error', { error, abTestId });
      throw error;
    }
  }

  /**
   * Supprimer un test A/B
   */
  static async deleteABTest(abTestId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_ab_tests')
        .delete()
        .eq('id', abTestId);

      if (error) {
        logger.error('Error deleting AB test', { error, abTestId });
        throw error;
      }
      return true;
    } catch ( _error: any) {
      logger.error('EmailABTestService.deleteABTest error', { error, abTestId });
      throw error;
    }
  }
}

// Export instance singleton
export const emailABTestService = EmailABTestService;







