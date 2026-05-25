/**
 * Item de notification
 * Affiche une notification avec icône, titre, message, date
 * Date : 27 octobre 2025
 */

import React from 'react';
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
const defaultMeta = {
  icon: Bell,
  color: 'text-gray-600',
  bgColor: 'bg-gray-50',
};

const getNotificationMeta = (type: NotificationType) => {
  const meta: Partial<
    Record<NotificationType, { icon: typeof Bell; color: string; bgColor: string }>
  > = {
    course_enrollment: {
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    course_lesson_complete: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    course_complete: {
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    course_certificate_ready: {
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    course_new_content: {
      icon: GraduationCap,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    course_quiz_passed: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    course_quiz_failed: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    affiliate_commission_earned: {
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    affiliate_commission_paid: {
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    system_announcement: defaultMeta,
    product_review_received: {
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    vendor_message_received: {
      icon: MessageCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    customer_message_received: defaultMeta,
  };

  return meta[type] ?? defaultMeta;
};

const NotificationItemComponent = ({ notification, onClick }: NotificationItemProps) => {
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
      style={{ willChange: 'transform' }}
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

          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>

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

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const NotificationItem = React.memo(NotificationItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.notification.id === nextProps.notification.id &&
    prevProps.notification.is_read === nextProps.notification.is_read &&
    prevProps.notification.type === nextProps.notification.type &&
    prevProps.notification.title === nextProps.notification.title &&
    prevProps.notification.message === nextProps.notification.message &&
    prevProps.notification.created_at === nextProps.notification.created_at &&
    prevProps.onClick === nextProps.onClick
  );
});

NotificationItem.displayName = 'NotificationItem';
