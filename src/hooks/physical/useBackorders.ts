/**
 * Hook pour la gestion des backorders
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type BackorderStatus = 'pending' | 'ordered' | 'in_transit' | 'partially_received' | 'received' | 'fulfilled';
export type BackorderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Backorder {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  status: BackorderStatus;
  priority: BackorderPriority;
  is_enabled: boolean;
  customer_demand: number;
  ordered_quantity: number;
  received_quantity: number;
  pending_quantity: number;
  first_request_date: string;
  expected_restock_date?: string;
  supplier_order_date?: string;
  last_received_date?: string;
  supplier_id?: string;
  supplier_name?: string;
  purchase_order_id?: string;
  total_customers: number;
  notified_customers: number;
  auto_fulfill_on_arrival: boolean;
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

export interface BackorderCustomer {
  id: string;
  backorder_id: string;
  customer_id: string;
  order_id: string;
  quantity_requested: number;
  quantity_fulfilled: number;
  is_notified: boolean;
  is_fulfilled: boolean;
  requested_at: string;
  fulfilled_at?: string;
  customer?: {
    id: string;
    email: string;
    full_name?: string;
  };
  order?: {
    id: string;
    order_number?: string;
  };
}

/**
 * Récupérer tous les backorders d'un store
 */
export function useBackorders(storeId: string | null, filters?: {
  status?: BackorderStatus;
  priority?: BackorderPriority;
}) {
  return useQuery({
    queryKey: ['backorders', storeId, filters],
    queryFn: async () => {
      if (!storeId) return [];

      let query = supabase
        .from('backorders')
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

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Backorder[];
    },
    enabled: !!storeId,
  });
}

/**
 * Récupérer un backorder spécifique
 */
export function useBackorder(backorderId: string | null) {
  return useQuery({
    queryKey: ['backorder', backorderId],
    queryFn: async () => {
      if (!backorderId) return null;

      const { data, error } = await supabase
        .from('backorders')
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
        .eq('id', backorderId)
        .single();

      if (error) throw error;
      return data as Backorder;
    },
    enabled: !!backorderId,
  });
}

/**
 * Récupérer les clients d'un backorder
 */
export function useBackorderCustomers(backorderId: string | null) {
  return useQuery({
    queryKey: ['backorder-customers', backorderId],
    queryFn: async () => {
      if (!backorderId) return [];

      const { data, error } = await supabase
        .from('backorder_customers')
        .select(`
          *,
          customer:customers!inner(
            id,
            email,
            full_name
          ),
          order:orders!inner(
            id,
            order_number
          )
        `)
        .eq('backorder_id', backorderId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as BackorderCustomer[];
    },
    enabled: !!backorderId,
  });
}

/**
 * Créer un backorder
 */
export function useCreateBackorder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      store_id: string;
      product_id: string;
      variant_id?: string;
      priority?: BackorderPriority;
      expected_restock_date?: string;
      supplier_id?: string;
      supplier_name?: string;
      auto_fulfill_on_arrival?: boolean;
      notes?: string;
    }) => {
      const { data: backorder, error } = await supabase
        .from('backorders')
        .insert({
          ...data,
          status: 'pending',
          priority: data.priority || 'medium',
          is_enabled: true,
          customer_demand: 0,
          ordered_quantity: 0,
          received_quantity: 0,
          pending_quantity: 0,
          total_customers: 0,
          notified_customers: 0,
          auto_fulfill_on_arrival: data.auto_fulfill_on_arrival ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return backorder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backorders'] });
      toast({
        title: 'Backorder créé',
        description: 'Le backorder a été créé avec succès',
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
 * Mettre à jour un backorder
 */
export function useUpdateBackorder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      status?: BackorderStatus;
      priority?: BackorderPriority;
      is_enabled?: boolean;
      expected_restock_date?: string;
      supplier_order_date?: string;
      supplier_id?: string;
      supplier_name?: string;
      purchase_order_id?: string;
      auto_fulfill_on_arrival?: boolean;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('backorders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backorders'] });
      queryClient.invalidateQueries({ queryKey: ['backorder'] });
      toast({
        title: 'Backorder mis à jour',
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
 * Enregistrer une réception de stock (partielle ou complète)
 */
export function useReceiveBackorderStock() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      backorderId,
      quantity,
      updateInventory = true,
    }: {
      backorderId: string;
      quantity: number;
      updateInventory?: boolean;
    }) => {
      // Récupérer le backorder
      const { data: backorder, error: fetchError } = await supabase
        .from('backorders')
        .select('*')
        .eq('id', backorderId)
        .single();

      if (fetchError) throw fetchError;

      const newReceivedQuantity = (backorder.received_quantity || 0) + quantity;
      const newPendingQuantity = Math.max(0, backorder.pending_quantity - quantity);

      // Déterminer le nouveau statut
      let newStatus: BackorderStatus = backorder.status;
      if (newReceivedQuantity >= backorder.ordered_quantity) {
        newStatus = 'received';
      } else if (newReceivedQuantity > 0) {
        newStatus = 'partially_received';
      }

      // Mettre à jour le backorder
      const { data, error } = await supabase
        .from('backorders')
        .update({
          received_quantity: newReceivedQuantity,
          pending_quantity: newPendingQuantity,
          status: newStatus,
          last_received_date: new Date().toISOString(),
        })
        .eq('id', backorderId)
        .select()
        .single();

      if (error) throw error;

      // Si auto_fulfill_on_arrival est activé et que le stock est reçu, remplir les commandes
      if (backorder.auto_fulfill_on_arrival && newStatus === 'received') {
        // Logique de fulfillment automatique (à implémenter selon votre système de commandes)
        // Pour l'instant, on marque juste comme fulfilled
        await supabase
          .from('backorders')
          .update({ status: 'fulfilled' })
          .eq('id', backorderId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backorders'] });
      queryClient.invalidateQueries({ queryKey: ['backorder'] });
      toast({
        title: 'Stock reçu',
        description: 'Le stock a été enregistré avec succès',
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
 * Notifier les clients d'un backorder
 */
export function useNotifyBackorderCustomers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backorderId: string) => {
      // Marquer tous les clients comme notifiés
      const { error } = await supabase
        .from('backorder_customers')
        .update({ is_notified: true })
        .eq('backorder_id', backorderId)
        .eq('is_notified', false);

      if (error) throw error;

      // Compter les clients notifiés
      const { count } = await supabase
        .from('backorder_customers')
        .select('*', { count: 'exact', head: true })
        .eq('backorder_id', backorderId)
        .eq('is_notified', true);

      // Mettre à jour le backorder
      await supabase
        .from('backorders')
        .update({ notified_customers: count || 0 })
        .eq('id', backorderId);

      return { success: true, notified: count || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['backorders'] });
      queryClient.invalidateQueries({ queryKey: ['backorder-customers'] });
      toast({
        title: 'Notifications envoyées',
        description: `${data.notified} client(s) notifié(s)`,
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
 * Marquer un backorder comme commandé au fournisseur
 */
export function useMarkBackorderOrdered() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      backorderId,
      orderedQuantity,
      supplierOrderDate,
      purchaseOrderId,
      supplierId,
      supplierName,
    }: {
      backorderId: string;
      orderedQuantity: number;
      supplierOrderDate?: string;
      purchaseOrderId?: string;
      supplierId?: string;
      supplierName?: string;
    }) => {
      // Récupérer le backorder pour calculer pending_quantity
      const { data: backorder, error: fetchError } = await supabase
        .from('backorders')
        .select('customer_demand, received_quantity')
        .eq('id', backorderId)
        .single();

      if (fetchError) throw fetchError;

      const pendingQuantity = Math.max(0, backorder.customer_demand - (backorder.received_quantity || 0));

      const { data, error } = await supabase
        .from('backorders')
        .update({
          status: 'ordered',
          ordered_quantity: orderedQuantity,
          pending_quantity: pendingQuantity,
          supplier_order_date: supplierOrderDate || new Date().toISOString(),
          purchase_order_id: purchaseOrderId,
          supplier_id: supplierId,
          supplier_name: supplierName,
        })
        .eq('id', backorderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backorders'] });
      queryClient.invalidateQueries({ queryKey: ['backorder'] });
      toast({
        title: 'Backorder marqué comme commandé',
        description: 'Le statut a été mis à jour',
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

