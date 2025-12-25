/**
 * Hooks React Query pour gestion des lots et dates d'expiration
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface ProductLot {
  id: string;
  physical_product_id: string;
  variant_id?: string;
  warehouse_id?: string;
  lot_number: string;
  batch_number?: string;
  serial_number?: string;
  manufacturing_date?: string;
  expiration_date?: string;
  best_before_date?: string;
  received_date: string;
  initial_quantity: number;
  current_quantity: number;
  reserved_quantity: number;
  unit_cost?: number;
  total_cost: number;
  status: 'active' | 'expired' | 'expiring_soon' | 'depleted' | 'damaged' | 'quarantined';
  rotation_method: 'FIFO' | 'LIFO' | 'FEFO' | 'manual';
  quality_status: 'good' | 'acceptable' | 'poor' | 'rejected';
  inspection_date?: string;
  inspection_notes?: string;
  inspector_id?: string;
  bin_location?: string;
  shelf_location?: string;
  supplier_batch_number?: string;
  certificate_of_analysis?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LotMovement {
  id: string;
  lot_id: string;
  movement_type: 'received' | 'sold' | 'transferred' | 'adjusted' | 'expired' | 'damaged' | 'returned' | 'destroyed';
  quantity: number;
  order_id?: string;
  order_item_id?: string;
  transfer_id?: string;
  user_id?: string;
  reason?: string;
  notes?: string;
  movement_date: string;
  created_at: string;
}

export interface ExpirationAlert {
  id: string;
  lot_id: string;
  alert_type: 'expiring_soon' | 'expired' | 'expiring_today';
  days_until_expiration?: number;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  resolution_action?: 'sold' | 'discounted' | 'returned' | 'destroyed' | 'transferred' | 'other';
  resolution_notes?: string;
  notification_sent: boolean;
  notification_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LotTransfer {
  id: string;
  lot_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled' | 'failed';
  transfer_date?: string;
  expected_arrival_date?: string;
  actual_arrival_date?: string;
  initiated_by?: string;
  received_by?: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS: Product Lots
// =====================================================

/**
 * Get lots for a product
 */
export const useProductLots = (
  physicalProductId: string,
  options?: {
    variantId?: string;
    warehouseId?: string;
    status?: ProductLot['status'];
    includeExpired?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['product-lots', physicalProductId, options],
    queryFn: async () => {
      let query = supabase
        .from('product_lots')
        .select('*')
        .eq('physical_product_id', physicalProductId)
        .order('expiration_date', { ascending: true, nullsLast: true });

      if (options?.variantId) {
        query = query.eq('variant_id', options.variantId);
      }
      if (options?.warehouseId) {
        query = query.eq('warehouse_id', options.warehouseId);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (!options?.includeExpired) {
        query = query.neq('status', 'expired');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProductLot[];
    },
    enabled: !!physicalProductId,
  });
};

/**
 * Get lot by ID
 */
export const useLot = (lotId: string) => {
  return useQuery({
    queryKey: ['lot', lotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_lots')
        .select('*')
        .eq('id', lotId)
        .single();

      if (error) throw error;
      return data as ProductLot;
    },
    enabled: !!lotId,
  });
};

/**
 * Create a new lot
 */
export const useCreateLot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lot: Omit<ProductLot, 'id' | 'created_at' | 'updated_at' | 'total_cost'>) => {
      const { data, error } = await supabase
        .from('product_lots')
        .insert(lot)
        .select()
        .single();

      if (error) throw error;
      return data as ProductLot;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['product-lots', data.physical_product_id],
      });
    },
  });
};

/**
 * Update a lot
 */
export const useUpdateLot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lotId,
      updates,
    }: {
      lotId: string;
      updates: Partial<ProductLot>;
    }) => {
      const { data, error } = await supabase
        .from('product_lots')
        .update(updates)
        .eq('id', lotId)
        .select()
        .single();

      if (error) throw error;
      return data as ProductLot;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lot', data.id] });
      queryClient.invalidateQueries({
        queryKey: ['product-lots', data.physical_product_id],
      });
    },
  });
};

/**
 * Delete a lot
 */
export const useDeleteLot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lotId: string) => {
      const { error } = await supabase
        .from('product_lots')
        .delete()
        .eq('id', lotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lots'] });
    },
  });
};

// =====================================================
// HOOKS: Lot Movements
// =====================================================

/**
 * Get movements for a lot
 */
export const useLotMovements = (lotId: string) => {
  return useQuery({
    queryKey: ['lot-movements', lotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lot_movements')
        .select('*')
        .eq('lot_id', lotId)
        .order('movement_date', { ascending: false });

      if (error) throw error;
      return data as LotMovement[];
    },
    enabled: !!lotId,
  });
};

/**
 * Create a lot movement
 */
export const useCreateLotMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: Omit<LotMovement, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('lot_movements')
        .insert(movement)
        .select()
        .single();

      if (error) throw error;
      return data as LotMovement;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lot-movements', data.lot_id] });
      queryClient.invalidateQueries({ queryKey: ['lot', data.lot_id] });
    },
  });
};

// =====================================================
// HOOKS: Expiration Alerts
// =====================================================

/**
 * Get expiration alerts
 */
export const useExpirationAlerts = (options?: {
  storeId?: string;
  resolved?: boolean;
  alertType?: ExpirationAlert['alert_type'];
}) => {
  return useQuery({
    queryKey: ['expiration-alerts', options],
    queryFn: async () => {
      let query = supabase
        .from('expiration_alerts')
        .select('*, lot:product_lots(*)')
        .order('created_at', { ascending: false });

      if (options?.resolved !== undefined) {
        query = query.eq('is_resolved', options.resolved);
      }
      if (options?.alertType) {
        query = query.eq('alert_type', options.alertType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (ExpirationAlert & { lot: ProductLot })[];
    },
  });
};

/**
 * Resolve an expiration alert
 */
export const useResolveExpirationAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      alertId,
      resolutionAction,
      resolutionNotes,
    }: {
      alertId: string;
      resolutionAction: ExpirationAlert['resolution_action'];
      resolutionNotes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('expiration_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_action: resolutionAction,
          resolution_notes: resolutionNotes,
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data as ExpirationAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiration-alerts'] });
    },
  });
};

// =====================================================
// HOOKS: Lot Transfers
// =====================================================

/**
 * Get lot transfers
 */
export const useLotTransfers = (lotId?: string) => {
  return useQuery({
    queryKey: ['lot-transfers', lotId],
    queryFn: async () => {
      let query = supabase
        .from('lot_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (lotId) {
        query = query.eq('lot_id', lotId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LotTransfer[];
    },
  });
};

/**
 * Create a lot transfer
 */
export const useCreateLotTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transfer: Omit<LotTransfer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('lot_transfers')
        .insert({
          ...transfer,
          initiated_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LotTransfer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lot-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['lot', data.lot_id] });
    },
  });
};

/**
 * Update lot transfer status
 */
export const useUpdateLotTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transferId,
      status,
      actualArrivalDate,
    }: {
      transferId: string;
      status: LotTransfer['status'];
      actualArrivalDate?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const updates: any = {
        status,
      };

      if (status === 'received' && actualArrivalDate) {
        updates.actual_arrival_date = actualArrivalDate;
        updates.received_by = user?.id;
      }

      const { data, error } = await supabase
        .from('lot_transfers')
        .update(updates)
        .eq('id', transferId)
        .select()
        .single();

      if (error) throw error;
      return data as LotTransfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lot-transfers'] });
    },
  });
};

// =====================================================
// HOOKS: Utility Functions
// =====================================================

/**
 * Get next lot for sale (FIFO/LIFO/FEFO)
 */
export const useGetNextLotForSale = (
  physicalProductId: string,
  quantity: number,
  options?: {
    variantId?: string;
    warehouseId?: string;
    rotationMethod?: 'FIFO' | 'LIFO' | 'FEFO';
  }
) => {
  return useQuery({
    queryKey: ['next-lot-for-sale', physicalProductId, quantity, options],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_next_lot_for_sale', {
        p_physical_product_id: physicalProductId,
        p_quantity: quantity,
        p_variant_id: options?.variantId || null,
        p_warehouse_id: options?.warehouseId || null,
        p_rotation_method: options?.rotationMethod || 'FIFO',
      });

      if (error) throw error;
      return data as Array<{
        lot_id: string;
        lot_number: string;
        available_quantity: number;
        expiration_date?: string;
        days_until_expiration?: number;
      }>;
    },
    enabled: !!physicalProductId && quantity > 0,
  });
};

/**
 * Allocate lot for order
 */
export const useAllocateLotForOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderItemId,
      quantity,
      rotationMethod = 'FIFO',
    }: {
      orderItemId: string;
      quantity: number;
      rotationMethod?: 'FIFO' | 'LIFO' | 'FEFO';
    }) => {
      const { data, error } = await supabase.rpc('allocate_lot_for_order', {
        p_order_item_id: orderItemId,
        p_quantity: quantity,
        p_rotation_method: rotationMethod,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lots'] });
      queryClient.invalidateQueries({ queryKey: ['lot-movements'] });
    },
  });
};

