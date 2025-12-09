/**
 * Edge Function pour Tracking Automatique des Shipments
 * Date: 31 Janvier 2025
 * 
 * Cette fonction peut être appelée via un cron job Supabase
 * pour tracker automatiquement tous les shipments en attente
 * avec intégration DHL et FedEx
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Obtenir token d'accès FedEx (OAuth 2.0)
 */
async function getFedExAccessToken(apiKey: string, apiSecret: string, testMode: boolean): Promise<string> {
  const tokenUrl = testMode
    ? 'https://apis-sandbox.fedex.com/oauth/token'
    : 'https://apis.fedex.com/oauth/token';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FedEx OAuth error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Tracker un shipment avec FedEx
 */
async function trackFedExShipment(
  trackingNumber: string,
  apiKey: string,
  apiSecret: string,
  testMode: boolean
): Promise<any[]> {
  const accessToken = await getFedExAccessToken(apiKey, apiSecret, testMode);
  const apiUrl = testMode ? 'https://apis-sandbox.fedex.com' : 'https://apis.fedex.com';
  const trackingUrl = `${apiUrl}/track/v1/trackingnumbers`;

  const response = await fetch(trackingUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-locale': 'fr_FR',
    },
    body: JSON.stringify({
      includeDetailedScans: true,
      trackingInfo: [
        {
          trackingNumberInfo: {
            trackingNumber: trackingNumber,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`FedEx API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  const events: any[] = [];
  const output = data.output || {};
  const completeTrackResults = output.completeTrackResults || [];

  completeTrackResults.forEach((result: any) => {
    const trackResults = result.trackResults || [];
    trackResults.forEach((trackResult: any) => {
      const scanEvents = trackResult.scanEvents || [];
      scanEvents.forEach((event: any) => {
        events.push({
          eventType: event.eventType || 'unknown',
          eventDescription: event.eventDescription || '',
          eventLocation: event.scanLocation?.city || '',
          eventTimestamp: event.date || new Date().toISOString(),
        });
      });
    });
  });

  return events.sort((a, b) => 
    new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime()
  );
}

/**
 * Obtenir token d'accès DHL (OAuth 2.0)
 */
async function getDHLAccessToken(apiKey: string, apiSecret: string, testMode: boolean): Promise<string> {
  const tokenUrl = testMode
    ? 'https://api-sandbox.dhl.com/rest/authenticate'
    : 'https://api.dhl.com/rest/authenticate';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: apiKey,
      password: apiSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DHL OAuth error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token || data.token || btoa(`${apiKey}:${apiSecret}`);
}

/**
 * Tracker un shipment avec DHL
 */
async function trackDHLShipment(
  trackingNumber: string,
  apiKey: string,
  apiSecret: string,
  testMode: boolean
): Promise<any[]> {
  const accessToken = await getDHLAccessToken(apiKey, apiSecret, testMode);
  const apiUrl = testMode ? 'https://api-sandbox.dhl.com' : 'https://api.dhl.com';
  const trackingUrl = `${apiUrl}/tracking/v1/shipments?trackingNumber=${trackingNumber}`;

  const response = await fetch(trackingUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`DHL API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  const events: any[] = [];
  const shipments = data.shipments || [];

  shipments.forEach((shipment: any) => {
    const eventsData = shipment.events || [];
    eventsData.forEach((event: any) => {
      events.push({
        eventType: event.eventCode || 'unknown',
        eventDescription: event.description || '',
        eventLocation: event.location?.address?.addressLocality || '',
        eventTimestamp: event.timestamp || new Date().toISOString(),
      });
    });
  });

  return events;
}

/**
 * Tracker un shipment selon son transporteur
 */
async function trackShipmentByCarrier(
  shipment: any,
  carrier: any,
  supabase: any
): Promise<{ success: boolean; events?: any[]; error?: string }> {
  try {
    if (!shipment.tracking_number) {
      return { success: false, error: 'No tracking number' };
    }

    let events: any[] = [];

    // Tracker selon le transporteur
    if (carrier.carrier_name === 'FedEx' || carrier.carrier_name === 'FedEx_Express') {
      events = await trackFedExShipment(
        shipment.tracking_number,
        carrier.api_key || '',
        carrier.api_secret || '',
        carrier.test_mode || true
      );
    } else if (carrier.carrier_name === 'DHL' || carrier.carrier_name === 'DHL_Express') {
      events = await trackDHLShipment(
        shipment.tracking_number,
        carrier.api_key || '',
        carrier.api_secret || '',
        carrier.test_mode || true
      );
    } else {
      return { success: false, error: 'Carrier not supported for automatic tracking' };
    }

    // Déterminer le statut final
    let newStatus = shipment.status;
    if (events.length > 0) {
      const latestEvent = events[0];
      const eventType = latestEvent.eventType?.toLowerCase() || '';

      if (eventType.includes('delivered') || eventType.includes('livré')) {
        newStatus = 'delivered';
      } else if (eventType.includes('out_for_delivery') || eventType.includes('en livraison')) {
        newStatus = 'out_for_delivery';
      } else if (eventType.includes('in_transit') || eventType.includes('en transit')) {
        newStatus = 'in_transit';
      } else if (eventType.includes('picked_up') || eventType.includes('pris en charge')) {
        newStatus = 'picked_up';
      }
    }

    // Mettre à jour le shipment
    const updateData: any = {
      status: newStatus,
      last_tracking_update: new Date().toISOString(),
      tracking_events: events,
    };

    if (newStatus === 'delivered') {
      updateData.actual_delivery = new Date().toISOString();
    }

    await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', shipment.id);

    // Insérer les événements de tracking
    for (const event of events) {
      await supabase.from('shipping_tracking_events').upsert({
        shipment_id: shipment.id,
        tracking_number: shipment.tracking_number,
        event_type: event.eventType,
        event_description: event.eventDescription,
        event_location: event.eventLocation,
        event_timestamp: event.eventTimestamp,
        metadata: event,
        source: 'api',
      }, {
        onConflict: 'tracking_number,event_timestamp,event_type',
      });
    }

    return { success: true, events };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer tous les shipments en attente avec leurs transporteurs
    const { data: shipments, error: fetchError } = await supabase
      .from('shipments')
      .select(`
        *,
        carrier:shipping_carriers(*)
      `)
      .in('status', ['pending', 'label_created', 'picked_up', 'in_transit'])
      .not('tracking_number', 'is', null);

    if (fetchError) {
      throw fetchError;
    }

    if (!shipments || shipments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending shipments to track',
          tracked: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Tracker chaque shipment
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const shipment of shipments) {
      try {
        if (!shipment.carrier) {
          failedCount++;
          errors.push(`Shipment ${shipment.id}: No carrier configured`);
          continue;
        }

        const result = await trackShipmentByCarrier(shipment, shipment.carrier, supabase);

        if (!result.success) {
          failedCount++;
          errors.push(`Shipment ${shipment.id}: ${result.error || 'Unknown error'}`);
        } else {
          successCount++;
        }

        // Petite pause pour éviter de surcharger
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        failedCount++;
        errors.push(`Shipment ${shipment.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Tracked ${successCount} shipments successfully, ${failedCount} failed`,
        tracked: successCount,
        failed: failedCount,
        total: shipments.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

