import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  Tag,
  LogOut,
  Store,
  Shield,
  ShieldCheck,
  DollarSign,
  UserPlus,
  History,
  Bell,
  Target,
  Search,
  MessageSquare,
} from "lucide-react";
import payhukLogo from "@/assets/payhuk-logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";

const menuItems = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Boutique",
    url: "/dashboard/store",
    icon: Store,
  },
  {
    title: "Marketplace",
    url: "/marketplace",
    icon: ShoppingCart,
  },
  {
    title: "Produits",
    url: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Commandes",
    url: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    title: "Commandes Avancées",
    url: "/dashboard/advanced-orders",
    icon: MessageSquare,
  },
  {
    title: "Clients",
    url: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Promotions",
    url: "/dashboard/promotions",
    icon: Tag,
  },
  {
    title: "Statistiques",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Paiements",
    url: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    title: "KYC",
    url: "/dashboard/kyc",
    icon: Shield,
  },
  {
    title: "Parrainage",
    url: "/dashboard/referrals",
    icon: UserPlus,
  },
  {
    title: "Mes Pixels",
    url: "/dashboard/pixels",
    icon: Target,
  },
  {
    title: "Mon SEO",
    url: "/dashboard/seo",
    icon: Search,
  },
  {
    title: "Paramètres",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

const adminMenuItems = [
  {
    title: "Vue d'ensemble",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Utilisateurs",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Boutiques",
    url: "/admin/stores",
    icon: Store,
  },
  {
    title: "Produits",
    url: "/admin/products",
    icon: Package,
  },
  {
    title: "Ventes",
    url: "/admin/sales",
    icon: ShoppingCart,
  },
  {
    title: "Parrainages",
    url: "/admin/referrals",
    icon: UserPlus,
  },
  {
    title: "Activité",
    url: "/admin/activity",
    icon: History,
  },
  {
    title: "Revenus Plateforme",
    url: "/admin/revenue",
    icon: DollarSign,
  },
  {
    title: "Admin KYC",
    url: "/admin/kyc",
    icon: ShieldCheck,
  },
  {
    title: "Litiges",
    url: "/admin/disputes",
    icon: Shield,
  },
  {
    title: "Paramètres",
    url: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Notifications",
    url: "/admin/notifications",
    icon: Bell,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive"
      });
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {/* Logo */}
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center gap-2">
            <img 
              src={payhukLogo} 
              alt="Payhuk" 
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 object-contain" 
            />
            {!isCollapsed && (
              <span className="text-base sm:text-lg font-bold text-black dark:text-white truncate">
                Payhuk
              </span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <SidebarGroup>
          <SidebarGroupLabel className="!text-black">Menu principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={({ isActive }) =>
                        `transition-all duration-300 ${
                          isActive
                            ? "bg-primary/20 text-primary font-semibold border-l-2 border-primary"
                            : "!text-black hover:bg-muted hover:translate-x-1"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Menu Items */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="!text-black">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `transition-all duration-300 ${
                            isActive
                              ? "bg-primary/20 text-primary font-semibold border-l-2 border-primary"
                              : "!text-black hover:bg-muted hover:translate-x-1"
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start !text-black"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
