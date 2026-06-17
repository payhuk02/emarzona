import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

/**
 * Supabase admin/client for Playwright E2E (Node.js runtime).
 * Node < 22 has no native WebSocket — realtime-js requires explicit `ws` transport.
 */
export function createNodeSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
}
