/**
 * Item de notification
 * Affiche une notification avec icône, titre, message, date
 * Date : 27 octobre 2025
 */

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  GraduationCap,
  CheckCircle2,
  Award,
  Bell,
  TrendingUp,
  MessageCircle,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

// Mapping type → icône + couleur
const getNotificationMeta = (type: NotificationType) => {
  const meta: Record<NotificationType, { icon: any; color: string; bgColor: string }> = {
    course_enrollment: {
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    lesson_complete: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    course_complete: {
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    certificate_ready: {
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    new_course: {
      icon: GraduationCap,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    course_update: {
      icon: Bell,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    quiz_passed: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    quiz_failed: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    affiliate_sale: {
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    affiliate_commission: {
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    comment_reply: {
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    instructor_message: {
      icon: MessageCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    system: {
      icon: Bell,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  };

  return meta[type] || meta.system;
};

export const NotificationItem = ({ notification, onClick }: NotificationItemProps) => {
  const { icon: Icon, color, bgColor } = getNotificationMeta(notification.type);

  const timeAgo = notification.created_at
    ? formatDistanceToNow(new Date(notification.created_at), {
        addSuffix: true,
        locale: fr,
      })
    : '';

  return (
    <div
      className={cn(
        'p-4 hover:bg-accent cursor-pointer transition-colors',
        !notification.is_read && 'bg-blue-50/30 dark:bg-blue-950/20'
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Icône */}
        <div className={cn('p-2 rounded-lg flex-shrink-0 h-fit', bgColor)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn('font-medium text-sm', !notification.is_read && 'font-semibold')}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {notification.action_label && (
              <span className="text-xs text-primary font-medium">
                {notification.action_label} →
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

