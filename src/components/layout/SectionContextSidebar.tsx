/**
 * SectionContextSidebar — sidebar contextuelle dérivée de navigation.menus (Phase 5)
 */

import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BaseContextSidebar } from '@/components/layout/BaseContextSidebar';
import { ContextSidebarNavItem } from '@/components/layout/ContextSidebarNavItem';
import type { BreadcrumbItem } from '@/components/layout/Breadcrumb';
import {
  CONTEXT_SIDEBAR_CONFIGS,
  type ContextSidebarConfig,
  type ContextSidebarConfigId,
} from '@/config/navigation.context';
import { isNavItemActive } from '@/config/navigation.helpers';
import type { NavItem } from '@/config/navigation.types';
import { useContextSidebarNavigation } from '@/hooks/useContextSidebarNavigation';

const closeMobileSidebar = () => {
  if (window.innerWidth < 768) {
    setTimeout(() => {
      window.dispatchEvent(new Event('close-mobile-sidebar'));
    }, 100);
  }
};

function findActiveItem(items: NavItem[], pathname: string, search: string): NavItem | undefined {
  return items.find(item => isNavItemActive(item.url, pathname, search));
}

type SectionContextSidebarProps = {
  config: ContextSidebarConfig;
};

export function SectionContextSidebar({ config }: SectionContextSidebarProps) {
  const location = useLocation();
  const nav = useContextSidebarNavigation(config);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const activeItem = useMemo(
    () => findActiveItem(nav.items, location.pathname, location.search),
    [nav.items, location.pathname, location.search]
  );

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: nav.sectionLabel, path: nav.rootPath },
    { label: activeItem?.title ?? nav.sectionLabel },
  ];

  const renderItem = (item: NavItem) => (
    <ContextSidebarNavItem
      key={item.url}
      label={item.title}
      path={item.url}
      icon={item.icon}
      isActive={isNavItemActive(item.url, location.pathname, location.search)}
      onClick={closeMobileSidebar}
    />
  );

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label={config.ariaLabel}>
        {nav.groups ? (
          <div
            className={
              config.collapsibleGroups ? 'space-y-3 md:space-y-4' : 'space-y-4 md:space-y-6'
            }
          >
            {nav.groups.map(group => (
              <div key={group.groupKey} className="space-y-2">
                {config.collapsibleGroups ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedGroups(prev =>
                        prev.includes(group.groupKey)
                          ? prev.filter(k => k !== group.groupKey)
                          : [...prev, group.groupKey]
                      )
                    }
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wider border-b border-white/10 hover:text-white transition-colors"
                    aria-expanded={!collapsedGroups.includes(group.groupKey)}
                  >
                    <span>{group.label}</span>
                    {collapsedGroups.includes(group.groupKey) ? (
                      <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : (
                  <h3 className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-200/80 uppercase tracking-wider border-b border-blue-800/30">
                    {group.label}
                  </h3>
                )}
                {(!config.collapsibleGroups || !collapsedGroups.includes(group.groupKey)) && (
                  <div className="space-y-1">{group.items.map(renderItem)}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          nav.items.map(renderItem)
        )}
      </nav>
    </BaseContextSidebar>
  );
}

export function ConfigContextSidebar({ configId }: { configId: ContextSidebarConfigId }) {
  return <SectionContextSidebar config={CONTEXT_SIDEBAR_CONFIGS[configId]} />;
}
