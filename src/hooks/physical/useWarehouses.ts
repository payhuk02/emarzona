/**
 * Warehouses Management Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les entrepôts, localisations, inventaire et transferts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface Warehouse {
  id: string;
  store_id: string;
  name: string;
  code: string;
  description?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  is_primary: boolean;
  is_fulfillment_center: boolean;
  is_receiving_center: boolean;
  max_capacity?: number;
  current_capacity: number;
  capacity_unit: string;
  operational_hours?: Record<string, any>;
  timezone: string;
  notes?: string;
  tags: string[];
  total_products: number;
  total_value: number;
  created_at: string;
  updated_at: string;
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  location_code: string;
  location_name?: string;
  location_type: 'zone' | 'aisle' | 'shelf' | 'bin' | 'rack' | 'pallet';
  parent_location_id?: string;
  max_capacity?: number;
  current_capacity: number;
  length?: number;
  width?: number;
  height?: number;
  dimensions_unit: string;
  is_active: boolean;
  is_reserved: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseInventory {
  id: string;
  warehouse_id: string;
  location_id?: string;
  product_id?: string;
  variant_id?: string;
  quantity_available: number;
  quantity_reserved: number;
  quantity_allocated: number;
  quantity_on_hand: number;
  average_cost?: number;
  total_value: number;
  reorder_point: number;
  reorder_quantity: number;
  last_movement_at?: string;
  last_counted_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseTransfer {
  id: string;
  store_id: string;
  transfer_number: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  status: 'pending' | 'approved' | 'in_transit' | 'received' | 'completed' | 'cancelled';
  requested_date: string;
  approved_date?: string;
  shipped_date?: string;
  expected_delivery_date?: string;
  received_date?: string;
  completed_date?: string;
  requested_by?: string;
  approved_by?: string;
  received_by?: string;
  shipping_method?: string;
  carrier_name?: string;
  tracking_number?: string;
  notes?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseAllocation {
  id: string;
  warehouse_id: string;
  order_id: string;
  order_item_id?: string;
  product_id: string;
  variant_id?: string;
  quantity_allocated: number;
  status: 'allocated' | 'picked' | 'packed' | 'shipped' | 'cancelled';
  location_id?: string;
  allocated_at: string;
  picked_at?: string;
  packed_at?: string;
  shipped_at?: string;
  allocated_by?: string;
  picked_by?: string;
  packed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useWarehouses - Récupère les entrepôts d'un store
 */
export const useWarehouses = (storeId?: string) => {
  return useQuery({
    queryKey: ['warehouses', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('store_id', storeId)
        .order('is_primary', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching warehouses', { error, storeId });
        throw error;
      }

      return (data || []) as Warehouse[];
    },
    enabled: !!storeId,
  });
};

/**
 * useWarehouseLocations - Récupère les localisations d'un entrepôt
 */
export const useWarehouseLocations = (warehouseId?: string) => {
  return useQuery({
    queryKey: ['warehouse-locations', warehouseId],
    queryFn: async () => {
      if (!warehouseId) throw new Error('Warehouse ID manquant');

      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .order('location_code', { ascending: true });

      if (error) {
        logger.error('Error fetching warehouse locations', { error, warehouseId });
        throw error;
      }

      return (data || []) as WarehouseLocation[];
    },
    enabled: !!warehouseId,
  });
};

/**
 * useWarehouseInventory - Récupère l'inventaire d'un entrepôt
 */
export const useWarehouseInventory = (warehouseId?: string, filters?: {
  productId?: string;
  variantId?: string;
  locationId?: string;
}) => {
  return useQuery({
    queryKey: ['warehouse-inventory', warehouseId, filters],
    queryFn: async () => {
      if (!warehouseId) throw new Error('Warehouse ID manquant');

      let query = supabase
        .from('warehouse_inventory')
        .select(`
          *,
          product:products (id, name, image_url),
          variant:product_variants (id, option1_value, option2_value),
          location:warehouse_locations (id, location_code, location_name)
        `)
        .eq('warehouse_id', warehouseId);

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.variantId) {
        query = query.eq('variant_id', filters.variantId);
      }
      if (filters?.locationId) {
        query = query.eq('location_id', filters.locationId);
      }

      query = query.order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching warehouse inventory', { error, warehouseId });
        throw error;
      }

      return (data || []) as WarehouseInventory[];
    },
    enabled: !!warehouseId,
  });
};

/**
 * useWarehouseTransfers - Récupère les transferts
 */
export const useWarehouseTransfers = (storeId?: string, filters?: {
  status?: WarehouseTransfer['status'];
  warehouseId?: string;
}) => {
  return useQuery({
    queryKey: ['warehouse-transfers', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('warehouse_transfers')
        .select(`
          *,
          from_warehouse:warehouses!from_warehouse_id (id, name, code),
          to_warehouse:warehouses!to_warehouse_id (id, name, code)
        `)
        .eq('store_id', storeId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.warehouseId) {
        query = query.or(`from_warehouse_id.eq.${filters.warehouseId},to_warehouse_id.eq.${filters.warehouseId}`);
      }

      query = query.order('requested_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching warehouse transfers', { error, storeId });
        throw error;
      }

      return (data || []) as WarehouseTransfer[];
    },
    enabled: !!storeId,
  });
};

/**
 * useWarehouseAllocations - Récupère les allocations
 */
export const useWarehouseAllocations = (warehouseId?: string, filters?: {
  orderId?: string;
  status?: WarehouseAllocation['status'];
}) => {
  return useQuery({
    queryKey: ['warehouse-allocations', warehouseId, filters],
    queryFn: async () => {
      if (!warehouseId) throw new Error('Warehouse ID manquant');

      let query = supabase
        .from('warehouse_allocations')
        .select(`
          *,
          product:products (id, name, image_url),
          order:orders (id, order_number)
        `)
        .eq('warehouse_id', warehouseId);

      if (filters?.orderId) {
        query = query.eq('order_id', filters.orderId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('allocated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching warehouse allocations', { error, warehouseId });
        throw error;
      }

      return (data || []) as WarehouseAllocation[];
    },
    enabled: !!warehouseId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateWarehouse - Créer un entrepôt
 */
export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (warehouseData: Partial<Warehouse>) => {
      const { data, error } = await supabase
        .from('warehouses')
        .insert({
          ...warehouseData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating warehouse', { error, warehouseData });
        throw error;
      }

      return data as Warehouse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', data.store_id] });
      toast({
        title: '✅ Entrepôt créé',
        description: 'L\'entrepôt a été créé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateWarehouse', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer l\'entrepôt',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCreateWarehouseTransfer - Créer un transfert
 */
export const useCreateWarehouseTransfer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      fromWarehouseId,
      toWarehouseId,
      items,
      reason,
      notes,
    }: {
      storeId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      items: Array<{
        product_id: string;
        variant_id?: string;
        quantity: number;
        from_location_id?: string;
        to_location_id?: string;
      }>;
      reason?: string;
      notes?: string;
    }) => {
      // Générer numéro de transfert
      const { data: transferNumber, error: transferNumberError } = await supabase.rpc('generate_warehouse_transfer_number');
      if (transferNumberError) throw transferNumberError;

      // Créer transfert
      const { data: transfer, error: transferError } = await supabase
        .from('warehouse_transfers')
        .insert({
          store_id: storeId,
          transfer_number: transferNumber,
          from_warehouse_id: fromWarehouseId,
          to_warehouse_id: toWarehouseId,
          status: 'pending',
          reason,
          notes,
          requested_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (transferError) {
        logger.error('Error creating warehouse transfer', { error: transferError });
        throw transferError;
      }

      // Créer items
      const transferItems = items.map(item => ({
        transfer_id: transfer.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity_requested: item.quantity,
        from_location_id: item.from_location_id,
        to_location_id: item.to_location_id,
      }));

      const { error: itemsError } = await supabase
        .from('warehouse_transfer_items')
        .insert(transferItems);

      if (itemsError) {
        logger.error('Error creating transfer items', { error: itemsError });
        throw itemsError;
      }

      return transfer as WarehouseTransfer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
      toast({
        title: '✅ Transfert créé',
        description: `Le transfert ${data.transfer_number} a été créé`,
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateWarehouseTransfer', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le transfert',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateTransferStatus - Mettre à jour le statut d'un transfert
 */
export const useUpdateTransferStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      transferId,
      status,
      userId,
    }: {
      transferId: string;
      status: WarehouseTransfer['status'];
      userId?: string;
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Mettre à jour les dates selon le statut
      const now = new Date().toISOString();
      if (status === 'approved') {
        updateData.approved_date = now;
        updateData.approved_by = userId;
      } else if (status === 'in_transit') {
        updateData.shipped_date = now;
      } else if (status === 'received') {
        updateData.received_date = now;
        updateData.received_by = userId;
      } else if (status === 'completed') {
        updateData.completed_date = now;
      }

      const { data, error } = await supabase
        .from('warehouse_transfers')
        .update(updateData)
        .eq('id', transferId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating transfer status', { error, transferId });
        throw error;
      }

      // Si reçu, mettre à jour l'inventaire
      if (status === 'received') {
        // Récupérer les items du transfert
        const { data: items } = await supabase
          .from('warehouse_transfer_items')
          .select('*')
          .eq('transfer_id', transferId);

        if (items) {
          // Mettre à jour l'inventaire pour chaque item
          for (const item of items) {
            const { data: transfer } = await supabase
              .from('warehouse_transfers')
              .select('from_warehouse_id, to_warehouse_id')
              .eq('id', transferId)
              .single();

            if (transfer) {
              // Réduire stock entrepôt source
              await supabase.rpc('adjust_warehouse_inventory', {
                p_warehouse_id: transfer.from_warehouse_id,
                p_product_id: item.product_id,
                p_quantity_change: -item.quantity_received,
                p_variant_id: item.variant_id,
              });

              // Augmenter stock entrepôt destination
              await supabase.rpc('adjust_warehouse_inventory', {
                p_warehouse_id: transfer.to_warehouse_id,
                p_product_id: item.product_id,
                p_quantity_change: item.quantity_received,
                p_variant_id: item.variant_id,
                p_location_id: item.to_location_id,
              });
            }
          }
        }
      }

      return data as WarehouseTransfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut du transfert a été mis à jour',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateTransferStatus', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });
};

