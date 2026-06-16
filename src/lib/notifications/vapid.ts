/**
 * Utilitaires VAPID Web Push — clé publique côté client uniquement.
 */

const VAPID_KEY_MIN_LENGTH = 80;

export function getVapidPublicKey(): string | null {
  const key = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim();
  if (!key) return null;
  return key;
}

export function isVapidConfigured(): boolean {
  const key = getVapidPublicKey();
  return !!key && key.length >= VAPID_KEY_MIN_LENGTH;
}

/** Convertit une clé VAPID base64url en Uint8Array pour PushManager.subscribe */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const trimmed = base64String.trim();
  if (!trimmed) {
    throw new Error('VAPID_PUBLIC_KEY_MISSING');
  }

  const padding = '='.repeat((4 - (trimmed.length % 4)) % 4);
  const base64 = (trimmed + padding).replace(/-/g, '+').replace(/_/g, '/');

  let rawData: string;
  try {
    rawData = window.atob(base64);
  } catch {
    throw new Error('VAPID_PUBLIC_KEY_INVALID');
  }

  if (rawData.length < 65) {
    throw new Error('VAPID_PUBLIC_KEY_INVALID');
  }

  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getVapidConfigErrorMessage(): string {
  if (!getVapidPublicKey()) {
    return 'Les notifications push ne sont pas configurées sur ce environnement (clé VAPID manquante).';
  }
  return 'La clé VAPID publique est invalide. Contactez le support.';
}
