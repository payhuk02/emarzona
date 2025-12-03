/**
 * Système de Tracking Automatique pour les Colis
 * Date: 31 Janvier 2025
 * 
 * Polling automatique des APIs transporteurs pour mettre à jour le statut des colis
 * Support: FedEx, DHL, UPS, Chronopost (à venir)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { FedExAdapter as FedExAdapterImpl } from './carriers/fedex-adapter';
import { DHLAdapter as DHLAdapterImpl } from './carriers/dhl-adapter';
import { UPSAdapter as UPSAdapterImpl } from './carriers/ups-adapter';
import { ChronopostAdapter as ChronopostAdapterImpl } from './carriers/chronopost-adapter';

export interface TrackingUpdate {
  event_type: string;
  event_code?: string;
  description: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  event_timestamp: string;
  raw_data?: Record<string, unknown>;
}

export interface CarrierTrackingResponse {
  success: boolean;
  tracking_number: string;
  status: string;
  events: TrackingUpdate[];
  estimated_delivery?: string;
  current_location?: string;
  error?: string;
}

/**
 * Interface pour les adaptateurs de transporteurs
 */
interface CarrierAdapter {
  name: string;
  track: (trackingNumber: string, carrierConfig?: Record<string, unknown>) => Promise<CarrierTrackingResponse>;
}

/**
 * Adaptateur FedEx
 */
class FedExAdapter implements CarrierAdapter {
  name = 'FedEx';
  private adapter: FedExAdapterImpl;

  constructor(config?: Record<string, unknown>) {
    this.adapter = new FedExAdapterImpl(config);
  }

  async track(trackingNumber: string, carrierConfig?: Record<string, unknown>): Promise<CarrierTrackingResponse> {
    return this.adapter.track(trackingNumber, carrierConfig);
  }
}

/**
 * Adaptateur DHL
 */
class DHLAdapter implements CarrierAdapter {
  name = 'DHL';
  private adapter: DHLAdapterImpl;

  constructor(config?: Record<string, unknown>) {
    this.adapter = new DHLAdapterImpl(config);
  }

  async track(trackingNumber: string, carrierConfig?: Record<string, unknown>): Promise<CarrierTrackingResponse> {
    return this.adapter.track(trackingNumber, carrierConfig);
  }
}

/**
 * Adaptateur UPS
 */
class UPSAdapter implements CarrierAdapter {
  name = 'UPS';
  private adapter: UPSAdapterImpl;

  constructor(config?: Record<string, unknown>) {
    this.adapter = new UPSAdapterImpl(config);
  }

  async track(trackingNumber: string, carrierConfig?: Record<string, unknown>): Promise<CarrierTrackingResponse> {
    return this.adapter.track(trackingNumber, carrierConfig);
  }
}

/**
 * Adaptateur Chronopost
 */
class ChronopostAdapter implements CarrierAdapter {
  name = 'Chronopost';
  private adapter: ChronopostAdapterImpl;

  constructor(config?: Record<string, unknown>) {
    this.adapter = new ChronopostAdapterImpl(config);
  }

  async track(trackingNumber: string, carrierConfig?: Record<string, unknown>): Promise<CarrierTrackingResponse> {
    return this.adapter.track(trackingNumber, carrierConfig);
  }
}

/**
 * Factory pour obtenir l'adaptateur approprié
 */
function getCarrierAdapter(carrierName: string, config?: Record<string, unknown>): CarrierAdapter | null {
  const adapters: Record<string, (config?: Record<string, unknown>) => CarrierAdapter> = {
    FedEx: (cfg) => new FedExAdapter(cfg),
    DHL: (cfg) => new DHLAdapter(cfg),
    UPS: (cfg) => new UPSAdapter(cfg),
    Chronopost: (cfg) => new ChronopostAdapter(cfg),
  };

  const adapterFactory = adapters[carrierName];
  return adapterFactory ? adapterFactory(config) : null;
}

/**
 * Met à jour le statut d'un shipment avec les données de tracking
 */
async function updateShipmentStatus(
  shipmentId: string,
  status: string,
  events: TrackingUpdate[],
  estimatedDelivery?: string
): Promise<void> {
  try {
    // Mettre à jour le shipment
    const updateData: Record<string, unknown> = {
      status,
      last_tracking_update: new Date().toISOString(),
    };

    if (estimatedDelivery) {
      updateData.estimated_delivery = estimatedDelivery;
    }

    // Mettre à jour les événements de tracking
    if (events.length > 0) {
      const { data: existingEvents } = await supabase
        .from('shipping_tracking_events')
        .select('event_timestamp, event_type')
        .eq('shipment_id', shipmentId);

      const existingEventKeys = new Set(
        (existingEvents || []).map(
          (e) => `${e.event_timestamp}_${e.event_type}`
        )
      );

      // Insérer uniquement les nouveaux événements
      const newEvents = events.filter(
        (e) => !existingEventKeys.has(`${e.event_timestamp}_${e.event_type}`)
      );

      if (newEvents.length > 0) {
        const eventsToInsert = newEvents.map((event) => ({
          shipment_id: shipmentId,
          event_type: event.event_type,
          event_code: event.event_code,
          description: event.description,
          location: event.location,
          event_timestamp: event.event_timestamp,
          raw_data: event.raw_data || {},
        }));

        await supabase.from('shipping_tracking_events').insert(eventsToInsert);
      }

      // Mettre à jour le statut final si livré
      if (status === 'delivered') {
        updateData.actual_delivery = new Date().toISOString();
      }
    }

    await supabase.from('shipments').update(updateData).eq('id', shipmentId);

    logger.info('Shipment status updated', { shipmentId, status, eventsCount: events.length });
  } catch (error) {
    logger.error('Error updating shipment status', { error, shipmentId });
    throw error;
  }
}

/**
 * Track un shipment spécifique
 */
export async function trackShipment(shipmentId: string): Promise<boolean> {
  try {
    // Récupérer les informations du shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select(`
        *,
        carrier:shipping_carriers (
          id,
          name,
          api_config
        )
      `)
      .eq('id', shipmentId)
      .single();

    if (shipmentError || !shipment) {
      logger.error('Shipment not found', { shipmentId, error: shipmentError });
      return false;
    }

    if (!shipment.tracking_number) {
      logger.warn('No tracking number for shipment', { shipmentId });
      return false;
    }

    const carrier = shipment.carrier as { name: string; api_config?: Record<string, unknown> } | null;

    if (!carrier) {
      logger.warn('No carrier for shipment', { shipmentId });
      return false;
    }

    // Obtenir l'adaptateur approprié
    const adapter = getCarrierAdapter(carrier.name, carrier.api_config);

    if (!adapter) {
      logger.warn('No adapter for carrier', { carrierName: carrier.name, shipmentId });
      return false;
    }

    // Appeler l'API de tracking
    const trackingResponse = await adapter.track(shipment.tracking_number, carrier.api_config);

    if (!trackingResponse.success) {
      logger.error('Tracking failed', {
        shipmentId,
        trackingNumber: shipment.tracking_number,
        error: trackingResponse.error,
      });
      return false;
    }

    // Mettre à jour le shipment
    await updateShipmentStatus(
      shipmentId,
      trackingResponse.status,
      trackingResponse.events,
      trackingResponse.estimated_delivery
    );

    return true;
  } catch (error) {
    logger.error('Error tracking shipment', { error, shipmentId });
    return false;
  }
}

/**
 * Track tous les shipments en attente de mise à jour
 */
export async function trackPendingShipments(): Promise<{ success: number; failed: number }> {
  try {
    // Récupérer les shipments qui nécessitent un tracking
    // (en transit, pas livrés, avec tracking number)
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select(`
        id,
        tracking_number,
        status,
        last_tracking_update,
        carrier:shipping_carriers (
          id,
          name,
          api_config
        )
      `)
      .in('status', ['label_created', 'picked_up', 'in_transit', 'out_for_delivery'])
      .not('tracking_number', 'is', null);

    if (error) {
      logger.error('Error fetching pending shipments', { error });
      return { success: 0, failed: 0 };
    }

    if (!shipments || shipments.length === 0) {
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    // Tracker chaque shipment
    for (const shipment of shipments) {
      const result = await trackShipment(shipment.id);
      if (result) {
        successCount++;
      } else {
        failedCount++;
      }

      // Petite pause pour éviter de surcharger les APIs
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    logger.info('Tracking batch completed', { total: shipments.length, success: successCount, failed: failedCount });

    return { success: successCount, failed: failedCount };
  } catch (error) {
    logger.error('Error tracking pending shipments', { error });
    return { success: 0, failed: 0 };
  }
}

/**
 * Envoie des notifications aux clients pour les mises à jour de tracking
 */
export async function sendTrackingNotifications(shipmentId: string): Promise<void> {
  try {
    // Récupérer le shipment avec la commande et le client
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(`
        *,
        order:orders (
          id,
          customer_id,
          customer:customers (
            id,
            email,
            full_name
          )
        )
      `)
      .eq('id', shipmentId)
      .single();

    if (error || !shipment) {
      logger.error('Shipment not found for notifications', { shipmentId, error });
      return;
    }

    const order = shipment.order as {
      customer?: { email?: string; full_name?: string };
    } | null;

    if (!order?.customer?.email) {
      logger.warn('No customer email for shipment', { shipmentId });
      return;
    }

    // Récupérer les derniers événements de tracking
    const { data: events } = await supabase
      .from('shipping_tracking_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('event_timestamp', { ascending: false })
      .limit(5);

    // Envoyer l'email de notification via SendGrid
    try {
      const { sendTrackingUpdateEmail } = await import('@/lib/sendgrid');
      
      await sendTrackingUpdateEmail({
        userEmail: order.customer.email,
        userName: order.customer.full_name || 'Client',
        userId: order.customer.id,
        orderId: shipment.order_id,
        trackingNumber: shipment.tracking_number || '',
        trackingUrl: shipment.tracking_url || '',
        status: shipment.status,
        carrierName: shipment.carrier?.name || 'Transporteur',
        estimatedDelivery: shipment.estimated_delivery 
          ? new Date(shipment.estimated_delivery).toLocaleDateString('fr-FR')
          : undefined,
        latestEvent: events && events.length > 0 ? {
          description: events[0].description,
          location: events[0].location 
            ? `${events[0].location.city || ''}${events[0].location.city && events[0].location.country ? ', ' : ''}${events[0].location.country || ''}`
            : undefined,
          timestamp: events[0].event_timestamp,
        } : undefined,
      });

      logger.info('Tracking notification email sent', {
        shipmentId,
        customerEmail: order.customer.email,
        status: shipment.status,
      });
    } catch (emailError) {
      logger.error('Error sending tracking notification email', {
        error: emailError,
        shipmentId,
        customerEmail: order.customer.email,
      });
      // Ne pas faire échouer la fonction si l'email échoue
    }
  } catch (error) {
    logger.error('Error sending tracking notifications', { error, shipmentId });
  }
}

