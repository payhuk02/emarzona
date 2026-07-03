import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  isNotificationPaused,
  pauseUntilFromHours,
  pauseUntilTomorrowMorning,
} from '@/lib/notifications/notification-pause';
import {
  getVibrationPattern,
  triggerDeviceVibration,
} from '@/lib/notifications/vibration-patterns';
import { playInAppNotificationAlert } from '@/lib/notifications/in-app-notification-alert';
import { mergeNotificationPreferences } from '@/lib/notifications/notification-preferences-defaults';

describe('notification-pause', () => {
  it('returns false when pause_until is null', () => {
    expect(isNotificationPaused(null)).toBe(false);
    expect(isNotificationPaused(undefined)).toBe(false);
  });

  it('returns true when pause_until is in the future', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isNotificationPaused(future)).toBe(true);
  });

  it('returns false when pause_until is in the past', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isNotificationPaused(past)).toBe(false);
  });

  it('pauseUntilFromHours adds hours from now', () => {
    const result = pauseUntilFromHours(2);
    const diff = Date.parse(result) - Date.now();
    expect(diff).toBeGreaterThan(1.9 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(2.1 * 60 * 60 * 1000);
  });

  it('pauseUntilTomorrowMorning targets next day 8am', () => {
    const result = pauseUntilTomorrowMorning();
    const d = new Date(result);
    expect(d.getHours()).toBe(8);
    expect(d.getMinutes()).toBe(0);
  });
});

describe('vibration-patterns', () => {
  it('returns empty pattern when disabled', () => {
    expect(getVibrationPattern('medium', false)).toEqual([]);
  });

  it('returns intensity-specific patterns', () => {
    expect(getVibrationPattern('light')).toEqual([100, 50, 100]);
    expect(getVibrationPattern('heavy')).toEqual([300, 150, 300]);
  });

  it('triggerDeviceVibration calls navigator.vibrate', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    triggerDeviceVibration('medium', true);
    expect(vibrate).toHaveBeenCalledWith([200, 100, 200]);
    vi.unstubAllGlobals();
  });
});

describe('playInAppNotificationAlert', () => {
  beforeEach(() => {
    vi.stubGlobal('Notification', { permission: 'default' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('skips when DND active', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const prefs = mergeNotificationPreferences({
      pause_until: future,
      sound_notifications: true,
    } as never);
    expect(playInAppNotificationAlert(prefs)).toBe(false);
  });

  it('returns true when sound enabled and tab focused', () => {
    const prefs = mergeNotificationPreferences({
      sound_notifications: true,
      vibration_notifications: false,
      sound_volume: 50,
    } as never);
    expect(playInAppNotificationAlert(prefs, { forceInTabSound: true })).toBe(true);
  });
});
