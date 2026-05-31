/**
 * Exécution des workflows email (actions côté Edge — envoi Resend réel)
 */
import type { SupabaseClient } from 'supabase';
import { sendMarketingEmailViaResend, type MarketingTemplate } from './resend-send-utils.ts';

export interface WorkflowContext {
  user_id?: string;
  email?: string;
  customer_id?: string;
  order_id?: string;
  store_id?: string;
  [key: string]: unknown;
}

interface WorkflowRow {
  id: string;
  store_id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  actions: WorkflowAction[];
  conditions?: Record<string, unknown>;
  status: string;
  is_active: boolean;
}

interface WorkflowAction {
  type: string;
  config: Record<string, unknown>;
  order?: number;
  order_index?: number;
  critical?: boolean;
}

const MAX_WAIT_SECONDS = 10;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function matchesEventTrigger(
  workflow: WorkflowRow,
  eventName: string,
  context: WorkflowContext
): boolean {
  if (workflow.trigger_type !== 'event') return false;
  const cfg = workflow.trigger_config || {};
  const configured =
    (cfg.event_name as string) || (cfg.event as string) || (cfg.event_type as string);
  if (!configured || configured !== eventName) return false;

  const filters = (cfg.filters || {}) as Record<string, unknown>;
  if (filters.store_id && context.store_id && filters.store_id !== context.store_id) {
    return false;
  }
  if (
    filters.product_type &&
    context.product_type &&
    filters.product_type !== context.product_type
  ) {
    return false;
  }
  return true;
}

async function resolveUserId(
  supabase: SupabaseClient,
  context: WorkflowContext,
  storeId: string
): Promise<string | null> {
  if (context.user_id) return context.user_id as string;

  if (context.email) {
    const { data: resolved } = await supabase.rpc('resolve_user_id_for_store_email', {
      p_store_id: storeId,
      p_email: context.email as string,
    });
    if (resolved) return resolved as string;
  }

  if (context.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('user_id, email')
      .eq('id', context.customer_id)
      .maybeSingle();
    if (customer?.user_id) return customer.user_id;
    if (customer?.email) {
      const { data: resolved } = await supabase.rpc('resolve_user_id_for_store_email', {
        p_store_id: storeId,
        p_email: customer.email,
      });
      if (resolved) return resolved as string;
    }
  }

  return null;
}

async function resolveRecipient(
  supabase: SupabaseClient,
  context: WorkflowContext,
  storeId: string
): Promise<{ email: string; name?: string; userId?: string } | null> {
  const userId = await resolveUserId(supabase, context, storeId);
  if (context.email) {
    return {
      email: (context.email as string).trim().toLowerCase(),
      name: (context.customer_name as string) || undefined,
      userId: userId || undefined,
    };
  }
  if (userId) {
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    if (user?.user?.email) {
      return {
        email: user.user.email,
        name: (user.user.user_metadata?.full_name as string) || undefined,
        userId,
      };
    }
  }
  if (context.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('email, name, full_name, user_id')
      .eq('id', context.customer_id)
      .maybeSingle();
    if (customer?.email) {
      return {
        email: customer.email,
        name: customer.full_name || customer.name || undefined,
        userId: customer.user_id || userId || undefined,
      };
    }
  }
  return null;
}

async function getMarketingTemplate(
  supabase: SupabaseClient,
  templateId: string
): Promise<MarketingTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('id,name,subject,html_content,from_email,from_name')
    .eq('id', templateId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as MarketingTemplate;
}

async function executeAction(
  supabase: SupabaseClient,
  action: WorkflowAction,
  storeId: string,
  context: WorkflowContext
): Promise<boolean> {
  const type = action.type;
  const config = action.config || {};

  switch (type) {
    case 'add_tag': {
      const userId = await resolveUserId(supabase, context, storeId);
      const tag = config.tag as string;
      if (!userId || !tag) {
        console.warn('add_tag: missing user_id or tag');
        return false;
      }
      const { error } = await supabase.rpc('add_user_tag', {
        p_user_id: userId,
        p_store_id: storeId,
        p_tag: tag,
        p_context: config.context || context,
      });
      return !error;
    }

    case 'remove_tag': {
      const userId = await resolveUserId(supabase, context, storeId);
      const tag = config.tag as string;
      if (!userId || !tag) return false;
      const { data, error } = await supabase.rpc('remove_user_tag', {
        p_user_id: userId,
        p_store_id: storeId,
        p_tag: tag,
      });
      return !error && data !== false;
    }

    case 'send_email': {
      const templateId = config.template_id as string;
      if (!templateId) {
        console.warn('send_email: missing template_id');
        return false;
      }
      const template = await getMarketingTemplate(supabase, templateId);
      if (!template) {
        console.warn('send_email: template not found', templateId);
        return false;
      }
      const recipient = await resolveRecipient(supabase, context, storeId);
      if (!recipient?.email) {
        console.warn('send_email: no recipient email in context');
        return false;
      }
      const variables = {
        ...(typeof config.variables === 'object' ? config.variables : {}),
        ...context,
      };
      const result = await sendMarketingEmailViaResend({
        supabase,
        to: recipient.email,
        toName: recipient.name,
        template,
        variables,
        userId: recipient.userId,
        storeId,
        templateSlug: template.name,
        subjectOverride: (config.subject as string) || undefined,
      });
      return result.success;
    }

    case 'wait': {
      const duration = Number(config.duration ?? config.seconds ?? 0);
      if (duration <= 0) return true;
      if (duration > MAX_WAIT_SECONDS) {
        console.warn(
          `wait: duration ${duration}s exceeds edge max (${MAX_WAIT_SECONDS}s), skipped`
        );
        return true;
      }
      await sleep(duration * 1000);
      return true;
    }

    case 'update_segment': {
      const segmentId = config.segment_id as string;
      const customerId = context.customer_id as string;
      if (!segmentId || !customerId) return false;

      const { data: segment } = await supabase
        .from('email_segments')
        .select('id, type, criteria')
        .eq('id', segmentId)
        .eq('store_id', storeId)
        .maybeSingle();

      if (!segment || segment.type !== 'static') {
        console.warn('update_segment: static segment required');
        return false;
      }

      const criteria = (segment.criteria || {}) as Record<string, unknown>;
      const ids = Array.isArray(criteria.customer_ids)
        ? [...(criteria.customer_ids as string[])]
        : [];
      if (!ids.includes(customerId)) ids.push(customerId);

      const { error } = await supabase
        .from('email_segments')
        .update({
          criteria: { ...criteria, customer_ids: ids },
          updated_at: new Date().toISOString(),
        })
        .eq('id', segmentId);

      return !error;
    }

    default:
      console.warn('Unknown workflow action type:', type);
      return false;
  }
}

export async function executeEmailWorkflow(
  supabase: SupabaseClient,
  workflowId: string,
  context: WorkflowContext
): Promise<boolean> {
  const { data: workflow, error } = await supabase
    .from('email_workflows')
    .select('id,store_id,name,trigger_type,trigger_config,actions,conditions,status,is_active')
    .eq('id', workflowId)
    .single();

  if (error || !workflow) {
    console.error('Workflow not found:', workflowId, error?.message);
    return false;
  }

  const row = workflow as WorkflowRow;
  if (row.status !== 'active' || !row.is_active) {
    return false;
  }

  const actions = [...(row.actions || [])].sort(
    (a, b) => (a.order ?? a.order_index ?? 0) - (b.order ?? b.order_index ?? 0)
  );

  let success = true;
  for (const action of actions) {
    const ok = await executeAction(supabase, action, row.store_id, context);
    if (!ok && action.critical) {
      success = false;
      break;
    }
  }

  const { data: current } = await supabase
    .from('email_workflows')
    .select('execution_count,success_count,error_count')
    .eq('id', workflowId)
    .single();

  if (current) {
    await supabase
      .from('email_workflows')
      .update({
        execution_count: (current.execution_count || 0) + 1,
        success_count: success ? (current.success_count || 0) + 1 : current.success_count,
        error_count: success ? current.error_count : (current.error_count || 0) + 1,
        last_executed_at: new Date().toISOString(),
      })
      .eq('id', workflowId);
  }

  return success;
}

export async function triggerEmailWorkflowsForEvent(
  supabase: SupabaseClient,
  storeId: string,
  eventName: string,
  context: WorkflowContext
): Promise<{ triggered: number; succeeded: number }> {
  const { data: workflows, error } = await supabase
    .from('email_workflows')
    .select('id,store_id,name,trigger_type,trigger_config,actions,conditions,status,is_active')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('trigger_type', 'event');

  if (error || !workflows?.length) {
    return { triggered: 0, succeeded: 0 };
  }

  const ctx = { ...context, store_id: storeId };
  let triggered = 0;
  let succeeded = 0;

  for (const wf of workflows as WorkflowRow[]) {
    if (!matchesEventTrigger(wf, eventName, ctx)) continue;
    triggered++;
    const ok = await executeEmailWorkflow(supabase, wf.id, ctx);
    if (ok) succeeded++;
  }

  return { triggered, succeeded };
}
