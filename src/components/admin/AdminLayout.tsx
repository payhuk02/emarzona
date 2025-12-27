import { ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminRoute } from '@/components/AdminRoute';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminMFA } from '@/hooks/useAdminMFA';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  UserPlus,
  Settings,
  Bell,
  Menu,
  X,
  Store,
  Package,
  History,
  BoxIcon,
  CreditCard,
  Scale,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Headphones,
  GraduationCap,
  Warehouse,
  Truck,
  DollarSign,
  FileText,
  Sparkles,
  Key,
  Shield,
  RotateCcw,
  Webhook,
  Gift,
  Star,
  Percent,
  MessageSquare,
  Activity,
  Accessibility,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

// Menu organisé par sections pour une meilleure navigation
const menuSections = [
  {
    label: 'Administration',
    items: [
      { icon: LayoutDashboard, label: "Vue d'ensemble", path: '/admin' },
      { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
      { icon: Store, label: 'Boutiques', path: '/admin/stores' },
      { icon: Users, label: 'Communauté', path: '/admin/community' },
      { icon: Key, label: 'Licences', path: '/dashboard/license-management' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { icon: Package, label: 'Produits', path: '/admin/products' },
      { icon: GraduationCap, label: 'Cours', path: '/admin/courses' },
      { icon: FileText, label: 'Avis', path: '/admin/reviews' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { icon: ShoppingCart, label: 'Ventes', path: '/admin/sales' },
      { icon: BoxIcon, label: 'Commandes', path: '/admin/orders' },
      { icon: Warehouse, label: 'Inventaire', path: '/admin/inventory' },
      { icon: Truck, label: 'Expéditions', path: '/admin/shipping' },
      {
        icon: MessageSquare,
        label: 'Conversations Livraison',
        path: '/admin/shipping-conversations',
      },
      {
        icon: MessageSquare,
        label: 'Conversations Clients-Vendeurs',
        path: '/admin/vendor-conversations',
      },
      { icon: RotateCcw, label: 'Retours', path: '/admin/returns' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { icon: DollarSign, label: 'Revenus', path: '/admin/revenue' },
      { icon: CreditCard, label: 'Paiements', path: '/admin/payments' },
      { icon: Percent, label: 'Taxes', path: '/admin/taxes' },
      { icon: Scale, label: 'Litiges', path: '/admin/disputes' },
      { icon: BarChart3, label: 'Statistiques Moneroo', path: '/admin/moneroo-analytics' },
      { icon: RotateCcw, label: 'Réconciliation Moneroo', path: '/admin/moneroo-reconciliation' },
    ],
  },
  {
    label: 'Marketing & Engagement',
    items: [
      { icon: UserPlus, label: 'Parrainages', path: '/admin/referrals' },
      { icon: TrendingUp, label: 'Affiliation', path: '/admin/affiliates' },
      { icon: Star, label: 'Programme de Fidélité', path: '/admin/loyalty' },
      { icon: Gift, label: 'Cartes Cadeaux', path: '/admin/gift-cards' },
    ],
  },
  {
    label: 'Systèmes & Intégrations',
    items: [
      { icon: Settings, label: 'Intégrations', path: '/admin/integrations' },
      { icon: Webhook, label: 'Webhooks', path: '/dashboard/webhooks' },
      // Système unifié pour tous les types de webhooks
    ],
  },
  {
    label: 'Analytics & Monitoring',
    items: [
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
      { icon: BarChart3, label: 'Monitoring Transactions', path: '/admin/transaction-monitoring' },
      { icon: Activity, label: 'Monitoring', path: '/admin/monitoring' },
    ],
  },
  {
    label: 'Sécurité & Support',
    items: [
      { icon: ShieldCheck, label: 'Admin KYC', path: '/admin/kyc' },
      { icon: Shield, label: 'Sécurité 2FA', path: '/admin/security' },
      { icon: History, label: 'Activité', path: '/admin/activity' },
      { icon: FileText, label: 'Audit', path: '/admin/audit' },
      { icon: Headphones, label: 'Support', path: '/admin/support' },
      { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
      { icon: Accessibility, label: 'Accessibilité', path: '/admin/accessibility' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { icon: Settings, label: 'Paramètres', path: '/admin/settings' },
      { icon: Percent, label: 'Commissions', path: '/admin/commission-settings' },
      { icon: DollarSign, label: 'Paiements Commissions', path: '/admin/commission-payments' },
      { icon: Sparkles, label: 'Personnalisation', path: '/admin/platform-customization' },
    ],
  },
];

// Menu flat pour la navigation
const menuItems = menuSections.flatMap(section => section.items);

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAAL2 } = useAdminMFA();

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
                  <Badge
                    variant={isAAL2 ? 'default' : 'destructive'}
                    className="text-[10px] uppercase tracking-wide"
                  >
                    {isAAL2 ? 'AAL2' : 'AAL1'}
                  </Badge>
                  <span className="truncate text-xs text-muted-foreground">Admin</span>
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
            'fixed left-0 top-0 z-40 hidden h-screen transition-[width] bg-card border-r md:block',
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
          {children}
        </main>
      </div>
    </AdminRoute>
  );
};






