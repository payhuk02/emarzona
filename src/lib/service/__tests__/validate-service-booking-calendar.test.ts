import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateServiceBooking } from '../validate-service-booking';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

const baseOptions = {
  productId: 'prod-1',
  scheduledDate: '2026-06-15',
  scheduledStartTime: '10:00:00',
  scheduledEndTime: '11:00:00',
};

describe('validateServiceBooking — calendar conflicts (E37)', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset();
    vi.mocked(supabase.rpc).mockImplementation(async (fn: string) => {
      if (fn === 'check_advance_booking_days') {
        return { data: [{ is_valid: true }], error: null };
      }
      if (fn === 'check_max_bookings_per_day') {
        return { data: [{ is_within_limit: true }], error: null };
      }
      if (fn === 'check_booking_conflicts') {
        return { data: [{ has_conflict: false }], error: null };
      }
      if (fn === 'detect_calendar_conflicts') {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });
  });

  it('returns valid when no calendar conflicts', async () => {
    const result = await validateServiceBooking(baseOptions);
    expect(result.isValid).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'detect_calendar_conflicts',
      expect.objectContaining({ p_service_id: 'prod-1' })
    );
  });

  it('rejects when Google Calendar busy block overlaps', async () => {
    vi.mocked(supabase.rpc).mockImplementation(async (fn: string) => {
      if (fn === 'detect_calendar_conflicts') {
        return {
          data: [{ conflict_type: 'calendar_event', conflict_event_id: 'evt-1' }],
          error: null,
        };
      }
      if (fn === 'check_advance_booking_days') {
        return { data: [{ is_valid: true }], error: null };
      }
      if (fn === 'check_max_bookings_per_day') {
        return { data: [{ is_within_limit: true }], error: null };
      }
      if (fn === 'check_booking_conflicts') {
        return { data: [{ has_conflict: false }], error: null };
      }
      return { data: null, error: null };
    });

    const result = await validateServiceBooking(baseOptions);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/Google/i);
  });
});
