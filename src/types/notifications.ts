/**
 * Types pour le système de notifications
 * Date : 27 octobre 2025
 */

import type { RecordString } from './common';
import type { NotificationType as UnifiedNotificationType } from '@/lib/notifications/unified-notifications';

// Réexporter le type complet depuis unified-notifications
export type NotificationType = UnifiedNotificationType;

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type EmailDigestFrequency = 'never' | 'daily' | 'weekly' | 'monthly';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: RecordString;
  action_url?: string;
  action_label?: string;
  is_read: boolean;
  is_archived: boolean;
  priority: NotificationPriority;
  created_at: string;
  read_at?: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;

  // Email preferences (nullable from database)
  email_course_enrollment: boolean | null;
  email_lesson_complete: boolean | null;
  email_course_complete: boolean | null;
  email_certificate_ready: boolean | null;
  email_new_course: boolean | null;
  email_course_update: boolean | null;
  email_quiz_result: boolean | null;
  email_affiliate_sale: boolean | null;
  email_comment_reply: boolean | null;
  email_instructor_message: boolean | null;

  // In-app preferences (nullable from database)
  app_course_enrollment: boolean | null;
  app_lesson_complete: boolean | null;
  app_course_complete: boolean | null;
  app_certificate_ready: boolean | null;
  app_new_course: boolean | null;
  app_course_update: boolean | null;
  app_quiz_result: boolean | null;
  app_affiliate_sale: boolean | null;
  app_comment_reply: boolean | null;
  app_instructor_message: boolean | null;

  // Global preferences (nullable from database)
  email_notifications?: boolean | null;
  push_notifications?: boolean | null;
  sms_notifications?: boolean | null;

  // Digest
  email_digest_frequency: EmailDigestFrequency | null;

  // Pause
  pause_until?: string | null;

  // Sound and vibration preferences (nullable from database)
  sound_notifications?: boolean | null; // Enable/disable notification sounds
  vibration_notifications?: boolean | null; // Enable/disable vibrations
  sound_volume?: number | null; // Sound volume 0-100 (default: 80)
  vibration_intensity?: 'light' | 'medium' | 'heavy' | null; // Vibration intensity (default: 'medium')
  notification_sound_type?: 'default' | 'gentle' | 'urgent' | null; // Sound type (default: 'default')

  // Accessibility preferences
  accessibility_mode?: boolean | null; // Enable accessibility enhancements
  high_contrast_sounds?: boolean | null; // Enhanced sound distinction for visually impaired
  screen_reader_friendly?: boolean | null; // Enhanced compatibility with screen readers

  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: RecordString;
  action_url?: string;
  action_label?: string;
  priority?: NotificationPriority;
}
