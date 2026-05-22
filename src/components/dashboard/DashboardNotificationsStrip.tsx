import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronRight } from 'lucide-react';

interface NotificationPreview {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'success';
  timestamp: string;
  read: boolean;
}

interface DashboardNotificationsStripProps {
  notifications: NotificationPreview[];
  unreadCount: number;
  enabled: boolean;
}

export const DashboardNotificationsStrip = React.memo<DashboardNotificationsStripProps>(
  ({ notifications, unreadCount, enabled }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!enabled || (notifications.length === 0 && unreadCount === 0)) {
      return null;
    }

    const latest = notifications.slice(0, 2);

    return (
      <section
        className="dashboard-premium-panel border-violet-200/50 bg-violet-50/20"
        role="region"
        aria-label={t('dashboard.notificationsStrip.ariaLabel', 'Notifications récentes')}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-violet-700" aria-hidden />
            <h2 className="text-sm font-semibold">
              {t('dashboard.notificationsStrip.title', 'Notifications')}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:underline"
          >
            {t('common.viewAll', 'Tout voir')}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {latest.length > 0 ? (
          <ul className="space-y-2">
            {latest.map(n => (
              <li
                key={n.id}
                className="rounded-lg border border-border/40 bg-background/80 px-3 py-2 text-sm"
              >
                <p className="font-medium truncate">{n.title}</p>
                <p className="text-muted-foreground text-xs line-clamp-1">{n.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('dashboard.notificationsStrip.empty', 'Aucune notification récente.')}
          </p>
        )}
      </section>
    );
  }
);

DashboardNotificationsStrip.displayName = 'DashboardNotificationsStrip';
