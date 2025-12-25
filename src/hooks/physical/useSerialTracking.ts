/**
 * Hooks React Query pour numéros de série et traçabilité
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface SerialNumber {
  id: string;
  physical_product_id: string;
  variant_id?: string;
  lot_id?: string;
  serial_number: string;
  imei?: string;
  mac_address?: string;
  barcode?: string;
  qr_code?: string;
  status: 'manufactured' | 'in_stock' | 'reserved' | 'sold' | 'shipped' | 'delivered' | 'returned' | 'refurbished' | 'warranty_repair' | 'damaged' | 'scrapped';
  warehouse_id?: string;
  bin_location?: string;
  current_location?: string;
  order_id?: string;
  order_item_id?: string;
  customer_id?: string;
  manufacturing_date?: string;
  manufacturing_location?: string;
  batch_number?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  warranty_duration_months?: number;
  warranty_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SerialNumberHistory {
  id: string;
  serial_number_id: string;
  event_type: 'manufactured' | 'received' | 'reserved' | 'sold' | 'shipped' | 'delivered' | 'returned' | 'refurbished' | 'warranty_claim' | 'repair_started' | 'repair_completed' | 'transferred' | 'damaged' | 'scrapped' | 'status_changed';
  from_location?: string;
  to_location?: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  from_customer_id?: string;
  to_customer_id?: string;
  order_id?: string;
  order_item_id?: string;
  return_id?: string;
  warranty_claim_id?: string;
  repair_id?: string;
  description?: string;
  notes?: string;
  performed_by?: string;
  metadata?: Record<string, any>;
  event_date: string;
  created_at: string;
}

export interface WarrantyClaim {
  id: string;
  serial_number_id: string;
  order_id?: string;
  customer_id: string;
  claim_number: string;
  claim_date: string;
  issue_description: string;
  reported_by?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'repair_in_progress' | 'repaired' | 'replacement_sent' | 'refunded' | 'resolved' | 'cancelled';
  resolution_type?: 'repair' | 'replacement' | 'refund' | 'credit' | 'denied';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  repair_cost: number;
  shipping_cost: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface Repair {
  id: string;
  serial_number_id: string;
  warranty_claim_id?: string;
  repair_number: string;
  repair_type: 'warranty' | 'out_of_warranty' | 'customer_paid';
  status: 'received' | 'diagnosed' | 'in_progress' | 'waiting_parts' | 'completed' | 'returned' | 'cancelled';
  issue_description: string;
  diagnosis?: string;
  repair_description?: string;
  parts_used?: Array<{ part_name: string; quantity: number; cost: number }>;
  labor_hours: number;
  parts_cost: number;
  labor_cost: number;
  shipping_cost: number;
  total_cost: number;
  received_date: string;
  started_date?: string;
  completed_date?: string;
  returned_date?: string;
  technician_id?: string;
  repair_center_id?: string;
  internal_notes?: string;
  customer_notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS: Serial Numbers
// =====================================================

/**
 * Get serial numbers for a product
 */
export const useProductSerialNumbers = (
  physicalProductId: string,
  options?: {
    variantId?: string;
    status?: SerialNumber['status'];
    includeHistory?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['product-serial-numbers', physicalProductId, options],
    queryFn: async () => {
      let query = supabase
        .from('serial_numbers')
        .select('*')
        .eq('physical_product_id', physicalProductId)
        .order('serial_number', { ascending: true });

      if (options?.variantId) {
        query = query.eq('variant_id', options.variantId);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SerialNumber[];
    },
    enabled: !!physicalProductId,
  });
};

/**
 * Get serial number by ID
 */
export const useSerialNumber = (serialNumberId: string) => {
  return useQuery({
    queryKey: ['serial-number', serialNumberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('serial_numbers')
        .select('*')
        .eq('id', serialNumberId)
        .single();

      if (error) throw error;
      return data as SerialNumber;
    },
    enabled: !!serialNumberId,
  });
};

/**
 * Get serial number by serial number string
 */
export const useSerialNumberByNumber = (serialNumber: string) => {
  return useQuery({
    queryKey: ['serial-number-by-number', serialNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('serial_numbers')
        .select('*')
        .eq('serial_number', serialNumber)
        .single();

      if (error) throw error;
      return data as SerialNumber;
    },
    enabled: !!serialNumber,
  });
};

/**
 * Create a serial number
 */
export const useCreateSerialNumber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serial: Omit<SerialNumber, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('serial_numbers')
        .insert(serial)
        .select()
        .single();

      if (error) throw error;
      return data as SerialNumber;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['product-serial-numbers', data.physical_product_id],
      });
    },
  });
};

/**
 * Update a serial number
 */
export const useUpdateSerialNumber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serialNumberId,
      updates,
    }: {
      serialNumberId: string;
      updates: Partial<SerialNumber>;
    }) => {
      const { data, error } = await supabase
        .from('serial_numbers')
        .update(updates)
        .eq('id', serialNumberId)
        .select()
        .single();

      if (error) throw error;
      return data as SerialNumber;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['serial-number', data.id] });
      queryClient.invalidateQueries({
        queryKey: ['product-serial-numbers', data.physical_product_id],
      });
      queryClient.invalidateQueries({ queryKey: ['serial-history', data.id] });
    },
  });
};

/**
 * Bulk create serial numbers
 */
export const useBulkCreateSerialNumbers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serials: Array<Omit<SerialNumber, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data, error } = await supabase
        .from('serial_numbers')
        .insert(serials)
        .select();

      if (error) throw error;
      return data as SerialNumber[];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ['product-serial-numbers', data[0].physical_product_id],
        });
      }
    },
  });
};

// =====================================================
// HOOKS: Serial Number History
// =====================================================

/**
 * Get history for a serial number
 */
export const useSerialNumberHistory = (serialNumberId: string) => {
  return useQuery({
    queryKey: ['serial-history', serialNumberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('serial_number_history')
        .select('*')
        .eq('serial_number_id', serialNumberId)
        .order('event_date', { ascending: false });

      if (error) throw error;
      return data as SerialNumberHistory[];
    },
    enabled: !!serialNumberId,
  });
};

/**
 * Get traceability for a serial number (using function)
 */
export const useSerialTraceability = (serialNumberId: string) => {
  return useQuery({
    queryKey: ['serial-traceability', serialNumberId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_serial_traceability', {
        p_serial_number_id: serialNumberId,
      });

      if (error) throw error;
      return data as Array<{
        event_type: string;
        event_date: string;
        description: string;
        location: string;
        customer_name: string;
        order_number: string;
        performed_by_name: string;
      }>;
    },
    enabled: !!serialNumberId,
  });
};

/**
 * Create a history entry manually
 */
export const useCreateSerialHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (history: Omit<SerialNumberHistory, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('serial_number_history')
        .insert(history)
        .select()
        .single();

      if (error) throw error;
      return data as SerialNumberHistory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['serial-history', data.serial_number_id] });
      queryClient.invalidateQueries({ queryKey: ['serial-traceability', data.serial_number_id] });
    },
  });
};

// =====================================================
// HOOKS: Warranty Claims
// =====================================================

/**
 * Get warranty claims
 */
export const useWarrantyClaims = (options?: {
  serialNumberId?: string;
  customerId?: string;
  status?: WarrantyClaim['status'];
}) => {
  return useQuery({
    queryKey: ['warranty-claims', options],
    queryFn: async () => {
      let query = supabase
        .from('warranty_claims')
        .select('*')
        .order('claim_date', { ascending: false });

      if (options?.serialNumberId) {
        query = query.eq('serial_number_id', options.serialNumberId);
      }
      if (options?.customerId) {
        query = query.eq('customer_id', options.customerId);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WarrantyClaim[];
    },
  });
};

/**
 * Create a warranty claim
 */
export const useCreateWarrantyClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (claim: Omit<WarrantyClaim, 'id' | 'created_at' | 'updated_at' | 'claim_number'>) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Generate claim number
      const claimNumber = `WC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data, error } = await supabase
        .from('warranty_claims')
        .insert({
          ...claim,
          claim_number: claimNumber,
          reported_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WarrantyClaim;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warranty-claims'] });
      queryClient.invalidateQueries({ queryKey: ['serial-number', data.serial_number_id] });
      queryClient.invalidateQueries({ queryKey: ['serial-history', data.serial_number_id] });
    },
  });
};

/**
 * Update warranty claim
 */
export const useUpdateWarrantyClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      claimId,
      updates,
    }: {
      claimId: string;
      updates: Partial<WarrantyClaim>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      if (updates.status === 'resolved' && !updates.resolved_at) {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user?.id;
      }

      const { data, error } = await supabase
        .from('warranty_claims')
        .update(updates)
        .eq('id', claimId)
        .select()
        .single();

      if (error) throw error;
      return data as WarrantyClaim;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warranty-claims'] });
      queryClient.invalidateQueries({ queryKey: ['serial-number', data.serial_number_id] });
    },
  });
};

// =====================================================
// HOOKS: Repairs
// =====================================================

/**
 * Get repairs
 */
export const useRepairs = (options?: {
  serialNumberId?: string;
  warrantyClaimId?: string;
  status?: Repair['status'];
}) => {
  return useQuery({
    queryKey: ['repairs', options],
    queryFn: async () => {
      let query = supabase
        .from('repairs')
        .select('*')
        .order('received_date', { ascending: false });

      if (options?.serialNumberId) {
        query = query.eq('serial_number_id', options.serialNumberId);
      }
      if (options?.warrantyClaimId) {
        query = query.eq('warranty_claim_id', options.warrantyClaimId);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Repair[];
    },
  });
};

/**
 * Create a repair
 */
export const useCreateRepair = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repair: Omit<Repair, 'id' | 'created_at' | 'updated_at' | 'repair_number'>) => {
      // Generate repair number
      const repairNumber = `REP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data, error } = await supabase
        .from('repairs')
        .insert({
          ...repair,
          repair_number: repairNumber,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Repair;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['serial-number', data.serial_number_id] });
      queryClient.invalidateQueries({ queryKey: ['serial-history', data.serial_number_id] });
    },
  });
};

/**
 * Update repair
 */
export const useUpdateRepair = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      repairId,
      updates,
    }: {
      repairId: string;
      updates: Partial<Repair>;
    }) => {
      const { data, error } = await supabase
        .from('repairs')
        .update(updates)
        .eq('id', repairId)
        .select()
        .single();

      if (error) throw error;
      return data as Repair;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['serial-number', data.serial_number_id] });
    },
  });
};

// =====================================================
// HOOKS: Utility Functions
// =====================================================

/**
 * Check if serial number is available for sale
 */
export const useCheckSerialAvailability = (serialNumber: string) => {
  return useQuery({
    queryKey: ['serial-availability', serialNumber],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_serial_available_for_sale', {
        p_serial_number: serialNumber,
      });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!serialNumber,
  });
};



