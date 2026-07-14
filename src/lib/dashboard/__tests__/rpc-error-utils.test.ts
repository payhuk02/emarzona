import { describe, expect, it } from 'vitest';
import { isRpcUnavailableError } from '@/lib/dashboard/rpc-error-utils';

describe('isRpcUnavailableError', () => {
  it('detects missing function (PGRST202)', () => {
    expect(
      isRpcUnavailableError({
        code: 'PGRST202',
        message: 'Could not find the function public.get_store_dashboard_stats_aggregated',
      })
    ).toBe(true);
  });

  it('detects permission denied (42501)', () => {
    expect(
      isRpcUnavailableError({
        code: '42501',
        message: 'permission denied for function get_store_dashboard_stats_aggregated',
      })
    ).toBe(true);
  });

  it('detects undefined column schema drift (42703)', () => {
    expect(
      isRpcUnavailableError({
        code: '42703',
        message: 'column "stock_quantity" does not exist',
      })
    ).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(
      isRpcUnavailableError({
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      })
    ).toBe(false);
  });
});
