/**
 * Dropdown de notifications
 * Liste rapide des notifications avec actions
 * Date : 27 octobre 2025
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Check, Settings, Eye } from '@/components/icons';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useUnreadCount,
} from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { isSafeInternalNavUrl } from '@/lib/navigation/keyboard-shortcuts';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: notificationsResult, isLoading } = useNotifications({ page: 1, pageSize: 10 });
  const notifications = notificationsResult?.data || [];
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleNotificationClick = async (notification: {
    id: string;
    is_read: boolean;
    action_url?: string | null;
  }) => {
    if (!notification.is_read) {
      await markAsRead.mutateAsync(notification.id);
    }

    const actionUrl = notification.action_url?.trim();
    if (actionUrl && isSafeInternalNavUrl(actionUrl)) {
      navigate(actionUrl);
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  const handleSettings = () => {
    navigate('/settings/notifications');
    onClose();
  };

  if (isLoading) {
    return (
      <div className="w-96 p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-96">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">{t('sidebar.notifications.title')}</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                {t('sidebar.notifications.markAllRead')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettings}
              aria-label={t('sidebar.notifications.settingsAriaLabel')}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">{t('sidebar.notifications.empty')}</p>
        </div>
      ) : (
        <>
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <Button
              variant="ghost"
              className="w-full justify-center text-sm"
              onClick={handleViewAll}
            >
              <Eye className="w-4 h-4 mr-2" />
              {t('sidebar.notifications.viewAll')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
