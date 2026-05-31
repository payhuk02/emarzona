/**
 * Traite les envois admin programmés (cron toutes les 5 min)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import {
  createBroadcastPopup,
  payloadFromBroadcastRow,
  processBroadcastDelivery,
} from '../_shared/admin-broadcast-processor.ts';

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const expectedCronSecret = Deno.env.get('CRON_SECRET') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cronSecret = req.headers.get('x-cron-secret');
    const isAuthenticated =
      !!expectedCronSecret && cronSecret?.trim() === expectedCronSecret.trim();

    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();
    const limit = 10;

    const { data: scheduled, error: fetchError } = await supabase
      .from('admin_broadcasts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const row of scheduled || []) {
      const broadcastId = row.id as string;

      await supabase
        .from('admin_broadcasts')
        .update({ status: 'processing' })
        .eq('id', broadcastId);

      try {
        const payload = payloadFromBroadcastRow(row as Record<string, unknown>);
        let popupId: string | null = null;

        if (payload.channels.includes('popup')) {
          const { data: existingPopup } = await supabase
            .from('platform_popup_messages')
            .select('id')
            .eq('broadcast_id', broadcastId)
            .maybeSingle();

          if (existingPopup?.id) {
            popupId = existingPopup.id;
            await supabase
              .from('platform_popup_messages')
              .update({ is_active: true, starts_at: now, updated_at: now })
              .eq('id', popupId);
          } else {
            popupId = await createBroadcastPopup(
              supabase,
              broadcastId,
              payload,
              (row.created_by as string) ?? null
            );
          }
        }

        const delivery = await processBroadcastDelivery(supabase, broadcastId, payload);
        const hasPopupOnly =
          payload.channels.includes('popup') &&
          !payload.channels.includes('email') &&
          !payload.channels.includes('in_app');
        const finalStatus =
          delivery.stats.failed === 0 || hasPopupOnly
            ? 'completed'
            : delivery.stats.sent === 0 && !popupId
              ? 'failed'
              : 'partial';

        await supabase
          .from('admin_broadcasts')
          .update({
            status: finalStatus,
            stats: { ...delivery.stats, popup_created: Boolean(popupId) },
            error_message: delivery.errors.length ? delivery.errors.slice(0, 20).join('; ') : null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', broadcastId);

        results.push({ id: broadcastId, status: finalStatus });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await supabase
          .from('admin_broadcasts')
          .update({
            status: 'failed',
            error_message: message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', broadcastId);
        results.push({ id: broadcastId, status: 'failed', error: message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('process-scheduled-broadcasts error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
