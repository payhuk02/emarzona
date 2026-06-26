import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { VendorApiV1Client, resolveVendorApiV1BaseUrl } from '@/lib/vendor/api-v1-client';

describe('VendorApiV1Client', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ api_version: 'v1', store: { id: 's1' } }),
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolveVendorApiV1BaseUrl', () => {
    expect(resolveVendorApiV1BaseUrl('https://x.supabase.co/')).toBe(
      'https://x.supabase.co/functions/v1/api-v1'
    );
  });

  it('getMe envoie Authorization Bearer', async () => {
    const client = new VendorApiV1Client({
      baseUrl: 'https://x.supabase.co/functions/v1/api-v1',
      apiKey: 'pk_live_test',
    });

    const me = await client.getMe();
    expect(me.api_version).toBe('v1');
    expect(fetch).toHaveBeenCalledWith(
      'https://x.supabase.co/functions/v1/api-v1/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer pk_live_test',
        }),
      })
    );
  });
});
