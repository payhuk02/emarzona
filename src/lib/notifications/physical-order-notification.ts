import { supabase } from '@/integrations/supabase/client';
import { createNotification } from '@/lib/notifications/helpers';
import { playNotificationSound } from '@/lib/notifications/play-notification-sound';
import { logger } from '@/lib/logger';
import type { NotificationSoundType } from '@/lib/notifications/play-notification-sound';

export type PhysicalOrderNotificationInput = {
  customerEmail: string;
  customerUserId?: string | null;
  productName: string;
  orderNumber: string;
  orderId: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  checkoutMethod: 'online' | 'cash_on_delivery';
  customerName?: string;
  customerPhone?: string;
  shippingSummary?: string;
};

async function resolveUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .ilike('email', normalized)
    .maybeSingle();

  if (error) {
    logger.warn('resolveUserIdByEmail failed', { error: error.message });
    return null;
  }

  return data?.user_id ?? null;
}

async function loadSoundPreference(userId: string): Promise<{
  enabled: boolean;
  soundType: NotificationSoundType;
}> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('sound_notifications, notification_sound_type')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    enabled: data?.sound_notifications !== false,
    soundType: (data?.notification_sound_type as NotificationSoundType) || 'default',
  };
}

function buildOrderMessage(input: PhysicalOrderNotificationInput): string {
  const lines = [
    `Produit : ${input.productName}`,
    `Commande n° ${input.orderNumber}`,
    `Quantité : ${input.quantity}`,
    `Montant : ${input.totalAmount.toLocaleString('fr-FR')} ${input.currency}`,
    `Paiement : ${
      input.checkoutMethod === 'cash_on_delivery'
        ? 'À la livraison'
        : 'En ligne (en attente ou confirmé)'
    }`,
  ];

  if (input.customerName) lines.push(`Nom : ${input.customerName}`);
  if (input.customerPhone) lines.push(`Téléphone : ${input.customerPhone}`);
  if (input.shippingSummary) lines.push(`Livraison : ${input.shippingSummary}`);

  return lines.join('\n');
}

/**
 * Envoie une notification plateforme au client (si compte existant) et joue le son configuré.
 */
export async function notifyPhysicalOrderPlaced(
  input: PhysicalOrderNotificationInput
): Promise<{ notified: boolean; userId: string | null }> {
  const userId = input.customerUserId ?? (await resolveUserIdByEmail(input.customerEmail));
  const message = buildOrderMessage(input);
  const title =
    input.checkoutMethod === 'cash_on_delivery'
      ? `Commande confirmée — ${input.productName}`
      : `Commande enregistrée — ${input.productName}`;

  if (userId) {
    await createNotification({
      user_id: userId,
      type: 'physical_product_order_placed',
      title,
      message,
      action_url: '/account/orders',
      action_label: 'Voir mes commandes',
      priority: 'high',
      metadata: {
        order_id: input.orderId,
        order_number: input.orderNumber,
        product_name: input.productName,
        checkout_method: input.checkoutMethod,
      },
    });

    const prefs = await loadSoundPreference(userId);
    if (prefs.enabled) {
      playNotificationSound(prefs.soundType);
    }

    return { notified: true, userId };
  }

  // Invité sans compte : son local immédiat pour feedback UX
  playNotificationSound('default');
  return { notified: false, userId: null };
}
