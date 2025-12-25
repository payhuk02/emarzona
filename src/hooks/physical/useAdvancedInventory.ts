/**
 * Advanced Inventory Management Hooks
 * Date: 2025-01-28
 * 
 * Hooks for managing multi-warehouse inventory, stock movements, and alerts
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
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  is_default: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface WarehouseInventory {
  id: string;
  warehouse_id: string;
  inventory_item_id: string;
  quantity_available: number;
  quantity_reserved: number;
  quantity_committed: number;
  bin_location?: string;
  reorder_point: number;
  reorder_quantity: number;
  max_stock_level?: number;
  last_counted_at?: string;
  created_at: string;
  updated_at: string;
  warehouse?: Warehouse;
  inventory_item?: {
    id: string;
    sku: string;
    physical_product_id?: string;
    variant_id?: string;
  };
}

export interface StockAlert {
  id: string;
  warehouse_inventory_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'reorder';
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  current_quantity: number;
  threshold_quantity: number;
  created_at: string;
  updated_at: string;
  warehouse_inventory?: WarehouseInventory;
}

export interface StockMovement {
  id: string;
  inventory_item_id: string;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage' | 'transfer' | 'recount';
  quantity: number;
  order_id?: string;
  user_id?: string;
  reason?: string;
  notes?: string;
  unit_cost?: number;
  total_cost: number;
  movement_date: string;
  created_at: string;
}

// =====================================================
// HOOKS: Warehouses
// =====================================================

/**
 * Get all warehouses for a store
 */
export const useWarehouses = (storeId?: string) => {
  return useQuery({
    queryKey: ['warehouses', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('store_id', storeId)
        .order('is_default', { ascending: false })
        .order('priority', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as Warehouse[];
    },
    enabled: !!storeId,
  });
};

/**
 * Get a single warehouse
 */
export const useWarehouse = (warehouseId?: string) => {
  return useQuery({
    queryKey: ['warehouse', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return null;

      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('id', warehouseId)
        .single();

      if (error) throw error;
      return data as Warehouse;
    },
    enabled: !!warehouseId,
  });
};

/**
 * Create warehouse
 */
export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('warehouses')
        .insert(warehouse)
        .select()
        .single();

      if (error) throw error;
      return data as Warehouse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', data.store_id] });
      toast({
        title: 'Entrepôt créé',
        description: `L'entrepôt "${data.name}" a été créé avec succès.`,
      });
      logger.info('Warehouse created', { warehouseId: data.id });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'entrepôt.',
        variant: 'destructive',
      });
      logger.error('Error creating warehouse', { error });
    },
  });
};

/**
 * Update warehouse
 */
export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Warehouse> & { id: string }) => {
      const { data, error } = await supabase
        .from('warehouses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Warehouse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', data.store_id] });
      queryClient.invalidateQueries({ queryKey: ['warehouse', data.id] });
      toast({
        title: 'Entrepôt mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour l\'entrepôt.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Delete warehouse
 */
export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (warehouseId: string) => {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', warehouseId);

      if (error) throw error;
    },
    onSuccess: (_, warehouseId) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({
        title: 'Entrepôt supprimé',
        description: 'L\'entrepôt a été supprimé avec succès.',
      });
      logger.info('Warehouse deleted', { warehouseId });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'entrepôt.',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOKS: Warehouse Inventory
// =====================================================

/**
 * Get warehouse inventory
 */
export const useWarehouseInventory = (warehouseId?: string) => {
  return useQuery({
    queryKey: ['warehouse-inventory', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];

      const { data, error } = await supabase
        .from('warehouse_inventory')
        .select(`
          *,
          warehouse:warehouses(*),
          inventory_item:inventory_items(
            id,
            sku,
            physical_product_id,
            variant_id
          )
        `)
        .eq('warehouse_id', warehouseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WarehouseInventory[];
    },
    enabled: !!warehouseId,
  });
};

/**
 * Get inventory by item across all warehouses
 */
export const useInventoryByItem = (inventoryItemId?: string) => {
  return useQuery({
    queryKey: ['inventory-by-item', inventoryItemId],
    queryFn: async () => {
      if (!inventoryItemId) return [];

      const { data, error } = await supabase
        .from('warehouse_inventory')
        .select(`
          *,
          warehouse:warehouses(*)
        `)
        .eq('inventory_item_id', inventoryItemId);

      if (error) throw error;
      return data as WarehouseInventory[];
    },
    enabled: !!inventoryItemId,
  });
};

/**
 * Update warehouse inventory
 */
export const useUpdateWarehouseInventory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<WarehouseInventory> & { id: string }) => {
      const { data, error } = await supabase
        .from('warehouse_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as WarehouseInventory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-by-item'] });
      toast({
        title: 'Stock mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le stock.',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOKS: Stock Alerts
// =====================================================

/**
 * Get stock alerts
 */
export const useStockAlerts = (storeId?: string, resolved?: boolean) => {
  return useQuery({
    queryKey: ['stock-alerts', storeId, resolved],
    queryFn: async () => {
      if (!storeId) return [];

      // Get warehouses for store first
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id')
        .eq('store_id', storeId);

      if (!warehouses || warehouses.length === 0) return [];

      const warehouseIds = warehouses.map((w) => w.id);

      // Get warehouse inventory IDs
      const { data: inventory } = await supabase
        .from('warehouse_inventory')
        .select('id')
        .in('warehouse_id', warehouseIds);

      if (!inventory || inventory.length === 0) return [];

      const inventoryIds = inventory.map((i) => i.id);

      // Get alerts
      let query = supabase
        .from('stock_alerts')
        .select(`
          *,
          warehouse_inventory:warehouse_inventory(
            *,
            warehouse:warehouses(*),
            inventory_item:inventory_items(*)
          )
        `)
        .in('warehouse_inventory_id', inventoryIds);

      if (resolved !== undefined) {
        query = query.eq('is_resolved', resolved);
      }

      const { data, error } = await query
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StockAlert[];
    },
    enabled: !!storeId,
  });
};

/**
 * Resolve stock alert
 */
export const useResolveStockAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      resolution_notes,
    }: {
      id: string;
      resolution_notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('stock_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as StockAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast({
        title: 'Alerte résolue',
        description: 'L\'alerte de stock a été marquée comme résolue.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de résoudre l\'alerte.',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOKS: Stock Movements
// =====================================================

/**
 * Get stock movements
 */
export const useStockMovements = (inventoryItemId?: string, limit = 50) => {
  return useQuery({
    queryKey: ['stock-movements', inventoryItemId, limit],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('movement_date', { ascending: false })
        .limit(limit);

      if (inventoryItemId) {
        query = query.eq('inventory_item_id', inventoryItemId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as StockMovement[];
    },
  });
};

/**
 * Create stock movement
 */
export const useCreateStockMovement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      movement: Omit<StockMovement, 'id' | 'created_at' | 'total_cost'>
    ) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          ...movement,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as StockMovement;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-by-item'] });
      toast({
        title: 'Mouvement enregistré',
        description: 'Le mouvement de stock a été enregistré.',
      });
      logger.info('Stock movement created', { movementId: data.id });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'enregistrer le mouvement.',
        variant: 'destructive',
      });
    },
  });
};



