import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFedexTrackingViaEdge } from '../shipping/fedex-track-client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('fetchFedexTrackingViaEdge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne le suivi avec événements', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: true,
        tracking_number: '7489123456789',
        status: 'IN_TRANSIT',
        events: [
          {
            timestamp: '2026-05-19T10:00:00.000Z',
            status: 'IN_TRANSIT',
            status_code: 'FX_IN_TRANSIT',
            location: { city: 'Ouaga', country: 'BF' },
            description: 'En transit',
          },
        ],
        source: 'mock',
      },
      error: null,
    } as never);

    const result = await fetchFedexTrackingViaEdge('7489123456789');

    expect(result.status).toBe('IN_TRANSIT');
    expect(result.events).toHaveLength(1);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('fedex-track', expect.any(Object));
  });
});
