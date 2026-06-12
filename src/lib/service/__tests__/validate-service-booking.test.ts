import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateServiceBooking } from '@/lib/service/validate-service-booking';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';

const baseOptions = {
  productId: 'prod-1',
  scheduledDate: '2026-06-20',
  scheduledStartTime: '10:00:00',
  scheduledEndTime: '11:00:00',
};

describe('validateServiceBooking', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset();
  });

  it('agrège les erreurs advance_booking_days et max_bookings_per_day', async () => {
    vi.mocked(supabase.rpc).mockImplementation(async (name: string) => {
      if (name === 'check_advance_booking_days') {
        return { data: [{ is_valid: false, message: 'Trop tôt' }], error: null };
      }
      if (name === 'check_max_bookings_per_day') {
        return { data: [{ is_within_limit: false, message: 'Quota jour atteint' }], error: null };
      }
      if (name === 'check_booking_conflicts') {
        return { data: [{ has_conflict: false }], error: null };
      }
      return { data: [], error: null };
    });

    const result = await validateServiceBooking(baseOptions);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(['Trop tôt', 'Quota jour atteint']));
  });

  it('retourne isValid=true quand les RPC passent', async () => {
    vi.mocked(supabase.rpc).mockImplementation(async (name: string) => {
      if (name === 'check_advance_booking_days') {
        return { data: [{ is_valid: true }], error: null };
      }
      if (name === 'check_max_bookings_per_day') {
        return { data: [{ is_within_limit: true }], error: null };
      }
      if (name === 'check_booking_conflicts') {
        return { data: [{ has_conflict: false }], error: null };
      }
      return { data: [], error: null };
    });

    const result = await validateServiceBooking(baseOptions);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
