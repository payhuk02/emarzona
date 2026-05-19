import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCheapestFedexShippingCost } from '../shipping/fedex-rates-client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('fetchCheapestFedexShippingCost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne le tarif minimum', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        rates: [
          {
            service_type: 'A',
            service_name: 'Slow',
            total_cost: 8000,
            currency: 'XOF',
            estimated_days: 5,
          },
          {
            service_type: 'B',
            service_name: 'Fast',
            total_cost: 12000,
            currency: 'XOF',
            estimated_days: 2,
          },
        ],
        source: 'mock',
      },
      error: null,
    } as never);

    const cost = await fetchCheapestFedexShippingCost({
      ship_from: { country: 'BF', postal_code: '01' },
      ship_to: { country: 'BF', postal_code: '02' },
      weight_kg: 1,
    });

    expect(cost).toBe(8000);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('fedex-rates', expect.any(Object));
  });
});
