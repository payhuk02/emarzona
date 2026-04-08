/**
 * Supabase Edge Function: Send SMS
 * Utilise Twilio API pour envoyer des SMS transactionnels
 * 
 * Templates supportés:
 * - payment_success: SMS de confirmation de paiement réussi
 * - payment_failed: SMS de notification d'échec de paiement
 * - payment_cancelled: SMS de notification d'annulation de paiement
 * - payment_refunded: SMS de notification de remboursement
 * - payment_pending: SMS de notification de paiement en attente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

interface SMSRequest {
  to: string;
  template: string;
  data: Record<string, unknown>;
}

/**
 * Génère le message SMS selon le template
 */
function generateSMSMessage(template: string, data: Record<string, unknown>): string {
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
      return `✅ Payhula: Paiement de ${formattedAmount} confirmé${orderNumber ? ` - Commande #${orderNumber}` : ''}. Merci !`;

    case 'payment_failed':
      return `❌ Payhula: Paiement de ${formattedAmount} échoué${reason ? `. ${reason}` : ''}. Veuillez réessayer.`;

    case 'payment_cancelled':
      return `🚫 Payhula: Paiement de ${formattedAmount} annulé${reason ? `. ${reason}` : ''}.`;

    case 'payment_refunded':
      return `💸 Payhula: Remboursement de ${formattedAmount} effectué${transactionId ? ` - Transaction: ${transactionId}` : ''}.`;

    case 'payment_pending':
      return `⏳ Payhula: Paiement de ${formattedAmount} en attente. Vous recevrez une confirmation prochainement.`;

    default:
      return `Payhula: ${JSON.stringify(data)}`;
  }
}

/**
 * Formate le numéro de téléphone pour Twilio
 * Supprime les caractères non numériques et ajoute le préfixe si nécessaire
 */
function formatPhoneNumber(phone: string): string {
  // Supprimer tous les caractères non numériques sauf le +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si le numéro commence par 0, le remplacer par +33 (France) ou +221 (Sénégal)
  // Pour l'instant, on assume que les numéros sont déjà au format international
  if (cleaned.startsWith('0')) {
    // Ajouter le préfixe approprié selon le pays
    // Pour l'Afrique de l'Ouest, utiliser +221 pour le Sénégal
    cleaned = '+221' + cleaned.substring(1);
  }
  
  // Si le numéro ne commence pas par +, ajouter +221 par défaut
  if (!cleaned.startsWith('+')) {
    cleaned = '+221' + cleaned;
  }
  
  return cleaned;
}

serve(async (req) => {
  // Gérer les requêtes CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
      },
    });
  }

  try {
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedInternalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');
    if (!expectedInternalSecret) {
      return new Response(
        JSON.stringify({ error: 'EDGE_INTERNAL_SECRET is not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    if (!internalSecret || internalSecret.trim() !== expectedInternalSecret.trim()) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Vérifier les clés API Twilio
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Twilio credentials are not set');
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parser la requête
    const { to, template, data }: SMSRequest = await req.json();

    // Valider les paramètres
    if (!to || !template) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: to, template' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Générer le message SMS
    const message = generateSMSMessage(template, data);

    // Formater le numéro de téléphone
    const formattedTo = formatPhoneNumber(to);

    // Envoyer le SMS via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('To', formattedTo);
    formData.append('Body', message);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!twilioResponse.ok) {
      const errorData = await twilioResponse.text();
      console.error('Twilio API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to send SMS', details: errorData }),
        {
          status: twilioResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await twilioResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.sid,
        to: formattedTo,
        template,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: unknown) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});







