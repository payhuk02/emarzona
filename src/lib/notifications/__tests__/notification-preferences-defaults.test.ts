import { describe, expect, it } from 'vitest';
import { isAccountSettingsPath } from '@/lib/billing/account-settings-paths';
import { mergeNotificationPreferences } from '@/lib/notifications/notification-preferences-defaults';

describe('isAccountSettingsPath', () => {
  it('matches notification settings routes', () => {
    expect(isAccountSettingsPath('/settings/notifications')).toBe(true);
    expect(isAccountSettingsPath('/notifications')).toBe(true);
    expect(isAccountSettingsPath('/dashboard/settings')).toBe(false);
  });
});

describe('mergeNotificationPreferences', () => {
  it('fills null digest frequency for Select', () => {
    const merged = mergeNotificationPreferences({
      id: 'x',
      user_id: 'u',
      email_digest_frequency: null,
      created_at: '',
      updated_at: '',
    } as never);
    expect(merged.email_digest_frequency).toBe('weekly');
    expect(merged.email_course_enrollment).toBe(true);
  });
});
