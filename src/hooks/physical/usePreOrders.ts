import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PreOrder, PreOrderCustomer, PreOrderStatus } from '@/components/physical/PreOrderManager';

// ============================================================================
// FETCH PRE-ORDERS
// ============================================================================

export function usePreOrders(storeId: string, filters?: {
  product_id?: string;
  status?: PreOrderStatus;
  is_enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['pre-orders', storeId, filters],
    queryFn: async () => {
      let query = supabase
        .from('pre_orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.is_enabled !== undefined) {
        query = query.eq('is_enabled', filters.is_enabled);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as PreOrder[];
    },
    enabled: !!storeId,
  });
}

// ============================================================================
// GET SINGLE PRE-ORDER
// ============================================================================

export function usePreOrder(preOrderId: string) {
  return useQuery({
    queryKey: ['pre-order', preOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pre_orders')
        .select('*')
        .eq('id', preOrderId)
        .single();

      if (error) throw error;
      return data as PreOrder;
    },
    enabled: !!preOrderId,
  });
}

// ============================================================================
// GET PRE-ORDER CUSTOMERS
// ============================================================================

export function usePreOrderCustomers(preOrderId: string) {
  return useQuery({
    queryKey: ['pre-order-customers', preOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pre_order_customers')
        .select('*')
        .eq('pre_order_id', preOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as PreOrderCustomer[];
    },
    enabled: !!preOrderId,
  });
}

// ============================================================================
// CREATE PRE-ORDER
// ============================================================================

export function useCreatePreOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preOrder: Omit<PreOrder, 'id' | 'created_at' | 'updated_at' | 'current_pre_orders' | 'reserved_quantity' | 'notification_sent'>) => {
      const { data, error } = await supabase
        .from('pre_orders')
        .insert([
          {
            ...preOrder,
            current_pre_orders: 0,
            reserved_quantity: 0,
            notification_sent: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as PreOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });
    },
  });
}

// ============================================================================
// UPDATE PRE-ORDER
// ============================================================================

export function useUpdatePreOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      preOrderId,
      updates,
    }: {
      preOrderId: string;
      updates: Partial<PreOrder>;
    }) => {
      const { data, error } = await supabase
        .from('pre_orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preOrderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pre-order', variables.preOrderId] });
    },
  });
}

// ============================================================================
// UPDATE PRE-ORDER STATUS
// ============================================================================

export function useUpdatePreOrderStatus() {
  const updatePreOrder = useUpdatePreOrder();

  return useMutation({
    mutationFn: async ({
      preOrderId,
      status,
      notes,
    }: {
      preOrderId: string;
      status: PreOrderStatus;
      notes?: string;
    }) => {
      const updates: Partial<PreOrder> = { status };
      if (notes) updates.notes = notes;

      // If marking as fulfilled, disable pre-order
      if (status === 'fulfilled' || status === 'cancelled') {
        updates.is_enabled = false;
      }

      return updatePreOrder.mutateAsync({ preOrderId, updates });
    },
  });
}

// ============================================================================
// ADD CUSTOMER TO PRE-ORDER
// ============================================================================

export function useAddCustomerToPreOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      preOrderId,
      customer,
    }: {
      preOrderId: string;
      customer: Omit<PreOrderCustomer, 'id' | 'created_at' | 'pre_order_id'>;
    }) => {
      // Insert customer
      const { data: customerData, error: customerError } = await supabase
        .from('pre_order_customers')
        .insert([
          {
            ...customer,
            pre_order_id: preOrderId,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (customerError) throw customerError;

      // Update pre-order counts
      const { data: preOrder, error: preOrderError } = await supabase
        .from('pre_orders')
        .select('*')
        .eq('id', preOrderId)
        .single();

      if (preOrderError) throw preOrderError;

      const newCurrentPreOrders = (preOrder.current_pre_orders || 0) + 1;
      const newReservedQuantity = (preOrder.reserved_quantity || 0) + customer.quantity;

      await supabase
        .from('pre_orders')
        .update({
          current_pre_orders: newCurrentPreOrders,
          reserved_quantity: newReservedQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preOrderId);

      return customerData as PreOrderCustomer;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pre-order', variables.preOrderId] });
      queryClient.invalidateQueries({ queryKey: ['pre-order-customers', variables.preOrderId] });
    },
  });
}

// ============================================================================
// REMOVE CUSTOMER FROM PRE-ORDER
// ============================================================================

export function useRemoveCustomerFromPreOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      preOrderId,
      customerId,
      quantity,
    }: {
      preOrderId: string;
      customerId: string;
      quantity: number;
    }) => {
      // Delete customer
      const { error: deleteError } = await supabase
        .from('pre_order_customers')
        .delete()
        .eq('id', customerId);

      if (deleteError) throw deleteError;

      // Update pre-order counts
      const { data: preOrder, error: preOrderError } = await supabase
        .from('pre_orders')
        .select('*')
        .eq('id', preOrderId)
        .single();

      if (preOrderError) throw preOrderError;

      const newCurrentPreOrders = Math.max((preOrder.current_pre_orders || 0) - 1, 0);
      const newReservedQuantity = Math.max((preOrder.reserved_quantity || 0) - quantity, 0);

      await supabase
        .from('pre_orders')
        .update({
          current_pre_orders: newCurrentPreOrders,
          reserved_quantity: newReservedQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preOrderId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pre-order', variables.preOrderId] });
      queryClient.invalidateQueries({ queryKey: ['pre-order-customers', variables.preOrderId] });
    },
  });
}

// ============================================================================
// NOTIFY CUSTOMERS
// ============================================================================

export function useNotifyPreOrderCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      preOrderId,
      message,
    }: {
      preOrderId: string;
      message?: string;
    }) => {
      // Get all customers
      const { data: customers, error: customersError } = await supabase
        .from('pre_order_customers')
        .select('*')
        .eq('pre_order_id', preOrderId)
        .eq('notified', false);

      if (customersError) throw customersError;

      // TODO: Send actual emails/notifications
      // For now, just mark as notified

      const { error: updateError } = await supabase
        .from('pre_order_customers')
        .update({
          notified: true,
        })
        .eq('pre_order_id', preOrderId)
        .eq('notified', false);

      if (updateError) throw updateError;

      // Mark pre-order as notification_sent
      await supabase
        .from('pre_orders')
        .update({
          notification_sent: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preOrderId);

      return customers;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pre-order', variables.preOrderId] });
      queryClient.invalidateQueries({ queryKey: ['pre-order-customers', variables.preOrderId] });
    },
  });
}

// ============================================================================
// MARK STOCK AS ARRIVED
// ============================================================================

export function useMarkPreOrderStockArrived() {
  const updateStatus = useUpdatePreOrderStatus();
  const notify = useNotifyPreOrderCustomers();

  return useMutation({
    mutationFn: async ({
      preOrderId,
      autoNotify = true,
    }: {
      preOrderId: string;
      autoNotify?: boolean;
    }) => {
      // Update status to arrived
      await updateStatus.mutateAsync({
        preOrderId,
        status: 'arrived',
        notes: `Stock reçu le ${new Date().toLocaleDateString('fr-FR')}`,
      });

      // Auto-notify customers if enabled
      if (autoNotify) {
        await notify.mutateAsync({ preOrderId });
      }
    },
  });
}

// ============================================================================
// DELETE PRE-ORDER
// ============================================================================

export function useDeletePreOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preOrderId: string) => {
      // First delete all customers
      await supabase.from('pre_order_customers').delete().eq('pre_order_id', preOrderId);

      // Then delete pre-order
      const { error } = await supabase.from('pre_orders').delete().eq('id', preOrderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] });
    },
  });
}

// ============================================================================
// CHECK IF PRODUCT HAS ACTIVE PRE-ORDER
// ============================================================================

export function useProductHasActivePreOrder(productId: string) {
  return useQuery({
    queryKey: ['product-pre-order-check', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pre_orders')
        .select('id, status, is_enabled')
        .eq('product_id', productId)
        .eq('is_enabled', true)
        .in('status', ['active', 'pending_arrival']);

      if (error) throw error;

      return {
        hasActivePreOrder: (data || []).length > 0,
        preOrderId: data?.[0]?.id,
      };
    },
    enabled: !!productId,
  });
}

