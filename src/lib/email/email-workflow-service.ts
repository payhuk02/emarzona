/**
 * Email Workflow Service
 * Service pour la gestion des workflows email
 * Date: 1er Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

export type WorkflowTriggerType = 'event' | 'time' | 'condition';
export type WorkflowStatus = 'active' | 'paused' | 'archived';
export type WorkflowActionType = 'send_email' | 'wait' | 'add_tag' | 'remove_tag' | 'update_segment';

export interface EmailWorkflow {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  trigger_type: WorkflowTriggerType;
  trigger_config: Record<string, any>;
  actions: WorkflowAction[];
  conditions?: Record<string, any>;
  status: WorkflowStatus;
  is_active: boolean;
  execution_count: number;
  success_count: number;
  error_count: number;
  last_executed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowAction {
  type: WorkflowActionType;
  config: Record<string, any>;
  order: number;
}

export interface CreateWorkflowPayload {
  store_id: string;
  name: string;
  description?: string;
  trigger_type: WorkflowTriggerType;
  trigger_config?: Record<string, any>;
  actions?: WorkflowAction[];
  conditions?: Record<string, any>;
  status?: WorkflowStatus;
}

// ============================================================
// SERVICE
// ============================================================

export class EmailWorkflowService {
  /**
   * Créer un workflow
   */
  static async createWorkflow(payload: CreateWorkflowPayload): Promise<EmailWorkflow> {
    try {
      const { data, error } = await supabase
        .from('email_workflows')
        .insert({
          ...payload,
          actions: payload.actions || [],
          trigger_config: payload.trigger_config || {},
          conditions: payload.conditions || {},
          status: payload.status || 'active',
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating workflow', { error, payload });
        throw error;
      }
      return data as EmailWorkflow;
    } catch (error: any) {
      logger.error('EmailWorkflowService.createWorkflow error', { error, payload });
      throw error;
    }
  }

  /**
   * Récupérer un workflow
   */
  static async getWorkflow(workflowId: string): Promise<EmailWorkflow | null> {
    try {
      const { data, error } = await supabase
        .from('email_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error('Error fetching workflow', { error, workflowId });
        throw error;
      }
      return data as EmailWorkflow;
    } catch (error: any) {
      logger.error('EmailWorkflowService.getWorkflow error', { error, workflowId });
      throw error;
    }
  }

  /**
   * Récupérer tous les workflows d'un store
   */
  static async getWorkflows(
    storeId: string,
    filters?: { status?: WorkflowStatus; limit?: number; offset?: number }
  ): Promise<EmailWorkflow[]> {
    try {
      let query = supabase
        .from('email_workflows')
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
        query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) {
        logger.error('Error fetching workflows', { error, storeId, filters });
        throw error;
      }
      return (data || []) as EmailWorkflow[];
    } catch (error: any) {
      logger.error('EmailWorkflowService.getWorkflows error', { error, storeId, filters });
      throw error;
    }
  }

  /**
   * Mettre à jour un workflow
   */
  static async updateWorkflow(
    workflowId: string,
    payload: Partial<CreateWorkflowPayload>
  ): Promise<EmailWorkflow> {
    try {
      const { data, error } = await supabase
        .from('email_workflows')
        .update(payload)
        .eq('id', workflowId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating workflow', { error, workflowId, payload });
        throw error;
      }
      return data as EmailWorkflow;
    } catch (error: any) {
      logger.error('EmailWorkflowService.updateWorkflow error', { error, workflowId, payload });
      throw error;
    }
  }

  /**
   * Supprimer un workflow
   */
  static async deleteWorkflow(workflowId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_workflows')
        .delete()
        .eq('id', workflowId);

      if (error) {
        logger.error('Error deleting workflow', { error, workflowId });
        throw error;
      }
      return true;
    } catch (error: any) {
      logger.error('EmailWorkflowService.deleteWorkflow error', { error, workflowId });
      throw error;
    }
  }

  /**
   * Exécuter un workflow
   */
  static async executeWorkflow(workflowId: string, context?: Record<string, any>): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('execute_email_workflow', {
        p_workflow_id: workflowId,
        p_context: context || {},
      });

      if (error) {
        logger.error('Error executing workflow', { error, workflowId, context });
        throw error;
      }
      return data as boolean;
    } catch (error: any) {
      logger.error('EmailWorkflowService.executeWorkflow error', { error, workflowId, context });
      throw error;
    }
  }
}

// Export instance singleton
export const emailWorkflowService = EmailWorkflowService;

