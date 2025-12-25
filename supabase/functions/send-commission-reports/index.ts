/**
 * Edge Function pour envoyer des rapports hebdomadaires et mensuels de commissions
 * À appeler via un cron job (hebdomadaire et mensuel)
 */
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportData {
  user_id: string;
  total_commissions: number;
  total_sales: number;
  total_clicks: number;
  currency: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { report_type, start_date, end_date } = await req.json();
    // report_type: 'weekly' | 'monthly'
    // start_date: ISO string
    // end_date: ISO string

    console.log(`Starting ${report_type} commission report...`);

    // Récupérer toutes les commissions créées dans la période
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Récupérer les commissions d'affiliation
    const { data: affiliateCommissions, error: affiliateError } = await supabase
      .from('affiliate_commissions')
      .select(`
        affiliate_id,
        commission_amount,
        order_total,
        affiliates(user_id),
        affiliate_links(total_clicks)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed');

    if (affiliateError) {
      console.error('Error fetching affiliate commissions:', affiliateError);
    }

    // Récupérer les commissions de parrainage
    const { data: referralCommissions, error: referralError } = await supabase
      .from('referral_commissions')
      .select('referrer_id, commission_amount, total_amount')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed');

    if (referralError) {
      console.error('Error fetching referral commissions:', referralError);
    }

    // Agréger les données par utilisateur
    const userReports = new Map<string, ReportData>();

    // Traiter les commissions d'affiliation
    if (affiliateCommissions) {
      for (const commission of affiliateCommissions) {
        const userId = (commission as any).affiliates?.user_id;
        if (!userId) continue;

        if (!userReports.has(userId)) {
          userReports.set(userId, {
            user_id: userId,
            total_commissions: 0,
            total_sales: 0,
            total_clicks: 0,
            currency: 'XOF',
          });
        }

        const report = userReports.get(userId)!;
        report.total_commissions += Number(commission.commission_amount || 0);
        report.total_sales += 1;
        
        // Ajouter les clics du lien d'affiliation
        const clicks = (commission as any).affiliate_links?.total_clicks || 0;
        report.total_clicks += clicks;
      }
    }

    // Traiter les commissions de parrainage
    if (referralCommissions) {
      for (const commission of referralCommissions) {
        const userId = commission.referrer_id;
        if (!userId) continue;

        if (!userReports.has(userId)) {
          userReports.set(userId, {
            user_id: userId,
            total_commissions: 0,
            total_sales: 0,
            total_clicks: 0,
            currency: 'XOF',
          });
        }

        const report = userReports.get(userId)!;
        report.total_commissions += Number(commission.commission_amount || 0);
        report.total_sales += 1;
      }
    }

    // Envoyer les notifications
    const notifications = [];
    for (const [userId, report] of userReports.entries()) {
      if (report.total_commissions > 0) {
        const title = report_type === 'weekly' ? '📊 Rapport hebdomadaire' : '📊 Rapport mensuel';
        const weekStart = startDate.toLocaleDateString('fr-FR');
        const weekEnd = endDate.toLocaleDateString('fr-FR');
        const monthName = startDate.toLocaleDateString('fr-FR', { month: 'long' });
        const year = startDate.getFullYear();

        const message = report_type === 'weekly'
          ? `Votre rapport de la semaine (${weekStart} - ${weekEnd}): ${report.total_sales} ventes, ${report.total_clicks} clics, ${report.total_commissions.toLocaleString('fr-FR')} ${report.currency} en commissions`
          : `Votre rapport du mois de ${monthName} ${year}: ${report.total_sales} ventes, ${report.total_clicks} clics, ${report.total_commissions.toLocaleString('fr-FR')} ${report.currency} en commissions`;

        notifications.push({
          user_id: userId,
          type: report_type === 'weekly' ? 'weekly_report' : 'monthly_report',
          title,
          message,
          data: {
            ...report,
            week_start: weekStart,
            week_end: weekEnd,
            month: monthName,
            year,
          },
          read: false,
        });
      }
    }

    // Insérer les notifications en batch
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
        throw notificationError;
      }
    }

    console.log(`${report_type} report sent to ${notifications.length} users`);

    return new Response(
      JSON.stringify({
        success: true,
        report_type,
        notifications_sent: notifications.length,
        period: {
          start: start_date,
          end: end_date,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in ${report_type} commission report:`, errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});







