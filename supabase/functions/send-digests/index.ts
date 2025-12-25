/**
 * Edge Function: Send Notification Digests
 * Date: 2 Février 2025
 *
 * Envoie les digests de notifications (quotidien/hebdomadaire)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer le paramètre period (daily ou weekly)
    const { period = 'daily' } = await req.json().catch(() => ({}));

    if (period !== 'daily' && period !== 'weekly') {
      throw new Error('Invalid period. Must be "daily" or "weekly"');
    }

    // Récupérer les utilisateurs avec préférences de digest
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id, email_digest_frequency')
      .eq('email_digest_frequency', period);

    if (prefError) {
      throw prefError;
    }

    if (!preferences || preferences.length === 0) {
      return new Response(JSON.stringify({ processed: 0, sent: 0, failed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let sent = 0;
    let failed = 0;

    // Calculer la date de début selon la période
    const now = new Date();
    const startDate =
      period === 'daily'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : (() => {
            // Weekly: lundi de cette semaine
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(now.setDate(diff));
          })();

    // Traiter chaque utilisateur
    for (const pref of preferences) {
      try {
        // Récupérer les notifications non urgentes non lues
        const { data: notifications, error: notifError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', pref.user_id)
          .eq('is_read', false)
          .in('priority', ['low', 'normal'])
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        if (notifError) {
          throw notifError;
        }

        if (!notifications || notifications.length === 0) {
          continue; // Pas de notifications à regrouper
        }

        // Grouper par type
        const byType: Record<string, number> = {};
        for (const notif of notifications) {
          byType[notif.type] = (byType[notif.type] || 0) + 1;
        }

        // Construire le message du digest
        const periodText = period === 'daily' ? "aujourd'hui" : 'cette semaine';
        let message = `Vous avez ${notifications.length} notification${notifications.length > 1 ? 's' : ''} ${periodText}.\n\n`;

        for (const [type, count] of Object.entries(byType)) {
          message += `• ${type}: ${count}\n`;
        }

        message += '\nConsultez vos notifications pour plus de détails.';

        // Envoyer le digest
        const { error: sendError } = await supabase.functions.invoke('send-unified-notification', {
          body: {
            user_id: pref.user_id,
            type: 'system_announcement',
            title: `📬 Résumé ${period === 'daily' ? 'quotidien' : 'hebdomadaire'} - ${notifications.length} notification${notifications.length > 1 ? 's' : ''}`,
            message,
            priority: 'low',
            channels: ['email', 'in_app'],
            metadata: {
              digest_period: period,
              digest_summary: { total: notifications.length, byType },
              notification_count: notifications.length,
            },
          },
        });

        if (sendError) {
          throw sendError;
        }

        // Marquer les notifications comme lues
        const notificationIds = notifications.map(n => n.id);
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', notificationIds);

        sent++;
      } catch (error) {
        console.error(`Error sending digest for user ${pref.user_id}:`, error);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        processed: preferences.length,
        sent,
        failed,
        period,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending digests:', error);
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
