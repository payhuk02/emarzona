import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { notifyPlanLockedNav } from '@/lib/navigation/plan-lock-nav';

export function usePlanLockNavAction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useCallback(
    (itemTitle: string, itemUrl: string) => {
      notifyPlanLockedNav({ itemTitle, itemUrl, navigate, toast, t });
    },
    [navigate, toast, t]
  );
}
