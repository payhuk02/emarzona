/**
 * Coupon Enhancements Hooks
 * Date: 2025-01-27
 * 
 * Hooks pour les améliorations des coupons : combinables, usage unique par client
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useState } from 'react';

// =====================================================
// TYPES
// =====================================================

export interface CombineCouponsResult {
  can_combine: boolean;
  total_discount: number;
  error_message?: string;
}

export interface CouponCustomerUsage {
  id: string;
  coupon_id: string;
  customer_id: string;
  order_id?: string;
  used_at: string;
  discount_amount: number;
  order_total_before: number;
  order_total_after: number;
}

// =====================================================
// HOOKS
// =====================================================

/**
 * Hook pour vérifier si des coupons peuvent être combinés
 */
export const useCanCombineCoupons = () => {
  return useMutation({
    mutationFn: async ({
      couponIds,
      orderTotal,
    }: {
      couponIds: string[];
      orderTotal: number;
    }): Promise<CombineCouponsResult> => {
      const { data, error } = await supabase.rpc('can_combine_coupons', {
        p_coupon_ids: couponIds,
        p_order_total: orderTotal,
      });

      if (error) {
        logger.error('Error checking coupon combination', { error, couponIds });
        throw error;
      }

      return data as CombineCouponsResult;
    },
  });
};

/**
 * Hook pour vérifier si un coupon peut être utilisé par un client
 */
export const useCanUseCouponByCustomer = () => {
  return useMutation({
    mutationFn: async ({
      couponId,
      customerId,
    }: {
      couponId: string;
      customerId: string;
    }): Promise<boolean> => {
      const { data, error } = await supabase.rpc('can_use_coupon_by_customer', {
        p_coupon_id: couponId,
        p_customer_id: customerId,
      });

      if (error) {
        logger.error('Error checking coupon usage', { error, couponId, customerId });
        throw error;
      }

      return data as boolean;
    },
  });
};

/**
 * Hook pour enregistrer l'usage d'un coupon
 */
export const useRecordCouponUsage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      couponId,
      customerId,
      orderId,
      discountAmount,
      orderTotalBefore,
      orderTotalAfter,
    }: {
      couponId: string;
      customerId: string;
      orderId: string;
      discountAmount: number;
      orderTotalBefore: number;
      orderTotalAfter: number;
    }) => {
      const { data, error } = await supabase.rpc('record_coupon_usage', {
        p_coupon_id: couponId,
        p_customer_id: customerId,
        p_order_id: orderId,
        p_discount_amount: discountAmount,
        p_order_total_before: orderTotalBefore,
        p_order_total_after: orderTotalAfter,
      });

      if (error) {
        logger.error('Error recording coupon usage', { error, couponId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeCoupons'] });
      queryClient.invalidateQueries({ queryKey: ['activeCoupons'] });
      queryClient.invalidateQueries({ queryKey: ['couponUsage'] });
    },
    onError: (error: Error) => {
      logger.error('Error in useRecordCouponUsage', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'enregistrer l\'usage du coupon',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour récupérer l'historique d'usage d'un coupon par client
 */
export const useCouponCustomerUsage = (couponId?: string, customerId?: string) => {
  return useQuery({
    queryKey: ['couponCustomerUsage', couponId, customerId],
    queryFn: async () => {
      if (!couponId && !customerId) {
        return [];
      }

      let query = supabase
        .from('coupon_customer_usage')
        .select('*')
        .order('used_at', { ascending: false });

      if (couponId) {
        query = query.eq('coupon_id', couponId);
      }

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching coupon customer usage', { error, couponId, customerId });
        throw error;
      }

      return (data || []) as CouponCustomerUsage[];
    },
    enabled: !!(couponId || customerId),
  });
};

/**
 * Hook pour valider plusieurs coupons combinés
 */
export const useValidateCombinedCoupons = () => {
  const { toast } = useToast();
  const canCombineMutation = useCanCombineCoupons();
  const canUseMutation = useCanUseCouponByCustomer();

  return useMutation({
    mutationFn: async ({
      couponIds,
      orderTotal,
      customerId,
    }: {
      couponIds: string[];
      orderTotal: number;
      customerId?: string;
    }): Promise<{
      valid: boolean;
      totalDiscount: number;
      error?: string;
      coupons: Array<{
        id: string;
        code: string;
        discount: number;
        canUse: boolean;
      }>;
    }> => {
      // Vérifier si les coupons peuvent être combinés
      const combineResult = await canCombineMutation.mutateAsync({ couponIds, orderTotal });

      if (!combineResult.can_combine) {
        return {
          valid: false,
          totalDiscount: 0,
          error: combineResult.error_message || 'Les coupons ne peuvent pas être combinés',
          coupons: [],
        };
      }

      // Vérifier l'usage unique pour chaque coupon si customerId fourni
      const coupons: Array<{
        id: string;
        code: string;
        discount: number;
        canUse: boolean;
      }> = [];

      if (customerId) {
        for (const couponId of couponIds) {
          const canUseCoupon = await canUseMutation.mutateAsync({ couponId, customerId });
          
          // Récupérer les infos du coupon
          const { data: coupon } = await supabase
            .from('digital_product_coupons')
            .select('id, code, discount_type, discount_value')
            .eq('id', couponId)
            .single();

          if (coupon) {
            const discount = coupon.discount_type === 'percentage'
              ? (orderTotal * coupon.discount_value / 100)
              : coupon.discount_value;

            coupons.push({
              id: coupon.id,
              code: coupon.code,
              discount,
              canUse: canUseCoupon,
            });
          }
        }

        // Vérifier si tous les coupons peuvent être utilisés
        const allCanUse = coupons.every(c => c.canUse);
        if (!allCanUse) {
          return {
            valid: false,
            totalDiscount: 0,
            error: 'Un ou plusieurs coupons ont déjà été utilisés',
            coupons,
          };
        }
      }

      return {
        valid: true,
        totalDiscount: combineResult.total_discount,
        coupons,
      };
    },
    onError: (error: Error) => {
      logger.error('Error validating combined coupons', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de valider les coupons',
        variant: 'destructive',
      });
    },
  });
};

