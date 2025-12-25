/**
 * Zoom Integration Hook
 * Date: 30 Janvier 2025
 * 
 * Hook pour gérer les réunions Zoom pour les services
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ZoomService, ZoomMeetingConfig, ZoomMeeting } from '@/integrations/video-conferencing';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

// Instance du service Zoom (sera initialisé avec les credentials du store)
let zoomServiceInstance: ZoomService | null = null;

/**
 * Initialise le service Zoom avec les credentials du store
 */
const getZoomService = async (storeId: string): Promise<ZoomService> => {
  // Récupérer les credentials Zoom du store
  const { data: storeConfig, error } = await supabase
    .from('store_integrations')
    .select('*')
    .eq('store_id', storeId)
    .eq('integration_type', 'zoom')
    .single();

  if (error || !storeConfig) {
    throw new Error('Configuration Zoom non trouvée pour ce store');
  }

  const config = storeConfig.config as {
    api_key?: string;
    api_secret?: string;
    account_id?: string;
  };

  if (!config.api_key || !config.api_secret) {
    throw new Error('Credentials Zoom manquants');
  }

  // Créer une nouvelle instance si nécessaire
  if (!zoomServiceInstance || 
      zoomServiceInstance['apiKey'] !== config.api_key ||
      zoomServiceInstance['apiSecret'] !== config.api_secret) {
    zoomServiceInstance = new ZoomService(
      config.api_key,
      config.api_secret,
      config.account_id
    );
  }

  return zoomServiceInstance;
};

/**
 * Hook pour créer une réunion Zoom
 */
export const useCreateZoomMeeting = (storeId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      config,
      bookingId,
    }: {
      config: ZoomMeetingConfig;
      bookingId?: string;
    }) => {
      if (!storeId) throw new Error('Store ID manquant');

      const zoomService = await getZoomService(storeId);
      const meeting = await zoomService.createMeeting(config);

      // Si un bookingId est fourni, lier la réunion au booking
      if (bookingId) {
        const { error } = await supabase
          .from('service_bookings')
          .update({
            meeting_url: meeting.join_url,
            meeting_id: meeting.id,
            meeting_password: meeting.password,
            meeting_platform: 'zoom',
          })
          .eq('id', bookingId);

        if (error) {
          logger.error('Error linking Zoom meeting to booking', { error, bookingId });
        }
      }

      return meeting;
    },
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ['zoom-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      toast({
        title: '✅ Réunion Zoom créée',
        description: `Réunion "${meeting.topic}" créée avec succès`,
      });
    },
    onError: (error: any) => {
      logger.error('Error creating Zoom meeting', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la réunion Zoom',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour récupérer une réunion Zoom
 */
export const useZoomMeeting = (meetingId: string, storeId?: string) => {
  return useQuery({
    queryKey: ['zoom-meeting', meetingId, storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');
      const zoomService = await getZoomService(storeId);
      return await zoomService.getMeeting(meetingId);
    },
    enabled: !!meetingId && !!storeId,
  });
};

/**
 * Hook pour mettre à jour une réunion Zoom
 */
export const useUpdateZoomMeeting = (storeId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      meetingId,
      config,
    }: {
      meetingId: string;
      config: Partial<ZoomMeetingConfig>;
    }) => {
      if (!storeId) throw new Error('Store ID manquant');
      const zoomService = await getZoomService(storeId);
      return await zoomService.updateMeeting(meetingId, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoom-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      toast({
        title: '✅ Réunion mise à jour',
        description: 'La réunion Zoom a été mise à jour avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error updating Zoom meeting', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour la réunion',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer une réunion Zoom
 */
export const useDeleteZoomMeeting = (storeId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      if (!storeId) throw new Error('Store ID manquant');
      const zoomService = await getZoomService(storeId);
      await zoomService.deleteMeeting(meetingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoom-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      toast({
        title: '✅ Réunion supprimée',
        description: 'La réunion Zoom a été supprimée avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error deleting Zoom meeting', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer la réunion',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour récupérer les enregistrements d'une réunion
 */
export const useZoomMeetingRecordings = (meetingId: string, storeId?: string) => {
  return useQuery({
    queryKey: ['zoom-meeting-recordings', meetingId, storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');
      const zoomService = await getZoomService(storeId);
      return await zoomService.getMeetingRecordings(meetingId);
    },
    enabled: !!meetingId && !!storeId,
  });
};

