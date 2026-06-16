/**
 * Cache local LRU — fallback si Redis indisponible.
 */

interface LocalEntry {
  value: string;
  expiresAt: number;
}

const MAX_ENTRIES = 1000;
const store = new Map<string, LocalEntry>();

export function localGet(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function localSetEx(key: string, value: string, ttlSeconds: number): void {
  if (store.size >= MAX_ENTRIES) {
    const firstKey = store.keys().next().value;
    if (firstKey) store.delete(firstKey);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function localDel(key: string): boolean {
  return store.delete(key);
}

export function localKeysMatching(prefix: string): string[] {
  const result: string[] = [];
  const now = Date.now();
  for (const [key, entry] of store) {
    if (key.startsWith(prefix) && now < entry.expiresAt) {
      result.push(key);
    }
  }
  return result;
}

export function localClear(): void {
  store.clear();
}

export function localSize(): number {
  return store.size;
}
