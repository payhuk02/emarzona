/**
 * Validateur de signatures webhook GeniusPay
 * Utilise HMAC-SHA256 pour vérifier l'authenticité des webhooks
 */

import { logger } from './logger';
import { GeniusPayWebhookSignatureError } from './geniuspay-errors';

/**
 * Vérifie la signature d'un webhook GeniusPay
 * @param payload - Le payload brut du webhook (string)
 * @param signature - La signature reçue dans l'en-tête X-GeniusPay-Signature
 * @param secret - Le secret webhook GeniusPay (depuis les variables d'environnement)
 * @returns true si la signature est valide, false sinon
 */
export async function verifyGeniusPayWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature) {
    throw new GeniusPayWebhookSignatureError('Missing webhook signature');
  }

  if (!secret) {
    throw new GeniusPayWebhookSignatureError('Webhook secret not configured');
  }

  try {
    // Calculer la signature HMAC-SHA256
    const calculatedSignature = await calculateHMACSignature(payload, secret);

    // Comparer les signatures de manière sécurisée (constant-time comparison)
    return constantTimeEquals(calculatedSignature, signature);
  } catch (error) {
    logger.error('Error verifying webhook signature', { error });
    throw new GeniusPayWebhookSignatureError(
      'Failed to verify webhook signature',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Calcule la signature HMAC-SHA256 d'un payload
 */
async function calculateHMACSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  // Importer la clé pour HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Générer la signature
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  // Convertir en hexadécimal
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare deux strings de manière constante dans le temps (constant-time comparison)
 * Pour éviter les attaques par timing
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let  result= 0;
  for (let  i= 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Extrait la signature depuis l'en-tête HTTP
 * GeniusPay envoie la signature dans l'en-tête X-GeniusPay-Signature
 */
export function extractSignatureFromHeader(headers: Headers): string | null {
  // Essayer différents formats d'en-tête
  const signature = headers.get('x-geniuspay-signature') || 
                   headers.get('X-GeniusPay-Signature') ||
                   headers.get('geniuspay-signature');

  if (!signature) {
    return null;
  }

  // La signature peut être au format "sha256=signature" ou juste "signature"
  // Extraire la partie après "sha256=" si présente
  const match = signature.match(/sha256=(.+)/i);
  return match ? match[1] : signature;
}

/**
 * Valide un webhook GeniusPay complet
 * @param payload - Le payload brut (string)
 * @param headers - Les en-têtes HTTP
 * @param secret - Le secret webhook
 * @throws GeniusPayWebhookSignatureError si la signature est invalide
 */
export async function validateGeniusPayWebhook(
  payload: string,
  headers: Headers,
  secret: string
): Promise<void> {
  const signature = extractSignatureFromHeader(headers);

  if (!signature) {
    throw new GeniusPayWebhookSignatureError(
      'Webhook signature header missing',
      { headers: Object.fromEntries(headers.entries()) }
    );
  }

  const isValid = await verifyGeniusPayWebhookSignature(payload, signature, secret);

  if (!isValid) {
    throw new GeniusPayWebhookSignatureError(
      'Invalid webhook signature',
      { 
        receivedSignature: signature.substring(0, 20) + '...', // Log partiel pour sécurité
      }
    );
  }
}













