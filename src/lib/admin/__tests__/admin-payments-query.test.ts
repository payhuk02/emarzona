import { describe, expect, it } from 'vitest';
import { applyAdminPaymentTabFilter } from '@/lib/admin/admin-payments-query';

describe('applyAdminPaymentTabFilter', () => {
  it('filters completed tab with paid statuses', () => {
    const query = { in: vi.fn().mockReturnValue({ tag: 'completed' }) };
    applyAdminPaymentTabFilter(query as never, 'completed');
    expect(query.in).toHaveBeenCalledWith('payment_status', ['completed', 'paid']);
  });

  it('returns query unchanged for all tab', () => {
    const query = { in: vi.fn(), eq: vi.fn() };
    const result = applyAdminPaymentTabFilter(query as never, 'all');
    expect(result).toBe(query);
    expect(query.in).not.toHaveBeenCalled();
  });
});
