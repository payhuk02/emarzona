/**
 * Hook pour gérer les packages de services
 * Date: 1 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const SERVICE_PACKAGE_FIELDS = 'id, service_id, product_id, store_id, name, description, slug, sessions_count, price, compare_at_price, credits_per_session, total_credits, expires_in_days, expires_at, is_active, is_featured, image_url, terms_and_conditions, created_at, updated_at';
const SERVICE_PACKAGE_PURCHASE_FIELDS = 'id, user_id, package_id, order_id, total_credits, remaining_credits, used_credits, purchased_at, expires_at, is_expired, status';

export interface ServicePackage {
  id: string;
  service_id: string;
  product_id: string;
  store_id: string;
  name: string;
  description?: string;
  slug: string;
  sessions_count: number;
  price: number;
  compare_at_price?: number;
  credits_per_session: number;
  total_credits: number;
  expires_in_days?: number;
  expires_at?: string;
  is_active: boolean;
  is_featured: boolean;
  image_url?: string;
  terms_and_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface ServicePackagePurchase {
  id: string;
  user_id: string;
  package_id: string;
  order_id?: string;
  total_credits: number;
  remaining_credits: number;
  used_credits: number;
  purchased_at: string;
  expires_at?: string;
  is_expired: boolean;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
}

export interface CreateServicePackageInput {
  service_id: string;
  product_id: string;
  store_id: string;
  name: string;
  description?: string;
  slug: string;
  sessions_count: number;
  price: number;
  compare_at_price?: number;
  credits_per_session?: number;
  expires_in_days?: number;
  is_active?: boolean;
  is_featured?: boolean;
  image_url?: string;
  terms_and_conditions?: string;
}

/**
 * Récupère les packages d'un service
 */
export const useServicePackages = (serviceId: string) => {
  return useQuery({
    queryKey: ['service-packages', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_packages')
        .select(SERVICE_PACKAGE_FIELDS)
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('price', { ascending: true });

      if (error) {
        logger.error('Error fetching service packages', { error, serviceId });
        throw error;
      }

      return (data || []) as ServicePackage[];
    },
    enabled: !!serviceId,
  });
};

/**
 * Récupère les packages achetés par l'utilisateur
 */
export const useUserServicePackages = () => {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  return useQuery({
    queryKey: ['user-service-packages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('service_package_purchases')
        .select(`
          ${SERVICE_PACKAGE_PURCHASE_FIELDS},
          package:service_packages(${SERVICE_PACKAGE_FIELDS})
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('purchased_at', { ascending: false });

      if (error) {
        logger.error('Error fetching user service packages', { error });
        throw error;
      }

      return (data || []) as ServicePackagePurchase[];
    },
    enabled: !!user?.id,
  });
};

/**
 * Crée un nouveau package
 */
export const useCreateServicePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateServicePackageInput) => {
      const { data, error } = await supabase
        .from('service_packages')
        .insert(input)
        .select()
        .single();

      if (error) {
        logger.error('Error creating service package', { error, input });
        throw error;
      }

      return data as ServicePackage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-packages', variables.service_id] });
    },
  });
};

/**
 * Met à jour un package
 */
export const useUpdateServicePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServicePackage> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating service package', { error, id, updates });
        throw error;
      }

      return data as ServicePackage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-packages', data.service_id] });
    },
  });
};







