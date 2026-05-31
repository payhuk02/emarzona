import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  dismissPlatformPopup,
  dismissPopupLocally,
  fetchActivePlatformPopups,
  getLocallyDismissedPopups,
  type PlatformPopupMessage,
} from '@/lib/admin/admin-broadcast-service';

export function usePlatformPopupMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['platform-popup-messages', user?.id ?? 'anon'],
    queryFn: async (): Promise<PlatformPopupMessage[]> => {
      const popups = await fetchActivePlatformPopups(user?.id);
      if (user?.id) return popups;

      const dismissed = new Set(getLocallyDismissedPopups());
      return popups.filter(p => !dismissed.has(p.id));
    },
    refetchInterval: () =>
      typeof document !== 'undefined' && document.visibilityState === 'visible' ? 120_000 : false,
    staleTime: 60_000,
  });
}

export function useDismissPlatformPopup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (popupId: string) => {
      if (user?.id) {
        await dismissPlatformPopup(popupId);
      } else {
        dismissPopupLocally(popupId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-popup-messages'] });
    },
  });
}
