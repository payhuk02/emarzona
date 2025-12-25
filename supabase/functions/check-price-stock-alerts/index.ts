// Edge Function: Vérifier et envoyer les notifications pour les alertes de prix et de stock
// Cette fonction doit être appelée périodiquement (cron job) pour vérifier les alertes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceAlert {
  alert_id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  current_price: number;
  target_price: number;
  currency: string;
  price_drop: number;
  price_drop_percent: number;
}

interface StockAlert {
  alert_id: string;
  user_id: string;
  product_id: string;
  product_name: string;
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const alertsToNotify: {
      priceAlerts: PriceAlert[];
      stockAlerts: StockAlert[];
    } = {
      priceAlerts: [],
      stockAlerts: [],
    };

    // 1. Vérifier les alertes de prix
    const { data: priceAlerts, error: priceError } = await supabaseClient.rpc('check_price_alerts');

    if (priceError) {
      console.error('Error checking price alerts:', priceError);
    } else if (priceAlerts && priceAlerts.length > 0) {
      alertsToNotify.priceAlerts = priceAlerts as PriceAlert[];

      // Marquer les alertes comme notifiées
      const alertIds = priceAlerts.map((alert: PriceAlert) => alert.alert_id);
      await supabaseClient
        .from('price_alerts')
        .update({
          notified: true,
          notification_sent_at: new Date().toISOString(),
        })
        .in('id', alertIds)
        .catch((err) => console.error('Error updating price alerts:', err));
    }

    // 2. Vérifier les alertes de stock
    const { data: stockAlerts, error: stockError } = await supabaseClient.rpc('check_stock_alerts');

    if (stockError) {
      console.error('Error checking stock alerts:', stockError);
    } else if (stockAlerts && stockAlerts.length > 0) {
      alertsToNotify.stockAlerts = stockAlerts as StockAlert[];

      // Marquer les alertes comme notifiées
      const alertIds = stockAlerts.map((alert: StockAlert) => alert.alert_id);
      await supabaseClient
        .from('stock_alerts')
        .update({
          notified: true,
          notification_sent_at: new Date().toISOString(),
        })
        .in('id', alertIds)
        .catch((err) => console.error('Error updating stock alerts:', err));
    }

    // 3. Envoyer les notifications
    const notifications = [];

    // Notifications pour les alertes de prix
    for (const alert of alertsToNotify.priceAlerts) {
      // Récupérer l'email de l'utilisateur
      const { data: userData } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('id', alert.user_id)
        .single();

      if (userData?.email) {
        // Créer une notification in-app
        const { error: notifError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: alert.user_id,
            type: 'price_alert',
            title: 'Alerte de prix',
            message: `Le prix de "${alert.product_name}" est maintenant de ${alert.current_price.toLocaleString('fr-FR')} ${alert.currency}. Prix cible: ${alert.target_price.toLocaleString('fr-FR')} ${alert.currency}`,
            metadata: {
              product_id: alert.product_id,
              product_name: alert.product_name,
              current_price: alert.current_price,
              target_price: alert.target_price,
              currency: alert.currency,
              price_drop: alert.price_drop,
              price_drop_percent: alert.price_drop_percent,
            },
          });

        if (notifError) {
          console.error('Error creating price alert notification:', notifError);
        } else {
          notifications.push({
            type: 'price_alert',
            user_id: alert.user_id,
            product_name: alert.product_name,
          });
        }

        // TODO: Envoyer un email (intégrer avec un service d'email)
        console.log(`Price alert notification sent to ${userData.email} for product ${alert.product_name}`);
      }
    }

    // Notifications pour les alertes de stock
    for (const alert of alertsToNotify.stockAlerts) {
      // Récupérer l'email de l'utilisateur
      const { data: userData } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('id', alert.user_id)
        .single();

      if (userData?.email) {
        // Créer une notification in-app
        const { error: notifError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: alert.user_id,
            type: 'stock_alert',
            title: 'Alerte de stock',
            message: `"${alert.product_name}" est maintenant en stock !`,
            metadata: {
              product_id: alert.product_id,
              product_name: alert.product_name,
            },
          });

        if (notifError) {
          console.error('Error creating stock alert notification:', notifError);
        } else {
          notifications.push({
            type: 'stock_alert',
            user_id: alert.user_id,
            product_name: alert.product_name,
          });
        }

        // TODO: Envoyer un email (intégrer avec un service d'email)
        console.log(`Stock alert notification sent to ${userData.email} for product ${alert.product_name}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        priceAlertsCount: alertsToNotify.priceAlerts.length,
        stockAlertsCount: alertsToNotify.stockAlerts.length,
        notificationsSent: notifications.length,
        notifications,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-price-stock-alerts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});







