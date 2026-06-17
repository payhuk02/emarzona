import { supabase, supabaseClientRuntimeMeta } from '@/integrations/supabase/client';

export const E2E_SUPABASE_PROBE_TAG = '[e2e-supabase-probe]';

export type SupabaseKeyKind = 'publishable' | 'mock' | 'jwt' | 'empty' | 'other';

export type SupabaseRuntimeProbe = {
  route: string;
  url: string;
  keyPrefix: string;
  keyLength: number;
  keyKind: SupabaseKeyKind;
  effectiveKeySource: 'VITE_SUPABASE_ANON_KEY' | 'VITE_SUPABASE_PUBLISHABLE_KEY' | 'none';
  keyTailCharCodes: number[];
  envKeyMatchesClient: boolean;
  clientKeyPrefix: string;
  clientKeyLength: number;
  clientKeyKind: SupabaseKeyKind;
  viteMode: string;
  rawAnonEnvLength: number;
  rawPublishableEnvLength: number;
  sessionStorageAuthKey: string | null;
  hasAuthSession: boolean;
  authUserId: string | null;
  restPingStatus: number | null;
  restPingError: string | null;
  productsSlugQueryError: string | null;
};

function classifyKey(key: string): SupabaseKeyKind {
  if (!key) return 'empty';
  if (key === 'mock-key' || key === 'test-supabase-key') return 'mock';
  if (key.startsWith('sb_publishable_')) return 'publishable';
  if (key.startsWith('eyJ')) return 'jwt';
  return 'other';
}

function maskKey(key: string): string {
  if (!key) return '(empty)';
  if (key.length <= 16) return `${key.slice(0, 4)}…(${key.length})`;
  return `${key.slice(0, 16)}…(${key.length})`;
}

function resolveSessionStorageAuthKey(url: string): string | null {
  try {
    const projectRef = new URL(url).hostname.split('.')[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}

/** Diagnostic runtime (dev/E2E) — ne loggue jamais la clé complète. */
export async function probeSupabaseRuntime(route: string): Promise<SupabaseRuntimeProbe> {
  const url = import.meta.env.VITE_SUPABASE_URL || 'https://hbdnzajbyjakdhuavrvb.supabase.co';
  const rawAnon = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '');
  const rawPublishable = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '');
  const effectiveKeySource: SupabaseRuntimeProbe['effectiveKeySource'] = rawAnon
    ? 'VITE_SUPABASE_ANON_KEY'
    : rawPublishable
      ? 'VITE_SUPABASE_PUBLISHABLE_KEY'
      : 'none';
  const effectiveKey = rawAnon || rawPublishable;
  const keyTailCharCodes = [...effectiveKey.slice(-3)].map(char => char.charCodeAt(0));

  const sessionStorageAuthKey = resolveSessionStorageAuthKey(url);
  const hasAuthSession = Boolean(
    sessionStorageAuthKey && sessionStorage.getItem(sessionStorageAuthKey)
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let restPingStatus: number | null = null;
  let restPingError: string | null = null;
  try {
    const response = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
      headers: {
        apikey: effectiveKey,
        Authorization: `Bearer ${session?.access_token ?? effectiveKey}`,
      },
    });
    restPingStatus = response.status;
    if (!response.ok) {
      const body = await response.text();
      restPingError = body.slice(0, 200);
    }
  } catch (error) {
    restPingError = error instanceof Error ? error.message : String(error);
  }

  let productsSlugQueryError: string | null = null;
  try {
    const { error } = await supabase
      .from('products')
      .select('id')
      .eq('product_type', 'course')
      .limit(1);
    if (error) productsSlugQueryError = error.message;
  } catch (error) {
    productsSlugQueryError = error instanceof Error ? error.message : String(error);
  }

  return {
    route,
    url,
    keyPrefix: maskKey(effectiveKey),
    keyLength: effectiveKey.length,
    keyKind: classifyKey(effectiveKey),
    effectiveKeySource,
    keyTailCharCodes,
    envKeyMatchesClient:
      effectiveKey.length === supabaseClientRuntimeMeta.keyLength &&
      effectiveKey.slice(0, 16) === supabaseClientRuntimeMeta.keyPrefix.replace('…', ''),
    clientKeyPrefix: supabaseClientRuntimeMeta.keyPrefix,
    clientKeyLength: supabaseClientRuntimeMeta.keyLength,
    clientKeyKind: supabaseClientRuntimeMeta.keyKind as SupabaseKeyKind,
    viteMode: import.meta.env.MODE,
    rawAnonEnvLength: rawAnon.length,
    rawPublishableEnvLength: rawPublishable.length,
    sessionStorageAuthKey,
    hasAuthSession,
    authUserId: session?.user?.id ?? null,
    restPingStatus,
    restPingError,
    productsSlugQueryError,
  };
}

export async function logSupabaseRuntimeProbe(route: string): Promise<SupabaseRuntimeProbe> {
  const probe = await probeSupabaseRuntime(route);
  console.info(E2E_SUPABASE_PROBE_TAG, JSON.stringify(probe));
  return probe;
}

declare global {
  interface Window {
    __e2eSupabaseProbe?: (route?: string) => Promise<SupabaseRuntimeProbe>;
  }
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__e2eSupabaseProbe = (route = window.location.pathname) => logSupabaseRuntimeProbe(route);
}
