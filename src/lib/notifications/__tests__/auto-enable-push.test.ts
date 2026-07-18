import { describe, expect, it } from 'vitest';
import {
  getAutoEnablePushSessionKey,
  shouldAutoEnablePush,
} from '@/lib/notifications/auto-enable-push';

describe('shouldAutoEnablePush', () => {
  const base = {
    userId: 'user-1',
    pushNotificationsEnabled: true,
    isSupported: true,
    isVapidReady: true,
    permission: 'default' as NotificationPermissionState,
    isSubscribed: false,
    alreadyAttemptedThisSession: false,
  };

  it('returns true when push enabled and not yet subscribed', () => {
    expect(shouldAutoEnablePush(base)).toBe(true);
  });

  it('returns false when push preference disabled', () => {
    expect(shouldAutoEnablePush({ ...base, pushNotificationsEnabled: false })).toBe(false);
  });

  it('returns false when permission denied', () => {
    expect(shouldAutoEnablePush({ ...base, permission: 'denied' })).toBe(false);
  });

  it('returns false when already subscribed', () => {
    expect(shouldAutoEnablePush({ ...base, isSubscribed: true })).toBe(false);
  });

  it('returns false when already attempted this session', () => {
    expect(shouldAutoEnablePush({ ...base, alreadyAttemptedThisSession: true })).toBe(false);
  });

  it('builds stable session key', () => {
    expect(getAutoEnablePushSessionKey('abc')).toBe('emarzona_push_auto_abc');
  });
});
