import { describe, expect, it } from 'vitest';
import {
  formatNotificationBadgeCount,
  isEmarzonaUnreadCountMessage,
  NOTIFICATION_BADGE_MAX,
} from '@/lib/notifications/notification-app-badge';

describe('formatNotificationBadgeCount', () => {
  it('returns null for zero or negative', () => {
    expect(formatNotificationBadgeCount(0)).toBeNull();
    expect(formatNotificationBadgeCount(-1)).toBeNull();
  });

  it('caps at NOTIFICATION_BADGE_MAX', () => {
    expect(formatNotificationBadgeCount(150)).toBe(NOTIFICATION_BADGE_MAX);
  });

  it('returns integer count for valid values', () => {
    expect(formatNotificationBadgeCount(3)).toBe(3);
    expect(formatNotificationBadgeCount(9)).toBe(9);
  });
});

describe('isEmarzonaUnreadCountMessage', () => {
  it('detects valid SW message', () => {
    expect(isEmarzonaUnreadCountMessage({ type: 'EMARZONA_UNREAD_COUNT', unreadCount: 2 })).toBe(
      true
    );
  });

  it('rejects invalid payloads', () => {
    expect(isEmarzonaUnreadCountMessage(null)).toBe(false);
    expect(isEmarzonaUnreadCountMessage({ type: 'OTHER' })).toBe(false);
  });
});
