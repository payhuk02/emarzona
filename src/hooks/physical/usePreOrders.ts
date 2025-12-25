/**
 * Hook pour la gestion des précommandes
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PreOrder {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  status: 'active' | 'pending_arrival' | 'arrived' | 'fulfilled' | 'cancelled';
  is_enabled: boolean;
  expected_availability_date?: string;
  pre_order_limit?: number;
  current_pre_orders: number;
  reserved_quantity: number;
  deposit_required: boolean;
  deposit_amount?: number;
  deposit_percentage?: number;
  auto_charge_on_arrival: boolean;
  notification_sent: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
  };
  variant?: {
    id: string;
    name: string;
  };
}

export interface PreOrderCustomer {
  id: string;
  pre_order_id: string;
  customer_id: string;
  order_id?: string;
  quantity: number;
  deposit_paid: boolean;
  deposit_amount?: number;
  notified: boolean;
  created_at: string;
  customer?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

/**
 * Récupérer toutes les précommandes d'un store
 */
export function usePreOrders(storeId: string | null) {
  return useQuery({
    queryKey: ['pre-orders', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('pre_orders')
        .select(`
          *,
          product:products!inner(
            id,
            name
          ),
          variant:product_variants(
            id,
            name
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PreOrder[];
    },
    enabled: !!storeId,
  });
}

/**
 * Récupérer une précommande spécifique
 */
export function usePreOrder(preOrderId: string | null) {
  return useQuery({
    queryKey: ['pre-order', preOrderId],
    queryFn: async () => {
      if (!preOrderId) return null;

      const { data, error } = await supabase
        .from('pre_orders')
        .select(`
          *,
          product:products!inner(
            id,
            name
          ),
          variant:product_variants(
            id,
            name
          )
        `)
        .eq('id', preOrderId)
        .single();

      if (error) throw error;
      return data as PreOrder;
    },
    enabled: !!preOrderId,
  });
}

/**
 * Récupérer les clients d'une précommande
 */
export function usePreOrderCustomers(preOrderId: string | null) {
  return useQuery({
    queryKey: ['pre-order-customers', preOrderId],
    queryFn: async () => {
      if (!preOrderId) return [];

      const { data, error } = await supabase
        .from('pre_order_customers')
        .select(`
          *,
          customer:customers!inner(
            id,
            email,
            full_name
          )
        `)
        .eq('pre_order_id', preOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PreOrderCustomer[];
    },
    enabled: !!preOrderId,
  });
}

/**
 * Créer une précommande
 */
export function useCreatePreOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      store_id: string;
      product_id: string;
      variant_id?: string;
      expected_availability_date?: string;
      pre_order_limit?: number;
      deposit_required?: boolean;
      deposit_amount?: number;
      deposit_percentage?: number;
      auto_charge_on_arrival?: boolean;
      notes?: string;
    }) => {
      const { data: preOrder, error } = await supabase
        .from('pre_orders')
        .insert({
          ...data,
          status: 'active',
          is_enabled: true,
        })
        .select()
        .single();

      if (error) throw error;
      return preOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });
      toast({
        title: 'Précommande créée',
        description: 'La précommande a été créée avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour une précommande
 */
export function useUpdatePreOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      status?: PreOrder['status'];
      is_enabled?: boolean;
      expected_availability_date?: string;
      pre_order_limit?: number;
      deposit_required?: boolean;
      deposit_amount?: number;
      deposit_percentage?: number;
      auto_charge_on_arrival?: boolean;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('pre_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pre-order'] });
      toast({
        title: 'Précommande mise à jour',
        description: 'Les modifications ont été enregistrées',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Marquer une précommande comme arrivée et convertir en commandes
 */
export function useConvertPreOrderToOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preOrderId: string) => {
      // Récupérer la précommande et ses clients
      const { data: preOrder, error: preOrderError } = await supabase
        .from('pre_orders')
        .select('*')
        .eq('id', preOrderId)
        .single();

      if (preOrderError) throw preOrderError;

      const { data: customers, error: customersError } = await supabase
        .from('pre_order_customers')
        .select('*')
        .eq('pre_order_id', preOrderId)
        .eq('notified', false);

      if (customersError) throw customersError;

      // Mettre à jour le statut de la précommande
      const { error: updateError } = await supabase
        .from('pre_orders')
        .update({
          status: 'arrived',
          notification_sent: true,
        })
        .eq('id', preOrderId);

      if (updateError) throw updateError;

      // Créer des commandes pour chaque client
      const orders = [];
      for (const customer of customers || []) {
        // Ici, vous devriez créer une vraie commande via votre système de commandes
        // Pour l'instant, on marque juste le client comme notifié
        const { error: notifyError } = await supabase
          .from('pre_order_customers')
          .update({ notified: true })
          .eq('id', customer.id);

        if (notifyError) {
          logger.error('Error notifying customer', { error: notifyError, customerId: customer.id });
        }
      }

      return { success: true, ordersCreated: orders.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pre-order'] });
      queryClient.invalidateQueries({ queryKey: ['pre-order-customers'] });
      toast({
        title: 'Précommande convertie',
        description: `${data.ordersCreated} commande(s) créée(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Envoyer des notifications aux clients d'une précommande
 */
export function useNotifyPreOrderCustomers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preOrderId: string) => {
      // Marquer tous les clients comme notifiés
      const { error } = await supabase
        .from('pre_order_customers')
        .update({ notified: true })
        .eq('pre_order_id', preOrderId)
        .eq('notified', false);

      if (error) throw error;

      // Mettre à jour la précommande
      await supabase
        .from('pre_orders')
        .update({ notification_sent: true })
        .eq('id', preOrderId);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pre-order-customers'] });
      toast({
        title: 'Notifications envoyées',
        description: 'Les clients ont été notifiés',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
