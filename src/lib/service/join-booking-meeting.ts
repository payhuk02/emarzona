import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export async function joinBookingMeeting(
  bookingId: string,
  role: 'host' | 'guest' = 'guest'
): Promise<{ url: string; platform?: string } | { error: string }> {
  const { data, error } = await supabase.functions.invoke<{
    url?: string;
    platform?: string;
    error?: string;
  }>('service-booking-meeting', {
    body: { bookingId, action: 'join', role },
  });
  if (error) {
    logger.warn('joinBookingMeeting failed', { bookingId, role, error: error.message });
    return { error: error.message };
  }
  if (data?.error) {
    logger.warn('joinBookingMeeting failed', { bookingId, role, error: data.error });
    return { error: data.error };
  }
  if (!data?.url) return { error: 'Lien visio indisponible' };
  return { url: data.url, platform: data.platform };
}
