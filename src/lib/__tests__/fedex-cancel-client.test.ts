import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cancelFedexShipmentViaEdge } from '../shipping/fedex-cancel-client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('cancelFedexShipmentViaEdge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirme l’annulation', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: true,
        tracking_number: '7489123456789',
        message: 'Expédition annulée (simulation)',
        source: 'mock',
      },
      error: null,
    } as never);

    const result = await cancelFedexShipmentViaEdge('7489123456789');

    expect(result.success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('fedex-cancel', expect.any(Object));
  });
});
