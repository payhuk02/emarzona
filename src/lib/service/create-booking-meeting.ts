/**
 * Epic 3.3.5 — Create Zoom/Google Meet for online service bookings
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface BookingMeetingResult {
  skipped?: boolean;
  reason?: string;
  meeting_url?: string;
  meeting?: {
    id: string;
    meeting_url: string | null;
    meeting_id: string | null;
    meeting_platform: string | null;
  };
  error?: string;
}

export async function createBookingMeeting(
  bookingId: string,
  platform?: 'zoom' | 'google_meet'
): Promise<BookingMeetingResult> {
  try {
    const { data, error } = await supabase.functions.invoke<BookingMeetingResult>(
      'service-booking-meeting',
      {
        body: { bookingId, platform },
      }
    );

    if (error) {
      logger.warn('createBookingMeeting edge error', { bookingId, error: error.message });
      return { error: error.message };
    }

    return data ?? { skipped: true, reason: 'empty_response' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('createBookingMeeting failed', { bookingId, message });
    return { error: message };
  }
}
