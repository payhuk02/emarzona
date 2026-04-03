/**
 * Customer Physical Orders Hooks
 * Date: 2025-01-27
 * 
 * Hooks pour récupérer les commandes de produits physiques d'un client
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Types pour les données brutes retournées par Supabase
interface SupabaseOrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  variant_id: string | null;
  products: {
    id: string;
    name: string;
    image_url: string | null;
    product_type: string;
  } | null;
  physical_product_variants: {
    id: string;
    name: string;
  } | null;
}

interface SupabaseOrder {
  id: string;
  order_number: string;
  store_id: string;
  customer_id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  status: string;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
  delivered_at: string | null;
  order_items: SupabaseOrderItem[] | null;
}

interface SupabaseShipment {
  id: string;
  order_id: string;
  tracking_number: string | null;
  tracking_url: string | null;
  status: string;
  carrier_id: string | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
}

interface SupabaseReturn {
  id: string;
  order_id: string;
  return_number: string;
  status: string;
  return_reason: string;
  requested_at: string;
}

interface SupabaseCarrier {
  id: string;
  name: string;
  code: string;
}

export interface CustomerPhysicalOrder {
  id: string;
  order_number: string;
  store_id: string;
  customer_id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  status: string;
  shipping_address: Record<string, string | number | boolean | null | undefined>;
  created_at: string;
  delivered_at?: string;
  order_items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    product_image_url?: string;
    variant_id?: string;
    variant_name?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  shipments?: Array<{
    id: string;
    tracking_number?: string;
    tracking_url?: string;
    status: string;
    carrier_name?: string;
    estimated_delivery?: string;
    actual_delivery?: string;
  }>;
  returns?: Array<{
    id: string;
    return_number: string;
    status: string;
    return_reason: string;
    requested_at: string;
  }>;
}

/**
 * Liste toutes les commandes de produits physiques du client connecté
 */
export const useCustomerPhysicalOrders = () => {
  return useQuery({
    queryKey: ['customerPhysicalOrders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('useCustomerPhysicalOrders: User not authenticated.');
        return [];
      }

      // Récupérer le customer_id pour l'utilisateur
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customerError || !customerData) {
        logger.error('useCustomerPhysicalOrders: Error fetching customer ID or customer not found.', { customerError });
        return [];
      }

      const customerId = customerData.id;

      // Récupérer les commandes avec produits physiques
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          store_id,
          customer_id,
          total_amount,
          currency,
          payment_status,
          status,
          shipping_address,
          created_at,
          delivered_at,
          order_items (
            id,
            product_id,
            quantity,
            price,
            variant_id,
            products (
              id,
              name,
              image_url,
              product_type
            ),
            physical_product_variants (
              id,
              name
            )
          )
        `)
        .eq('customer_id', customerId)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (ordersError) {
        logger.error('useCustomerPhysicalOrders: Error fetching orders.', { ordersError });
        throw ordersError;
      }

      // Filtrer pour ne garder que les commandes avec produits physiques
      const physicalOrders = (orders || []).filter((order: SupabaseOrder) => {
        return order.order_items?.some((item) => 
          item.products?.product_type === 'physical'
        );
      });

      if (physicalOrders.length === 0) {
        return [];
      }

      // OPTIMIZED: Fetch all shipments and returns in batch (N+1 fix)
      const orderIds = physicalOrders.map((order) => order.id);

      // Fetch all shipments for all orders in one query
      const { data: allShipments } = await supabase
        .from('shipments')
        .select('id, order_id, tracking_number, tracking_url, status, carrier_id, estimated_delivery, actual_delivery')
        .in('order_id', orderIds);

      // Fetch all returns for all orders in one query
      const { data: allReturns } = await supabase
        .from('product_returns')
        .select('id, order_id, return_number, status, return_reason, requested_at')
        .in('order_id', orderIds)
        .order('requested_at', { ascending: false });

      // Get unique carrier IDs
      const carrierIds = [...new Set((allShipments || [])
        .map((s: SupabaseShipment) => s.carrier_id)
        .filter((id): id is string => id !== null && id !== undefined))];

      // Fetch all carriers in one query (N+1 fix)
      const { data: allCarriers } = carrierIds.length > 0
        ? await supabase
            .from('shipping_carriers')
            .select('id, name, code')
            .in('id', carrierIds)
        : { data: [] };

      // Create a map for quick lookup
      const carriersMap = new Map<string, SupabaseCarrier>(
        (allCarriers || []).map((c: SupabaseCarrier) => [c.id, c])
      );

      // Group shipments and returns by order_id
      const shipmentsByOrder = new Map<string, Array<{
        id: string;
        tracking_number?: string;
        tracking_url?: string;
        status: string;
        carrier_name?: string;
        estimated_delivery?: string;
        actual_delivery?: string;
      }>>();
      const returnsByOrder = new Map<string, SupabaseReturn[]>();

      (allShipments || []).forEach((shipment: SupabaseShipment) => {
        const orderId = shipment.order_id;
        if (!shipmentsByOrder.has(orderId)) {
          shipmentsByOrder.set(orderId, []);
        }
        shipmentsByOrder.get(orderId)!.push({
          ...shipment,
          carrier_name: shipment.carrier_id 
            ? (carriersMap.get(shipment.carrier_id)?.name || carriersMap.get(shipment.carrier_id)?.code || undefined)
            : undefined,
        });
      });

      (allReturns || []).forEach((returnItem: SupabaseReturn) => {
        const orderId = returnItem.order_id;
        if (!returnsByOrder.has(orderId)) {
          returnsByOrder.set(orderId, []);
        }
        returnsByOrder.get(orderId)!.push(returnItem);
      });

      // Map orders with their shipments and returns
      const ordersWithDetails = physicalOrders.map((order: SupabaseOrder) => ({
        id: order.id,
        order_number: order.order_number || order.id,
        store_id: order.store_id,
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        currency: order.currency || 'XOF',
        payment_status: order.payment_status,
        status: order.status,
        shipping_address: order.shipping_address || {},
        created_at: order.created_at,
        delivered_at: order.delivered_at,
        order_items: (order.order_items || []).map((item: SupabaseOrderItem) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || 'Produit inconnu',
          product_image_url: item.products?.image_url,
          variant_id: item.variant_id,
          variant_name: item.physical_product_variants?.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        shipments: shipmentsByOrder.get(order.id) || [],
        returns: returnsByOrder.get(order.id) || [],
      } as CustomerPhysicalOrder));

      return ordersWithDetails;
    },
  });
};

/**
 * Récupère une commande spécifique avec tous ses détails
 */
export const useCustomerPhysicalOrder = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['customerPhysicalOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID manquant');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer le customer_id
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customerData) throw new Error('Client non trouvé');

      // Récupérer la commande
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*),
            physical_product_variants (*)
          )
        `)
        .eq('id', orderId)
        .eq('customer_id', customerData.id)
        .single();

      if (error) throw error;

      // Récupérer shipments et returns
      const { data: shipments } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_id', orderId);

      const { data: returns } = await supabase
        .from('product_returns')
        .select('*')
        .eq('order_id', orderId);

      return {
        ...order,
        shipments: shipments || [],
        returns: returns || [],
      };
    },
    enabled: !!orderId,
  });
};










