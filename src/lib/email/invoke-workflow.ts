/**
 * Exécution des workflows email via Edge Functions
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface WorkflowExecutionContext {
  user_id?: string;
  email?: string;
  customer_id?: string;
  order_id?: string;
  store_id?: string;
  [key: string]: unknown;
}

export async function invokeExecuteEmailWorkflow(
  workflowId: string,
  context?: WorkflowExecutionContext
): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('execute-email-workflow', {
    body: { workflow_id: workflowId, context: context || {} },
  });

  if (error) {
    logger.error('invokeExecuteEmailWorkflow failed', { error: error.message, workflowId });
    return false;
  }

  return (data as { success?: boolean })?.success === true;
}

export async function invokeTriggerEmailWorkflows(
  storeId: string,
  event: string,
  context?: WorkflowExecutionContext
): Promise<{ triggered: number; succeeded: number }> {
  const { data, error } = await supabase.functions.invoke('trigger-email-workflows', {
    body: { store_id: storeId, event, context: context || {} },
  });

  if (error) {
    logger.error('invokeTriggerEmailWorkflows failed', { error: error.message, storeId, event });
    return { triggered: 0, succeeded: 0 };
  }

  const result = data as { triggered?: number; succeeded?: number };
  return {
    triggered: result.triggered ?? 0,
    succeeded: result.succeeded ?? 0,
  };
}
