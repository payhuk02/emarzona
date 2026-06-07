import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getSellerNavSections,
  resolveContextSidebarNav,
  type ContextSidebarConfig,
} from '@/config/navigation.context';

export function useContextSidebarNavigation(config: ContextSidebarConfig) {
  const { t } = useTranslation();
  const sellerSections = useMemo(() => getSellerNavSections(), []);

  return useMemo(
    () => resolveContextSidebarNav(sellerSections, config, t),
    [sellerSections, config, t]
  );
}
