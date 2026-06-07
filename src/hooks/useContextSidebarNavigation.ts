import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getContextNavSections,
  resolveContextSidebarNav,
  type ContextSidebarConfig,
} from '@/config/navigation.context';

export function useContextSidebarNavigation(config: ContextSidebarConfig) {
  const { t } = useTranslation();
  const sections = useMemo(() => getContextNavSections(), []);

  return useMemo(() => resolveContextSidebarNav(sections, config, t), [sections, config, t]);
}
