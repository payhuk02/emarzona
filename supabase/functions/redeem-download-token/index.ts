/**
 * Redeems a digital download token:
 * 1. Atomically validates/consumes token (RPC)
 * 2. Returns a short-lived signed URL for private storage objects (service role)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { fileNameFromRef, parseFileRef } from '../_shared/storage-ref.ts';

const DEFAULT_SIGNED_URL_TTL_SECONDS = 3600;

interface RedeemRequest {
  token?: string;
}

interface ValidateTokenResult {
  valid?: boolean;
  error?: string;
  file_url?: string;
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin);
  }

  let body: RedeemRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, origin);
  }

  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) {
    return jsonResponse({ error: 'Token is required', code: 'TOKEN_REQUIRED' }, 400, origin);
  }

  try {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase.rpc('validate_download_token', {
      p_token: token,
    });

    if (error) {
      console.error('[redeem-download-token] validate_download_token failed', error.message);
      return jsonResponse(
        { error: 'Token validation failed', code: 'VALIDATION_FAILED' },
        400,
        origin
      );
    }

    const result = data as ValidateTokenResult | null;
    if (!result?.valid || !result.file_url) {
      return jsonResponse(
        {
          error: result?.error || 'Token invalide ou expiré',
          code: 'TOKEN_INVALID',
        },
        403,
        origin
      );
    }

    const fileRef = parseFileRef(result.file_url);
    const fileName = fileNameFromRef(result.file_url);

    if (fileRef.kind === 'external') {
      return jsonResponse(
        {
          signedUrl: fileRef.url,
          fileName,
          expiresInSeconds: DEFAULT_SIGNED_URL_TTL_SECONDS,
          external: true,
        },
        200,
        origin
      );
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(fileRef.bucket)
      .createSignedUrl(fileRef.path, DEFAULT_SIGNED_URL_TTL_SECONDS);

    if (signError || !signed?.signedUrl) {
      console.error('[redeem-download-token] createSignedUrl failed', {
        bucket: fileRef.bucket,
        path: fileRef.path,
        message: signError?.message,
      });
      return jsonResponse(
        {
          error: 'Impossible de générer le lien sécurisé',
          code: 'SIGN_URL_FAILED',
        },
        500,
        origin
      );
    }

    return jsonResponse(
      {
        signedUrl: signed.signedUrl,
        fileName,
        expiresInSeconds: DEFAULT_SIGNED_URL_TTL_SECONDS,
        external: false,
      },
      200,
      origin
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[redeem-download-token] unexpected error', message);
    return jsonResponse({ error: 'Internal server error', code: 'INTERNAL' }, 500, origin);
  }
});
