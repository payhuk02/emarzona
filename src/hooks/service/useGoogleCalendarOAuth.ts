/**
 * Epic 3.3.4 — Google Calendar OAuth hook
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  startGoogleCalendarOAuth,
  syncGoogleCalendarBusy,
} from '@/lib/service/google-calendar-client';

export function useConnectGoogleCalendar() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      returnUrl,
      serviceId,
    }: {
      storeId: string;
      returnUrl?: string;
      serviceId?: string;
    }) => {
      const redirect = returnUrl ?? `${window.location.origin}${window.location.pathname}`;
      const { authUrl } = await startGoogleCalendarOAuth(storeId, redirect, serviceId);
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      logger.error('Google Calendar OAuth failed', { error });
      toast({
        title: 'Connexion Google Calendar',
        description: error.message || 'Impossible de démarrer OAuth',
        variant: 'destructive',
      });
    },
  });
}

export function useSyncGoogleCalendarBusy() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      integrationId,
      startDate,
      endDate,
    }: {
      integrationId: string;
      startDate?: string;
      endDate?: string;
    }) => syncGoogleCalendarBusy(integrationId, startDate, endDate),
    onSuccess: data => {
      toast({
        title: 'Calendrier synchronisé',
        description: `${data?.synced ?? 0} créneau(x) occupé(s) importé(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
