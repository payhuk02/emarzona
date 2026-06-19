/**
 * Couche d'accès données commandes — requêtes partagées entre hooks de création.
 */

import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { resolveOrderNumber } from '@/lib/orders/resolve-order-number';

type DbClient = SupabaseClient<Database>;

/**
 * Génère un numéro de commande via RPC avec fallback local.
 */
export async function generateOrderNumber(
  client: DbClient = supabase,
  options?: { suffix?: string }
): Promise<string> {
  const { data, error } = await client.rpc('generate_order_number');
  return resolveOrderNumber(data, error, options);
}
