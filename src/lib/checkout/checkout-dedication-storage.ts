/**
 * Stockage temporaire des dédicaces artiste avant checkout direct (sans panier).
 */
import type { CartDedicationPayload } from '@/lib/checkout/artist-dedications';

const PREFIX = 'checkout_dedication_';

function storageKey(productId: string): string {
  return `${PREFIX}${productId}`;
}

export function storeCheckoutDedication(
  productId: string,
  dedication: CartDedicationPayload
): void {
  try {
    sessionStorage.setItem(storageKey(productId), JSON.stringify(dedication));
  } catch {
    // Non-blocking
  }
}

export function readCheckoutDedication(productId: string): CartDedicationPayload | null {
  try {
    const raw = sessionStorage.getItem(storageKey(productId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartDedicationPayload;
    if (!parsed?.dedication_text?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCheckoutDedication(productId: string): void {
  try {
    sessionStorage.removeItem(storageKey(productId));
  } catch {
    // ignore
  }
}
