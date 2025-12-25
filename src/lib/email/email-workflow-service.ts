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
      const { data, error } = await (supabase
        .from('email_workflows' as any)
        .insert({
          ...payload,
          actions: payload.actions || [],
          trigger_config: payload.trigger_config || {},
          conditions: payload.conditions || {},
          status: payload.status || 'active',
          is_active: true,
        })
        .select()
        .single() as any);

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
      const { data, error } = await (supabase
        .from('email_workflows' as any)
        .select('*')
        .eq('id', workflowId)
        .single() as any);

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
      let query = (supabase
        .from('email_workflows' as any)
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false }) as any);

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
        // Si la table n'existe pas (404), retourner un tableau vide
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('does not exist') || error.code === '42P01') {
          logger.warn('Table email_workflows does not exist. Returning empty array.', { storeId });
          return [];
        }
        logger.error('Error fetching workflows', { error, storeId, filters });
        throw error;
      }
      return (data || []) as EmailWorkflow[];
    } catch (error: any) {
      // Si la table n'existe pas, retourner un tableau vide au lieu de throw
      if (error?.code === 'PGRST116' || error?.message?.includes('404') || error?.message?.includes('does not exist') || error?.code === '42P01') {
        logger.warn('Table email_workflows does not exist. Returning empty array.', { storeId });
        return [];
      }
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
      const { data, error } = await (supabase
        .from('email_workflows' as any)
        .update(payload)
        .eq('id', workflowId)
        .select()
        .single() as any);

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
      const { error } = await (supabase
        .from('email_workflows' as any)
        .delete()
        .eq('id', workflowId) as any);

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
      // S'assurer que le contexte contient les informations nécessaires
      const enrichedContext = {
        ...context,
        // Si user_id n'est pas présent, essayer de l'extraire d'autres champs
        user_id: context?.user_id || context?.userId || context?.user?.id,
        email: context?.email || context?.user?.email,
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error - execute_email_workflow function not in generated types
      const { data, error } = await supabase.rpc('execute_email_workflow', {
        p_workflow_id: workflowId,
        p_context: enrichedContext || {},
      });

      if (error) {
        logger.error('Error executing workflow', { error, workflowId, context: enrichedContext });
        throw error;
      }

      const success = data as boolean;
      if (success) {
        logger.info('Workflow executed successfully', { workflowId });
      } else {
        logger.warn('Workflow execution returned false', { workflowId });
      }

      return success;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('EmailWorkflowService.executeWorkflow error', { 
        error: errorMessage, 
        workflowId, 
        context 
      });
      throw new Error(`Failed to execute workflow: ${errorMessage}`);
    }
  }
}

// Export instance singleton
export const emailWorkflowService = EmailWorkflowService;

