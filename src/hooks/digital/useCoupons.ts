/**
 * Digital Product Coupons Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les codes promo pour produits digitaux
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface DigitalProductCoupon {
  id: string;
  store_id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  applicable_product_ids?: string[];
  applicable_product_types?: string[];
  applicable_store_ids?: string[];
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_customer: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  is_archived: boolean;
  first_time_buyers_only: boolean;
  exclude_sale_items: boolean;
  exclude_bundles: boolean;
  total_discount_given: number;
  total_orders: number;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  order_id: string;
  customer_id?: string;
  discount_amount: number;
  order_total_before_discount: number;
  order_total_after_discount: number;
  customer_email?: string;
  customer_name?: string;
  product_id?: string;
  product_type?: string;
  created_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
  coupon_id?: string;
  code?: string;
  name?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  discount_amount?: number;
  order_total_before?: number;
  order_total_after?: number;
  min_amount?: number;
}

export interface CreateCouponData {
  store_id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  applicable_product_ids?: string[];
  applicable_product_types?: string[];
  applicable_store_ids?: string[];
  usage_limit?: number;
  usage_limit_per_customer?: number;
  valid_from?: string;
  valid_until?: string;
  first_time_buyers_only?: boolean;
  exclude_sale_items?: boolean;
  exclude_bundles?: boolean;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useStoreCoupons - Liste les coupons d'un store
 */
export const useStoreCoupons = (storeId?: string) => {
  return useQuery({
    queryKey: ['storeCoupons', storeId],
    queryFn: async () => {
      if (!storeId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id);

        if (!stores || stores.length === 0) {
          return [];
        }

        storeId = stores[0].id;
      }

      const { data, error } = await supabase
        .from('digital_product_coupons')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching store coupons', { error, storeId });
        throw error;
      }

      return (data || []) as DigitalProductCoupon[];
    },
    enabled: true,
  });
};

/**
 * useActiveCoupons - Liste les coupons actifs d'un store
 */
export const useActiveCoupons = (storeId?: string) => {
  return useQuery({
    queryKey: ['activeCoupons', storeId],
    queryFn: async () => {
      if (!storeId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id);

        if (!stores || stores.length === 0) {
          return [];
        }

        storeId = stores[0].id;
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('digital_product_coupons')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .eq('is_archived', false)
        .lte('valid_from', now)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching active coupons', { error, storeId });
        throw error;
      }

      return (data || []) as DigitalProductCoupon[];
    },
    enabled: true,
  });
};

/**
 * useCouponUsages - Historique des utilisations d'un coupon
 */
export const useCouponUsages = (couponId: string | undefined) => {
  return useQuery({
    queryKey: ['couponUsages', couponId],
    queryFn: async () => {
      if (!couponId) throw new Error('Coupon ID manquant');

      const { data, error } = await supabase
        .from('coupon_usages')
        .select('*')
        .eq('coupon_id', couponId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        logger.error('Error fetching coupon usages', { error, couponId });
        throw error;
      }

      return (data || []) as CouponUsage[];
    },
    enabled: !!couponId,
  });
};

/**
 * useValidateCoupon - Valider un code promo
 */
export const useValidateCoupon = (
  code: string | undefined,
  options?: {
    productId?: string;
    productType?: string;
    storeId?: string;
    customerId?: string;
    orderAmount?: number;
  }
) => {
  return useQuery({
    queryKey: ['validateCoupon', code, options],
    queryFn: async () => {
      if (!code || code.trim() === '') {
        return {
          valid: false,
          error: 'code_empty',
          message: 'Veuillez entrer un code promo',
        } as CouponValidationResult;
      }

      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: code.toUpperCase().trim(),
        p_product_id: options?.productId || null,
        p_product_type: options?.productType || null,
        p_store_id: options?.storeId || null,
        p_customer_id: options?.customerId || null,
        p_order_amount: options?.orderAmount || 0,
      });

      if (error) {
        logger.error('Error validating coupon', { error, code });
        return {
          valid: false,
          error: 'validation_error',
          message: error.message || 'Erreur lors de la validation',
        } as CouponValidationResult;
      }

      return data as CouponValidationResult;
    },
    enabled: !!code && code.trim() !== '',
    staleTime: 0, // Toujours valider à nouveau
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateCoupon - Créer un nouveau coupon
 */
export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (couponData: CreateCouponData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier que le store appartient à l'utilisateur
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('id', couponData.store_id)
        .eq('user_id', user.id)
        .single();

      if (!store) {
        throw new Error('Store non trouvé ou non autorisé');
      }

      // Normaliser le code (uppercase, trim)
      const normalizedCode = couponData.code.toUpperCase().trim();

      // Vérifier que le code n'existe pas déjà
      const { data: existing } = await supabase
        .from('digital_product_coupons')
        .select('id')
        .eq('code', normalizedCode)
        .single();

      if (existing) {
        throw new Error('Ce code promo existe déjà');
      }

      const { data, error } = await supabase
        .from('digital_product_coupons')
        .insert({
          ...couponData,
          code: normalizedCode,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating coupon', { error });
        throw error;
      }

      return data as DigitalProductCoupon;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storeCoupons', variables.store_id] });
      queryClient.invalidateQueries({ queryKey: ['activeCoupons', variables.store_id] });
      toast({
        title: '✅ Coupon créé',
        description: 'Le code promo a été créé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateCoupon', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le coupon',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateCoupon - Mettre à jour un coupon
 */
export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      couponId,
      updates,
    }: {
      couponId: string;
      updates: Partial<DigitalProductCoupon>;
    }) => {
      const { data, error } = await supabase
        .from('digital_product_coupons')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', couponId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating coupon', { error, couponId });
        throw error;
      }

      return data as DigitalProductCoupon;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['storeCoupons', data.store_id] });
      queryClient.invalidateQueries({ queryKey: ['activeCoupons', data.store_id] });
      queryClient.invalidateQueries({ queryKey: ['coupon', data.id] });
      toast({
        title: '✅ Coupon mis à jour',
        description: 'Le code promo a été mis à jour',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useUpdateCoupon', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le coupon',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useDeleteCoupon - Supprimer/Archiver un coupon
 */
export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ couponId, storeId }: { couponId: string; storeId: string }) => {
      // Archiver plutôt que supprimer pour garder l'historique
      const { data, error } = await supabase
        .from('digital_product_coupons')
        .update({
          is_archived: true,
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', couponId)
        .select()
        .single();

      if (error) {
        logger.error('Error deleting coupon', { error, couponId });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storeCoupons', variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ['activeCoupons', variables.storeId] });
      toast({
        title: '✅ Coupon archivé',
        description: 'Le code promo a été archivé',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useDeleteCoupon', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer le coupon',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useApplyCoupon - Appliquer un coupon à une commande
 */
export const useApplyCoupon = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      couponId,
      orderId,
      customerId,
      discountAmount,
    }: {
      couponId: string;
      orderId: string;
      customerId: string;
      discountAmount: number;
    }) => {
      const { data, error } = await supabase.rpc('apply_coupon_to_order', {
        p_coupon_id: couponId,
        p_order_id: orderId,
        p_customer_id: customerId,
        p_discount_amount: discountAmount,
      });

      if (error) {
        logger.error('Error applying coupon', { error, couponId, orderId });
        throw new Error(error.message || 'Erreur lors de l\'application du coupon');
      }

      if (!data || !data.success) {
        throw new Error(data?.message || 'Erreur lors de l\'application du coupon');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['couponUsages'] });
      toast({
        title: '✅ Coupon appliqué',
        description: 'Le code promo a été appliqué avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useApplyCoupon', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'appliquer le coupon',
        variant: 'destructive',
      });
    },
  });
};

