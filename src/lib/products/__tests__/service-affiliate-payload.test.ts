import {
  isServiceAffiliateEnabled,
  toServiceAffiliateRpcPayload,
} from '../service-affiliate-payload';

describe('toServiceAffiliateRpcPayload', () => {
  it('returns null when affiliation is off', () => {
    expect(toServiceAffiliateRpcPayload({ enabled: false })).toBeNull();
    expect(isServiceAffiliateEnabled({ affiliate_enabled: false })).toBe(false);
  });

  it('maps wizard enabled=true', () => {
    const payload = toServiceAffiliateRpcPayload({
      enabled: true,
      commission_rate: 15,
      commission_type: 'percentage',
    });
    expect(payload).toMatchObject({
      enabled: true,
      affiliate_enabled: true,
      commission_rate: 15,
      commission_type: 'percentage',
    });
  });

  it('maps affiliate_enabled when enabled is absent', () => {
    expect(toServiceAffiliateRpcPayload({ affiliate_enabled: true })?.enabled).toBe(true);
  });

  it('can send a disable payload for update RPC', () => {
    expect(toServiceAffiliateRpcPayload({ enabled: false }, { includeWhenDisabled: true })).toEqual(
      expect.objectContaining({ enabled: false, affiliate_enabled: false })
    );
  });
});
