/**
 * Physical Product Returns Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les retours de produits physiques (RMA)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

// =====================================================
// TYPES
// =====================================================

export interface ProductReturn {
  id: string;
  store_id: string;
  order_id: string;
  order_item_id: string;
  user_id: string;
  return_number: string;
  status: 'pending' | 'approved' | 'rejected' | 'return_shipped' | 'return_received' | 'inspecting' | 'refund_processing' | 'refunded' | 'store_credit_issued' | 'exchange_processing' | 'exchanged' | 'cancelled';
  return_reason: 'defective' | 'wrong_item' | 'not_as_described' | 'damaged' | 'size_issue' | 'color_issue' | 'changed_mind' | 'late_delivery' | 'other';
  return_reason_details?: string;
  product_id?: string;
  variant_id?: string;
  quantity: number;
  return_window_days: number;
  return_deadline_date?: string;
  is_within_window: boolean;
  refund_method: 'original_payment' | 'store_credit' | 'exchange';
  original_amount: number;
  refund_amount?: number;
  restocking_fee: number;
  return_shipping_cost: number;
  photos: string[];
  return_address?: Record<string, any>;
  return_tracking_number?: string;
  return_carrier?: string;
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  return_shipped_at?: string;
  return_received_at?: string;
  inspected_at?: string;
  refund_processed_at?: string;
  customer_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    order_number: string;
    delivered_at?: string;
  };
  product?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

export interface ReturnPolicy {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  return_window_days: number;
  requires_receipt: boolean;
  requires_photos: boolean;
  requires_original_packaging: boolean;
  requires_tags: boolean;
  accepted_conditions: string[];
  restocking_fee_percentage: number;
  restocking_fee_fixed: number;
  return_shipping_paid_by: 'customer' | 'store';
  accepted_reasons: string[];
  allowed_refund_methods: string[];
  excluded_product_ids: string[];
  excluded_category_ids: string[];
  applies_to_all_products: boolean;
  specific_product_ids: string[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReturnRefund {
  id: string;
  return_id: string;
  refund_type: 'full' | 'partial' | 'store_credit';
  refund_amount: number;
  currency: string;
  refund_method: 'original_payment' | 'store_credit' | 'bank_transfer' | 'check';
  original_payment_id?: string;
  refund_transaction_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  processed_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReturnData {
  order_id: string;
  order_item_id: string;
  return_reason: ProductReturn['return_reason'];
  return_reason_details?: string;
  quantity: number;
  refund_method?: ProductReturn['refund_method'];
  photos?: string[];
  customer_notes?: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useReturns - Récupère les retours d'un utilisateur
 */
export const useReturns = (userId?: string) => {
  return useQuery({
    queryKey: ['returns', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID manquant');

      const { data, error } = await supabase
        .from('product_returns')
        .select(`
          *,
          order:orders (
            id,
            order_number,
            delivered_at
          ),
          product:products (
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) {
        logger.error('Error fetching returns', { error, userId });
        throw error;
      }

      return (data || []) as ProductReturn[];
    },
    enabled: !!userId,
  });
};

/**
 * useStoreReturns - Récupère les retours d'un store (admin)
 */
export const useStoreReturns = (storeId?: string, filters?: {
  status?: ProductReturn['status'];
  dateFrom?: string;
  dateTo?: string;
}) => {
  return useQuery({
    queryKey: ['store-returns', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('product_returns')
        .select(`
          *,
          order:orders (
            id,
            order_number,
            delivered_at
          ),
          product:products (
            id,
            name,
            image_url
          )
        `)
        .eq('store_id', storeId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('requested_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('requested_at', filters.dateTo);
      }

      query = query.order('requested_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching store returns', { error, storeId });
        throw error;
      }

      return (data || []) as ProductReturn[];
    },
    enabled: !!storeId,
  });
};

/**
 * useReturn - Récupère un retour spécifique
 */
export const useReturn = (returnId: string | undefined) => {
  return useQuery({
    queryKey: ['return', returnId],
    queryFn: async () => {
      if (!returnId) throw new Error('Return ID manquant');

      const { data, error } = await supabase
        .from('product_returns')
        .select(`
          *,
          order:orders (
            id,
            order_number,
            delivered_at
          ),
          product:products (
            id,
            name,
            image_url
          )
        `)
        .eq('id', returnId)
        .single();

      if (error) {
        logger.error('Error fetching return', { error, returnId });
        throw error;
      }

      return data as ProductReturn;
    },
    enabled: !!returnId,
  });
};

/**
 * useReturnPolicies - Récupère les politiques de retour d'un store
 */
export const useReturnPolicies = (storeId?: string) => {
  return useQuery({
    queryKey: ['return-policies', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('return_policies')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching return policies', { error, storeId });
        throw error;
      }

      return (data || []) as ReturnPolicy[];
    },
    enabled: !!storeId,
  });
};

/**
 * useCheckReturnWindow - Vérifie si un retour est dans la fenêtre
 */
export const useCheckReturnWindow = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['return-window', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID manquant');

      const { data, error } = await supabase.rpc('check_return_window', {
        p_order_id: orderId,
      });

      if (error) {
        logger.error('Error checking return window', { error, orderId });
        throw error;
      }

      return data as boolean;
    },
    enabled: !!orderId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateReturn - Créer une demande de retour
 */
export const useCreateReturn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (returnData: CreateReturnData) => {
      // Récupérer les infos de la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('store_id, delivered_at')
        .eq('id', returnData.order_id)
        .single();

      if (orderError || !order) {
        throw new Error('Commande non trouvée');
      }

      // Calculer deadline
      const { data: deadline } = await supabase.rpc('calculate_return_deadline', {
        p_order_id: returnData.order_id,
        p_store_id: order.store_id,
      });

      // Générer numéro de retour
      const { data: returnNumber } = await supabase.rpc('generate_return_number');

      // Récupérer le montant de l'item
      const { data: orderItem } = await supabase
        .from('order_items')
        .select('price, quantity')
        .eq('id', returnData.order_item_id)
        .single();

      const { data, error } = await supabase
        .from('product_returns')
        .insert({
          store_id: order.store_id,
          order_id: returnData.order_id,
          order_item_id: returnData.order_item_id,
          user_id: user?.id || '',
          return_number: returnNumber,
          return_reason: returnData.return_reason,
          return_reason_details: returnData.return_reason_details,
          quantity: returnData.quantity,
          refund_method: returnData.refund_method || 'original_payment',
          original_amount: orderItem?.price || 0,
          photos: returnData.photos || [],
          customer_notes: returnData.customer_notes,
          return_deadline_date: deadline,
          return_window_days: 30, // Par défaut, sera ajusté par politique
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating return', { error, returnData });
        throw error;
      }

      return data as ProductReturn;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['store-returns'] });
      toast({
        title: '✅ Demande de retour créée',
        description: `Votre demande de retour ${data.return_number} a été créée avec succès`,
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateReturn', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la demande de retour',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useApproveReturn - Approuver un retour (admin)
 */
export const useApproveReturn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ returnId, adminNotes }: { returnId: string; adminNotes?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('product_returns')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.user.id,
          admin_notes: adminNotes,
        })
        .eq('id', returnId)
        .select()
        .single();

      if (error) {
        logger.error('Error approving return', { error, returnId });
        throw error;
      }

      return data as ProductReturn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['store-returns'] });
      toast({
        title: '✅ Retour approuvé',
        description: 'Le retour a été approuvé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useApproveReturn', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'approuver le retour',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useRejectReturn - Rejeter un retour (admin)
 */
export const useRejectReturn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ returnId, rejectionReason, adminNotes }: { returnId: string; rejectionReason: string; adminNotes?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('product_returns')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: user.user.id,
          rejection_reason: rejectionReason,
          admin_notes: adminNotes,
        })
        .eq('id', returnId)
        .select()
        .single();

      if (error) {
        logger.error('Error rejecting return', { error, returnId });
        throw error;
      }

      return data as ProductReturn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['store-returns'] });
      toast({
        title: '✅ Retour rejeté',
        description: 'Le retour a été rejeté',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useRejectReturn', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de rejeter le retour',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateReturnStatus - Mettre à jour le statut d'un retour
 */
export const useUpdateReturnStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      returnId,
      status,
      trackingNumber,
      carrier,
      adminNotes,
    }: {
      returnId: string;
      status: ProductReturn['status'];
      trackingNumber?: string;
      carrier?: string;
      adminNotes?: string;
    }) => {
      const updateData: any = {
        status,
        admin_notes: adminNotes,
      };

      if (status === 'return_received') {
        updateData.return_received_at = new Date().toISOString();
      }
      if (status === 'inspecting') {
        updateData.inspected_at = new Date().toISOString();
      }
      if (trackingNumber) {
        updateData.return_tracking_number = trackingNumber;
      }
      if (carrier) {
        updateData.return_carrier = carrier;
      }

      const { data, error } = await supabase
        .from('product_returns')
        .update(updateData)
        .eq('id', returnId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating return status', { error, returnId });
        throw error;
      }

      return data as ProductReturn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['store-returns'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut du retour a été mis à jour',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateReturnStatus', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });
};

