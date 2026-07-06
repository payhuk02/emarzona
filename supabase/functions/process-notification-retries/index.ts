/**
 * Edge Function: Process Notification Retries
 * Date: 2 Février 2025
 *
 * Traite les retries de notifications en attente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireCronOrInternalAuth } from '../_shared/edge-auth-utils.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authFailure = requireCronOrInternalAuth(req, corsHeaders);
  if (authFailure) return authFailure;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les retries en attente
    const { data: retries, error: fetchError } = await supabase
      .from('notification_retries')
      .select(
        'id,user_id,notification_type,channel,notification_data,attempt_number,max_attempts,next_retry_at,status'
      )
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .order('next_retry_at', { ascending: true })
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!retries || retries.length === 0) {
      return new Response(JSON.stringify({ processed: 0, succeeded: 0, failed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let succeeded = 0;
    let failed = 0;

    // Traiter chaque retry
    for (const retry of retries) {
      try {
        const notification = retry.notification_data as any;
        const channel = retry.channel;

        // Réessayer l'envoi selon le canal
        let success = false;

        if (channel === 'in_app') {
          const { error } = await supabase.from('notifications').insert({
            user_id: notification.user_id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata || {},
            action_url: notification.action_url,
            action_label: notification.action_label,
            priority: notification.priority || 'medium',
            is_read: false,
          });
          success = !error;
        } else if (channel === 'email') {
          const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET') ?? '';
          const invokeHeaders: Record<string, string> = {};
          if (internalSecret) {
            invokeHeaders['x-internal-secret'] = internalSecret;
          }

          const { data: emailResult, error: emailError } = await supabase.functions.invoke(
            'send-notification-email',
            { body: notification, headers: invokeHeaders }
          );

          success =
            !emailError &&
            (emailResult as { success?: boolean; skipped?: boolean } | null)?.success !== false;
        } else {
          const { error } = await supabase.functions.invoke(`send-${channel}`, {
            body: notification,
          });
          success = !error;
        }

        if (success) {
          // Marquer comme complété
          await supabase
            .from('notification_retries')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', retry.id);

          succeeded++;
        } else {
          // Vérifier si on a atteint le max
          if (retry.attempt_number >= retry.max_attempts) {
            // Envoyer à dead letter queue
            await supabase.from('notification_dead_letters').insert({
              user_id: retry.user_id,
              notification_type: retry.notification_type,
              channel: retry.channel,
              notification_data: retry.notification_data,
              error_message: 'Max retries reached',
              failed_at: new Date().toISOString(),
              retry_id: retry.id,
            });

            // Marquer comme failed
            await supabase
              .from('notification_retries')
              .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: 'Max retries reached',
              })
              .eq('id', retry.id);

            failed++;
          } else {
            // Programmer le prochain retry (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, retry.attempt_number), 30000);
            const nextRetryAt = new Date(Date.now() + delay);

            await supabase
              .from('notification_retries')
              .update({
                attempt_number: retry.attempt_number + 1,
                next_retry_at: nextRetryAt.toISOString(),
              })
              .eq('id', retry.id);
          }
        }
      } catch (error) {
        // En cas d'erreur, marquer comme failed si max atteint
        if (retry.attempt_number >= retry.max_attempts) {
          await supabase
            .from('notification_retries')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', retry.id);

          failed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        processed: retries.length,
        succeeded,
        failed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing notification retries:', error);
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
