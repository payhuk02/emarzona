/**
 * Hook acheteur — précommande sur fiche produit (Epic 3.2.5)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductPreOrderInfo {
  id: string;
  product_id: string;
  variant_id?: string | null;
  status: string;
  expected_availability_date?: string | null;
  pre_order_limit?: number | null;
  current_pre_orders: number;
  reserved_quantity: number;
  deposit_required: boolean;
  deposit_amount?: number | null;
  deposit_percentage?: number | null;
  spots_remaining?: number | null;
  is_full: boolean;
}

export function useProductPreOrder(productId: string | undefined, variantId?: string | null) {
  return useQuery({
    queryKey: ['product-pre-order', productId, variantId ?? null],
    queryFn: async (): Promise<ProductPreOrderInfo | null> => {
      if (!productId) return null;

      const { data, error } = await supabase.rpc('get_active_product_pre_order', {
        p_product_id: productId,
        p_variant_id: variantId ?? undefined,
      });

      if (error) throw error;
      return (data as ProductPreOrderInfo | null) ?? null;
    },
    enabled: !!productId,
  });
}

export function useRegisterProductPreOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ preOrderId, quantity = 1 }: { preOrderId: string; quantity?: number }) => {
      const { data, error } = await supabase.rpc('register_product_pre_order', {
        p_pre_order_id: preOrderId,
        p_quantity: quantity,
      });

      if (error) throw error;
      return data as {
        success: boolean;
        already_registered: boolean;
        registration_id: string;
        pre_order_id: string;
        quantity: number;
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-pre-order'] });
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });

      toast({
        title: data.already_registered ? 'Déjà inscrit' : 'Précommande enregistrée',
        description: data.already_registered
          ? 'Vous êtes déjà inscrit à cette précommande.'
          : `Votre demande (${variables.quantity ?? 1} unité(s)) a été enregistrée.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Précommande impossible',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
