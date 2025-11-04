/**
 * Digital Product Drip Content Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer le contenu progressif (drip content)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface DripSchedule {
  id: string;
  digital_product_id: string;
  file_id?: string;
  release_delay_days: number;
  release_delay_hours: number;
  release_delay_minutes: number;
  release_type: 'time_based' | 'action_based' | 'date_based';
  release_date?: string;
  release_condition?: Record<string, any>;
  email_notification: boolean;
  notification_subject?: string;
  notification_body?: string;
  display_order: number;
  release_title?: string;
  release_message?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DripRelease {
  id: string;
  drip_schedule_id: string;
  digital_product_id: string;
  file_id?: string;
  customer_id: string;
  order_id?: string;
  scheduled_release_date: string;
  actual_release_date?: string;
  release_status: 'scheduled' | 'released' | 'cancelled' | 'failed';
  email_sent: boolean;
  email_sent_at?: string;
  email_sent_error?: string;
  file_accessed: boolean;
  first_access_date?: string;
  access_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  drip_schedule?: DripSchedule;
  file?: {
    id: string;
    name: string;
    file_url: string;
    file_size_mb: number;
  };
}

export interface AvailableDripContent {
  release_id: string;
  drip_schedule_id: string;
  digital_product_id: string;
  file_id?: string;
  file_name?: string;
  file_url?: string;
  release_title?: string;
  release_message?: string;
  scheduled_release_date: string;
  actual_release_date?: string;
  is_released: boolean;
  is_available: boolean;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useDripSchedules - Liste les schedules de drip content d'un produit
 */
export const useDripSchedules = (digitalProductId: string | undefined) => {
  return useQuery({
    queryKey: ['dripSchedules', digitalProductId],
    queryFn: async () => {
      if (!digitalProductId) throw new Error('Digital Product ID manquant');

      const { data, error } = await supabase
        .from('digital_product_drip_schedule')
        .select('*')
        .eq('digital_product_id', digitalProductId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('release_delay_days', { ascending: true });

      if (error) {
        logger.error('Error fetching drip schedules', { error, digitalProductId });
        throw error;
      }

      return (data || []) as DripSchedule[];
    },
    enabled: !!digitalProductId,
  });
};

/**
 * useCustomerDripReleases - Liste les releases de drip content d'un client
 */
export const useCustomerDripReleases = (
  customerId?: string,
  digitalProductId?: string
) => {
  return useQuery({
    queryKey: ['customerDripReleases', customerId, digitalProductId],
    queryFn: async () => {
      if (!customerId) {
        // Récupérer le customer_id depuis l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', user.email)
          .limit(1);

        if (!customer || customer.length === 0) {
          return [];
        }

        customerId = customer[0].id;
      }

      let query = supabase
        .from('drip_content_releases')
        .select(`
          *,
          drip_schedule:digital_product_drip_schedule (*),
          file:digital_product_files (
            id,
            name,
            file_url,
            file_size_mb
          )
        `)
        .eq('customer_id', customerId)
        .in('release_status', ['scheduled', 'released'])
        .order('scheduled_release_date', { ascending: true });

      if (digitalProductId) {
        query = query.eq('digital_product_id', digitalProductId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching customer drip releases', { error, customerId });
        throw error;
      }

      return (data || []) as DripRelease[];
    },
    enabled: true,
  });
};

/**
 * useAvailableDripContent - Récupère le contenu drip disponible pour un client
 */
export const useAvailableDripContent = (
  customerId?: string,
  digitalProductId?: string
) => {
  return useQuery({
    queryKey: ['availableDripContent', customerId, digitalProductId],
    queryFn: async () => {
      if (!customerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', user.email)
          .limit(1);

        if (!customer || customer.length === 0) {
          return [];
        }

        customerId = customer[0].id;
      }

      const { data, error } = await supabase.rpc('get_available_drip_content', {
        p_customer_id: customerId,
        p_digital_product_id: digitalProductId || null,
      });

      if (error) {
        logger.error('Error fetching available drip content', { error, customerId });
        throw error;
      }

      return (data || []) as AvailableDripContent[];
    },
    enabled: true,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateDripSchedule - Créer un schedule de drip content
 */
export const useCreateDripSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (scheduleData: Omit<DripSchedule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('digital_product_drip_schedule')
        .insert(scheduleData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating drip schedule', { error });
        throw error;
      }

      return data as DripSchedule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dripSchedules', variables.digital_product_id] });
      toast({
        title: '✅ Schedule créé',
        description: 'Le plan de libération progressive a été créé',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateDripSchedule', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le schedule',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateDripSchedule - Mettre à jour un schedule
 */
export const useUpdateDripSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      scheduleId,
      updates,
    }: {
      scheduleId: string;
      updates: Partial<DripSchedule>;
    }) => {
      const { data, error } = await supabase
        .from('digital_product_drip_schedule')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating drip schedule', { error, scheduleId });
        throw error;
      }

      return data as DripSchedule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dripSchedules', data.digital_product_id] });
      toast({
        title: '✅ Schedule mis à jour',
        description: 'Le plan de libération a été mis à jour',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useUpdateDripSchedule', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le schedule',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useDeleteDripSchedule - Supprimer un schedule
 */
export const useDeleteDripSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ scheduleId, digitalProductId }: { scheduleId: string; digitalProductId: string }) => {
      const { error } = await supabase
        .from('digital_product_drip_schedule')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        logger.error('Error deleting drip schedule', { error, scheduleId });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dripSchedules', variables.digitalProductId] });
      toast({
        title: '✅ Schedule supprimé',
        description: 'Le plan de libération a été supprimé',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useDeleteDripSchedule', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer le schedule',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCreateDripReleasesForOrder - Créer les releases pour une commande
 */
export const useCreateDripReleasesForOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      orderId,
      customerId,
    }: {
      orderId: string;
      customerId: string;
    }) => {
      const { data, error } = await supabase.rpc('create_drip_releases_for_order', {
        p_order_id: orderId,
        p_customer_id: customerId,
      });

      if (error) {
        logger.error('Error creating drip releases', { error, orderId });
        throw new Error(error.message || 'Erreur lors de la création des releases');
      }

      if (!data || !data.success) {
        throw new Error(data?.message || 'Erreur lors de la création des releases');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDripReleases'] });
      queryClient.invalidateQueries({ queryKey: ['availableDripContent'] });
      toast({
        title: '✅ Releases créés',
        description: 'Les libérations progressives ont été planifiées',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateDripReleasesForOrder', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer les releases',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useReleaseDripContent - Libérer un contenu drip
 */
export const useReleaseDripContent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (releaseId: string) => {
      const { data, error } = await supabase.rpc('release_drip_content', {
        p_release_id: releaseId,
      });

      if (error) {
        logger.error('Error releasing drip content', { error, releaseId });
        throw new Error(error.message || 'Erreur lors de la libération');
      }

      if (!data || !data.success) {
        throw new Error(data?.message || 'Erreur lors de la libération');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDripReleases'] });
      queryClient.invalidateQueries({ queryKey: ['availableDripContent'] });
      toast({
        title: '✅ Contenu libéré',
        description: 'Le contenu a été libéré avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useReleaseDripContent', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de libérer le contenu',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useTrackDripContentAccess - Tracker l'accès à un contenu drip
 */
export const useTrackDripContentAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (releaseId: string) => {
      const { data, error } = await supabase
        .from('drip_content_releases')
        .update({
          file_accessed: true,
          first_access_date: new Date().toISOString(),
          access_count: supabase.raw('access_count + 1'),
        })
        .eq('id', releaseId)
        .select()
        .single();

      if (error) {
        logger.error('Error tracking drip content access', { error, releaseId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDripReleases'] });
      queryClient.invalidateQueries({ queryKey: ['availableDripContent'] });
    },
  });
};

