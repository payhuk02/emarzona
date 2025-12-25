/**
 * Edge Function: Process Scheduled Notifications
 * Date: 2 Février 2025
 *
 * Traite les notifications programmées en attente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les notifications à traiter
    const { data: scheduled, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!scheduled || scheduled.length === 0) {
      return new Response(JSON.stringify({ processed: 0, sent: 0, failed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let sent = 0;
    let failed = 0;

    // Traiter chaque notification
    for (const item of scheduled) {
      try {
        // Appeler la fonction sendUnifiedNotification via Edge Function
        const { data: result, error: sendError } = await supabase.functions.invoke(
          'send-unified-notification',
          {
            body: item.notification_data,
          }
        );

        if (sendError || !result?.success) {
          // Marquer comme échouée
          await supabase
            .from('scheduled_notifications')
            .update({
              status: 'failed',
              error_message: sendError?.message || result?.error || 'Unknown error',
            })
            .eq('id', item.id);

          failed++;
        } else {
          // Marquer comme envoyée
          await supabase
            .from('scheduled_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          sent++;
        }
      } catch (error) {
        // Marquer comme échouée
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', item.id);

        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        processed: scheduled.length,
        sent,
        failed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
