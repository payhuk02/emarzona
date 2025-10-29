import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type ShippingStatus =
  | 'pending'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

export type ShippingCarrier =
  | 'dhl'
  | 'fedex'
  | 'ups'
  | 'usps'
  | 'la_poste'
  | 'colissimo'
  | 'chronopost'
  | 'other';

export interface ShippingInfo {
  id: string;
  order_id: string;
  order_number?: string;
  customer_name?: string;
  customer_email?: string;
  status: ShippingStatus;
  carrier?: ShippingCarrier;
  carrier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipping_method?: string;
  shipping_cost?: number;
  currency?: string;
  weight?: number; // in grams
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  shipped_date?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  shipping_address: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  origin_address?: {
    name: string;
    line1: string;
    city: string;
    postal_code: string;
    country: string;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  id: string;
  shipping_id: string;
  status: ShippingStatus;
  location?: string;
  description: string;
  timestamp: string;
  created_at: string;
}

export interface ShippingStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  in_transit: number;
  delivered: number;
  failed: number;
  avg_delivery_time_days?: number;
  on_time_delivery_rate?: number; // percentage
}

// ============================================================================
// FETCH SHIPMENTS
// ============================================================================

export function useShipments(storeId: string, filters?: {
  status?: ShippingStatus;
  carrier?: ShippingCarrier;
  date_from?: string;
  date_to?: string;
}) {
  return useQuery({
    queryKey: ['shipments', storeId, filters],
    queryFn: async () => {
      let query = supabase
        .from('shipments')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.carrier) {
        query = query.eq('carrier', filters.carrier);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ShippingInfo[];
    },
    enabled: !!storeId,
  });
}

// ============================================================================
// GET SINGLE SHIPMENT
// ============================================================================

export function useShipment(shipmentId: string) {
  return useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', shipmentId)
        .single();

      if (error) throw error;
      return data as ShippingInfo;
    },
    enabled: !!shipmentId,
  });
}

// ============================================================================
// GET TRACKING EVENTS
// ============================================================================

export function useTrackingEvents(shipmentId: string) {
  return useQuery({
    queryKey: ['tracking-events', shipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('shipping_id', shipmentId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return (data || []) as TrackingEvent[];
    },
    enabled: !!shipmentId,
  });
}

// ============================================================================
// GET SHIPPING STATS
// ============================================================================

export function useShippingStats(storeId: string, dateRange?: {
  start: string;
  end: string;
}) {
  return useQuery({
    queryKey: ['shipping-stats', storeId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('shipments')
        .select('*')
        .eq('store_id', storeId);

      if (dateRange?.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange?.end) {
        query = query.lte('created_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      const shipments = (data || []) as ShippingInfo[];

      const stats: ShippingStats = {
        total: shipments.length,
        pending: shipments.filter((s) => s.status === 'pending').length,
        processing: shipments.filter((s) => s.status === 'processing').length,
        shipped: shipments.filter((s) => s.status === 'shipped' || s.status === 'in_transit').length,
        in_transit: shipments.filter((s) => s.status === 'in_transit').length,
        delivered: shipments.filter((s) => s.status === 'delivered').length,
        failed: shipments.filter((s) => s.status === 'failed').length,
      };

      // Calculate avg delivery time
      const deliveredShipments = shipments.filter(
        (s) => s.status === 'delivered' && s.shipped_date && s.actual_delivery_date
      );
      if (deliveredShipments.length > 0) {
        const totalDays = deliveredShipments.reduce((sum, s) => {
          const shipped = new Date(s.shipped_date!).getTime();
          const delivered = new Date(s.actual_delivery_date!).getTime();
          const days = (delivered - shipped) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        stats.avg_delivery_time_days = totalDays / deliveredShipments.length;
      }

      // Calculate on-time delivery rate
      const shipmentsWithEstimates = shipments.filter(
        (s) =>
          s.status === 'delivered' &&
          s.estimated_delivery_date &&
          s.actual_delivery_date
      );
      if (shipmentsWithEstimates.length > 0) {
        const onTime = shipmentsWithEstimates.filter((s) => {
          const estimated = new Date(s.estimated_delivery_date!).getTime();
          const actual = new Date(s.actual_delivery_date!).getTime();
          return actual <= estimated;
        }).length;
        stats.on_time_delivery_rate = (onTime / shipmentsWithEstimates.length) * 100;
      }

      return stats;
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// CREATE SHIPMENT
// ============================================================================

export function useCreateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shipment: Omit<ShippingInfo, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('shipments')
        .insert([
          {
            ...shipment,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as ShippingInfo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-stats'] });
    },
  });
}

// ============================================================================
// UPDATE SHIPMENT STATUS
// ============================================================================

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shipmentId,
      status,
      notes,
    }: {
      shipmentId: string;
      status: ShippingStatus;
      notes?: string;
    }) => {
      const updates: Partial<ShippingInfo> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) updates.notes = notes;
      if (status === 'shipped' || status === 'in_transit') {
        updates.shipped_date = new Date().toISOString();
      }
      if (status === 'delivered') {
        updates.actual_delivery_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', shipmentId)
        .select()
        .single();

      if (error) throw error;

      // Add tracking event
      await supabase.from('tracking_events').insert([
        {
          shipping_id: shipmentId,
          status,
          description: notes || `Statut mis à jour: ${status}`,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipment', variables.shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['tracking-events', variables.shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['shipping-stats'] });
    },
  });
}

// ============================================================================
// UPDATE TRACKING INFO
// ============================================================================

export function useUpdateTrackingInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shipmentId,
      carrier,
      trackingNumber,
      trackingUrl,
    }: {
      shipmentId: string;
      carrier?: ShippingCarrier;
      trackingNumber?: string;
      trackingUrl?: string;
    }) => {
      const { data, error } = await supabase
        .from('shipments')
        .update({
          carrier,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shipmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipment', variables.shipmentId] });
    },
  });
}

// ============================================================================
// ADD TRACKING EVENT
// ============================================================================

export function useAddTrackingEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Omit<TrackingEvent, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('tracking_events')
        .insert([
          {
            ...event,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as TrackingEvent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-events', data.shipping_id] });
    },
  });
}

// ============================================================================
// DELETE SHIPMENT
// ============================================================================

export function useDeleteShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shipmentId: string) => {
      // First delete tracking events
      await supabase.from('tracking_events').delete().eq('shipping_id', shipmentId);

      // Then delete shipment
      const { error } = await supabase.from('shipments').delete().eq('id', shipmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-stats'] });
    },
  });
}

// ============================================================================
// GENERATE TRACKING URL
// ============================================================================

export function generateTrackingUrl(carrier: ShippingCarrier, trackingNumber: string): string {
  const urls: Record<ShippingCarrier, string> = {
    dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    la_poste: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
    colissimo: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
    chronopost: `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${trackingNumber}`,
    other: '',
  };

  return urls[carrier] || '';
}

