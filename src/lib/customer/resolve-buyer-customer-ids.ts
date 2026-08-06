/**
 * Résolution des `customers.id` pour un acheteur authentifié.
 * `orders.customer_id` pointe vers `customers.id`, jamais vers `auth.users.id`.
 *
 * Aligné sur get_customer_hub_summary :
 * - customers.user_id = auth uid
 * - + profils multi-boutiques par email
 * - + legacy éventuel customer_id = uid
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type ResolveBuyerCustomerIdsParams = {
  userId: string;
  email?: string | null;
};

/**
 * Retourne les IDs customers (et éventuellement l'uid legacy) pour filtrer les commandes.
 */
export async function resolveBuyerCustomerIds(
  params: ResolveBuyerCustomerIdsParams
): Promise<string[]> {
  const userId = params.userId?.trim();
  if (!userId) return [];

  const ids = new Set<string>();
  // Legacy hub : certaines anciennes lignes ont customer_id = auth.uid()
  ids.add(userId);

  const { data: byUserId, error: byUserError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId);

  if (byUserError) {
    // Ne pas bloquer le portail client si la recherche par user_id échoue (RLS, etc.)
    logger.warn('resolveBuyerCustomerIds: customers by user_id failed', { error: byUserError });
  }
  for (const row of byUserId ?? []) {
    if (row.id) ids.add(row.id);
  }

  const email = params.email?.trim().toLowerCase();
  if (email) {
    const { data: byEmail, error: byEmailError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email);

    if (byEmailError) {
      logger.warn('resolveBuyerCustomerIds: customers by email failed', { error: byEmailError });
    }
    for (const row of byEmail ?? []) {
      if (row.id) ids.add(row.id);
    }

    // Certains stores stockent l'email avec casse différente
    if ((byEmail ?? []).length === 0 && params.email && params.email !== email) {
      const { data: byEmailExact } = await supabase
        .from('customers')
        .select('id')
        .eq('email', params.email.trim());
      for (const row of byEmailExact ?? []) {
        if (row.id) ids.add(row.id);
      }
    }
  }

  return Array.from(ids);
}

/** True si seuls l'uid legacy est présent (aucun profil customers trouvé). */
export function hasLinkedCustomerProfiles(customerIds: string[], userId: string): boolean {
  return customerIds.some(id => id !== userId);
}

/** IDs valides pour `orders.customer_id` (exclut l'uid legacy si des profils customers existent). */
export function getBuyerOrderCustomerIds(customerIds: string[], userId: string): string[] {
  const linked = customerIds.filter(id => id !== userId);
  return linked.length > 0 ? linked : customerIds;
}
