/**
 * Suppliers Management Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les fournisseurs et commandes automatiques
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface Supplier {
  id: string;
  store_id: string;
  name: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  payment_terms?: string;
  currency: string;
  tax_id?: string;
  notes?: string;
  tags: string[];
  is_active: boolean;
  is_preferred: boolean;
  total_orders: number;
  total_spent: number;
  average_delivery_days?: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id?: string;
  variant_id?: string;
  supplier_sku?: string;
  supplier_product_name?: string;
  unit_cost: number;
  currency: string;
  minimum_order_quantity: number;
  bulk_pricing: Array<{ quantity: number; price: number }>;
  lead_time_days: number;
  estimated_delivery_days?: number;
  is_available: boolean;
  stock_available?: boolean;
  notes?: string;
  catalog_url?: string;
  is_active: boolean;
  is_preferred: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierOrder {
  id: string;
  store_id: string;
  supplier_id: string;
  order_number: string;
  supplier_order_number?: string;
  status: 'draft' | 'pending' | 'sent' | 'confirmed' | 'processing' | 'shipped' | 'partially_received' | 'received' | 'cancelled' | 'completed';
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  order_date: string;
  expected_delivery_date?: string;
  confirmed_date?: string;
  shipped_date?: string;
  received_date?: string;
  notes?: string;
  terms?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AutoReorderRule {
  id: string;
  store_id: string;
  product_id?: string;
  variant_id?: string;
  supplier_id: string;
  reorder_point: number;
  reorder_quantity: number;
  max_stock_level?: number;
  is_active: boolean;
  auto_create_order: boolean;
  require_approval: boolean;
  notify_on_reorder: boolean;
  notify_email: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useSuppliers - Récupère les fournisseurs d'un store
 */
export const useSuppliers = (storeId?: string) => {
  return useQuery({
    queryKey: ['suppliers', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('store_id', storeId)
        .order('is_preferred', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching suppliers', { error, storeId });
        throw error;
      }

      return (data || []) as Supplier[];
    },
    enabled: !!storeId,
  });
};

/**
 * useSupplierProducts - Récupère les produits d'un fournisseur
 */
export const useSupplierProducts = (supplierId?: string) => {
  return useQuery({
    queryKey: ['supplier-products', supplierId],
    queryFn: async () => {
      if (!supplierId) throw new Error('Supplier ID manquant');

      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          *,
          product:products (
            id,
            name,
            image_url
          )
        `)
        .eq('supplier_id', supplierId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching supplier products', { error, supplierId });
        throw error;
      }

      return (data || []) as SupplierProduct[];
    },
    enabled: !!supplierId,
  });
};

/**
 * useSupplierOrders - Récupère les commandes fournisseurs
 */
export const useSupplierOrders = (storeId?: string, filters?: {
  status?: SupplierOrder['status'];
  supplierId?: string;
}) => {
  return useQuery({
    queryKey: ['supplier-orders', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('supplier_orders')
        .select(`
          *,
          supplier:suppliers (
            id,
            name,
            company_name
          )
        `)
        .eq('store_id', storeId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }

      query = query.order('order_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching supplier orders', { error, storeId });
        throw error;
      }

      return (data || []) as SupplierOrder[];
    },
    enabled: !!storeId,
  });
};

/**
 * useAutoReorderRules - Récupère les règles de réapprovisionnement
 */
export const useAutoReorderRules = (storeId?: string) => {
  return useQuery({
    queryKey: ['auto-reorder-rules', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('auto_reorder_rules')
        .select(`
          *,
          product:products (
            id,
            name
          ),
          supplier:suppliers (
            id,
            name
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching auto reorder rules', { error, storeId });
        throw error;
      }

      return (data || []) as AutoReorderRule[];
    },
    enabled: !!storeId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateSupplier - Créer un fournisseur
 */
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (supplierData: Partial<Supplier>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplierData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating supplier', { error, supplierData });
        throw error;
      }

      return data as Supplier;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', data.store_id] });
      toast({
        title: '✅ Fournisseur créé',
        description: 'Le fournisseur a été créé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateSupplier', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le fournisseur',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCreateSupplierOrder - Créer une commande fournisseur
 */
export const useCreateSupplierOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      supplierId,
      items,
      notes,
    }: {
      storeId: string;
      supplierId: string;
      items: Array<{
        supplier_product_id?: string;
        product_id?: string;
        variant_id?: string;
        quantity: number;
        unit_cost: number;
      }>;
      notes?: string;
    }) => {
      // Générer numéro de commande
      const { data: orderNumber, error: orderNumberError } = await supabase.rpc('generate_supplier_order_number');
      if (orderNumberError) throw orderNumberError;

      // Calculer totaux
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      const totalAmount = subtotal;

      // Créer commande
      const { data: order, error: orderError } = await supabase
        .from('supplier_orders')
        .insert({
          store_id: storeId,
          supplier_id: supplierId,
          order_number: orderNumber,
          status: 'draft',
          subtotal,
          total_amount: totalAmount,
          notes,
        })
        .select()
        .single();

      if (orderError) {
        logger.error('Error creating supplier order', { error: orderError });
        throw orderError;
      }

      // Créer items
      const orderItems = items.map(item => ({
        supplier_order_id: order.id,
        supplier_product_id: item.supplier_product_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity_ordered: item.quantity,
        unit_cost: item.unit_cost,
      }));

      const { error: itemsError } = await supabase
        .from('supplier_order_items')
        .insert(orderItems);

      if (itemsError) {
        logger.error('Error creating supplier order items', { error: itemsError });
        throw itemsError;
      }

      return order as SupplierOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      toast({
        title: '✅ Commande créée',
        description: `La commande ${data.order_number} a été créée`,
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateSupplierOrder', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    },
  });
};

