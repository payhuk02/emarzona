import { describe, it, expect, vi } from 'vitest';
import { generateOrderNumber } from '@/lib/orders/orders-data';
import { resolveOrderNumber } from '@/lib/orders/resolve-order-number';

vi.mock('@/lib/orders/resolve-order-number', () => ({
  resolveOrderNumber: vi.fn(),
}));

describe('orders-data', () => {
  it('generateOrderNumber delegates to resolveOrderNumber', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'ORD-123', error: null });
    vi.mocked(resolveOrderNumber).mockReturnValue('ORD-123');

    const client = { rpc } as never;
    const result = await generateOrderNumber(client, { suffix: 'a' });

    expect(rpc).toHaveBeenCalledWith('generate_order_number');
    expect(resolveOrderNumber).toHaveBeenCalledWith('ORD-123', null, { suffix: 'a' });
    expect(result).toBe('ORD-123');
  });
});
