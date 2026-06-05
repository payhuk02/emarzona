import { PRINCIPAL_ADMIN_EMAIL } from '@/lib/principal-admin';

/** Actions déclenchant une alerte email / webhook sécurité. */
export const SENSITIVE_AUDIT_ACTIONS = new Set([
  'KYC_REJECT',
  'DELETE_USER',
  'UPDATE_RBAC_ROLE',
  'SUSPEND_USER',
  'PROMOTE_ADMIN',
  'SET_USER_ROLE',
]);

export type SecurityAlertPayload = {
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  actorEmail?: string | null;
};

export function isSensitiveAuditAction(action: string): boolean {
  return SENSITIVE_AUDIT_ACTIONS.has(action);
}

export function defaultSecurityAlertEmails(): string[] {
  const fromEnv = (import.meta.env.VITE_ADMIN_SECURITY_ALERT_EMAILS as string | undefined)
    ?.split(',')
    .map(e => e.trim())
    .filter(Boolean);
  if (fromEnv?.length) return fromEnv;
  return [PRINCIPAL_ADMIN_EMAIL];
}
