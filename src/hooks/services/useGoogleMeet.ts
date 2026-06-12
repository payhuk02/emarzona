/**
 * Epic 3.3.5 — Google Meet hook for service bookings
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { createBookingMeeting } from '@/lib/service/create-booking-meeting';

export function useCreateGoogleMeetForBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const result = await createBookingMeeting(bookingId, 'google_meet');
      if (result.error) throw new Error(result.error);
      if (result.skipped && result.reason !== 'meeting_exists') {
        throw new Error(result.reason || 'Meeting creation skipped');
      }
      return result;
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      if (!result.skipped) {
        toast({
          title: 'Google Meet créé',
          description: 'Le lien de réunion a été ajouté à la réservation',
        });
      }
    },
    onError: (error: Error) => {
      logger.error('Google Meet creation failed', { error });
      toast({
        title: 'Erreur Google Meet',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCreateBookingMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      platform,
    }: {
      bookingId: string;
      platform?: 'zoom' | 'google_meet';
    }) => createBookingMeeting(bookingId, platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}
