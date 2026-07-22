import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

/**
 * Supabase admin/client for Playwright E2E (Node.js runtime).
 * Node < 22 has no native WebSocket — realtime-js requires explicit `ws` transport.
 */
export function createNodeSupabaseClient(url: string, key: string): SupabaseClient {
  const trimmed = key.trim();
  // Fail fast: anon/publishable keys or truncated secrets produce opaque GoTrue JWT errors.
  if (trimmed.startsWith('eyJ')) {
    try {
      const payloadPart = trimmed.split('.')[1];
      if (payloadPart) {
        const json = Buffer.from(payloadPart, 'base64url').toString('utf8');
        const payload = JSON.parse(json) as { role?: string };
        if (payload.role && payload.role !== 'service_role') {
          throw new Error(
            `SUPABASE_SERVICE_ROLE_KEY has JWT role="${payload.role}" (expected service_role). ` +
              'Update the GitHub secret to the project service_role key.'
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('service_role')) {
        throw error;
      }
      /* non-JWT or opaque secret formats — let Supabase client decide */
    }
  }

  return createClient(url, trimmed, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
}
