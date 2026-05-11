/**
 * Composant cloche de notifications (header)
 * Affiche le nombre de notifications non lues + dropdown
 * Date : 27 octobre 2025
 */

import { useState } from 'react';
import { Bell } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { useUnreadCount, useRealtimeNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell = () => {
  const { data: unreadCount = 0 } = useUnreadCount();

  // S'abonner aux notifications temps réel
  useRealtimeNotifications();

  return (
    <Select>
      <SelectTrigger
        className="relative"
        variant="ghost"
        size="icon"
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
      </SelectTrigger>
      <SelectContent mobileVariant="sheet" className="w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-sm p-0">
        <NotificationDropdown onClose={() => {}} />
      </SelectContent>
    </Select>
  );
};







