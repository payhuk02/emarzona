import { LayoutDashboard, Search, Check, Plus } from '@/components/icons';
import {
  Circle,
  Clock3,
  ChevronDown,
  ChevronRight,
  Lock,
  ShoppingBag,
  Key,
  Activity,
  Package,
} from 'lucide-react';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { SidebarCollapsibleSection } from '@/components/sidebar/SidebarCollapsibleSection';
import { SidebarNavCommandPalette } from '@/components/sidebar/SidebarNavCommandPalette';
import { SidebarPersonaSwitch } from '@/components/sidebar/SidebarPersonaSwitch';
import { PersonaOnboardingCoach } from '@/components/sidebar/PersonaOnboardingCoach';
import { NAV_LINK_ACTIVE, NAV_LINK_INACTIVE } from '@/components/sidebar/sidebar-nav-shared';
import {
  DEFAULT_OPEN_SECTION_KEYS,
  flattenNavSections,
  sectionContainsPath,
} from '@/config/navigation.enrich';
import {
  getNavItemPath,
  isNavItemActive,
  parseNavTo,
  resolveSidebarLogoAriaKey,
  resolveSidebarLogoHome,
} from '@/config/navigation.helpers';
import { resolveNavItemIcon } from '@/config/navigation.icons';
import type { NavSection, SidebarPersona } from '@/config/navigation.types';
import { useSidebarPersona } from '@/hooks/useSidebarPersona';
import { useSidebarNavigation } from '@/hooks/useSidebarNavigation';
import { recordNavClick, sortEntriesByNavFrequency } from '@/hooks/useNavigationAnalytics';
import { useState, useEffect, useMemo, useCallback } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { EmarzonaBrandName } from '@/components/brand/EmarzonaBrandName';
import { cn } from '@/lib/utils';
import { STORE_CREATE_PATH } from '@/lib/store/store-create-path';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import { useStoreContext } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import { isNavPathPlanLocked } from '@/lib/navigation/plan-lock-nav';
import { usePlanLockNavAction } from '@/hooks/usePlanLockNavAction';
import {
  hasSidebarJsonPref,
  readSidebarJsonPref,
  setSidebarPrefsUserId,
  SIDEBAR_PREF_KEYS,
  writeSidebarJsonPref,
} from '@/lib/navigation/sidebar-prefs-storage';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';
import {
  canAccessCommercePath,
  getPrimaryProductCreatePath,
} from '@/lib/commerce/store-capability-map';
import { isSellerNavItemActive, resolveSellerNavUrl } from '@/lib/navigation/vendor-products-nav';
import { logger } from '@/lib/logger';
import { LogoImageWithFallback } from '@/components/sidebar/LogoImageWithFallback';
import {
  ContextSidebar,
  useContextSidebar,
  ContextSidebarTrigger,
} from '@/components/navigation/ContextSidebar';
import { MegaMenuDropdown, MegaMenuTrigger } from '@/components/navigation/MegaMenuDropdown';
import { CONTEXT_SIDEBAR_MAPPING } from '@/config/navigation.context.extended';

const isNavItemPlanLocked = (
  url: string,
  planSlug: string | null,
  commerceType?: StoreCommerceType | null
) => isNavPathPlanLocked(url, planSlug, commerceType);

// Helper function to get context sections for a specific item URL
const getContextSectionsForItem = (itemUrl: string) => {
  for (const [pattern, sections] of Object.entries(CONTEXT_SIDEBAR_MAPPING)) {
    if (itemUrl.startsWith(pattern)) {
      return sections;
    }
  }
  return [];
};

const buildDefaultCollapsedSections = (
  sections: NavSection[],
  pathname: string,
  search: string,
  commerceType?: StoreCommerceType | null
): string[] => {
  const openKeys = new Set(DEFAULT_OPEN_SECTION_KEYS);
  sections.forEach(s => {
    if (s.defaultOpen) openKeys.add(s.sectionKey);
  });
  const activeKey = sections.find(s =>
    sectionContainsPath(s, pathname, search, commerceType)
  )?.sectionKey;
  if (activeKey) openKeys.add(activeKey);
  return sections.map(s => s.sectionKey).filter(key => !openKeys.has(key));
};

export function AppSidebar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { state, isMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const {
    stores,
    selectedStoreId,
    selectedStore,
    switchStore,
    canCreateStore,
    loading: storesLoading,
  } = useStoreContext();
  const { planSlug } = useStorePhysicalAccess(selectedStoreId);
  const commerceType = selectedStore?.commerce_type;
  const storeMetadata = selectedStore?.metadata ?? null;
  const platformLogo = usePlatformLogo();
  const handlePlanLockedNav = usePlanLockNavAction();
  /** Desktop rail only — mobile drawer always shows labels + icons */
  const isCollapsed = state === 'collapsed' && !isMobile;
  const { persona, setPersona, needsPersonaOnboarding } = useSidebarPersona(isAdmin);
  const [commandOpen, setCommandOpen] = useState(false);
  const {
    isOpen: contextSidebarOpen,
    open: openContextSidebar,
    close: closeContextSidebar,
  } = useContextSidebar();
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [prefsHydrated, setPrefsHydrated] = useState(false);
  const [storesMenuOpen, setStoresMenuOpen] = useState(false);

  const showAdminMenu = isAdmin && persona === 'admin';
  const showUserMenu = !showAdminMenu;
  const resolveNavHref = (url: string) =>
    persona === 'seller' ? resolveSellerNavUrl(url, commerceType) : url;
  const isNavLinkActive = useCallback(
    (url: string, mode: 'exact' | 'prefix' = 'exact') =>
      persona === 'seller'
        ? isSellerNavItemActive(url, location.pathname, location.search, mode, commerceType)
        : isNavItemActive(url, location.pathname, location.search, mode),
    [persona, location.pathname, location.search, commerceType]
  );
  const logoHome = resolveSidebarLogoHome(persona);
  const logoAriaKey = resolveSidebarLogoAriaKey(persona);

  const { activeSections, commandPaletteSections } = useSidebarNavigation({
    persona,
    isPlatformAdmin: isAdmin,
    showAdminMenu,
    commerceType,
    storeMetadata,
  });

  const allCurrentEntries = useMemo(() => flattenNavSections(activeSections), [activeSections]);

  const navCommandEntries = useMemo(
    () =>
      sortEntriesByNavFrequency(flattenNavSections(commandPaletteSections)).map(entry => ({
        title: entry.title,
        url: entry.url,
        icon: entry.icon,
        sectionLabel: entry.sectionLabel,
      })),
    [commandPaletteSections]
  );

  const vendorQuickActions = useMemo(() => {
    const type = parseStoreCommerceType(commerceType);
    const createLabels: Record<StoreCommerceType, string> = {
      physical: t('command.newPhysicalProduct', 'Nouveau produit physique'),
      digital: t('command.newDigitalProduct', 'Nouveau produit digital'),
      service: t('command.newService', 'Nouveau service'),
      course: t('command.newCourse', 'Nouveau cours'),
      artist: t('command.newArtistWork', "Nouvelle œuvre d'artiste"),
    };

    const actions = [
      {
        title: createLabels[type],
        url: getPrimaryProductCreatePath(type),
        icon: Plus,
        sectionLabel: t('command.quickActions', 'Actions rapides'),
      },
      {
        title: t('command.orders', 'Commandes'),
        url: '/dashboard/orders',
        icon: ShoppingBag,
        sectionLabel: t('command.quickActions', 'Actions rapides'),
      },
      {
        title: t('command.integrations', 'Clés API & intégrations'),
        url: '/dashboard/integrations',
        icon: Key,
        sectionLabel: t('command.quickActions', 'Actions rapides'),
      },
      {
        title: t('command.inventory', 'Inventaire'),
        url: '/dashboard/physical/inventory',
        icon: Package,
        sectionLabel: t('command.quickActions', 'Actions rapides'),
      },
      {
        title: t('command.platformStatus', 'Statut plateforme'),
        url: '/status',
        icon: Activity,
        sectionLabel: t('command.quickActions', 'Actions rapides'),
      },
    ];

    return actions.filter(action => canAccessCommercePath(action.url, type, { storeMetadata }));
  }, [t, commerceType, storeMetadata]);

  const handlePersonaChange = (next: SidebarPersona) => {
    setPersona(next);
    writeSidebarJsonPref(SIDEBAR_PREF_KEYS.personaOnboarded, true);
    if (next === 'admin' && isAdmin) navigate('/admin');
    else if (next === 'buyer') navigate('/account/hub');
    else navigate('/dashboard');
  };

  const currentNavItem = useMemo(
    () => allCurrentEntries.find(item => isNavLinkActive(item.url, 'exact')),
    [allCurrentEntries, isNavLinkActive]
  );

  useEffect(() => {
    setSidebarPrefsUserId(userId);
  }, [userId]);

  useEffect(() => {
    setPrefsHydrated(false);
    try {
      const storedCollapsed = readSidebarJsonPref<string[]>(
        SIDEBAR_PREF_KEYS.collapsedSections,
        userId
      );
      const storedStores = readSidebarJsonPref<boolean>(SIDEBAR_PREF_KEYS.storesExpanded, userId);

      if (storedCollapsed) setCollapsedSections(storedCollapsed);
      if (storedStores !== null) setStoresMenuOpen(storedStores);
      setPrefsHydrated(true);
    } catch (error) {
      logger.warn('Failed to restore sidebar preferences', error);
      setPrefsHydrated(true);
    }
  }, [userId]);

  useEffect(() => {
    if (!prefsHydrated) return;
    if (hasSidebarJsonPref(SIDEBAR_PREF_KEYS.collapsedSections, userId)) return;
    setCollapsedSections(
      buildDefaultCollapsedSections(
        activeSections,
        location.pathname,
        location.search,
        commerceType
      )
    );
  }, [prefsHydrated, activeSections, location.pathname, location.search, userId]);

  useEffect(() => {
    if (!prefsHydrated) return;
    if (hasSidebarJsonPref(SIDEBAR_PREF_KEYS.storesExpanded, userId)) return;
    setStoresMenuOpen(stores.length <= 1);
  }, [prefsHydrated, stores.length, userId]);

  useEffect(() => {
    const activeKey = activeSections.find(s =>
      sectionContainsPath(s, location.pathname, location.search)
    )?.sectionKey;
    if (!activeKey) return;
    setCollapsedSections(prev =>
      prev.includes(activeKey) ? prev.filter(k => k !== activeKey) : prev
    );
  }, [location.pathname, location.search, activeSections]);

  useEffect(() => {
    if (!prefsHydrated) return;
    writeSidebarJsonPref(SIDEBAR_PREF_KEYS.storesExpanded, storesMenuOpen, userId);
  }, [storesMenuOpen, prefsHydrated, userId]);

  useEffect(() => {
    if (!prefsHydrated) return;
    writeSidebarJsonPref(SIDEBAR_PREF_KEYS.collapsedSections, collapsedSections, userId);
  }, [collapsedSections, prefsHydrated, userId]);

  const toggleSectionCollapse = (sectionKey: string) => {
    setCollapsedSections(prev =>
      prev.includes(sectionKey) ? prev.filter(key => key !== sectionKey) : [...prev, sectionKey]
    );
  };

  const handleLockedNavClick = (itemTitle: string, itemUrl: string) => {
    handlePlanLockedNav(itemTitle, itemUrl);
  };

  const navigateToNavItem = (item: { title: string; url: string }) => {
    recordNavClick(item.url);
    if (showUserMenu && isNavItemPlanLocked(item.url, planSlug, commerceType)) {
      handleLockedNavClick(item.title, item.url);
      return;
    }
    navigate(resolveNavHref(item.url));
  };

  return (
    <Sidebar
      collapsible="icon"
      className="app-sidebar border-r border-border transition-all duration-300"
    >
      <SidebarNavCommandPalette
        entries={navCommandEntries}
        quickActions={vendorQuickActions}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />

      {/* En-tête compact : logo + palette */}
      <div className={cn('shrink-0 border-b border-border', isCollapsed ? 'p-2' : 'px-3 py-2.5')}>
        <div className="flex items-center gap-2 min-h-[2.75rem]">
          <Link
            to={logoHome}
            className="flex items-center gap-1.5 group transition-opacity duration-200 hover:opacity-90 shrink-0"
            aria-label={t(logoAriaKey)}
          >
            {platformLogo ? (
              <LogoImageWithFallback
                src={platformLogo}
                className={cn('flex-shrink-0', isCollapsed ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10')}
              />
            ) : (
              <div
                className={cn(
                  'flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md',
                  isCollapsed ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10'
                )}
                aria-hidden="true"
              >
                <span className="text-sm font-bold text-white">E</span>
              </div>
            )}
            {!isCollapsed && (
              <EmarzonaBrandName className="hidden text-lg tracking-tight sm:inline" />
            )}
          </Link>
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground shrink-0"
              onClick={() => setCommandOpen(true)}
              aria-label={t('sidebar.chrome.searchAriaLabelCollapsed')}
            >
              <Search className="h-4 w-4" />
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="app-sidebar-command-trigger flex flex-1 items-center gap-2 h-9 rounded-lg border border-border bg-muted/40 px-2.5 text-left text-sm text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground transition-all duration-200 min-w-0"
              aria-label={t('sidebar.chrome.searchAriaLabel')}
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex-1 truncate text-xs">
                {t('sidebar.chrome.searchPlaceholder')}
              </span>
              <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                Ctrl+K
              </kbd>
            </button>
          )}
        </div>
        <PersonaOnboardingCoach isAdmin={isAdmin} enabled={!!userId && needsPersonaOnboarding}>
          <SidebarPersonaSwitch
            persona={persona === 'admin' && !isAdmin ? 'seller' : persona}
            isAdmin={isAdmin}
            isCollapsed={isCollapsed}
            onPersonaChange={handlePersonaChange}
          />
        </PersonaOnboardingCoach>
      </div>

      <SidebarContent className="app-sidebar-scroll flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {/* Menu Items - Organisé par sections */}
        {showUserMenu &&
          activeSections.map((section, sectionIndex) => (
            <React.Fragment key={section.sectionKey}>
              {isCollapsed && sectionIndex > 0 && (
                <div
                  className="app-sidebar-rail-separator mx-auto my-1 h-px w-6 bg-border"
                  role="separator"
                />
              )}
              <SidebarCollapsibleSection
                sectionId={section.sectionKey}
                label={section.label}
                isOpen={isCollapsed || !collapsedSections.includes(section.sectionKey)}
                onToggle={() => toggleSectionCollapse(section.sectionKey)}
                hideHeader={isCollapsed}
              >
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map(item => {
                      const IconComponent = resolveNavItemIcon(item.url, item.icon) ?? Circle;
                      if (!item.icon) {
                        logger.warn(`Menu item missing icon: ${item.title}`);
                      }

                      // Menu spécial pour "Tableau de bord" avec sous-menu des boutiques - STATIQUE (toujours ouvert)
                      if (
                        getNavItemPath(item.url) === '/dashboard' &&
                        !storesLoading &&
                        stores.length > 0
                      ) {
                        const isDashboardActive = location.pathname === '/dashboard';
                        return (
                          <SidebarMenuItem
                            key={`${section.label}-${item.title}-${item.url}-dashboard`}
                          >
                            <SidebarMenuButton
                              asChild
                              tooltip={item.title}
                              className={`transition-all duration-200 group relative flex items-center ${
                                isDashboardActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE
                              }`}
                            >
                              <NavLink to={item.url} end className="flex items-center gap-2 w-full">
                                <IconComponent
                                  className="h-4 w-4 shrink-0 stroke-[2]"
                                  aria-hidden="true"
                                />
                                {!isCollapsed && (
                                  <span className="flex-1 font-medium">{item.title}</span>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                            {!isCollapsed && stores.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setStoresMenuOpen(open => !open)}
                                className="ml-6 mt-1 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                aria-expanded={storesMenuOpen}
                              >
                                <span>
                                  {t('sidebar.chrome.myStores', { count: stores.length })}
                                </span>
                                {storesMenuOpen ? (
                                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                )}
                              </button>
                            )}
                            {!isCollapsed && stores.length > 0 && (
                              <div
                                className={cn(
                                  'ml-4 grid transition-[grid-template-rows] duration-300 ease-out',
                                  storesMenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                )}
                              >
                                <div className="overflow-hidden min-h-0 space-y-1 border-l border-border pl-2 mt-1">
                                  {stores.map(store => (
                                    <Button
                                      key={store.id}
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        switchStore(store.id);
                                        navigate('/dashboard');
                                        toast({
                                          title: t('sidebar.chrome.storeChangedTitle'),
                                          description: t('sidebar.chrome.storeChangedDescription', {
                                            name: store.name,
                                          }),
                                        });
                                      }}
                                      className={`w-full justify-start transition-all duration-200 opacity-90 ${
                                        selectedStoreId === store.id
                                          ? NAV_LINK_ACTIVE
                                          : NAV_LINK_INACTIVE
                                      }`}
                                    >
                                      {selectedStoreId === store.id && (
                                        <Check className="h-3 w-3 mr-2" />
                                      )}
                                      <span className="truncate">{store.name}</span>
                                    </Button>
                                  ))}
                                  {canCreateStore() && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(STORE_CREATE_PATH)}
                                      className={`w-full justify-start ${NAV_LINK_INACTIVE} transition-all duration-200`}
                                    >
                                      <Plus className="h-3 w-3 mr-2" />
                                      <span>{t('sidebar.chrome.createStore')}</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </SidebarMenuItem>
                        );
                      }

                      // Menu items normaux
                      const isPlanLocked =
                        showUserMenu && isNavItemPlanLocked(item.url, planSlug, commerceType);

                      if (isPlanLocked) {
                        return (
                          <SidebarMenuItem key={`${section.label}-${item.title}-${item.url}`}>
                            <SidebarMenuButton
                              tooltip={t('sidebar.chrome.planLockTooltip', { item: item.title })}
                              onClick={() => handleLockedNavClick(item.title, item.url)}
                              className={`${NAV_LINK_INACTIVE} opacity-75 transition-all duration-200 group relative flex items-center`}
                            >
                              <IconComponent
                                className="h-4 w-4 shrink-0 stroke-[2]"
                                aria-hidden="true"
                              />
                              {!isCollapsed ? (
                                <>
                                  <span className="flex-1 font-medium">{item.title}</span>
                                  <Lock
                                    className="h-3 w-3 flex-shrink-0 opacity-80"
                                    aria-hidden="true"
                                  />
                                </>
                              ) : (
                                <span className="sr-only">
                                  {t('sidebar.chrome.planLockTooltip', { item: item.title })}
                                </span>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      }

                      return (
                        <SidebarMenuItem key={`${section.label}-${item.title}-${item.url}`}>
                          {getContextSectionsForItem(item.url).length > 0 ? (
                            <MegaMenuDropdown
                              trigger={
                                <SidebarMenuButton
                                  tooltip={item.title}
                                  className={
                                    isNavLinkActive(item.url)
                                      ? `transition-all duration-200 group relative flex items-center ${NAV_LINK_ACTIVE}`
                                      : `transition-all duration-200 group relative flex items-center ${NAV_LINK_INACTIVE}`
                                  }
                                >
                                  <IconComponent
                                    className="h-4 w-4 shrink-0 stroke-[2]"
                                    aria-hidden="true"
                                  />
                                  {!isCollapsed ? (
                                    <span className="flex-1 font-medium">{item.title}</span>
                                  ) : (
                                    <span className="sr-only">{item.title}</span>
                                  )}
                                </SidebarMenuButton>
                              }
                              sections={getContextSectionsForItem(item.url)}
                              isOpen={megaMenuOpen}
                              onOpenChange={setMegaMenuOpen}
                            />
                          ) : (
                            <SidebarMenuButton asChild tooltip={item.title}>
                              <NavLink
                                to={parseNavTo(resolveNavHref(item.url))}
                                end
                                onClick={() => recordNavClick(item.url)}
                                className={
                                  isNavLinkActive(item.url)
                                    ? `transition-all duration-200 group relative flex items-center ${NAV_LINK_ACTIVE}`
                                    : `transition-all duration-200 group relative flex items-center ${NAV_LINK_INACTIVE}`
                                }
                              >
                                <IconComponent
                                  className="h-4 w-4 shrink-0 stroke-[2]"
                                  aria-hidden="true"
                                />
                                {!isCollapsed ? (
                                  <span className="flex-1 font-medium">{item.title}</span>
                                ) : (
                                  <span className="sr-only">{item.title}</span>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarCollapsibleSection>
            </React.Fragment>
          ))}

        {/* Bouton Retour Dashboard (visible uniquement sur pages admin) */}
        {showAdminMenu && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={t('sidebar.chrome.adminBackToDashboard')}>
                    <NavLink
                      to="/dashboard"
                      className={`${NAV_LINK_INACTIVE} transition-all duration-200`}
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      {!isCollapsed && <span>{t('sidebar.chrome.adminBackToDashboard')}</span>}
                      {isCollapsed && (
                        <span className="sr-only">{t('sidebar.chrome.adminBackToDashboard')}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Menu Items - Organisé par sections */}
        {showAdminMenu &&
          activeSections.map((section, sectionIndex) => (
            <React.Fragment key={section.sectionKey}>
              {isCollapsed && sectionIndex > 0 && (
                <div
                  className="app-sidebar-rail-separator mx-auto my-1 h-px w-6 bg-border"
                  role="separator"
                />
              )}
              <SidebarCollapsibleSection
                sectionId={section.sectionKey}
                label={section.label}
                isOpen={isCollapsed || !collapsedSections.includes(section.sectionKey)}
                onToggle={() => toggleSectionCollapse(section.sectionKey)}
                hideHeader={isCollapsed}
              >
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map(item => {
                      const IconComponent = resolveNavItemIcon(item.url, item.icon) ?? Circle;
                      if (!item.icon) {
                        logger.warn(`Menu item missing icon: ${item.title}`);
                      }
                      return (
                        <SidebarMenuItem key={`${section.label}-${item.title}-${item.url}`}>
                          <SidebarMenuButton asChild tooltip={item.title}>
                            <NavLink
                              to={parseNavTo(item.url)}
                              end
                              onClick={() => recordNavClick(item.url)}
                              className={
                                isNavItemActive(item.url, location.pathname, location.search)
                                  ? `transition-all duration-200 ${NAV_LINK_ACTIVE}`
                                  : `transition-all duration-200 ${NAV_LINK_INACTIVE}`
                              }
                            >
                              <IconComponent
                                className="h-4 w-4 shrink-0 stroke-[2]"
                                aria-hidden="true"
                              />
                              {!isCollapsed ? (
                                <span>{item.title}</span>
                              ) : (
                                <span className="sr-only">{item.title}</span>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarCollapsibleSection>
            </React.Fragment>
          ))}
      </SidebarContent>

      {/* Context Sidebar - Enterprise-grade domain-specific navigation */}
      <ContextSidebar isOpen={contextSidebarOpen} onClose={closeContextSidebar} />
    </Sidebar>
  );
}
