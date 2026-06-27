import { supabase } from '@/integrations/supabase/client';
import {
  mapProtectStatusPayload,
  type EmarzonaProtectStatus,
  type ProtectReasonCode,
  type ProtectResolution,
} from '@/lib/trust/emarzona-protect-policy';

export async function fetchEmarzonaProtectStatus(orderId: string): Promise<EmarzonaProtectStatus> {
  const { data, error } = await supabase.rpc('get_emarzona_protect_status', {
    p_order_id: orderId,
  });
  if (error) throw error;
  return mapProtectStatusPayload(orderId, data);
}

export async function createEmarzonaProtectClaim(input: {
  orderId: string;
  subject: string;
  description: string;
  reasonCode: ProtectReasonCode;
}): Promise<{ disputeId: string }> {
  const { data, error } = await supabase.rpc('create_emarzona_protect_claim', {
    p_order_id: input.orderId,
    p_subject: input.subject,
    p_description: input.description,
    p_reason_code: input.reasonCode,
  });
  if (error) throw error;

  const payload = (data ?? {}) as Record<string, unknown>;
  const disputeId = typeof payload.dispute_id === 'string' ? payload.dispute_id : '';
  if (!disputeId) {
    throw new Error('Réclamation créée sans identifiant litige');
  }
  return { disputeId };
}

export async function resolveEmarzonaProtectDispute(input: {
  disputeId: string;
  resolution: ProtectResolution;
  refundAmount?: number;
  adminNotes?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('resolve_emarzona_protect_dispute', {
    p_dispute_id: input.disputeId,
    p_resolution: input.resolution,
    p_refund_amount: input.refundAmount ?? null,
    p_admin_notes: input.adminNotes ?? null,
  });
  if (error) throw error;
}

export async function backfillEmarzonaProtectEnrollments(options?: {
  daysBack?: number;
  limit?: number;
  reconcileIneligible?: boolean;
}): Promise<{ activated: number; reconciled: number }> {
  const { data, error } = await supabase.rpc('backfill_emarzona_protect_enrollments', {
    p_days_back: options?.daysBack ?? 365,
    p_limit: options?.limit ?? 500,
    p_reconcile_ineligible: options?.reconcileIneligible ?? true,
  });
  if (error) throw error;
  const payload = (data ?? {}) as Record<string, unknown>;
  return {
    activated: Number(payload.activated ?? 0),
    reconciled: Number(payload.reconciled ?? 0),
  };
}
