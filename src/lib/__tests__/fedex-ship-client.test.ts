import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFedexShipmentViaEdge } from '../shipping/fedex-ship-client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('createFedexShipmentViaEdge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne une expédition avec numéro de suivi', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: true,
        tracking_number: '7489123456789',
        tracking_url: 'https://www.fedex.com/fedextrack/?trknbr=7489123456789',
        label_url: 'https://example.com/label.pdf',
        estimated_delivery: '2026-05-24T00:00:00.000Z',
        shipping_cost: 5000,
        currency: 'XOF',
        service_type: 'FEDEX_GROUND',
        source: 'mock',
      },
      error: null,
    } as never);

    const result = await createFedexShipmentViaEdge({
      ship_from: {
        name: 'Shop',
        address: 'Rue 1',
        city: 'Ouaga',
        zip: '01',
        country: 'BF',
      },
      ship_to: {
        name: 'Client',
        address: 'Rue 2',
        city: 'Bobo',
        zip: '02',
        country: 'BF',
      },
      package: { weight: 1.2 },
    });

    expect(result.tracking_number).toBe('7489123456789');
    expect(supabase.functions.invoke).toHaveBeenCalledWith('fedex-ship', expect.any(Object));
  });
});
