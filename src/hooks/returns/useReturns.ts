/**
 * Hook useReturns - Gestion des retours
 * Date: 26 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface ProductReturn {
  id: string;
  order_id: string;
  order_item_id?: string;
  product_id: string;
  customer_id: string;
  store_id: string;
  return_number: string;
  return_reason: string;
  return_reason_details?: string;
  status: string;
  quantity: number;
  item_price: number;
  total_amount: number;
  refund_amount?: number;
  refund_type?: string;
  refund_method?: string;
  refund_status?: string;
  refunded_at?: string;
  requested_at: string;
  approved_at?: string;
  rejected_at?: string;
  received_at?: string;
  customer_photos?: string[];
  customer_notes?: string;
  store_notes?: string;
  return_tracking_number?: string;
  created_at: string;
  updated_at: string;
}

const RETURNS_QUERY_KEY = ['product-returns'];

/**
 * Récupérer tous les retours d'un client
 */
export function useCustomerReturns(customerId?: string) {
  return useQuery({
    queryKey: [...RETURNS_QUERY_KEY, 'customer', customerId],
    queryFn: async (): Promise<ProductReturn[]> => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from('product_returns')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching customer returns:', error);
        throw error;
      }

      return (data as ProductReturn[]) || [];
    },
    enabled: !!customerId,
  });
}

/**
 * Récupérer tous les retours d'une boutique
 */
export function useStoreReturns(storeId?: string) {
  return useQuery({
    queryKey: [...RETURNS_QUERY_KEY, 'store', storeId],
    queryFn: async (): Promise<ProductReturn[]> => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('product_returns')
        .select(`
          *,
          orders (
            order_number,
            customer_id
          ),
          products (
            id,
            name,
            image_url
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching store returns:', error);
        throw error;
      }

      return (data as ProductReturn[]) || [];
    },
    enabled: !!storeId,
  });
}

/**
 * Récupérer un retour spécifique
 */
export function useReturn(returnId: string) {
  return useQuery({
    queryKey: [...RETURNS_QUERY_KEY, returnId],
    queryFn: async (): Promise<ProductReturn | null> => {
      const { data, error } = await supabase
        .from('product_returns')
        .select(`
          *,
          orders (
            order_number,
            customer_id
          ),
          products (
            id,
            name,
            image_url
          )
        `)
        .eq('id', returnId)
        .single();

      if (error) {
        logger.error('Error fetching return:', error);
        throw error;
      }

      return data as ProductReturn;
    },
    enabled: !!returnId,
  });
}

/**
 * Créer une demande de retour
 */
export function useCreateReturn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (returnData: {
      order_id: string;
      order_item_id?: string;
      product_id: string;
      customer_id: string;
      return_reason: string;
      return_reason_details?: string;
      quantity: number;
      item_price: number;
      total_amount: number;
      customer_notes?: string;
      customer_photos?: string[];
    }): Promise<ProductReturn> => {
      // Récupérer le store_id depuis la commande
      const { data: order } = await supabase
        .from('orders')
        .select('store_id')
        .eq('id', returnData.order_id)
        .single();

      if (!order) {
        throw new Error('Commande non trouvée');
      }

      const { data, error } = await supabase
        .from('product_returns')
        .insert({
          order_id: returnData.order_id,
          order_item_id: returnData.order_item_id,
          product_id: returnData.product_id,
          customer_id: returnData.customer_id,
          store_id: order.store_id,
          return_reason: returnData.return_reason,
          return_reason_details: returnData.return_reason_details,
          quantity: returnData.quantity,
          item_price: returnData.item_price,
          total_amount: returnData.total_amount,
          customer_notes: returnData.customer_notes,
          customer_photos: returnData.customer_photos,
          status: 'requested',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating return:', error);
        throw error;
      }

      // Déclencher webhook return.created (asynchrone, ne bloque pas)
      import('@/lib/webhooks').then(({ triggerReturnCreatedWebhook }) => {
        triggerReturnCreatedWebhook(
          data.id,
          {
            order_item_id: data.order_item_id || '',
            customer_id: data.customer_id,
            store_id: data.store_id,
            return_number: data.return_number || '',
            return_reason: data.return_reason,
            status: data.status,
            refund_amount: data.refund_amount || 0,
            created_at: data.created_at,
          }
        ).catch(console.error);
      });

      return data as ProductReturn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURNS_QUERY_KEY });
      toast({
        title: '✅ Demande créée',
        description: 'Votre demande de retour a été soumise avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error creating return:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la demande de retour',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour le statut d'un retour (par le vendeur)
 */
export function useUpdateReturnStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnId,
      status,
      notes,
    }: {
      returnId: string;
      status: string;
      notes?: string;
    }): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Non authentifié');
      }

      // Utiliser la fonction RPC pour mettre à jour le statut
      const { error } = await supabase.rpc('update_return_status', {
        p_return_id: returnId,
        p_new_status: status,
        p_performed_by: user.id,
        p_notes: notes || null,
      });

      if (error) {
        logger.error('Error updating return status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURNS_QUERY_KEY });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut du retour a été mis à jour',
      });
    },
    onError: (error: any) => {
      logger.error('Error updating return status:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Traiter un remboursement
 */
export function useProcessRefund() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnId,
      refundAmount,
      refundMethod,
      refundTransactionId,
    }: {
      returnId: string;
      refundAmount: number;
      refundMethod: string;
      refundTransactionId?: string;
    }): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Non authentifié');
      }

      const { error } = await supabase.rpc('process_refund', {
        p_return_id: returnId,
        p_refund_amount: refundAmount,
        p_refund_method: refundMethod,
        p_performed_by: user.id,
        p_refund_transaction_id: refundTransactionId || null,
      });

      if (error) {
        logger.error('Error processing refund:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURNS_QUERY_KEY });
      toast({
        title: '✅ Remboursement traité',
        description: 'Le remboursement a été traité avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error processing refund:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de traiter le remboursement',
        variant: 'destructive',
      });
    },
  });
}

