/**
 * Epic 3.3.4 — Client helpers for Google Calendar OAuth + busy sync
 */

import { supabase } from '@/integrations/supabase/client';

export async function startGoogleCalendarOAuth(
  storeId: string,
  returnUrl: string,
  serviceId?: string
) {
  const { data, error } = await supabase.functions.invoke<{ authUrl: string; state: string }>(
    'google-calendar-oauth',
    {
      body: {
        action: 'authorize',
        storeId,
        returnUrl,
        serviceId,
      },
    }
  );

  if (error) throw new Error(error.message || 'OAuth initiation failed');
  if (!data?.authUrl) throw new Error('OAuth URL not returned');

  return data;
}

export async function syncGoogleCalendarBusy(
  integrationId: string,
  startDate?: string,
  endDate?: string
) {
  const { data, error } = await supabase.functions.invoke<{ synced: number; blocks: number }>(
    'google-calendar-sync',
    {
      body: { integrationId, startDate, endDate },
    }
  );

  if (error) throw new Error(error.message || 'Calendar sync failed');
  return data;
}
