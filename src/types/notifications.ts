/**
 * Types pour le système de notifications
 * Date : 27 octobre 2025
 */

export type NotificationType =
  | 'course_enrollment'
  | 'lesson_complete'
  | 'course_complete'
  | 'certificate_ready'
  | 'new_course'
  | 'course_update'
  | 'quiz_passed'
  | 'quiz_failed'
  | 'affiliate_sale'
  | 'affiliate_commission'
  | 'comment_reply'
  | 'instructor_message'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type EmailDigestFrequency = 'never' | 'daily' | 'weekly' | 'monthly';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
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
  
  // Email preferences
  email_course_enrollment: boolean;
  email_lesson_complete: boolean;
  email_course_complete: boolean;
  email_certificate_ready: boolean;
  email_new_course: boolean;
  email_course_update: boolean;
  email_quiz_result: boolean;
  email_affiliate_sale: boolean;
  email_comment_reply: boolean;
  email_instructor_message: boolean;
  
  // In-app preferences
  app_course_enrollment: boolean;
  app_lesson_complete: boolean;
  app_course_complete: boolean;
  app_certificate_ready: boolean;
  app_new_course: boolean;
  app_course_update: boolean;
  app_quiz_result: boolean;
  app_affiliate_sale: boolean;
  app_comment_reply: boolean;
  app_instructor_message: boolean;
  
  // Digest
  email_digest_frequency: EmailDigestFrequency;
  
  // Pause
  pause_until?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  action_url?: string;
  action_label?: string;
  priority?: NotificationPriority;
}

