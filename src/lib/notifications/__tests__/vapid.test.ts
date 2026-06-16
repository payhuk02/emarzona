import { describe, it, expect } from 'vitest';
import { getVapidPublicKey, isVapidConfigured } from '@/lib/notifications/vapid';

describe('vapid config', () => {
  it('returns null when env not set', () => {
    expect(getVapidPublicKey()).toBeNull();
    expect(isVapidConfigured()).toBe(false);
  });
});
