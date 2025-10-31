import { ReactNode, useState } from 'react';
import { AdminRoute } from '@/components/AdminRoute';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminMFA } from '@/hooks/useAdminMFA';
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
  Layout,
  Key,
  Shield,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

// Menu organisé par sections pour une meilleure navigation
const menuSections = [
  {
    label: 'Administration',
    items: [
      { icon: LayoutDashboard, label: 'Vue d\'ensemble', path: '/admin' },
      { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
      { icon: Store, label: 'Boutiques', path: '/admin/stores' },
    ]
  },
  {
    label: 'Catalogue',
    items: [
      { icon: Package, label: 'Produits', path: '/admin/products' },
      { icon: GraduationCap, label: 'Cours', path: '/admin/courses' },
      { icon: FileText, label: 'Avis', path: '/admin/reviews' },
      { icon: Key, label: 'Licences', path: '/dashboard/license-management' },
    ]
  },
  {
    label: 'Commerce',
    items: [
      { icon: ShoppingCart, label: 'Ventes', path: '/admin/sales' },
      { icon: BoxIcon, label: 'Commandes', path: '/admin/orders' },
      { icon: Warehouse, label: 'Inventaire', path: '/admin/inventory' },
      { icon: Truck, label: 'Expéditions', path: '/admin/shipping' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { icon: DollarSign, label: 'Revenus', path: '/admin/revenue' },
      { icon: CreditCard, label: 'Paiements', path: '/admin/payments' },
      { icon: Scale, label: 'Litiges', path: '/admin/disputes' },
    ]
  },
  {
    label: 'Croissance',
    items: [
      { icon: UserPlus, label: 'Parrainages', path: '/admin/referrals' },
      { icon: TrendingUp, label: 'Affiliation', path: '/admin/affiliates' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    ]
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
    ]
  },
  {
    label: 'Templates',
    items: [
      { icon: Layout, label: 'Templates', path: '/admin/templates' },
      { icon: Sparkles, label: 'Templates Premium', path: '/admin/templates-premium' },
    ]
  },
  {
    label: 'Configuration',
    items: [
      { icon: Settings, label: 'Paramètres', path: '/admin/settings' },
    ]
  },
];

// Menu flat pour la navigation
const menuItems = menuSections.flatMap(section => section.items);

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAAL2 } = useAdminMFA();

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-0 z-40 h-screen transition-transform bg-card border-r',
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
                          <Badge variant={isAAL2 ? 'default' : 'destructive'} className="text-[10px] uppercase tracking-wide">
                            {isAAL2 ? 'AAL2' : 'AAL1'}
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{isAAL2 ? '2FA active (AAL2)' : '2FA inactive - activez la 2FA'}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="ml-auto"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>

            {/* Menu Items organisés par sections */}
            <nav className="flex-1 space-y-4 p-4 overflow-y-auto">
              {menuSections.map((section) => (
                <div key={section.label} className="space-y-2">
                  {sidebarOpen && (
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                      {section.label}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
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
                          <Icon className="h-5 w-5" />
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
            'transition-all',
            sidebarOpen ? 'ml-64' : 'ml-20'
          )}
        >
          {children}
        </main>
      </div>
    </AdminRoute>
  );
};
