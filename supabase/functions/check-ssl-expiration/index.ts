/**
 * Edge Function: Vérification de l'expiration des certificats SSL
 * Date: 2025-02-02
 * Description: Vérifie périodiquement l'expiration des certificats SSL et envoie des alertes
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SSLCertificateStatus {
  id: string;
  store_id: string;
  domain: string;
  certificate_expires_at: string | null;
  certificate_valid: boolean;
}

interface StoreNotificationSettings {
  email_enabled: boolean;
  email_ssl_expiring: boolean;
  email_ssl_expired: boolean;
  notification_email: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer tous les certificats SSL actifs
    const { data: sslStatuses, error: sslError } = await supabaseClient
      .from('ssl_certificate_status')
      .select('id, store_id, domain, certificate_expires_at, certificate_valid')
      .eq('certificate_valid', true)
      .not('certificate_expires_at', 'is', null);

    if (sslError) {
      console.error('Error fetching SSL certificates:', sslError);
      return new Response(
        JSON.stringify({ error: sslError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sslStatuses || sslStatuses.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No SSL certificates to check', checked: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const alertsSent: string[] = [];
    const expiringSoon: SSLCertificateStatus[] = [];
    const expired: SSLCertificateStatus[] = [];

    // Vérifier chaque certificat
    for (const sslStatus of sslStatuses) {
      if (!sslStatus.certificate_expires_at) continue;

      const expiresAt = new Date(sslStatus.certificate_expires_at);
      const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Certificat expiré
      if (expiresAt <= now) {
        expired.push(sslStatus);
        await updateSSLStatus(supabaseClient, sslStatus.id, false);
        await sendSSLAlert(supabaseClient, sslStatus, 'expired');
        alertsSent.push(sslStatus.domain);
      }
      // Certificat expire dans moins de 30 jours
      else if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
        expiringSoon.push(sslStatus);
        // Envoyer une alerte seulement si pas déjà envoyée aujourd'hui
        const shouldAlert = await shouldSendAlert(supabaseClient, sslStatus.id, 'expiring');
        if (shouldAlert) {
          await sendSSLAlert(supabaseClient, sslStatus, 'expiring', daysUntilExpiration);
          alertsSent.push(sslStatus.domain);
        }
      }
    }

    // Mettre à jour last_checked_at pour tous les certificats vérifiés
    await supabaseClient
      .from('ssl_certificate_status')
      .update({ last_checked_at: now.toISOString() })
      .in('id', sslStatuses.map(s => s.id));

    return new Response(
      JSON.stringify({
        message: 'SSL expiration check completed',
        checked: sslStatuses.length,
        expiring_soon: expiringSoon.length,
        expired: expired.length,
        alerts_sent: alertsSent.length,
        domains: alertsSent,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-ssl-expiration:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateSSLStatus(supabase: any, sslId: string, isValid: boolean): Promise<void> {
  await supabase
    .from('ssl_certificate_status')
    .update({ certificate_valid: isValid })
    .eq('id', sslId);
}

async function shouldSendAlert(supabase: any, sslId: string, alertType: 'expiring' | 'expired'): Promise<boolean> {
  // Vérifier si une alerte a déjà été envoyée aujourd'hui
  // Pour simplifier, on vérifie dans la table stores si un email a été envoyé
  // Dans une vraie implémentation, on aurait une table store_ssl_alerts
  // Pour l'instant, on envoie toujours (peut être amélioré avec une table dédiée)
  return true;
}

async function sendSSLAlert(
  supabase: any,
  sslStatus: SSLCertificateStatus,
  alertType: 'expiring' | 'expired',
  daysUntilExpiration?: number
): Promise<void> {
  try {
    // Récupérer les informations de la boutique
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, user_id, contact_email')
      .eq('id', sslStatus.store_id)
      .single();

    if (storeError || !store) {
      console.error('Error fetching store:', storeError);
      return;
    }

    // Récupérer les paramètres de notifications de la boutique
    const { data: notificationSettings } = await supabase
      .from('store_notification_settings')
      .select('email_enabled, email_ssl_expiring, email_ssl_expired, notification_email')
      .eq('store_id', sslStatus.store_id)
      .single();

    const settings: StoreNotificationSettings = notificationSettings || {
      email_enabled: true,
      email_ssl_expiring: true,
      email_ssl_expired: true,
      notification_email: null,
    };

    // Vérifier si les notifications sont activées
    if (!settings.email_enabled) return;
    if (alertType === 'expiring' && !settings.email_ssl_expiring) return;
    if (alertType === 'expired' && !settings.email_ssl_expired) return;

    // Déterminer l'email de destination
    const recipientEmail = settings.notification_email || store.contact_email;
    if (!recipientEmail) {
      console.warn(`No email address found for store ${store.id}`);
      return;
    }

    // Préparer le sujet et le message
    const subject = alertType === 'expired'
      ? `⚠️ Certificat SSL expiré pour ${sslStatus.domain}`
      : `⚠️ Certificat SSL expire bientôt pour ${sslStatus.domain}`;

    const message = alertType === 'expired'
      ? `Le certificat SSL pour le domaine ${sslStatus.domain} (Boutique: ${store.name}) a expiré. Veuillez renouveler le certificat immédiatement.`
      : `Le certificat SSL pour le domaine ${sslStatus.domain} (Boutique: ${store.name}) expire dans ${daysUntilExpiration} jour(s). Veuillez renouveler le certificat.`;

    // Appeler la fonction send-email pour envoyer l'alerte
    await supabase.functions.invoke('send-email', {
      body: {
        to: recipientEmail,
        subject: subject,
        template: 'ssl-alert',
        data: {
          store_name: store.name,
          domain: sslStatus.domain,
          alert_type: alertType,
          days_until_expiration: daysUntilExpiration,
          message: message,
          action_url: `${Deno.env.get('SITE_URL') || 'https://emarzona.com'}/stores/${store.id}/settings/domain`,
        },
      },
    });

    console.log(`SSL alert sent to ${recipientEmail} for domain ${sslStatus.domain}`);
  } catch (error) {
    console.error('Error sending SSL alert:', error);
  }
}

