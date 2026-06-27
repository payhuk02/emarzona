import { supabase } from '@/integrations/supabase/client';
import {
  mapProtectStatusPayload,
  type EmarzonaProtectStatus,
  type ProtectReasonCode,
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
