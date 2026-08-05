import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { openCustomerDigitalFile } from '@/lib/digital/open-customer-digital-file';

vi.mock('@/lib/digital/redeem-download', () => ({
  redeemDownloadToken: vi.fn(),
}));

import { redeemDownloadToken } from '@/lib/digital/redeem-download';

describe('openCustomerDigitalFile', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'open',
      vi.fn(() => ({}) as Window)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('opens redeem page for storage files', async () => {
    const result = await openCustomerDigitalFile(
      { url: 'https://app.example.com/download/abc', token: 'abc' },
      'storage://products/file.pdf'
    );

    expect(result.mode).toBe('redeem-page');
    expect(window.open).toHaveBeenCalledWith(
      'https://app.example.com/download/abc',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('redeems token and opens external URL directly', async () => {
    vi.mocked(redeemDownloadToken).mockResolvedValue({
      ok: true,
      data: {
        signedUrl: 'https://drive.google.com/file/d/123',
        fileName: 'doc.pdf',
        expiresInSeconds: 3600,
        external: true,
      },
    });

    const result = await openCustomerDigitalFile(
      { token: 'tok-ext' },
      'https://drive.google.com/file/d/123'
    );

    expect(result.mode).toBe('external');
    expect(redeemDownloadToken).toHaveBeenCalledWith('tok-ext');
    expect(window.open).toHaveBeenCalledWith(
      'https://drive.google.com/file/d/123',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
