/**
 * Composant cloche de notifications (header)
 * Affiche le nombre de notifications non lues + dropdown
 * Date : 27 octobre 2025
 */

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnreadCount, useRealtimeNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell = () => {
  const { data: unreadCount = 0 } = useUnreadCount();
  const [open, setOpen] = useState(false);
  
  // S'abonner aux notifications temps réel
  useRealtimeNotifications();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <NotificationDropdown onClose={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

