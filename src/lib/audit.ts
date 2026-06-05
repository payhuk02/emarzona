import { supabase } from '@/integrations/supabase/client';
import { isSensitiveAuditAction } from '@/lib/audit-alerts';

type AuditPayload = {
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

async function notifySecurityStakeholders(
  payload: AuditPayload,
  actorEmail: string | null | undefined
): Promise<void> {
  try {
    await supabase.functions.invoke('admin-security-alert', {
      body: {
        action: payload.action,
        targetType: payload.targetType ?? null,
        targetId: payload.targetId ?? null,
        metadata: payload.metadata ?? {},
        actorEmail: actorEmail ?? null,
      },
    });
  } catch {
    // Best-effort alerting; never block admin actions
  }
}

export async function logAdminAction(payload: AuditPayload): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('admin_actions').insert({
      actor_id: user.id,
      action: payload.action,
      target_type: payload.targetType ?? null,
      target_id: payload.targetId ?? null,
      metadata: payload.metadata ?? {},
    });

    if (isSensitiveAuditAction(payload.action)) {
      void notifySecurityStakeholders(payload, user.email);
    }
  } catch {
    // Best-effort logging; ignore failures
  }
}
