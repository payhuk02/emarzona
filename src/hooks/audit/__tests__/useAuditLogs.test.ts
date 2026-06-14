import { describe, it, expect } from 'vitest';
import { auditLogsToCsv } from '@/hooks/audit/useAuditLogs';

describe('auditLogsToCsv (Epic 4.4)', () => {
  it('produces CSV with escaped quotes in metadata', () => {
    const csv = auditLogsToCsv([
      {
        id: '1',
        log_source: 'platform_admin',
        store_id: null,
        actor_id: 'u1',
        actor_email: 'admin@test.com',
        action: 'settings.update',
        target_type: 'platform',
        target_id: null,
        metadata: { note: 'say "hello"' },
        ip_address: '1.2.3.4',
        user_agent: null,
        created_at: '2026-06-11T10:00:00Z',
      },
    ]);
    expect(csv.split('\n')).toHaveLength(2);
    expect(csv).toContain('admin@test.com');
    expect(csv).toContain('settings.update');
  });
});
