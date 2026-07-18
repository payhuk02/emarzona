import { describe, expect, it, vi } from 'vitest';
import { playInAppNotificationAlert } from '@/lib/notifications/in-app-notification-alert';
import * as playSound from '@/lib/notifications/play-notification-sound';
import * as vibration from '@/lib/notifications/vibration-patterns';

describe('playInAppNotificationAlert', () => {
  it('skipVibration prevents device vibration', () => {
    const playSpy = vi.spyOn(playSound, 'playNotificationSound').mockImplementation(() => {});
    const vibrateSpy = vi.spyOn(vibration, 'triggerDeviceVibration').mockImplementation(() => {});

    playInAppNotificationAlert(
      { sound_notifications: true, vibration_notifications: true },
      { forceInTabSound: true, skipVibration: true }
    );

    expect(playSpy).toHaveBeenCalled();
    expect(vibrateSpy).not.toHaveBeenCalled();

    playSpy.mockRestore();
    vibrateSpy.mockRestore();
  });
});
