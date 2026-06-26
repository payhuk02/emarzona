import { describe, expect, it } from 'vitest';
import {
  assertBuyerDownloadMethod,
  buildDownloadRedeemPageUrl,
  isAllowedBuyerDownloadMethod,
  requiresTokenRedemptionForPrivateBucket,
} from '@/lib/digital/drm-policy';

describe('drm-policy', () => {
  it('autorise uniquement token-redeem pour acheteurs', () => {
    expect(isAllowedBuyerDownloadMethod('token-redeem')).toBe(true);
    expect(isAllowedBuyerDownloadMethod('direct-signed-url')).toBe(false);
    expect(() => assertBuyerDownloadMethod('direct-signed-url')).toThrow(/DRM v2/i);
  });

  it('buildDownloadRedeemPageUrl encode le token', () => {
    expect(buildDownloadRedeemPageUrl('abc/def', 'https://www.emarzona.com')).toBe(
      'https://www.emarzona.com/download/abc%2Fdef'
    );
  });

  it('requiresTokenRedemptionForPrivateBucket — bucket products', () => {
    expect(requiresTokenRedemptionForPrivateBucket('products')).toBe(true);
    expect(requiresTokenRedemptionForPrivateBucket('public')).toBe(false);
  });
});
