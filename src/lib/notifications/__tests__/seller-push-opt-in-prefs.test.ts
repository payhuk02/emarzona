import { beforeEach, describe, expect, it } from 'vitest';
import {
  dismissSellerPushOptIn,
  isSellerPushOptInDismissed,
  resetSellerPushOptInDismissed,
} from '@/lib/notifications/seller-push-opt-in-prefs';
import { setSidebarPrefsUserId } from '@/lib/navigation/sidebar-prefs-storage';

describe('seller-push-opt-in-prefs', () => {
  const userId = 'test-seller-push-user';

  beforeEach(() => {
    setSidebarPrefsUserId(userId);
    resetSellerPushOptInDismissed(userId);
  });

  it('starts not dismissed', () => {
    expect(isSellerPushOptInDismissed(userId)).toBe(false);
  });

  it('persists dismiss per user', () => {
    dismissSellerPushOptIn(userId);
    expect(isSellerPushOptInDismissed(userId)).toBe(true);
  });
});
