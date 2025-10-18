import { ReactNode, useState } from 'react';
import { AdminRoute } from '@/components/AdminRoute';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Vue d\'ensemble', path: '/admin' },
  { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
  { icon: Store, label: 'Boutiques', path: '/admin/stores' },
  { icon: Package, label: 'Produits', path: '/admin/products' },
  { icon: ShoppingCart, label: 'Ventes', path: '/admin/sales' },
  { icon: UserPlus, label: 'Parrainages', path: '/admin/referrals' },
  { icon: History, label: 'Activité', path: '/admin/activity' },
  { icon: Settings, label: 'Paramètres', path: '/admin/settings' },
  { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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
                <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Administration
                </h2>
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

            {/* Menu Items */}
            <nav className="flex-1 space-y-2 p-4">
              {menuItems.map((item) => {
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
