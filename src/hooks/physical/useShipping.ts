/**
 * Shipping Management Hooks
 * Date: 28 octobre 2025
 * 
 * Hooks pour zones et tarifs de livraison
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface ShippingZone {
  id: string;
  store_id: string;
  name: string;
  countries: string[];
  states: string[];
  zip_codes: string[];
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingRate {
  id: string;
  shipping_zone_id: string;
  name: string;
  description?: string;
  rate_type: 'flat' | 'weight_based' | 'price_based' | 'free';
  base_price: number;
  price_per_kg?: number;
  min_weight?: number;
  max_weight?: number;
  min_order_amount?: number;
  max_order_amount?: number;
  estimated_days_min?: number;
  estimated_days_max?: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingCalculation {
  rate: ShippingRate;
  zone: ShippingZone;
  calculated_price: number;
  estimated_delivery: {
    min_days: number;
    max_days: number;
  };
}

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Get shipping zones for a store
 */
export const useShippingZones = (storeId: string) => {
  return useQuery({
    queryKey: ['shipping-zones', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('store_id', storeId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as ShippingZone[];
    },
    enabled: !!storeId,
  });
};

/**
 * Get single shipping zone
 */
export const useShippingZone = (zoneId: string) => {
  return useQuery({
    queryKey: ['shipping-zone', zoneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_zones')
        .select(`
          *,
          rates:shipping_rates (*)
        `)
        .eq('id', zoneId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!zoneId,
  });
};

/**
 * Get shipping rates for a zone
 */
export const useShippingRates = (zoneId: string) => {
  return useQuery({
    queryKey: ['shipping-rates', zoneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .eq('shipping_zone_id', zoneId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as ShippingRate[];
    },
    enabled: !!zoneId,
  });
};

/**
 * Calculate shipping for an order
 */
export const useCalculateShipping = (storeId: string) => {
  return useMutation({
    mutationFn: async ({
      country,
      state,
      zipCode,
      weight,
      orderAmount,
    }: {
      country: string;
      state?: string;
      zipCode?: string;
      weight: number;
      orderAmount: number;
    }) => {
      // 1. Find matching shipping zones
      const { data: zones } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (!zones || zones.length === 0) {
        throw new Error('No shipping zones available');
      }

      // Find the best matching zone
      const matchingZone = zones.find((zone: ShippingZone) => {
        if (zone.countries.length > 0 && !zone.countries.includes(country)) {
          return false;
        }
        if (state && zone.states.length > 0 && !zone.states.includes(state)) {
          return false;
        }
        if (zipCode && zone.zip_codes.length > 0) {
          const matches = zone.zip_codes.some((pattern) => {
            // Simple pattern matching (can be enhanced)
            return zipCode.startsWith(pattern);
          });
          if (!matches) return false;
        }
        return true;
      });

      if (!matchingZone) {
        throw new Error('No shipping zone found for this location');
      }

      // 2. Get shipping rates for this zone
      const { data: rates } = await supabase
        .from('shipping_rates')
        .select('*')
        .eq('shipping_zone_id', matchingZone.id)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (!rates || rates.length === 0) {
        throw new Error('No shipping rates available for this zone');
      }

      // 3. Calculate shipping cost for each rate
      const calculations: ShippingCalculation[] = rates
        .map((rate: ShippingRate) => {
          let calculatedPrice = rate.base_price;
          let isEligible = true;

          switch (rate.rate_type) {
            case 'free':
              calculatedPrice = 0;
              break;

            case 'flat':
              // Already set to base_price
              break;

            case 'weight_based':
              if (rate.min_weight && weight < rate.min_weight) isEligible = false;
              if (rate.max_weight && weight > rate.max_weight) isEligible = false;
              if (isEligible && rate.price_per_kg) {
                calculatedPrice = rate.base_price + weight * rate.price_per_kg;
              }
              break;

            case 'price_based':
              if (rate.min_order_amount && orderAmount < rate.min_order_amount)
                isEligible = false;
              if (rate.max_order_amount && orderAmount > rate.max_order_amount)
                isEligible = false;
              break;
          }

          if (!isEligible) return null;

          return {
            rate,
            zone: matchingZone,
            calculated_price: calculatedPrice,
            estimated_delivery: {
              min_days: rate.estimated_days_min || 3,
              max_days: rate.estimated_days_max || 7,
            },
          };
        })
        .filter(Boolean) as ShippingCalculation[];

      return calculations;
    },
  });
};

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Create shipping zone
 */
export const useCreateShippingZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zone: Omit<ShippingZone, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('shipping_zones')
        .insert(zone)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones', variables.store_id] });
    },
  });
};

/**
 * Update shipping zone
 */
export const useUpdateShippingZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ShippingZone>;
    }) => {
      const { data: updated, error } = await supabase
        .from('shipping_zones')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zone', data.id] });
      queryClient.invalidateQueries({ queryKey: ['shipping-zones', data.store_id] });
    },
  });
};

/**
 * Delete shipping zone
 */
export const useDeleteShippingZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shipping_zones').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
    },
  });
};

/**
 * Create shipping rate
 */
export const useCreateShippingRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rate: Omit<ShippingRate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('shipping_rates')
        .insert(rate)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['shipping-rates', variables.shipping_zone_id],
      });
    },
  });
};

/**
 * Update shipping rate
 */
export const useUpdateShippingRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ShippingRate>;
    }) => {
      const { data: updated, error } = await supabase
        .from('shipping_rates')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['shipping-rates', data.shipping_zone_id],
      });
    },
  });
};

/**
 * Delete shipping rate
 */
export const useDeleteShippingRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shipping_rates').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
    },
  });
};

/**
 * Toggle shipping zone active status
 */
export const useToggleShippingZoneStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('shipping_zones')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones', data.store_id] });
    },
  });
};

/**
 * Toggle shipping rate active status
 */
export const useToggleShippingRateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('shipping_rates')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['shipping-rates', data.shipping_zone_id],
      });
    },
  });
};

