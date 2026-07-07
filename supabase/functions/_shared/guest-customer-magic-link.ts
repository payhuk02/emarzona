import type { SupabaseClient } from '@supabase/supabase-js';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function resolveCustomerPortalPath(productType: string | null | undefined): string {
  switch (productType) {
    case 'digital':
      return '/account/downloads';
    case 'course':
      return '/account/courses';
    case 'service':
      return '/account/bookings';
    case 'artist':
      return '/account/artist';
    case 'physical':
      return '/account/physical';
    default:
      return '/account/orders';
  }
}

/**
 * Génère un magic link Supabase pour l'espace client invité.
 * Utilisé par guest-customer-access (paiement confirmé) et les emails de confirmation (COD inclus).
 */
export async function generateGuestCustomerMagicLink(
  supabase: SupabaseClient,
  options: {
    email: string;
    productType?: string | null;
    siteUrl: string;
  }
): Promise<string | null> {
  const normalizedEmail = normalizeEmail(options.email);
  if (!normalizedEmail.includes('@')) return null;

  const redirectPath = resolveCustomerPortalPath(options.productType);
  const redirectTo = `${options.siteUrl.replace(/\/$/, '')}${redirectPath}`;

  let targetUserId: string | null = null;

  const { data: userByEmail, error: lookupError } =
    await supabase.auth.admin.getUserByEmail(normalizedEmail);

  if (!lookupError && userByEmail?.user?.id) {
    targetUserId = userByEmail.user.id;
  }

  if (!targetUserId) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: {
        guest_checkout: true,
        provisioned_via: 'order-confirmation-email',
      },
    });

    if (createError) {
      if (
        createError.message.toLowerCase().includes('already') ||
        createError.message.toLowerCase().includes('registered')
      ) {
        const { data: retryUser } = await supabase.auth.admin.getUserByEmail(normalizedEmail);
        targetUserId = retryUser?.user?.id ?? null;
      } else {
        console.error('generateGuestCustomerMagicLink createUser failed:', createError);
        return null;
      }
    } else {
      targetUserId = created.user?.id ?? null;
    }
  }

  if (!targetUserId) return null;

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: normalizedEmail,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error('generateGuestCustomerMagicLink generateLink failed:', linkError);
    return null;
  }

  return linkData.properties.action_link;
}
