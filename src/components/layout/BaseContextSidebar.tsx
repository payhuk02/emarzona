/**
 * Base Context Sidebar - Composant de base professionnel et responsive
 * Gère desktop (fixed) et mobile (drawer + barre horizontale en bas) avec animations fluides
 */

import { ReactNode, isValidElement, Children, useMemo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Menu, Search, Clock3, Pin, ChevronDown } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

interface BaseContextSidebarProps {
  breadcrumbItems: BreadcrumbItem[];
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
}

interface ExtractedNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PINNED_CONTEXT_NAV_KEY = 'contextSidebarPinnedUrls';
const RECENT_CONTEXT_NAV_KEY = 'contextSidebarRecentUrls';
const MAX_RECENT_ITEMS = 5;

/**
 * Fonction récursive pour extraire les ContextSidebarNavItem des enfants
 * Détecte les items par leurs props (label, path, icon)
 */
const extractNavItems = (children: ReactNode): ExtractedNavItem[] => {
  const items: ExtractedNavItem[] = [];

  Children.forEach(children, child => {
    if (isValidElement(child)) {
      const props = (child.props || {}) as {
        label?: string;
        path?: string;
        icon?: React.ComponentType<{ className?: string }>;
        children?: ReactNode;
      };

      // Si c'est un ContextSidebarNavItem (a les props label, path, icon)
      if (props.label && props.path && props.icon) {
        items.push({ label: props.label, path: props.path, icon: props.icon });
      }
      // Si c'est un nav ou un autre conteneur, on extrait ses enfants
      else if (props.children) {
        const nestedItems = extractNavItems(props.children);
        items.push(...nestedItems);
      }
    }
  });

  return items;
};

/**
 * Composant de base pour toutes les sidebars contextuelles
 * - Desktop: Sidebar fixe à gauche
 * - Mobile: Drawer accessible + Barre de navigation horizontale fixe en bas
 * - Design professionnel avec animations fluides
 */
export const BaseContextSidebar = ({
  breadcrumbItems,
  children,
  className = '',
  triggerClassName = '',
}: BaseContextSidebarProps) => {
  const { setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [navSearch, setNavSearch] = useState('');
  const [pinnedUrls, setPinnedUrls] = useState<string[]>([]);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [quickNavOpen, setQuickNavOpen] = useState(false);

  // Mémoriser les items de navigation pour éviter les re-renders inutiles
  const navItems = useMemo(() => {
    return extractNavItems(children);
  }, [children]);

  const currentNavItem = useMemo(
    () =>
      navItems.find(
        item =>
          location.pathname === item.path ||
          (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`))
      ) ?? null,
    [location.pathname, navItems]
  );

  useEffect(() => {
    try {
      const storedPinned = localStorage.getItem(PINNED_CONTEXT_NAV_KEY);
      const storedRecent = localStorage.getItem(RECENT_CONTEXT_NAV_KEY);
      if (storedPinned) setPinnedUrls(JSON.parse(storedPinned));
      if (storedRecent) setRecentUrls(JSON.parse(storedRecent));
    } catch (error) {
      logger.warn('Failed to load context sidebar preferences', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PINNED_CONTEXT_NAV_KEY, JSON.stringify(pinnedUrls));
  }, [pinnedUrls]);

  useEffect(() => {
    localStorage.setItem(RECENT_CONTEXT_NAV_KEY, JSON.stringify(recentUrls));
  }, [recentUrls]);

  useEffect(() => {
    if (!currentNavItem?.path) return;
    setRecentUrls(prev =>
      [currentNavItem.path, ...prev.filter(url => url !== currentNavItem.path)].slice(
        0,
        MAX_RECENT_ITEMS
      )
    );
  }, [currentNavItem?.path]);

  const togglePinCurrentPage = () => {
    if (!currentNavItem?.path) return;
    setPinnedUrls(prev =>
      prev.includes(currentNavItem.path)
        ? prev.filter(url => url !== currentNavItem.path)
        : [currentNavItem.path, ...prev].slice(0, 10)
    );
  };

  const pinnedItems = useMemo(
    () => navItems.filter(item => pinnedUrls.includes(item.path)),
    [navItems, pinnedUrls]
  );
  const recentItems = useMemo(
    () =>
      recentUrls
        .map(url => navItems.find(item => item.path === url))
        .filter((item): item is ExtractedNavItem => Boolean(item))
        .filter(item => !pinnedUrls.includes(item.path)),
    [recentUrls, navItems, pinnedUrls]
  );
  const searchResults = useMemo(() => {
    const query = navSearch.trim().toLowerCase();
    if (!query) return [];
    return navItems
      .filter(item => `${item.label} ${item.path}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [navSearch, navItems]);

  // Desktop: Sidebar fixe
  const desktopSidebar = (
    <aside
      className={cn(
        'app-context-sidebar hidden md:block fixed left-0 top-16 w-[15rem] lg:w-60 xl:w-64 h-[calc(100vh-4rem)]',
        'border-r border-white/10',
        'text-white',
        'overflow-y-auto overflow-x-hidden z-40',
        'transition-all duration-300 ease-in-out',
        'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent',
        'shadow-[4px_0_12px_rgba(0,0,0,0.15)]',
        'backdrop-blur-sm',
        className
      )}
      aria-label="Navigation contextuelle"
    >
      <div className="p-3 lg:p-4 space-y-3 lg:space-y-4 min-w-0">
        {/* Breadcrumb horizontal en haut */}
        <Breadcrumb items={breadcrumbItems} />

        <div className="space-y-2.5 pb-2 lg:pb-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setQuickNavOpen(prev => !prev)}
            className="lg:hidden w-full flex items-center justify-between py-1 text-[10px] uppercase tracking-[0.14em] text-white/75 font-bold"
            aria-expanded={quickNavOpen}
          >
            <span>Navigation rapide</span>
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', quickNavOpen && 'rotate-180')}
            />
          </button>

          <div className={cn('space-y-2.5', !quickNavOpen && 'hidden lg:block')}>
            <label
              htmlFor="context-sidebar-search"
              className="hidden lg:block text-[10px] uppercase tracking-[0.14em] text-white/75 font-bold"
            >
              Navigation rapide
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
              <Input
                id="context-sidebar-search"
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
                placeholder="Rechercher..."
                className="h-8 lg:h-9 pl-8 text-sm bg-white/10 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                aria-label="Rechercher dans la navigation contextuelle"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-1 space-y-1 max-h-36 overflow-auto scrollbar-hide">
                {searchResults.map(item => (
                  <Button
                    key={`search-${item.path}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate(item.path);
                      setNavSearch('');
                    }}
                    className="w-full justify-start h-7 px-2 text-xs text-blue-100 hover:bg-white/10 hover:text-white"
                  >
                    <item.icon className="h-3.5 w-3.5 mr-2" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div
            className={cn(
              'flex items-center justify-between gap-2',
              !quickNavOpen && 'hidden lg:flex'
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePinCurrentPage}
              disabled={!currentNavItem}
              className="h-7 px-2 text-xs text-blue-100 hover:bg-white/10 hover:text-white"
            >
              <Pin className="h-3.5 w-3.5 mr-1.5" />
              {currentNavItem && pinnedUrls.includes(currentNavItem.path)
                ? 'Désépingler'
                : 'Épingler'}
            </Button>
            {currentNavItem && (
              <span className="text-[11px] text-blue-100/70 truncate min-w-0 max-w-[7rem] lg:max-w-[9rem]">
                {currentNavItem.label}
              </span>
            )}
          </div>

          {(pinnedItems.length > 0 || recentItems.length > 0) && (
            <div className={cn('space-y-2', !quickNavOpen && 'hidden lg:block')}>
              {pinnedItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-wide text-blue-100/70 font-semibold">
                    Épinglés
                  </p>
                  {pinnedItems.slice(0, 4).map(item => (
                    <Button
                      key={`pin-${item.path}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className="w-full justify-start h-7 px-2 text-xs text-blue-100 hover:bg-white/10 hover:text-white"
                    >
                      <item.icon className="h-3.5 w-3.5 mr-2" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  ))}
                </div>
              )}
              {recentItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-wide text-blue-100/70 font-semibold flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    Récents
                  </p>
                  {recentItems.slice(0, 3).map(item => (
                    <Button
                      key={`recent-${item.path}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className="w-full justify-start h-7 px-2 text-xs text-blue-100/90 hover:bg-white/10 hover:text-white"
                    >
                      <item.icon className="h-3.5 w-3.5 mr-2" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contenu de la sidebar */}
        <div className="space-y-1">{children}</div>
      </div>
    </aside>
  );

  // Mobile: Hamburger pour ouvrir la sidebar principale (AppSidebar)
  const mobileHamburger = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpenMobile(true)}
      className={cn(
        'md:hidden fixed top-16 left-2 z-[60]',
        'h-10 w-10 p-0 rounded-lg',
        'bg-background border border-border',
        'text-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        'shadow-lg',
        'transition-all duration-200 ease-in-out',
        'touch-manipulation',
        triggerClassName
      )}
      aria-label="Ouvrir le menu principal"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );

  // Mobile: Barre de navigation horizontale fixe en bas
  // Toujours visible si des items existent (même après navigation)
  // Utilise useMemo pour éviter les re-renders inutiles
  const mobileBottomNav = useMemo(() => {
    if (navItems.length === 0) return null;

    return (
      <nav
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-[110]',
          'bg-background border-t border-border',
          'shadow-[0_-2px_8px_rgba(0,0,0,0.1)]',
          'safe-area-bottom',
          'context-bottom-nav' // Classe spécifique pour éviter le CSS global
        )}
        role="navigation"
        aria-label="Navigation contextuelle mobile"
        style={{
          position: 'fixed',
          bottom: 0,
          top: 'auto',
          left: 0,
          right: 0,
          zIndex: 110,
        }}
      >
        {/* Scroll horizontal pour les items de navigation */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center justify-start gap-0.5 px-1 py-1.5 min-h-[56px]">
            {navItems.map(item => (
              <ContextSidebarNavItem
                key={`mobile-context-${item.path}`}
                label={item.label}
                path={item.path}
                icon={item.icon}
                horizontal
              />
            ))}
          </div>
        </div>
      </nav>
    );
  }, [navItems]);

  return (
    <>
      {desktopSidebar}
      {mobileHamburger}
      {mobileBottomNav}
    </>
  );
};
