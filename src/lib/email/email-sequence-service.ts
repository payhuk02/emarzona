/**
 * Email Sequence Service
 * Service pour la gestion des séquences d'emails (drip campaigns)
 * Date: 1er Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

export type SequenceTriggerType = 'event' | 'time' | 'behavior';
export type SequenceStatus = 'active' | 'paused' | 'archived';
export type SequenceStepDelayType = 'immediate' | 'minutes' | 'hours' | 'days';
export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface EmailSequence {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  trigger_type: SequenceTriggerType;
  trigger_config: Record<string, string | number | boolean | null | undefined>;
  status: SequenceStatus;
  enrolled_count: number;
  completed_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  template_id?: string;
  delay_type: SequenceStepDelayType;
  delay_value: number;
  conditions?: Record<string, string | number | boolean | null | undefined>;
  created_at: string;
}

export interface EmailSequenceEnrollment {
  id: string;
  sequence_id: string;
  user_id: string;
  status: EnrollmentStatus;
  current_step: number;
  completed_steps: number[];
  enrolled_at: string;
  next_email_at?: string;
  completed_at?: string;
  context: Record<string, string | number | boolean | null | undefined>;
}

export interface CreateSequencePayload {
  store_id: string;
  name: string;
  description?: string;
  trigger_type: SequenceTriggerType;
  trigger_config: Record<string, any>;
  status?: SequenceStatus;
}

export interface CreateSequenceStepPayload {
  sequence_id: string;
  step_order: number;
  template_id?: string;
  delay_type: SequenceStepDelayType;
  delay_value: number;
  conditions?: Record<string, string | number | boolean | null | undefined>;
}

export interface EnrollUserPayload {
  sequence_id: string;
  user_id: string;
  context?: Record<string, string | number | boolean | null | undefined>;
}

// ============================================================
// SERVICE
// ============================================================

export class EmailSequenceService {
  /**
   * Créer une nouvelle séquence
   */
  static async createSequence(payload: CreateSequencePayload): Promise<EmailSequence> {
    try {
      const { data, error } = await supabase
        .from('email_sequences')
        .insert({
          ...payload,
          status: payload.status || 'active',
          trigger_config: payload.trigger_config || {},
          enrolled_count: 0,
          completed_count: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating sequence', { error, payload });
        throw error;
      }

      return data as EmailSequence;
    } catch ( _error: unknown) {
      logger.error('EmailSequenceService.createSequence error', { error, payload });
      throw error;
    }
  }

  /**
   * Récupérer une séquence par ID
   */
  static async getSequence(sequenceId: string): Promise<EmailSequence | null> {
    try {
      const { data, error } = await supabase
        .from('email_sequences')
        .select('*')
        .eq('id', sequenceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error fetching sequence', { error, sequenceId });
        throw error;
      }

      return data as EmailSequence;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.getSequence error', { error, sequenceId });
      throw error;
    }
  }

  /**
   * Récupérer toutes les séquences d'un store
   */
  static async getSequences(
    storeId: string,
    filters?: {
      status?: SequenceStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<EmailSequence[]> {
    try {
      let  query= supabase
        .from('email_sequences')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
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
        logger.error('Error fetching sequences', { error, storeId, filters });
        throw error;
      }

      return (data || []) as EmailSequence[];
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.getSequences error', { error, storeId, filters });
      throw error;
    }
  }

  /**
   * Mettre à jour une séquence
   */
  static async updateSequence(
    sequenceId: string,
    payload: Partial<CreateSequencePayload>
  ): Promise<EmailSequence> {
    try {
      const { data, error } = await supabase
        .from('email_sequences')
        .update(payload)
        .eq('id', sequenceId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating sequence', { error, sequenceId, payload });
        throw error;
      }

      return data as EmailSequence;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.updateSequence error', { error, sequenceId, payload });
      throw error;
    }
  }

  /**
   * Supprimer une séquence
   */
  static async deleteSequence(sequenceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_sequences')
        .delete()
        .eq('id', sequenceId);

      if (error) {
        logger.error('Error deleting sequence', { error, sequenceId });
        throw error;
      }

      return true;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.deleteSequence error', { error, sequenceId });
      throw error;
    }
  }

  /**
   * Ajouter une étape à une séquence
   */
  static async addStep(payload: CreateSequenceStepPayload): Promise<EmailSequenceStep> {
    try {
      const { data, error } = await supabase
        .from('email_sequence_steps')
        .insert({
          ...payload,
          conditions: payload.conditions || {},
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding step', { error, payload });
        throw error;
      }

      return data as EmailSequenceStep;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.addStep error', { error, payload });
      throw error;
    }
  }

  /**
   * Récupérer les étapes d'une séquence
   */
  static async getSteps(sequenceId: string): Promise<EmailSequenceStep[]> {
    try {
      const { data, error } = await supabase
        .from('email_sequence_steps')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('step_order', { ascending: true });

      if (error) {
        logger.error('Error fetching steps', { error, sequenceId });
        throw error;
      }

      return (data || []) as EmailSequenceStep[];
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.getSteps error', { error, sequenceId });
      throw error;
    }
  }

  /**
   * Mettre à jour une étape
   */
  static async updateStep(
    stepId: string,
    payload: Partial<CreateSequenceStepPayload>
  ): Promise<EmailSequenceStep> {
    try {
      const { data, error } = await supabase
        .from('email_sequence_steps')
        .update(payload)
        .eq('id', stepId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating step', { error, stepId, payload });
        throw error;
      }

      return data as EmailSequenceStep;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.updateStep error', { error, stepId, payload });
      throw error;
    }
  }

  /**
   * Supprimer une étape
   */
  static async deleteStep(stepId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_sequence_steps')
        .delete()
        .eq('id', stepId);

      if (error) {
        logger.error('Error deleting step', { error, stepId });
        throw error;
      }

      return true;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.deleteStep error', { error, stepId });
      throw error;
    }
  }

  /**
   * Inscrire un utilisateur dans une séquence
   */
  static async enrollUser(payload: EnrollUserPayload): Promise<EmailSequenceEnrollment> {
    try {
      const { data, error } = await supabase.rpc('enroll_user_in_sequence', {
        p_sequence_id: payload.sequence_id,
        p_user_id: payload.user_id,
        p_context: payload.context || {},
      });

      if (error) {
        logger.error('Error enrolling user', { error, payload });
        throw error;
      }

      // Récupérer l'enrollment créé
      const enrollment = await this.getEnrollment(payload.sequence_id, payload.user_id);
      if (!enrollment) {
        throw new Error('Failed to create enrollment');
      }

      return enrollment;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.enrollUser error', { error, payload });
      throw error;
    }
  }

  /**
   * Récupérer un enrollment
   */
  static async getEnrollment(
    sequenceId: string,
    userId: string
  ): Promise<EmailSequenceEnrollment | null> {
    try {
      const { data, error } = await supabase
        .from('email_sequence_enrollments')
        .select('*')
        .eq('sequence_id', sequenceId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error fetching enrollment', { error, sequenceId, userId });
        throw error;
      }

      return data as EmailSequenceEnrollment;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.getEnrollment error', { error, sequenceId, userId });
      throw error;
    }
  }

  /**
   * Récupérer tous les enrollments d'une séquence
   */
  static async getEnrollments(
    sequenceId: string,
    filters?: {
      status?: EnrollmentStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<EmailSequenceEnrollment[]> {
    try {
      let  query= supabase
        .from('email_sequence_enrollments')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('enrolled_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
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
        logger.error('Error fetching enrollments', { error, sequenceId, filters });
        throw error;
      }

      return (data || []) as EmailSequenceEnrollment[];
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.getEnrollments error', { error, sequenceId, filters });
      throw error;
    }
  }

  /**
   * Mettre en pause un enrollment
   */
  static async pauseEnrollment(
    sequenceId: string,
    userId: string
  ): Promise<EmailSequenceEnrollment> {
    try {
      const { data, error } = await supabase
        .from('email_sequence_enrollments')
        .update({ status: 'paused' })
        .eq('sequence_id', sequenceId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error pausing enrollment', { error, sequenceId, userId });
        throw error;
      }

      return data as EmailSequenceEnrollment;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.pauseEnrollment error', { error, sequenceId, userId });
      throw error;
    }
  }

  /**
   * Annuler un enrollment
   */
  static async cancelEnrollment(
    sequenceId: string,
    userId: string
  ): Promise<EmailSequenceEnrollment> {
    try {
      const { data, error } = await supabase
        .from('email_sequence_enrollments')
        .update({ status: 'cancelled' })
        .eq('sequence_id', sequenceId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error cancelling enrollment', { error, sequenceId, userId });
        throw error;
      }

      return data as EmailSequenceEnrollment;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.cancelEnrollment error', { error, sequenceId, userId });
      throw error;
    }
  }

  /**
   * Récupérer les prochains emails à envoyer (pour traitement par cron)
   */
  static async getNextEmailsToSend(limit: number = 100): Promise<EmailSequenceEnrollment[]> {
    try {
      const { data, error } = await supabase.rpc('get_next_sequence_emails_to_send', {
        p_limit: limit,
      });

      if (error) {
        logger.error('Error fetching next emails to send', { error, limit });
        throw error;
      }

      return data || [];
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.getNextEmailsToSend error', { error, limit });
      throw error;
    }
  }

  /**
   * Faire avancer un enrollment à l'étape suivante
   */
  static async advanceEnrollment(enrollmentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('advance_sequence_enrollment', {
        p_enrollment_id: enrollmentId,
      });

      if (error) {
        logger.error('Error advancing enrollment', { error, enrollmentId });
        throw error;
      }

      return data === true;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('EmailSequenceService.advanceEnrollment error', { error, enrollmentId });
      throw error;
    }
  }
}

// Export instance singleton
export const emailSequenceService = EmailSequenceService;







