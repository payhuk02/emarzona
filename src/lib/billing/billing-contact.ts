/**
 * Résolution du téléphone de facturation pour les checkouts abonnement.
 * MoneyFusion (mobile money) exige un numéro de téléphone : on le lit depuis
 * le profil, sinon on le demande puis on le mémorise pour les prochains paiements.
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { normalizePhoneForPayment } from '@/lib/validation';

function cleanPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length >= 6 ? trimmed : null;
}

/** Téléphone connu de l'utilisateur courant (profil, metadata auth, auth phone). */
export async function resolveBillingCustomerPhone(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  return (
    cleanPhone(profile?.phone) ??
    cleanPhone(user.user_metadata?.phone) ??
    cleanPhone(user.phone) ??
    null
  );
}

/**
 * Garantit un téléphone pour le checkout : profil → sinon saisie utilisateur
 * (mémorisée dans le profil pour les prochains renouvellements).
 */
export async function requireBillingCustomerPhone(): Promise<string> {
  const known = await resolveBillingCustomerPhone();
  if (known) return normalizePhoneForPayment(known);

  const entered =
    typeof window !== 'undefined'
      ? window.prompt(
          'Le paiement mobile money nécessite un numéro de téléphone.\n' +
            'Entrez votre numéro (ex. +226 70 00 00 00) :'
        )
      : null;

  const cleaned = cleanPhone(entered);
  if (!cleaned) {
    throw new Error(
      'Un numéro de téléphone est requis pour le paiement mobile money. ' +
        'Ajoutez-le dans Paramètres → Profil puis réessayez.'
    );
  }

  const normalized = normalizePhoneForPayment(cleaned);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { error } = await supabase
      .from('profiles')
      .update({ phone: normalized, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) {
      logger.warn('Could not persist billing phone to profile', { error: error.message });
    }
  }

  return normalized;
}
