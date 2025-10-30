import { supabase } from '@/integrations/supabase/client';

type AuditPayload = {
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

export async function logAdminAction(payload: AuditPayload): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('admin_actions').insert({
      actor_id: user.id,
      action: payload.action,
      target_type: payload.targetType ?? null,
      target_id: payload.targetId ?? null,
      metadata: payload.metadata ?? {},
    });
  } catch (_) {
    // Best-effort logging; ignore failures
  }
}


