import { ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminRoute } from '@/components/AdminRoute';
import { RequireAAL2 } from '@/components/admin/RequireAAL2';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminMFA } from '@/hooks/useAdminMFA';
import { useAuth } from '@/contexts/AuthContext';
import { isPrincipalAdminEmail } from '@/lib/principal-admin';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import { ADMIN_NAV_SECTIONS, filterAdminNavSections } from '@/lib/admin/admin-nav';
import { Menu, X } from 'lucide-react';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAAL2 } = useAdminMFA();
  const { can, isSuperAdmin, platformRole, loading: permLoading } = useCurrentAdminPermissions();
  const showMfaStatus = !isPrincipalAdminEmail(user?.email);

  const menuSections = useMemo(() => {
    if (permLoading) return [];
    return filterAdminNavSections(ADMIN_NAV_SECTIONS, can, isSuperAdmin);
  }, [permLoading, can, isSuperAdmin]);
  const menuItems = useMemo(() => menuSections.flatMap(section => section.items), [menuSections]);

  // Sur mobile: sidebar desktop par défaut fermée (sinon elle écrase le contenu).
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const activeLabel = useMemo(() => {
    const active = menuItems.find(item => item.path === location.pathname);
    return active?.label ?? 'Administration';
  }, [location.pathname]);

  const goTo = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header mobile (sticky) */}
        <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur md:hidden">
          <div className="flex h-14 items-center justify-between px-3">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Ouvrir le menu admin"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{activeLabel}</div>
                <div className="flex items-center gap-2">
                  {showMfaStatus && (
                    <Badge
                      variant={isAAL2 ? 'default' : 'destructive'}
                      className="text-[10px] uppercase tracking-wide"
                    >
                      {isAAL2 ? 'AAL2' : 'AAL1'}
                    </Badge>
                  )}
                  <span className="truncate text-xs text-muted-foreground">
                    {platformRole ?? 'Admin'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu mobile (Sheet) */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[18rem] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <span>Administration</span>
                {showMfaStatus && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Badge
                            variant={isAAL2 ? 'default' : 'destructive'}
                            className="text-[10px] uppercase tracking-wide"
                          >
                            {isAAL2 ? 'AAL2' : 'AAL1'}
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isAAL2 ? '2FA active (AAL2)' : '2FA inactive - activez la 2FA'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </SheetTitle>
            </SheetHeader>
            <nav className="max-h-[calc(100vh-64px)] overflow-y-auto space-y-4 p-4">
              {menuSections.map(section => (
                <div key={section.label} className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    {section.label}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Button
                          key={item.path}
                          variant={isActive ? 'default' : 'ghost'}
                          className="w-full justify-start gap-3"
                          onClick={() => goTo(item.path)}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                          <span>{item.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Sidebar desktop */}
        <aside
          className={cn(
            'app-premium-admin-aside fixed left-0 top-0 z-40 hidden h-screen transition-[width] border-r md:block',
            sidebarOpen ? 'w-64' : 'w-20'
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b">
              {sidebarOpen && (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Administration
                  </h2>
                  {showMfaStatus && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Badge
                              variant={isAAL2 ? 'default' : 'destructive'}
                              className="text-[10px] uppercase tracking-wide"
                            >
                              {isAAL2 ? 'AAL2' : 'AAL1'}
                            </Badge>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isAAL2 ? '2FA active (AAL2)' : '2FA inactive - activez la 2FA'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="ml-auto"
                aria-label={sidebarOpen ? 'Fermer le menu latéral' : 'Ouvrir le menu latéral'}
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </div>

            {/* Menu Items organisés par sections */}
            <nav className="flex-1 space-y-4 p-4 overflow-y-auto">
              {menuSections.map(section => (
                <div key={section.label} className="space-y-2">
                  {sidebarOpen && (
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                      {section.label}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <Button
                          key={item.path}
                          variant={isActive ? 'default' : 'ghost'}
                          className={cn(
                            'w-full justify-start gap-3',
                            !sidebarOpen && 'justify-center'
                          )}
                          onClick={() => navigate(item.path)}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                          {sidebarOpen && <span>{item.label}</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            'transition-all pb-16 md:pb-0',
            // Sur mobile: pas de marge gauche; sur desktop: marge selon l'état.
            sidebarOpen ? 'md:ml-64' : 'md:ml-20'
          )}
        >
          <div className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4">
            <AdminBreadcrumb />
          </div>
          <RequireAAL2>{children}</RequireAAL2>
        </main>
      </div>
    </AdminRoute>
  );
};
