import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { validateArtistProductRpc } from '@/lib/server-validation';

const basePayload = {
  artist_type: 'visual_artist',
  artist_name: 'Awa Koné',
  artwork_title: 'Lumière du Sahel',
  requires_shipping: true,
};

describe('validateArtistProductRpc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns valid when RPC returns null message', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    const result = await validateArtistProductRpc(basePayload);

    expect(result.valid).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith('validate_artist_product', {
      p_artist_type: 'visual_artist',
      p_artist_name: 'Awa Koné',
      p_artwork_title: 'Lumière du Sahel',
      p_artwork_year: null,
      p_artwork_dimensions: {},
      p_artwork_edition_type: 'original',
      p_edition_number: null,
      p_total_editions: null,
      p_requires_shipping: true,
      p_artwork_link_url: null,
      p_shipping_handling_time: null,
      p_shipping_insurance_amount: 0,
    });
  });

  it('maps RPC error string to validation failure', async () => {
    rpcMock.mockResolvedValue({
      data: "Le nom de l'artiste est requis",
      error: null,
    });

    const result = await validateArtistProductRpc({
      ...basePayload,
      artist_name: '',
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('artiste');
  });

  it('maps Supabase RPC error', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });

    const result = await validateArtistProductRpc(basePayload);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('validation_error');
  });

  it('passes null year and link when optional (not 0 or empty string)', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    await validateArtistProductRpc({
      ...basePayload,
      artwork_year: undefined,
      artwork_link_url: '',
      requires_shipping: true,
    });

    const args = rpcMock.mock.calls[0][1];
    expect(args.p_artwork_year).toBeNull();
    expect(args.p_artwork_link_url).toBeNull();
  });

  it('requires artwork link when shipping is false', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    await validateArtistProductRpc({
      ...basePayload,
      requires_shipping: false,
      artwork_link_url: 'https://cdn.example.com/oeuvre.mp4',
    });

    expect(rpcMock.mock.calls[0][1].p_artwork_link_url).toBe('https://cdn.example.com/oeuvre.mp4');
  });
});
