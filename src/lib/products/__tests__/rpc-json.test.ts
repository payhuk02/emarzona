import { describe, expect, it } from 'vitest';
import { assertRpcJsonSerializable, sanitizeRpcJson } from '@/lib/products/rpc-json';

describe('sanitizeRpcJson', () => {
  it('removes undefined and converts NaN to null', () => {
    const input = {
      ok: 1,
      missing: undefined,
      bad: Number.NaN,
      nested: { keep: true, drop: undefined },
    };

    expect(sanitizeRpcJson(input)).toEqual({
      ok: 1,
      bad: null,
      nested: { keep: true },
    });
  });

  it('assertRpcJsonSerializable rejects non-serializable payloads', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(() => assertRpcJsonSerializable(circular, 'test')).toThrow(
      'Données invalides pour la requête serveur'
    );
  });
});
