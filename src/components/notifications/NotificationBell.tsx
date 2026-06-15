/**
 * Cloche de notifications (header) — Popover compact, adapté à la topnav sombre
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUnreadCount } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils';

const topNavIconBtnClass =
  'topnav-icon-btn relative h-9 w-9 min-h-9 min-w-9 shrink-0 border-0 bg-transparent p-0 shadow-none hover:bg-accent/50';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = ({ className }: NotificationBellProps) => {
  const { t } = useTranslation();
  const { data: unreadCount = 0 } = useUnreadCount();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-9 w-9 min-h-9 min-w-9 shrink-0 touch-manipulation',
            topNavIconBtnClass,
            className
          )}
          aria-label={t('sidebar.chrome.notificationsAriaLabel')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] leading-none"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(100vw-1rem,24rem)] p-0">
        <NotificationDropdown onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};
