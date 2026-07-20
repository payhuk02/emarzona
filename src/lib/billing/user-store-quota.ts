/**
 * Quota boutiques lié aux plans d'abonnement (Sprint 4).
 */

import { supabase } from '@/integrations/supabase/client';

/** Fallback Free si RPC indisponible (aligné default_user_max_stores). */
export const DEFAULT_MAX_STORES_PER_USER = 3;

export type UserStoreQuota = {
  max_stores: number | null;
  used_stores: number;
  remaining_stores: number | null;
  can_create: boolean;
};

export function fallbackStoreQuota(ownedStoreCount: number): UserStoreQuota {
  const max = DEFAULT_MAX_STORES_PER_USER;
  return {
    max_stores: max,
    used_stores: ownedStoreCount,
    remaining_stores: Math.max(0, max - ownedStoreCount),
    can_create: ownedStoreCount < max,
  };
}

type UntypedRpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export async function fetchUserStoreQuota(userId?: string): Promise<UserStoreQuota> {
  // RPC Sprint 4 — absente des types.ts générés tant que `supabase:types` n'est pas relancé
  const { data, error } = await (supabase as unknown as UntypedRpcClient).rpc(
    'get_user_store_quota',
    {
      p_user_id: userId ?? undefined,
    }
  );

  if (error || !data || typeof data !== 'object') {
    throw error ?? new Error('get_user_store_quota failed');
  }

  const row = data as Record<string, unknown>;
  const max =
    row.max_stores === null || row.max_stores === undefined ? null : Number(row.max_stores);
  const used = Number(row.used_stores ?? 0);
  const remaining =
    row.remaining_stores === null || row.remaining_stores === undefined
      ? null
      : Number(row.remaining_stores);
  const canCreate = Boolean(row.can_create);

  return {
    max_stores: Number.isFinite(max as number) || max === null ? max : DEFAULT_MAX_STORES_PER_USER,
    used_stores: Number.isFinite(used) ? used : 0,
    remaining_stores:
      remaining === null || Number.isFinite(remaining)
        ? remaining
        : Math.max(0, (max ?? DEFAULT_MAX_STORES_PER_USER) - used),
    can_create: canCreate,
  };
}
