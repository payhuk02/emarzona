import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MovementType, MovementDirection, StockMovement } from '@/components/physical/StockMovementHistory';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateStockMovementInput {
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_label?: string;
  sku?: string;
  type: MovementType;
  direction: MovementDirection;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  reference_id?: string;
  reference_type?: string;
  user_id?: string;
  user_name?: string;
  location_from?: string;
  location_to?: string;
}

export interface StockMovementStats {
  total_movements: number;
  total_in: number;
  total_out: number;
  net_change: number;
  by_type: Record<MovementType, number>;
  recent_activity: number; // last 24h
}

// ============================================================================
// FETCH STOCK MOVEMENTS
// ============================================================================

export function useStockMovements(filters?: {
  product_id?: string;
  variant_id?: string;
  type?: MovementType;
  direction?: MovementDirection;
  date_from?: string;
  date_to?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['stock-movements', filters],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters?.variant_id) {
        query = query.eq('variant_id', filters.variant_id);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.direction) {
        query = query.eq('direction', filters.direction);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as StockMovement[];
    },
  });
}

// ============================================================================
// GET STOCK MOVEMENT STATS
// ============================================================================

export function useStockMovementStats(productId?: string, dateRange?: {
  start: string;
  end: string;
}) {
  return useQuery({
    queryKey: ['stock-movement-stats', productId, dateRange],
    queryFn: async () => {
      let query = supabase.from('stock_movements').select('*');

      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (dateRange?.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange?.end) {
        query = query.lte('created_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      const movements = (data || []) as StockMovement[];

      // Calculate stats
      const total_in = movements
        .filter((m) => m.direction === 'in')
        .reduce((sum, m) => sum + m.quantity, 0);

      const total_out = movements
        .filter((m) => m.direction === 'out')
        .reduce((sum, m) => sum + m.quantity, 0);

      const by_type: Record<MovementType, number> = {
        purchase: 0,
        sale: 0,
        return: 0,
        adjustment: 0,
        transfer: 0,
        damage: 0,
        theft: 0,
      };

      movements.forEach((m) => {
        by_type[m.type] = (by_type[m.type] || 0) + 1;
      });

      // Recent activity (last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recent_activity = movements.filter(
        (m) => m.created_at >= oneDayAgo
      ).length;

      const stats: StockMovementStats = {
        total_movements: movements.length,
        total_in,
        total_out,
        net_change: total_in - total_out,
        by_type,
        recent_activity,
      };

      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// CREATE STOCK MOVEMENT
// ============================================================================

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: CreateStockMovementInput) => {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert([
          {
            ...movement,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update product quantity
      const newQuantity = movement.quantity_after;
      await supabase
        .from('physical_products')
        .update({ total_quantity: newQuantity })
        .eq('id', movement.product_id);

      return data as StockMovement;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movement-stats'] });
      queryClient.invalidateQueries({ queryKey: ['physical-products'] });
      queryClient.invalidateQueries({ queryKey: ['physical-product', data.product_id] });
    },
  });
}

// ============================================================================
// CREATE BULK STOCK MOVEMENTS
// ============================================================================

export function useCreateBulkStockMovements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movements: CreateStockMovementInput[]) => {
      // Insert all movements
      const { data, error } = await supabase
        .from('stock_movements')
        .insert(
          movements.map((m) => ({
            ...m,
            created_at: new Date().toISOString(),
          }))
        )
        .select();

      if (error) throw error;

      // Update all product quantities
      const updates = movements.map((m) =>
        supabase
          .from('physical_products')
          .update({ total_quantity: m.quantity_after })
          .eq('id', m.product_id)
      );

      await Promise.all(updates);

      return data as StockMovement[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movement-stats'] });
      queryClient.invalidateQueries({ queryKey: ['physical-products'] });
    },
  });
}

// ============================================================================
// ADJUST STOCK (Helper mutation)
// ============================================================================

export function useAdjustStock() {
  const createMovement = useCreateStockMovement();

  return useMutation({
    mutationFn: async ({
      product_id,
      product_name,
      variant_id,
      variant_label,
      sku,
      current_quantity,
      new_quantity,
      type = 'adjustment',
      reason,
      user_id,
      user_name,
    }: {
      product_id: string;
      product_name: string;
      variant_id?: string;
      variant_label?: string;
      sku?: string;
      current_quantity: number;
      new_quantity: number;
      type?: MovementType;
      reason?: string;
      user_id?: string;
      user_name?: string;
    }) => {
      const quantity = Math.abs(new_quantity - current_quantity);
      const direction: MovementDirection = new_quantity > current_quantity ? 'in' : 'out';

      const movement: CreateStockMovementInput = {
        product_id,
        product_name,
        variant_id,
        variant_label,
        sku,
        type,
        direction,
        quantity,
        quantity_before: current_quantity,
        quantity_after: new_quantity,
        reason,
        user_id,
        user_name,
        reference_type: 'manual',
      };

      return createMovement.mutateAsync(movement);
    },
  });
}

// ============================================================================
// PROCESS SALE (Helper mutation)
// ============================================================================

export function useProcessSale() {
  const createMovement = useCreateStockMovement();

  return useMutation({
    mutationFn: async ({
      product_id,
      product_name,
      variant_id,
      variant_label,
      sku,
      current_quantity,
      quantity_sold,
      order_id,
      customer_name,
    }: {
      product_id: string;
      product_name: string;
      variant_id?: string;
      variant_label?: string;
      sku?: string;
      current_quantity: number;
      quantity_sold: number;
      order_id: string;
      customer_name?: string;
    }) => {
      const movement: CreateStockMovementInput = {
        product_id,
        product_name,
        variant_id,
        variant_label,
        sku,
        type: 'sale',
        direction: 'out',
        quantity: quantity_sold,
        quantity_before: current_quantity,
        quantity_after: current_quantity - quantity_sold,
        reason: `Vente - Commande #${order_id}`,
        reference_id: order_id,
        reference_type: 'order',
        user_name: customer_name ? `Client: ${customer_name}` : undefined,
      };

      return createMovement.mutateAsync(movement);
    },
  });
}

// ============================================================================
// PROCESS RETURN (Helper mutation)
// ============================================================================

export function useProcessReturn() {
  const createMovement = useCreateStockMovement();

  return useMutation({
    mutationFn: async ({
      product_id,
      product_name,
      variant_id,
      variant_label,
      sku,
      current_quantity,
      quantity_returned,
      order_id,
      reason,
    }: {
      product_id: string;
      product_name: string;
      variant_id?: string;
      variant_label?: string;
      sku?: string;
      current_quantity: number;
      quantity_returned: number;
      order_id: string;
      reason?: string;
    }) => {
      const movement: CreateStockMovementInput = {
        product_id,
        product_name,
        variant_id,
        variant_label,
        sku,
        type: 'return',
        direction: 'in',
        quantity: quantity_returned,
        quantity_before: current_quantity,
        quantity_after: current_quantity + quantity_returned,
        reason: reason || `Retour client - Commande #${order_id}`,
        reference_id: order_id,
        reference_type: 'return',
      };

      return createMovement.mutateAsync(movement);
    },
  });
}

// ============================================================================
// PROCESS PURCHASE (Helper mutation)
// ============================================================================

export function useProcessPurchase() {
  const createMovement = useCreateStockMovement();

  return useMutation({
    mutationFn: async ({
      product_id,
      product_name,
      variant_id,
      variant_label,
      sku,
      current_quantity,
      quantity_purchased,
      purchase_id,
      supplier_name,
      location,
    }: {
      product_id: string;
      product_name: string;
      variant_id?: string;
      variant_label?: string;
      sku?: string;
      current_quantity: number;
      quantity_purchased: number;
      purchase_id: string;
      supplier_name?: string;
      location?: string;
    }) => {
      const movement: CreateStockMovementInput = {
        product_id,
        product_name,
        variant_id,
        variant_label,
        sku,
        type: 'purchase',
        direction: 'in',
        quantity: quantity_purchased,
        quantity_before: current_quantity,
        quantity_after: current_quantity + quantity_purchased,
        reason: `Approvisionnement${supplier_name ? ` - ${supplier_name}` : ''}`,
        reference_id: purchase_id,
        reference_type: 'purchase',
        location_to: location,
      };

      return createMovement.mutateAsync(movement);
    },
  });
}

// ============================================================================
// DELETE MOVEMENT (Admin only)
// ============================================================================

export function useDeleteStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movementId: string) => {
      const { error } = await supabase
        .from('stock_movements')
        .delete()
        .eq('id', movementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movement-stats'] });
    },
  });
}

