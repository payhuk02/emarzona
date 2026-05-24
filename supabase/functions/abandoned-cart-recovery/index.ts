/**
 * Edge Function: Abandoned Cart Recovery
 * Date: 26 Janvier 2025
 *
 * Description:
 * Envoie des emails automatiques de récupération pour paniers abandonnés
 * S'exécute via cron (toutes les heures)
 *
 * Emails:
 * - Après 1h: Premier rappel
 * - Après 24h: Deuxième rappel avec code promo
 * - Après 72h: Dernier rappel
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { canSendEmailToRecipient } from '../_shared/email-compliance-utils.ts';
import { logEmailSend } from '../_shared/email-template-utils.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mail.emarzona.com';
const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Emarzona';

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
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface AbandonedCart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  customer_email: string | null;
  cart_items: any[];
  total_amount: number;
  currency: string;
  recovery_attempts: number;
  created_at: string;
  reminder_sent_at?: string[];
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les paniers abandonnés à notifier
    // - 1h: Premier rappel
    const carts1h = await supabase.rpc('get_abandoned_carts_for_recovery', {
      p_hours_ago: 1,
      p_max_attempts: 3,
    });

    // - 24h: Deuxième rappel
    const carts24h = await supabase.rpc('get_abandoned_carts_for_recovery', {
      p_hours_ago: 24,
      p_max_attempts: 3,
    });

    // - 72h: Dernier rappel
    const carts72h = await supabase.rpc('get_abandoned_carts_for_recovery', {
      p_hours_ago: 72,
      p_max_attempts: 3,
    });

    const allCarts = [
      ...(carts1h.data || []),
      ...(carts24h.data || []),
      ...(carts72h.data || []),
    ] as AbandonedCart[];

    // Dédupliquer (un panier peut correspondre à plusieurs fenêtres)
    const uniqueCarts = Array.from(new Map(allCarts.map(cart => [cart.id, cart])).values());

    const results = [];

    for (const cart of uniqueCarts) {
      // Vérifier que l'email n'a pas déjà été envoyé récemment (dans les 6 dernières heures)
      const lastReminder = cart.reminder_sent_at?.[cart.reminder_sent_at.length - 1];
      if (lastReminder) {
        const lastReminderDate = new Date(lastReminder);
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        if (lastReminderDate > sixHoursAgo) {
          continue; // Skip si déjà envoyé récemment
        }
      }

      // Déterminer le type de rappel
      const hoursSinceAbandon = Math.floor(
        (Date.now() - new Date(cart.created_at).getTime()) / (1000 * 60 * 60)
      );

      let emailSubject = '';
      let emailBody = '';
      let includeCoupon = false;

      if (hoursSinceAbandon >= 72) {
        // Dernier rappel (72h)
        emailSubject = '🎁 Dernière chance ! Finalisez votre commande';
        emailBody = `Bonjour,\n\nNous avons remarqué que vous avez laissé des articles dans votre panier il y a 72 heures.\n\nC'est votre dernière chance de profiter de ces produits !\n\nTotal de votre panier: ${cart.total_amount.toLocaleString('fr-FR')} ${cart.currency}\n\n`;
        includeCoupon = true;
      } else if (hoursSinceAbandon >= 24) {
        // Deuxième rappel (24h) avec code promo
        emailSubject = '⏰ Vous avez oublié quelque chose dans votre panier';
        emailBody = `Bonjour,\n\nVotre panier vous attend ! Profitez de 10% de réduction avec le code PROMO10.\n\nTotal: ${cart.total_amount.toLocaleString('fr-FR')} ${cart.currency}\nCode promo: PROMO10 (-10%)\n\n`;
        includeCoupon = true;
      } else {
        // Premier rappel (1h)
        emailSubject = '🛒 Vous avez oublié des articles dans votre panier';
        emailBody = `Bonjour,\n\nVous avez laissé des articles dans votre panier. Finalisez votre commande maintenant !\n\nTotal: ${cart.total_amount.toLocaleString('fr-FR')} ${cart.currency}\n\n`;
      }

      // Générer le lien de retour au panier
      const siteUrl = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
      const returnUrl = cart.user_id
        ? `${siteUrl}/cart`
        : `${siteUrl}/cart?session=${cart.session_id}`;

      emailBody += `\nRetourner au panier: ${returnUrl}\n\nÀ bientôt,\nL'équipe Emarzona`;

      if (RESEND_API_KEY && cart.customer_email) {
        try {
          const eligibility = await canSendEmailToRecipient(
            supabase,
            cart.customer_email,
            'marketing',
            cart.user_id || undefined
          );

          if (!eligibility.allowed) {
            results.push({
              cart_id: cart.id,
              email: cart.customer_email,
              status: 'skipped',
              reason: eligibility.reason || 'compliance',
            });
            continue;
          }

          const htmlBody = `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.6">${emailBody.replace(/</g, '&lt;')}</pre>`;

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
              to: [cart.customer_email],
              subject: emailSubject,
              html: htmlBody,
              tags: [{ name: 'type', value: 'abandoned_cart' }],
            }),
          });

          if (emailResponse.ok) {
            const sent = await emailResponse.json();
            await logEmailSend(supabase, {
              template_slug: 'abandoned-cart-recovery',
              recipient_email: cart.customer_email,
              user_id: cart.user_id || undefined,
              subject: emailSubject,
              html_content: htmlBody,
              sendgrid_message_id: sent.id,
              sendgrid_status: 'sent',
            });

            await supabase.rpc('mark_recovery_email_sent', {
              p_abandoned_cart_id: cart.id,
            });

            results.push({
              cart_id: cart.id,
              email: cart.customer_email,
              status: 'sent',
              attempt: cart.recovery_attempts + 1,
            });
          } else {
            results.push({
              cart_id: cart.id,
              email: cart.customer_email,
              status: 'error',
              error: await emailResponse.text(),
            });
          }
        } catch (error: unknown) {
          results.push({
            cart_id: cart.id,
            email: cart.customer_email,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } else {
        console.log('RESEND_API_KEY not configured, skipping email:', cart.id);
        results.push({
          cart_id: cart.id,
          email: cart.customer_email,
          status: 'skipped',
          reason: 'RESEND_API_KEY not configured',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: uniqueCarts.length,
        results,
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
        error: (error as Error).message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
