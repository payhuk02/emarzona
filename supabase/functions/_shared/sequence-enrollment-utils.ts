/**
 * Utilitaires séquences email — déclenchement événements + enrollment invités
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface SequenceTriggerRow {
  id: string;
  store_id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown> | null;
  status: string;
}

export interface SequenceEnrollmentContext {
  store_id: string;
  order_id?: string;
  customer_id?: string;
  email?: string;
  customer_name?: string;
  order_total?: number;
  currency?: string;
  guest_checkout?: boolean;
  product_type?: string;
  [key: string]: unknown;
}

export function matchesSequenceEventTrigger(
  sequence: SequenceTriggerRow,
  eventName: string,
  context: SequenceEnrollmentContext
): boolean {
  if (sequence.trigger_type !== 'event' || sequence.status !== 'active') return false;

  const cfg = (sequence.trigger_config || {}) as Record<string, unknown>;
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
  if (filters.guest_only === true && context.guest_checkout !== true) {
    return false;
  }
  return true;
}

export async function triggerSequenceEnrollmentsForEvent(
  supabase: SupabaseClient,
  storeId: string,
  eventName: string,
  context: SequenceEnrollmentContext
): Promise<{ triggered: number; enrolled: number; errors: number }> {
  const email = context.email?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { triggered: 0, enrolled: 0, errors: 0 };
  }

  const { data: sequences, error } = await supabase
    .from('email_sequences')
    .select('id, store_id, name, trigger_type, trigger_config, status')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .eq('trigger_type', 'event');

  if (error || !sequences?.length) {
    return { triggered: 0, enrolled: 0, errors: 0 };
  }

  const ctx: SequenceEnrollmentContext = { ...context, store_id: storeId, email };
  let triggered = 0;
  let enrolled = 0;
  let errors = 0;

  for (const seq of sequences as SequenceTriggerRow[]) {
    if (!matchesSequenceEventTrigger(seq, eventName, ctx)) continue;
    triggered++;

    const { data: enrollmentId, error: enrollError } = await supabase.rpc(
      'enroll_store_email_in_sequence',
      {
        p_store_id: storeId,
        p_sequence_id: seq.id,
        p_email: email,
        p_context: {
          ...ctx,
          sequence_name: seq.name,
          trigger_event: eventName,
        },
      }
    );

    if (enrollError) {
      console.error(`enroll_store_email_in_sequence [${seq.id}]:`, enrollError.message);
      errors++;
      continue;
    }

    if (enrollmentId) enrolled++;
  }

  return { triggered, enrolled, errors };
}
