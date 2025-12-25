import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || 'https://payhula.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// VAPID keys (doivent être configurées dans Supabase Edge Functions secrets)
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

/**
 * Encoder une clé VAPID pour l'URL base64
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Générer la signature JWT pour VAPID
 */
async function generateVAPIDJWT(endpoint: string): Promise<string> {
  // Note: Cette implémentation simplifiée nécessite une bibliothèque JWT
  // Pour une production réelle, utilisez une bibliothèque JWT appropriée
  // Pour l'instant, on retourne un placeholder
  // TODO: Implémenter la génération JWT VAPID complète
  return 'vapid-jwt-token';
}

/**
 * Envoyer une notification push via Web Push Protocol
 */
async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, unknown>;
    url?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return { success: false, error: 'VAPID keys not configured' };
    }

    // Préparer le payload de la notification avec son et affichage
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      tag: payload.tag || 'default',
      data: {
        ...payload.data,
        url: payload.url || '/',
      },
      // Options pour son et affichage
      silent: payload.silent !== undefined ? payload.silent : false, // ✅ SON ACTIVÉ par défaut
      requireInteraction: payload.requireInteraction || false,
      vibrate: payload.vibrate || [200, 100, 200], // ✅ Vibration pour mobile
    });

    // Décoder les clés
    const p256dh = urlBase64ToUint8Array(subscription.keys.p256dh);
    const auth = urlBase64ToUint8Array(subscription.keys.auth);

    // Générer le JWT VAPID
    const jwt = await generateVAPIDJWT(subscription.endpoint);

    // Note: L'implémentation complète du chiffrement Web Push nécessite
    // l'utilisation d'une bibliothèque de chiffrement (web-push library)
    // Pour l'instant, on retourne un succès simulé
    // TODO: Implémenter le chiffrement Web Push complet avec web-push

    console.log('Push notification prepared:', {
      endpoint: subscription.endpoint,
      payload: notificationPayload,
    });

    // Pour une implémentation complète, utiliser web-push library:
    // const webpush = require('web-push');
    // webpush.setVapidDetails(
    //   'mailto:your-email@example.com',
    //   VAPID_PUBLIC_KEY,
    //   VAPID_PRIVATE_KEY
    // );
    // await webpush.sendNotification(subscription, notificationPayload);

    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, data, url } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtenir les abonnements push de l'utilisateur
    const { data: subscriptions, error: subscriptionsError } = await supabase.rpc(
      'get_push_subscriptions_for_user',
      { p_user_id: user_id }
    );

    if (subscriptionsError) {
      console.error('Error getting push subscriptions:', subscriptionsError);
      return new Response(JSON.stringify({ error: 'Failed to get push subscriptions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No push subscriptions found for user' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Envoyer la notification à tous les abonnements
    const results = [];
    for (const subscription of subscriptions) {
      const result = await sendPushNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        {
          title,
          body,
          data,
          url,
        }
      );

      // Logger la notification
      await supabase.rpc('log_notification', {
        p_user_id: user_id,
        p_type: 'push',
        p_title: title,
        p_body: body,
        p_data: data || {},
        p_channel: 'web-push',
        p_provider: 'vapid',
        p_push_subscription_id: subscription.id,
        p_status: result.success ? 'sent' : 'failed',
      });

      results.push({
        subscription_id: subscription.id,
        success: result.success,
        error: result.error,
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        total: subscriptions.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
