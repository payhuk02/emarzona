import type { NotificationPreferences } from '@/types/notifications';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  id: 'local-default',
  user_id: '',
  email_course_enrollment: true,
  email_lesson_complete: true,
  email_course_complete: true,
  email_certificate_ready: true,
  email_new_course: false,
  email_course_update: true,
  email_quiz_result: true,
  email_affiliate_sale: true,
  email_comment_reply: true,
  email_instructor_message: true,
  app_course_enrollment: true,
  app_lesson_complete: true,
  app_course_complete: true,
  app_certificate_ready: true,
  app_new_course: true,
  app_course_update: true,
  app_quiz_result: true,
  app_affiliate_sale: true,
  app_comment_reply: true,
  app_instructor_message: true,
  email_notifications: true,
  push_notifications: true,
  sms_notifications: false,
  email_digest_frequency: 'weekly',
  pause_until: null,
  sound_notifications: true,
  vibration_notifications: true,
  sound_volume: 80,
  vibration_intensity: 'medium',
  notification_sound_type: 'default',
  accessibility_mode: false,
  high_contrast_sounds: false,
  screen_reader_friendly: false,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

export function mergeNotificationPreferences(
  partial: Partial<NotificationPreferences> | null | undefined
): NotificationPreferences {
  if (!partial) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...partial,
    email_digest_frequency:
      partial.email_digest_frequency ?? DEFAULT_NOTIFICATION_PREFERENCES.email_digest_frequency,
  };
}
