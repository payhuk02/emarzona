/**
 * FedEx Shipping Hooks
 * Date: 28 octobre 2025
 * 
 * React Query hooks pour intégration FedEx
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getFedexService } from '@/services/fedex';
import type { FedexShipmentRequest, FedexRateRequest } from '@/services/fedex';
import { useToast } from '@/hooks/use-toast';

const SHIPPING_CARRIER_FIELDS = 'id, store_id, name, code, description, is_active, is_default, credentials, config, supports_tracking, supports_labels, supports_pickup, created_at, updated_at';
const SHIPMENT_FIELDS = 'id, order_id, carrier_id, store_id, tracking_number, tracking_url, service_type, status, weight_value, shipping_cost, currency, ship_from, ship_to, estimated_delivery, actual_delivery, tracking_events, created_at, updated_at';
const ORDER_FIELDS = 'id, store_id, customer_id, order_number, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, currency, status, payment_status, created_at, updated_at';
const SHIPPING_LABEL_FIELDS = 'id, shipment_id, label_format, label_url, label_data, is_printed, printed_at, created_at, updated_at';

// =====================================================
// TYPES
// =====================================================

export interface ShipmentAddress {
  name?: string;
  city?: string;
  country?: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  state?: string;
  phone?: string;
}

export interface TrackingEvent {
  id?: string;
  status?: string;
  location?: string;
  timestamp?: string;
  description?: string;
}

export interface ShipmentLabel {
  id: string;
  shipment_id: string;
  label_url?: string;
  label_data?: string;
  created_at?: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  carrier_id: string;
  store_id: string;
  tracking_number: string;
  tracking_url?: string;
  service_type: string;
  status: string;
  weight_value: number;
  shipping_cost?: number;
  currency?: string;
  ship_from?: ShipmentAddress;
  ship_to?: ShipmentAddress;
  estimated_delivery?: string;
  actual_delivery?: string;
  tracking_events?: TrackingEvent[];
  labels?: ShipmentLabel[];
  order?: {
    order_number?: string;
    total_amount?: number;
  };
  created_at: string;
  updated_at?: string;
}

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Get all shipments for a store
 */
export const useShipments = (storeId: string) => {
  return useQuery({
    queryKey: ['shipments', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          ${SHIPMENT_FIELDS},
          carrier:shipping_carriers(${SHIPPING_CARRIER_FIELDS}),
          order:orders(order_number, total_amount)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Shipment[];
    },
    enabled: !!storeId,
  });
};

/**
 * Get single shipment
 */
export const useShipment = (shipmentId: string) => {
  return useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          ${SHIPMENT_FIELDS},
          carrier:shipping_carriers(${SHIPPING_CARRIER_FIELDS}),
          order:orders(${ORDER_FIELDS}),
          labels:shipping_labels(${SHIPPING_LABEL_FIELDS})
        `)
        .eq('id', shipmentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!shipmentId,
  });
};

/**
 * Get shipments by order
 */
export const useOrderShipments = (orderId: string) => {
  return useQuery({
    queryKey: ['order-shipments', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          ${SHIPMENT_FIELDS},
          carrier:shipping_carriers(${SHIPPING_CARRIER_FIELDS}),
          labels:shipping_labels(${SHIPPING_LABEL_FIELDS})
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
};

/**
 * Get tracking information (real-time from FedEx)
 */
export const useFedexTracking = (trackingNumber: string, enabled = true) => {
  return useQuery({
    queryKey: ['fedex-tracking', trackingNumber],
    queryFn: async () => {
      const trackingData = await getFedexService().getTracking(trackingNumber);
      return trackingData;
    },
    enabled: !!trackingNumber && enabled,
    refetchInterval: 60000, // Refresh every minute
  });
};

/**
 * Get shipping rates
 */
export const useFedexRates = (request: FedexRateRequest | null) => {
  return useQuery({
    queryKey: ['fedex-rates', request],
    queryFn: async () => {
      if (!request) return [];
      const rates = await getFedexService().getRates(request);
      return rates;
    },
    enabled: !!request,
  });
};

/**
 * Get FedEx carrier
 */
export const useFedexCarrier = () => {
  return useQuery({
    queryKey: ['fedex-carrier'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_carriers')
        .select(SHIPPING_CARRIER_FIELDS)
        .eq('code', 'fedex')
        .single();

      if (error) throw error;
      return data;
    },
  });
};

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Create shipment with FedEx
 */
export const useCreateFedexShipment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      orderId,
      storeId,
      shipmentRequest,
    }: {
      orderId: string;
      storeId: string;
      shipmentRequest: FedexShipmentRequest;
    }) => {
      // 1. Create shipment with FedEx API
      const fedexResponse = await getFedexService().createShipment(shipmentRequest);

      if (!fedexResponse.success) {
        throw new Error('Failed to create FedEx shipment');
      }

      // 2. Get FedEx carrier ID
      const { data: carrier } = await supabase
        .from('shipping_carriers')
        .select('id')
        .eq('code', 'fedex')
        .single();

      if (!carrier) throw new Error('FedEx carrier not found');

      // 3. Save shipment to database
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          order_id: orderId,
          carrier_id: carrier.id,
          store_id: storeId,
          tracking_number: fedexResponse.tracking_number,
          tracking_url: fedexResponse.tracking_url,
          service_type: fedexResponse.service_type,
          status: 'label_created',
          weight_value: shipmentRequest.package.weight,
          ship_from: shipmentRequest.ship_from,
          ship_to: shipmentRequest.ship_to,
          shipping_cost: fedexResponse.shipping_cost,
          currency: fedexResponse.currency,
          estimated_delivery: fedexResponse.estimated_delivery,
        })
        .select()
        .single();

      if (shipmentError) throw shipmentError;

      // 4. Save shipping label
      const { error: labelError } = await supabase.from('shipping_labels').insert({
        shipment_id: shipment.id,
        label_format: 'PDF',
        label_url: fedexResponse.label_url,
        label_data: fedexResponse.label_base64,
      });

      if (labelError) throw labelError;

      return { shipment, fedexResponse };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.storeId] });
      queryClient.invalidateQueries({
        queryKey: ['order-shipments', variables.orderId],
      });

      toast({
        title: '✅ Expédition créée',
        description: 'L\'étiquette d\'expédition a été générée avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de créer l\'expédition';
      toast({
        title: '❌ Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Update shipment tracking (sync with FedEx)
 */
export const useUpdateShipmentTracking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shipmentId: string) => {
      // 1. Get shipment
      const { data: shipment } = await supabase
        .from('shipments')
        .select(SHIPMENT_FIELDS)
        .eq('id', shipmentId)
        .single();

      if (!shipment || !shipment.tracking_number) {
        throw new Error('Shipment not found');
      }

      // 2. Get latest tracking from FedEx
      const trackingData = await getFedexService().getTracking(
        shipment.tracking_number
      );

      if (!trackingData.success) {
        throw new Error('Failed to get tracking info');
      }

      // 3. Update shipment status
      const { data: updated, error } = await supabase
        .from('shipments')
        .update({
          status: trackingData.status.toLowerCase(),
          tracking_events: trackingData.events,
          last_tracking_update: new Date().toISOString(),
          actual_delivery: trackingData.actual_delivery,
        })
        .eq('id', shipmentId)
        .select()
        .single();

      if (error) throw error;

      // 4. Save tracking events
      for (const event of trackingData.events) {
        await supabase.from('shipping_tracking_events').insert({
          shipment_id: shipmentId,
          event_type: event.status,
          event_code: event.status_code,
          description: event.description,
          location: event.location,
          event_timestamp: event.timestamp,
          raw_data: event,
        });
      }

      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shipment', data.id] });
      queryClient.invalidateQueries({ queryKey: ['shipments', data.store_id] });
      queryClient.invalidateQueries({
        queryKey: ['fedex-tracking', data.tracking_number],
      });
    },
  });
};

/**
 * Cancel shipment
 */
export const useCancelShipment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (shipmentId: string) => {
      // 1. Get shipment
      const { data: shipment } = await supabase
        .from('shipments')
        .select(SHIPMENT_FIELDS)
        .eq('id', shipmentId)
        .single();

      if (!shipment) throw new Error('Shipment not found');

      // 2. Cancel with FedEx (if not already delivered)
      if (shipment.status !== 'delivered' && shipment.tracking_number) {
        await getFedexService().cancelShipment(shipment.tracking_number);
      }

      // 3. Update database
      const { data: updated, error } = await supabase
        .from('shipments')
        .update({ status: 'cancelled' })
        .eq('id', shipmentId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', data.store_id] });
      toast({
        title: '✅ Expédition annulée',
        description: 'L\'expédition a été annulée avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: '❌ Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Request pickup
 */
export const useRequestPickup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      storeId: string;
      address: ShipmentAddress;
      pickupDate: string;
      packageCount: number;
      totalWeight: number;
    }) => {
      // 1. Request pickup from FedEx
      const pickupResponse = await mockFedexService.requestPickup({
        address: data.address,
        pickupDate: data.pickupDate,
        packageCount: data.packageCount,
        totalWeight: data.totalWeight,
      });

      if (!pickupResponse.success) {
        throw new Error('Failed to request pickup');
      }

      // 2. Get FedEx carrier
      const { data: carrier } = await supabase
        .from('shipping_carriers')
        .select('id')
        .eq('code', 'fedex')
        .single();

      // 3. Save to database
      const { data: pickup, error } = await supabase
        .from('shipping_pickup_requests')
        .insert({
          store_id: data.storeId,
          carrier_id: carrier?.id,
          confirmation_number: pickupResponse.confirmation_number,
          pickup_address: data.address,
          pickup_date: data.pickupDate,
          package_count: data.packageCount,
          total_weight: data.totalWeight,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return pickup;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pickup-requests', data.store_id] });
      toast({
        title: '✅ Ramassage planifié',
        description: `Confirmation: ${data.confirmation_number}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Print shipping label
 */
export const usePrintLabel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (labelId: string) => {
      // 1. Get label
      const { data: label } = await supabase
        .from('shipping_labels')
        .select(SHIPPING_LABEL_FIELDS)
        .eq('id', labelId)
        .single();

      if (!label) throw new Error('Label not found');

      // 2. Mark as printed
      const { data: updated, error } = await supabase
        .from('shipping_labels')
        .update({
          is_printed: true,
          printed_at: new Date().toISOString(),
        })
        .eq('id', labelId)
        .select()
        .single();

      if (error) throw error;

      // 3. Trigger browser print (or download)
      if (label.label_url) {
        window.open(label.label_url, '_blank');
      } else if (label.label_data) {
        // Create blob from base64 and download
        const byteCharacters = atob(label.label_data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let  i= 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }

      return updated;
    },
    onSuccess: () => {
      toast({
        title: '🖨️ Étiquette imprimée',
        description: 'L\'étiquette a été envoyée à l\'impression.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: '❌ Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};







