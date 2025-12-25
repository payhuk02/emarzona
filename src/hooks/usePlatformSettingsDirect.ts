/**
 * Hook pour gérer directement la table platform_settings
 * Utilisé pour les paramètres globaux de la plateforme (commissions, retraits, etc.)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface PlatformSettings {
  id: string;
  platform_commission_rate: number;
  referral_commission_rate: number;
  min_withdrawal_amount: number;
  auto_approve_withdrawals: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface PlatformSettingsUpdate {
  platform_commission_rate?: number;
  referral_commission_rate?: number;
  min_withdrawal_amount?: number;
  auto_approve_withdrawals?: boolean;
  email_notifications?: boolean;
  sms_notifications?: boolean;
}

/**
 * Hook pour récupérer les paramètres de la plateforme
 */
export const usePlatformSettingsDirect = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les paramètres
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        logger.error('Error fetching platform settings', { error });
        throw error;
      }

      return data as PlatformSettings;
    },
    retry: 2,
  });

  // Mettre à jour les paramètres
  const updateSettings = useMutation({
    mutationFn: async (updates: PlatformSettingsUpdate) => {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('platform_settings')
        .update({
          ...updates,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000001') // Singleton ID
        .select()
        .single();

      if (error) {
        logger.error('Error updating platform settings', { error });
        throw error;
      }

      return data as PlatformSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['platform-settings'], data);
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast({
        title: '✅ Paramètres mis à jour',
        description: 'Les paramètres de la plateforme ont été sauvegardés avec succès.',
      });
      logger.log('Platform settings updated', { settings: data });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour les paramètres',
        variant: 'destructive',
      });
      logger.error('Error updating platform settings', { error });
    },
  });

  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
};







