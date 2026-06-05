import { describe, expect, it } from 'vitest';
import { isSensitiveAuditAction, SENSITIVE_AUDIT_ACTIONS } from '@/lib/audit-alerts';

describe('admin-audit-alerts', () => {
  it('flags critical security actions', () => {
    expect(SENSITIVE_AUDIT_ACTIONS.has('KYC_REJECT')).toBe(true);
    expect(SENSITIVE_AUDIT_ACTIONS.has('DELETE_USER')).toBe(true);
    expect(SENSITIVE_AUDIT_ACTIONS.has('UPDATE_RBAC_ROLE')).toBe(true);
  });

  it('ignores routine product toggles', () => {
    expect(isSensitiveAuditAction('ACTIVATE_PRODUCT')).toBe(false);
    expect(isSensitiveAuditAction('DEACTIVATE_PRODUCT')).toBe(false);
  });
});
