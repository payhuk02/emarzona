/**
 * Supabase Edge Function: Send Email
 * Utilise Resend API pour envoyer des emails transactionnels
 *
 * Templates supportés:
 * - payment_success: Email de confirmation de paiement réussi
 * - payment_failed: Email de notification d'échec de paiement
 * - payment_cancelled: Email de notification d'annulation de paiement
 * - payment_refunded: Email de notification de remboursement
 * - payment_pending: Email de notification de paiement en attente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@payhula.com';
const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Payhula';

interface EmailRequest {
  to: string;
  subject: string;
  template?: string; // Template basique (optionnel si html fourni)
  html?: string; // HTML personnalisé (depuis templates centralisés)
  data?: Record<string, unknown>; // Données pour template basique
}

/**
 * Génère le contenu HTML de l'email selon le template
 */
function generateEmailHTML(template: string, data: Record<string, unknown>): string {
  const customerName = (data.customerName as string) || 'Client';
  const amount = (data.amount as number) || 0;
  const currency = (data.currency as string) || 'XOF';
  const orderNumber = (data.orderNumber as string) || '';
  const transactionId = (data.transactionId as string) || '';
  const reason = (data.reason as string) || '';

  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'XOF' ? 0 : 2,
  }).format(amount);

  switch (template) {
    case 'payment_success':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Paiement confirmé</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">✅ Paiement confirmé</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Bonjour ${customerName},</p>
            <p>Votre paiement a été confirmé avec succès !</p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Montant:</strong> ${formattedAmount}</p>
              ${orderNumber ? `<p style="margin: 10px 0 0 0;"><strong>Commande:</strong> #${orderNumber}</p>` : ''}
              ${transactionId ? `<p style="margin: 10px 0 0 0;"><strong>Transaction:</strong> ${transactionId}</p>` : ''}
            </div>
            <p>Merci pour votre achat !</p>
            <p style="margin-top: 30px;">Cordialement,<br>L'équipe Payhula</p>
          </div>
        </body>
        </html>
      `;

    case 'payment_failed':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Paiement échoué</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">❌ Paiement échoué</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Bonjour ${customerName},</p>
            <p>Votre paiement de ${formattedAmount} a échoué.</p>
            ${
              reason
                ? `<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>Raison:</strong> ${reason}</p>
            </div>`
                : ''
            }
            <p>Veuillez réessayer ou contacter le support si le problème persiste.</p>
            <p style="margin-top: 30px;">Cordialement,<br>L'équipe Payhula</p>
          </div>
        </body>
        </html>
      `;

    case 'payment_cancelled':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Paiement annulé</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🚫 Paiement annulé</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Bonjour ${customerName},</p>
            <p>Votre paiement de ${formattedAmount} a été annulé.</p>
            ${reason ? `<p><strong>Raison:</strong> ${reason}</p>` : ''}
            <p>Si vous souhaitez finaliser votre commande, vous pouvez réessayer à tout moment.</p>
            <p style="margin-top: 30px;">Cordialement,<br>L'équipe Payhula</p>
          </div>
        </body>
        </html>
      `;

    case 'payment_refunded':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Remboursement effectué</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">💸 Remboursement effectué</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Bonjour ${customerName},</p>
            <p>Un remboursement de ${formattedAmount} a été effectué sur votre compte.</p>
            ${reason ? `<p><strong>Raison:</strong> ${reason}</p>` : ''}
            ${transactionId ? `<p><strong>Transaction:</strong> ${transactionId}</p>` : ''}
            <p>Le remboursement devrait apparaître sur votre compte bancaire dans les 5-10 jours ouvrables.</p>
            <p style="margin-top: 30px;">Cordialement,<br>L'équipe Payhula</p>
          </div>
        </body>
        </html>
      `;

    case 'payment_pending':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Paiement en attente</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">⏳ Paiement en attente</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Bonjour ${customerName},</p>
            <p>Votre paiement de ${formattedAmount} est en cours de traitement.</p>
            <p>Vous recevrez une notification une fois le paiement confirmé.</p>
            <p style="margin-top: 30px;">Cordialement,<br>L'équipe Payhula</p>
          </div>
        </body>
        </html>
      `;

    default:
      return `
        <!DOCTYPE html>
        <html>
        <body>
          <p>Bonjour ${customerName},</p>
          <p>${JSON.stringify(data, null, 2)}</p>
        </body>
        </html>
      `;
  }
}

serve(async req => {
  // Gérer les requêtes CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Vérifier la clé API Resend
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parser la requête
    const { to, subject, template, html, data }: EmailRequest = await req.json();

    // Valider les paramètres
    if (!to || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: to, subject' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Utiliser HTML fourni si disponible (depuis templates centralisés)
    // Sinon générer depuis template basique
    const htmlContent = html || (template ? generateEmailHTML(template, data || {}) : '');

    if (!htmlContent) {
      return new Response(JSON.stringify({ error: 'Missing HTML content or template' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Envoyer l'email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: errorData }), {
        status: resendResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await resendResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
        to,
        subject,
        template: template || (html ? 'custom' : 'unknown'),
        htmlProvided: !!html,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-email function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
