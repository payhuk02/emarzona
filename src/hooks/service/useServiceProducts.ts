/**
 * Service Products Hooks
 * Date: 28 octobre 2025
 *
 * React Query hooks for managing service products
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateCatalogCaches } from '@/lib/cache-invalidation';
import { supabase } from '@/integrations/supabase/client';

const SERVICE_PRODUCT_FIELDS =
  'id, product_id, service_type, duration_minutes, location_type, location_address, meeting_url, timezone, requires_staff, max_participants, pricing_type, deposit_required, deposit_amount, deposit_type, allow_booking_cancellation, cancellation_deadline_hours, require_approval, buffer_time_before, buffer_time_after, max_bookings_per_day, advance_booking_days, fulfillment_mode, category_attributes, total_bookings, total_completed_bookings, total_cancelled_bookings, total_revenue, average_rating, created_at, updated_at';
const SERVICE_PRODUCT_ITEM_FIELDS =
  'id, store_id, name, description, price, promotional_price, currency, is_active, is_draft, product_type, image_url, slug, category, category_id, created_at, updated_at';
const SERVICE_AVAILABILITY_SLOT_FIELDS =
  'id, service_product_id, day_of_week, start_time, end_time, is_active, created_at, updated_at';
const SERVICE_STAFF_MEMBER_FIELDS =
  'id, service_product_id, name, email, phone, role, is_active, created_at, updated_at';
const SERVICE_RESOURCE_FIELDS =
  'id, service_product_id, name, description, resource_type, quantity, is_required, created_at, updated_at';

export interface ServiceProduct {
  id: string;
  product_id: string;
  service_type: 'appointment' | 'class' | 'event' | 'consultation' | 'other';
  duration_minutes: number;
  location_type: 'on_site' | 'online' | 'customer_location' | 'flexible';
  location_address?: string;
  meeting_url?: string;
  timezone: string;
  requires_staff: boolean;
  max_participants: number;
  pricing_type: 'fixed' | 'hourly' | 'per_participant';
  deposit_required: boolean;
  deposit_amount?: number;
  deposit_type?: 'fixed' | 'percentage';
  allow_booking_cancellation: boolean;
  cancellation_deadline_hours: number;
  require_approval: boolean;
  buffer_time_before: number;
  buffer_time_after: number;
  max_bookings_per_day?: number;
  advance_booking_days: number;
  total_bookings: number;
  total_completed_bookings: number;
  total_cancelled_bookings: number;
  total_revenue: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
  fulfillment_mode?: 'appointment' | 'project' | 'both';
  category_attributes?: Record<string, string | number | boolean | string[]>;
  product?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    status: string;
    [key: string]: unknown;
  };
}

async function fetchServiceProductsForStore(storeId: string): Promise<ServiceProduct[]> {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(SERVICE_PRODUCT_ITEM_FIELDS)
    .eq('store_id', storeId)
    .eq('product_type', 'service')
    .order('created_at', { ascending: false });

  if (productsError) throw productsError;
  if (!products?.length) return [];

  const productIds = products.map(row => row.id);
  const { data: rows, error } = await supabase
    .from('service_products')
    .select(SERVICE_PRODUCT_FIELDS)
    .in('product_id', productIds)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const byProductId = new Map((rows || []).map(row => [row.product_id, row]));

  return products.map(product => {
    const row = byProductId.get(product.id);
    if (row) {
      return { ...row, product } as ServiceProduct;
    }

    return {
      id: product.id,
      product_id: product.id,
      service_type: 'other',
      duration_minutes: 60,
      location_type: 'flexible',
      timezone: 'UTC',
      requires_staff: false,
      max_participants: 1,
      pricing_type: 'fixed',
      deposit_required: false,
      allow_booking_cancellation: true,
      cancellation_deadline_hours: 24,
      require_approval: false,
      buffer_time_before: 0,
      buffer_time_after: 0,
      advance_booking_days: 30,
      total_bookings: 0,
      total_completed_bookings: 0,
      total_cancelled_bookings: 0,
      total_revenue: 0,
      average_rating: 0,
      created_at: product.created_at,
      updated_at: product.updated_at,
      product,
    } as ServiceProduct;
  });
}

/**
 * Get all service products for a store
 */
export const useServiceProducts = (storeId?: string) => {
  return useQuery({
    queryKey: ['service-products', storeId],
    queryFn: async () => fetchServiceProductsForStore(storeId!),
    enabled: !!storeId,
  });
};

/**
 * Get a single service product
 */
export const useServiceProduct = (productId?: string) => {
  return useQuery({
    queryKey: ['service-product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_products')
        .select(
          `
          ${SERVICE_PRODUCT_FIELDS},
          product:products(${SERVICE_PRODUCT_ITEM_FIELDS}),
          availability_slots:service_availability_slots(${SERVICE_AVAILABILITY_SLOT_FIELDS}),
          staff:service_staff_members(${SERVICE_STAFF_MEMBER_FIELDS}),
          resources:service_resources(${SERVICE_RESOURCE_FIELDS})
        `
        )
        .eq('product_id', productId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
};

/**
 * Create a new service product
 */
export const useCreateServiceProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ServiceProduct>) => {
      const { data: result, error } = await supabase
        .from('service_products')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-products'] });
      invalidateCatalogCaches(queryClient);
    },
  });
};

/**
 * Update a service product
 */
export const useUpdateServiceProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceProduct> }) => {
      const { data: result, error } = await supabase
        .from('service_products')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-products'] });
      queryClient.invalidateQueries({ queryKey: ['service-product', variables.id] });
      invalidateCatalogCaches(queryClient);
    },
  });
};

/**
 * Delete a service product
 */
export const useDeleteServiceProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: deleted, error } = await supabase
        .from('service_products')
        .delete()
        .or(`id.eq.${id},product_id.eq.${id}`)
        .select('id, product_id');

      if (error) throw error;

      const productIds = [
        ...new Set(
          (deleted || [])
            .map(row => row.product_id)
            .filter((productId): productId is string => Boolean(productId))
        ),
      ];
      if (!productIds.includes(id)) productIds.push(id);

      const { error: productError } = await supabase
        .from('products')
        .delete()
        .in('id', productIds)
        .eq('product_type', 'service');
      if (productError) throw productError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-products'] });
      invalidateCatalogCaches(queryClient);
    },
  });
};

/**
 * Get service stats
 */
export const useServiceStats = (serviceProductId: string) => {
  return useQuery({
    queryKey: ['service-stats', serviceProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_products')
        .select(
          'total_bookings, total_completed_bookings, total_cancelled_bookings, total_revenue, average_rating'
        )
        .eq('id', serviceProductId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!serviceProductId,
  });
};

async function fetchRankedServiceProducts(
  storeId: string,
  orderColumn: 'total_bookings' | 'average_rating',
  limit: number,
  minRating?: number
): Promise<ServiceProduct[]> {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .eq('store_id', storeId)
    .eq('product_type', 'service');

  if (productsError) throw productsError;
  const productIds = products?.map(row => row.id) || [];
  if (productIds.length === 0) return [];

  let query = supabase
    .from('service_products')
    .select(
      `
          ${SERVICE_PRODUCT_FIELDS},
          product:products(${SERVICE_PRODUCT_ITEM_FIELDS})
        `
    )
    .in('product_id', productIds)
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (minRating != null) {
    query = query.gte('average_rating', minRating);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ServiceProduct[];
}

/**
 * Get popular services
 */
export const usePopularServices = (storeId: string, limit = 5) => {
  return useQuery({
    queryKey: ['popular-services', storeId, limit],
    queryFn: () => fetchRankedServiceProducts(storeId, 'total_bookings', limit),
    enabled: !!storeId,
  });
};

/**
 * Get top rated services
 */
export const useTopRatedServices = (storeId: string, limit = 5) => {
  return useQuery({
    queryKey: ['top-rated-services', storeId, limit],
    queryFn: () => fetchRankedServiceProducts(storeId, 'average_rating', limit, 4.0),
    enabled: !!storeId,
  });
};
