import type { PostgrestError } from '@supabase/supabase-js';

const TRANSIENT_POSTGREST_CODES = new Set(['PGRST000', 'PGRST001', 'PGRST002']);

export function isTransientPostgrestError(error: PostgrestError | null): boolean {
  return Boolean(error && TRANSIENT_POSTGREST_CODES.has(error.code));
}

export async function retryOnTransientPostgrest<T>(
  operation: () => PromiseLike<{ data: T; error: PostgrestError | null }>,
  options: { attempts?: number; initialDelayMs?: number } = {}
): Promise<{ data: T; error: PostgrestError | null }> {
  const attempts = options.attempts ?? 8;
  const initialDelayMs = options.initialDelayMs ?? 1_000;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = await operation();
    if (!isTransientPostgrestError(result.error) || attempt === attempts) {
      return result;
    }

    await new Promise(resolve => setTimeout(resolve, initialDelayMs * attempt));
  }

  throw new Error('Unreachable PostgREST retry state');
}
