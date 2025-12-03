/**
 * Edge Function pour Tracking Automatique des Shipments
 * Date: 31 Janvier 2025
 * 
 * Cette fonction peut être appelée via un cron job Supabase
 * pour tracker automatiquement tous les shipments en attente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Récupérer tous les shipments en attente
    const { data: shipments, error: fetchError } = await supabase
      .from('shipments')
      .select('*')
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
        // Appeler la fonction RPC de tracking
        const { error: trackError } = await supabase.rpc('track_shipment', {
          p_shipment_id: shipment.id,
        });

        if (trackError) {
          failedCount++;
          errors.push(`Shipment ${shipment.id}: ${trackError.message}`);
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

