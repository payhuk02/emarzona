import type { NotificationPreferences } from '@/types/notifications';
import { isNotificationPaused } from '@/lib/notifications/notification-pause';
import {
  playNotificationSound,
  type NotificationSoundType,
} from '@/lib/notifications/play-notification-sound';
import { triggerDeviceVibration } from '@/lib/notifications/vibration-patterns';

export type InAppAlertOptions = {
  /** Jouer le son même si l'onglet est au premier plan (sans notification OS) */
  forceInTabSound?: boolean;
};

/**
 * Alerte utilisateur (son + vibration) selon notification_preferences.
 */
export function playInAppNotificationAlert(
  preferences: NotificationPreferences | null | undefined,
  options: InAppAlertOptions = {}
): boolean {
  if (isNotificationPaused(preferences?.pause_until)) return false;

  const soundOn = preferences?.sound_notifications !== false;
  const vibrateOn = preferences?.vibration_notifications !== false;
  const soundType = (preferences?.notification_sound_type as NotificationSoundType) || 'default';
  const volume = preferences?.sound_volume ?? 80;
  const highContrast = preferences?.high_contrast_sounds === true;

  const osNotificationGranted =
    typeof Notification !== 'undefined' && Notification.permission === 'granted';

  if (soundOn && (options.forceInTabSound || !osNotificationGranted)) {
    playNotificationSound(soundType, { volumePercent: volume, highContrast });
  }

  if (vibrateOn) {
    triggerDeviceVibration(preferences?.vibration_intensity, true);
  }

  return soundOn || vibrateOn;
}
