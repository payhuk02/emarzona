/**
 * Classification des erreurs RPC Supabase (PostgREST) pour fallback dashboard.
 */

export type SupabaseRpcError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const UNAVAILABLE_PATTERNS = [
  'could not find the function',
  'does not exist',
  'function public.get_store_dashboard_stats_aggregated',
  'function public.get_top_selling_products',
  'schema cache',
  'permission denied for function',
  'must be owner of function',
  'undefined column',
  'column does not exist',
] as const;

const UNAVAILABLE_CODES = new Set([
  '42703', // undefined_column (RPC SQL drift vs prod schema)
  '42883', // undefined_function
  '42501', // insufficient_privilege
  'PGRST202', // function not found
  'PGRST204', // no rows / schema
  'PGRST301', // JWT / RLS related
]);

function errorText(error: SupabaseRpcError): string {
  return [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase();
}

/** RPC absente, non déployée ou inaccessible → fallback client autorisé. */
export function isRpcUnavailableError(error: SupabaseRpcError | null | undefined): boolean {
  if (!error) return false;

  if (error.code && UNAVAILABLE_CODES.has(error.code)) {
    return true;
  }

  const msg = errorText(error);
  return UNAVAILABLE_PATTERNS.some(pattern => msg.includes(pattern));
}

export function logRpcFallback(
  rpcName: string,
  error: SupabaseRpcError,
  context?: Record<string, unknown>
): void {
  if (import.meta.env.DEV) {
    console.info(
      `[Dashboard] RPC ${rpcName} indisponible (${error.code ?? 'unknown'}) — fallback client.`,
      { message: error.message, ...context }
    );
  }
}
