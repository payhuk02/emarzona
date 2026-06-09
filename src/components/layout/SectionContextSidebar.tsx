/**
 * SectionContextSidebar — sidebar contextuelle dérivée de navigation.menus (Phase 5–6)
 */

import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BaseContextSidebar } from '@/components/layout/BaseContextSidebar';
import { ContextSidebarNavItem } from '@/components/layout/ContextSidebarNavItem';
import type { BreadcrumbItem } from '@/components/layout/Breadcrumb';
import {
  CONTEXT_SIDEBAR_CONFIGS,
  type ContextSidebarConfig,
  type ContextSidebarConfigId,
} from '@/config/navigation.context';
import { getNavItemPath, isNavItemActive } from '@/config/navigation.helpers';
import type { NavItem } from '@/config/navigation.types';
import { useStoreContext } from '@/contexts/StoreContext';
import { useToast } from '@/hooks/use-toast';
import { useContextSidebarNavigation } from '@/hooks/useContextSidebarNavigation';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import {
  requiredPlanLabelForPath,
  requiredPhysicalFeatureForPath,
} from '@/lib/billing/physical-route-capabilities';
import {
  hasPhysicalFeatureAccess,
  type PhysicalPlanSlug,
} from '@/lib/billing/physical-plan-capabilities';

const closeMobileSidebar = () => {
  if (window.innerWidth < 768) {
    setTimeout(() => {
      window.dispatchEvent(new Event('close-mobile-sidebar'));
    }, 100);
  }
};

function findActiveItem(
  items: NavItem[],
  pathname: string,
  search: string,
  config: ContextSidebarConfig,
  activeTab: string | null
): NavItem | undefined {
  if (config.activeMatch === 'tab') {
    return items.find(item => {
      const tab = item.url.split('tab=')[1]?.split('&')[0];
      return tab === (activeTab ?? 'profile');
    });
  }
  return items.find(item => isNavItemActive(item.url, pathname, search));
}

function isItemActive(
  item: NavItem,
  pathname: string,
  search: string,
  config: ContextSidebarConfig,
  activeTab: string | null
): boolean {
  if (config.activeMatch === 'tab') {
    const tab = item.url.split('tab=')[1]?.split('&')[0];
    return tab === (activeTab ?? 'profile');
  }
  return isNavItemActive(item.url, pathname, search);
}

type SectionContextSidebarProps = {
  config: ContextSidebarConfig;
};

export function SectionContextSidebar({ config }: SectionContextSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { selectedStoreId } = useStoreContext();
  const { planSlug } = useStorePhysicalAccess(selectedStoreId);
  const nav = useContextSidebarNavigation(config);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const activeTab = searchParams.get('tab');

  const activeItem = useMemo(
    () => findActiveItem(nav.items, location.pathname, location.search, config, activeTab),
    [nav.items, location.pathname, location.search, config, activeTab]
  );

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: nav.sectionLabel, path: nav.rootPath },
    { label: activeItem?.title ?? nav.sectionLabel },
  ];

  const quickNavItems = useMemo(
    () =>
      nav.items.map(item => ({
        label: item.title,
        path: item.url,
        icon: item.icon,
        isActive: isItemActive(item, location.pathname, location.search, config, activeTab),
      })),
    [nav.items, location.pathname, location.search, config, activeTab]
  );

  const handleItemClick = (item: NavItem) => {
    if (config.enablePlanLock) {
      const path = getNavItemPath(item.url);
      const feature = requiredPhysicalFeatureForPath(path);
      if (feature && !hasPhysicalFeatureAccess(planSlug as PhysicalPlanSlug, feature)) {
        const planLabel = requiredPlanLabelForPath(path);
        toast({
          title: t('sidebar.context.planLockTitle', { defaultValue: 'Fonctionnalité verrouillée' }),
          description: planLabel
            ? t('sidebar.context.planLockRequiresPlan', {
                defaultValue: '{{item}} requiert le plan {{plan}}.',
                item: item.title,
                plan: planLabel,
              })
            : t('sidebar.context.planLockRequiresUpgrade', {
                defaultValue: '{{item}} nécessite un plan supérieur.',
                item: item.title,
              }),
        });
        navigate('/dashboard/billing/physical');
        closeMobileSidebar();
        return;
      }
    }
    closeMobileSidebar();
  };

  const renderItem = (item: NavItem) => {
    const path = getNavItemPath(item.url);
    const locked =
      config.enablePlanLock &&
      (() => {
        const feature = requiredPhysicalFeatureForPath(path);
        return feature ? !hasPhysicalFeatureAccess(planSlug as PhysicalPlanSlug, feature) : false;
      })();

    const upgradeSuffix = t('sidebar.context.upgradeSuffix', { defaultValue: '(upgrade)' });

    return (
      <ContextSidebarNavItem
        key={item.url}
        label={locked ? `${item.title} ${upgradeSuffix}` : item.title}
        path={locked ? '/dashboard/billing/physical' : item.url}
        icon={item.icon}
        isActive={isItemActive(item, location.pathname, location.search, config, activeTab)}
        onClick={() => handleItemClick(item)}
      />
    );
  };

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems} quickNavItems={quickNavItems}>
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
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border hover:text-foreground transition-colors"
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
                  <h3 className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
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
