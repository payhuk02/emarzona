/**
 * Shipping Carriers Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les transporteurs et génération d'étiquettes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { DHLService, FedExService } from '@/integrations/shipping';

// =====================================================
// TYPES
// =====================================================

export interface ShippingCarrier {
  id: string;
  store_id: string;
  carrier_name: 'DHL' | 'FedEx' | 'UPS' | 'Chronopost' | 'DHL_Express' | 'FedEx_Express' | 'UPS_Express' | 'Custom';
  display_name: string;
  api_key?: string;
  api_secret?: string;
  api_url?: string;
  account_number?: string;
  meter_number?: string;
  is_active: boolean;
  is_default: boolean;
  test_mode: boolean;
  available_services: string[];
  requires_signature: boolean;
  requires_insurance: boolean;
  requires_customs: boolean;
  supported_countries: string[];
  supported_states: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ShippingLabel {
  id: string;
  store_id: string;
  order_id: string;
  carrier_id: string;
  label_number: string;
  tracking_number?: string;
  service_type: string;
  service_name?: string;
  shipping_cost: number;
  currency: string;
  insurance_cost: number;
  total_cost: number;
  label_url?: string;
  label_format: string;
  weight?: number;
  weight_unit: string;
  dimensions?: Record<string, any>;
  from_address: Record<string, any>;
  to_address: Record<string, any>;
  status: 'pending' | 'generated' | 'printed' | 'voided' | 'error';
  api_response?: Record<string, any>;
  api_request_id?: string;
  generated_at?: string;
  printed_at?: string;
  voided_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingTrackingEvent {
  id: string;
  shipping_label_id: string;
  tracking_number: string;
  event_type: string;
  event_description: string;
  event_location?: string;
  latitude?: number;
  longitude?: number;
  event_timestamp: string;
  metadata: Record<string, any>;
  source: string;
  created_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useShippingCarriers - Récupère les transporteurs configurés
 */
export const useShippingCarriers = (storeId?: string) => {
  return useQuery({
    queryKey: ['shipping-carriers', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('shipping_carriers')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching shipping carriers', { error, storeId });
        throw error;
      }

      return (data || []) as ShippingCarrier[];
    },
    enabled: !!storeId,
  });
};

/**
 * useCalculateCarrierRates - Calculer tarifs avec transporteur
 */
export const useCalculateCarrierRates = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      carrierId,
      from,
      to,
      weight,
      dimensions,
    }: {
      carrierId: string;
      from: { country: string; postalCode: string };
      to: { country: string; postalCode: string };
      weight: number;
      dimensions?: { length: number; width: number; height: number };
    }) => {
      // Récupérer config transporteur
      const { data: carrier, error: carrierError } = await supabase
        .from('shipping_carriers')
        .select('*')
        .eq('id', carrierId)
        .single();

      if (carrierError || !carrier) {
        throw new Error('Transporteur non trouvé');
      }

      // Initialiser service selon transporteur
      let rates: any[] = [];
      
      if (carrier.carrier_name === 'DHL' || carrier.carrier_name === 'DHL_Express') {
        const dhlService = new DHLService({
          apiKey: carrier.api_key || '',
          apiSecret: carrier.api_secret || '',
          apiUrl: carrier.api_url,
          testMode: carrier.test_mode,
        });
        
        rates = await dhlService.getRates({
          from,
          to,
          weight,
          weightUnit: 'kg',
          dimensions,
        });
      } else if (carrier.carrier_name === 'FedEx' || carrier.carrier_name === 'FedEx_Express') {
        const fedexService = new FedExService({
          apiKey: carrier.api_key || '',
          apiSecret: carrier.api_secret || '',
          accountNumber: carrier.account_number || '',
          meterNumber: carrier.meter_number,
          apiUrl: carrier.api_url,
          testMode: carrier.test_mode,
        });
        
        rates = await fedexService.getRates({
          from,
          to,
          weight,
          weightUnit: 'kg',
          dimensions,
        });
      }

      return rates;
    },
    onError: (error: any) => {
      logger.error('Error in useCalculateCarrierRates', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de calculer les tarifs',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useGenerateShippingLabel - Générer une étiquette d'expédition
 */
export const useGenerateShippingLabel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      orderId,
      carrierId,
      serviceType,
      fromAddress,
      toAddress,
      weight,
      dimensions,
    }: {
      orderId: string;
      carrierId: string;
      serviceType: string;
      fromAddress: Record<string, any>;
      toAddress: Record<string, any>;
      weight: number;
      dimensions?: { length: number; width: number; height: number };
    }) => {
      // Récupérer commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('store_id')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Commande non trouvée');
      }

      // Récupérer transporteur
      const { data: carrier, error: carrierError } = await supabase
        .from('shipping_carriers')
        .select('*')
        .eq('id', carrierId)
        .single();

      if (carrierError || !carrier) {
        throw new Error('Transporteur non trouvé');
      }

      // Générer numéro d'étiquette
      const { data: labelNumber } = await supabase.rpc('generate_shipping_label_number');

      // Générer étiquette via API transporteur
      let labelResponse: any;
      
      if (carrier.carrier_name === 'DHL' || carrier.carrier_name === 'DHL_Express') {
        const dhlService = new DHLService({
          apiKey: carrier.api_key || '',
          apiSecret: carrier.api_secret || '',
          apiUrl: carrier.api_url,
          testMode: carrier.test_mode,
        });
        
        labelResponse = await dhlService.createLabel({
          shipment: {
            shipper: fromAddress,
            recipient: toAddress,
            packages: [{
              weight,
              dimensions: dimensions || { length: 0, width: 0, height: 0 },
            }],
            serviceType,
          },
        });
      } else if (carrier.carrier_name === 'FedEx' || carrier.carrier_name === 'FedEx_Express') {
        const fedexService = new FedExService({
          apiKey: carrier.api_key || '',
          apiSecret: carrier.api_secret || '',
          accountNumber: carrier.account_number || '',
          meterNumber: carrier.meter_number,
          apiUrl: carrier.api_url,
          testMode: carrier.test_mode,
        });
        
        labelResponse = await fedexService.createLabel({
          shipment: {
            shipper: fromAddress,
            recipient: toAddress,
            packages: [{
              weight,
              dimensions: dimensions || { length: 0, width: 0, height: 0 },
            }],
            serviceType,
          },
        });
      } else {
        throw new Error('Transporteur non supporté');
      }

      // Sauvegarder étiquette en base
      const { data: label, error: labelError } = await supabase
        .from('shipping_labels')
        .insert({
          store_id: order.store_id,
          order_id: orderId,
          carrier_id: carrierId,
          label_number: labelNumber,
          tracking_number: labelResponse.trackingNumber,
          service_type: serviceType,
          shipping_cost: labelResponse.shippingCost,
          currency: labelResponse.currency,
          label_url: labelResponse.labelUrl,
          from_address: fromAddress,
          to_address: toAddress,
          weight,
          dimensions,
          status: 'generated',
          generated_at: new Date().toISOString(),
          api_response: labelResponse,
        })
        .select()
        .single();

      if (labelError) {
        logger.error('Error saving shipping label', { error: labelError });
        throw labelError;
      }

      return label as ShippingLabel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-labels'] });
      toast({
        title: '✅ Étiquette générée',
        description: 'L\'étiquette d\'expédition a été générée avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useGenerateShippingLabel', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de générer l\'étiquette',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useShippingLabels - Récupère les étiquettes d'un store
 */
export const useShippingLabels = (storeId?: string) => {
  return useQuery({
    queryKey: ['shipping-labels', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('shipping_labels')
        .select(`
          *,
          carrier:shipping_carriers (
            id,
            display_name,
            carrier_name
          ),
          order:orders (
            id,
            order_number
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching shipping labels', { error, storeId });
        throw error;
      }

      return (data || []) as ShippingLabel[];
    },
    enabled: !!storeId,
  });
};

/**
 * useTrackShipment - Suivre un colis
 */
export const useTrackShipment = (trackingNumber?: string) => {
  return useQuery({
    queryKey: ['track-shipment', trackingNumber],
    queryFn: async () => {
      if (!trackingNumber) throw new Error('Tracking number manquant');

      const { data, error } = await supabase
        .from('shipping_tracking_events')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .order('event_timestamp', { ascending: false });

      if (error) {
        logger.error('Error fetching tracking events', { error, trackingNumber });
        throw error;
      }

      return (data || []) as ShippingTrackingEvent[];
    },
    enabled: !!trackingNumber,
    refetchInterval: 300000, // Refetch toutes les 5 minutes
  });
};

