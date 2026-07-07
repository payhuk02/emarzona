/**
 * Conformité email : désabonnements et préférences utilisateur
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type EmailCategory = 'transactional' | 'marketing' | 'notification';

export interface EmailSendEligibility {
  allowed: boolean;
  reason?: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Vérifie les désabonnements via RPC SQL check_user_unsubscribed
 */
export async function isEmailUnsubscribed(
  supabase: SupabaseClient,
  email: string,
  category: EmailCategory
): Promise<boolean> {
  const unsubscribeType = category === 'transactional' ? 'transactional' : 'marketing';

  const { data, error } = await supabase.rpc('check_user_unsubscribed', {
    p_email: normalizeEmail(email),
    p_type: unsubscribeType,
  });

  if (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'check_user_unsubscribed failed',
        error: error.message,
        category,
      })
    );
    // Fail-closed pour marketing/notification ; transactionnel reste permissif (commandes critiques)
    return category !== 'transactional';
  }

  return data === true;
}

/**
 * Vérifie email_preferences pour les envois non transactionnels
 */
export async function checkEmailPreferences(
  supabase: SupabaseClient,
  userId: string | undefined,
  category: EmailCategory
): Promise<EmailSendEligibility> {
  if (category === 'transactional' || !userId) {
    return { allowed: true };
  }

  const { data: prefs } = await supabase
    .from('email_preferences')
    .select(
      'marketing_emails, notification_emails, promotional_emails, newsletter, order_updates, product_updates'
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (!prefs) {
    return { allowed: true };
  }

  if (category === 'marketing') {
    if (prefs.marketing_emails === false) {
      return { allowed: false, reason: 'marketing_emails_disabled' };
    }
    if (prefs.promotional_emails === false) {
      return { allowed: false, reason: 'promotional_emails_disabled' };
    }
  }

  if (category === 'notification') {
    if (prefs.notification_emails === false) {
      return { allowed: false, reason: 'notification_emails_disabled' };
    }
    if (prefs.product_updates === false) {
      return { allowed: false, reason: 'product_updates_disabled' };
    }
  }

  return { allowed: true };
}

/**
 * Contrôle complet avant envoi (hors appels internes transactionnels critiques)
 */
export async function canSendEmailToRecipient(
  supabase: SupabaseClient,
  email: string,
  category: EmailCategory,
  userId?: string
): Promise<EmailSendEligibility> {
  if (category !== 'transactional') {
    const unsubscribed = await isEmailUnsubscribed(supabase, email, category);
    if (unsubscribed) {
      return { allowed: false, reason: 'recipient_unsubscribed' };
    }
  } else {
    const unsubscribedTransactional = await isEmailUnsubscribed(supabase, email, 'transactional');
    if (unsubscribedTransactional) {
      return { allowed: false, reason: 'recipient_unsubscribed_transactional' };
    }
  }

  return checkEmailPreferences(supabase, userId, category);
}

/**
 * Accès boutique : propriétaire ou résolution via produit / commande
 */
export async function verifyStoreAccess(
  supabase: SupabaseClient,
  userId: string,
  options: { storeId?: string; productId?: string; orderId?: string }
): Promise<{ allowed: boolean; storeId?: string }> {
  let resolvedStoreId = options.storeId;

  if (!resolvedStoreId && options.productId) {
    const { data } = await supabase
      .from('products')
      .select('store_id')
      .eq('id', options.productId)
      .maybeSingle();
    resolvedStoreId = data?.store_id ?? undefined;
  }

  if (!resolvedStoreId && options.orderId) {
    const { data } = await supabase
      .from('orders')
      .select('store_id')
      .eq('id', options.orderId)
      .maybeSingle();
    resolvedStoreId = data?.store_id ?? undefined;
  }

  if (!resolvedStoreId) {
    return { allowed: false };
  }

  const { data: store } = await supabase
    .from('stores')
    .select('user_id')
    .eq('id', resolvedStoreId)
    .maybeSingle();

  if (store?.user_id === userId) {
    return { allowed: true, storeId: resolvedStoreId };
  }

  return { allowed: false, storeId: resolvedStoreId };
}
