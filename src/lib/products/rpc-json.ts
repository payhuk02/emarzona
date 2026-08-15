import { logger } from '@/lib/logger';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function normalizeRpcJsonValue(value: unknown): JsonValue {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(normalizeRpcJsonValue);
  if (typeof value === 'object') {
    const normalized: Record<string, JsonValue> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested === undefined) continue;
      normalized[key] = normalizeRpcJsonValue(nested);
    }
    return normalized;
  }
  return null;
}

/**
 * Ensures RPC JSON/JSONB arguments are plain, JSON-serializable values.
 * Prevents PostgREST PGRST102 ("Empty or invalid json") from undefined/NaN payloads.
 */
export function sanitizeRpcJson<T>(value: T): T {
  return normalizeRpcJsonValue(value) as T;
}

export function assertRpcJsonSerializable(value: unknown, context: string): void {
  try {
    const serialized = JSON.stringify(value);
    if (!serialized || serialized === 'undefined') {
      throw new Error('empty serialized body');
    }
  } catch (error) {
    logger.error('RPC payload serialization failed', { context, error });
    throw new Error('Données invalides pour la requête serveur. Vérifiez le formulaire.');
  }
}
