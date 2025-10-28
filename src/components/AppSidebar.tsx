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
  TrendingUp,
  BookOpen,
  GraduationCap,
  Download,
  Key,
  Truck,
  Warehouse,
  Calendar,
  FileText,
  Scale,
  BoxIcon,
  Headphones,
} from "lucide-react";
import payhukLogo from "@/assets/payhuk-logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
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

// Menu organisé par sections
const menuSections = [
  {
    label: "Principal",
    items: [
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
    ]
  },
  {
    label: "Produits & Cours",
    items: [
      {
        title: "Produits",
        url: "/dashboard/products",
        icon: Package,
      },
      {
        title: "Mes Cours",
        url: "/dashboard/my-courses",
        icon: GraduationCap,
      },
      {
        title: "Produits Digitaux",
        url: "/dashboard/digital-products",
        icon: Download,
      },
      {
        title: "Mes Téléchargements",
        url: "/dashboard/my-downloads",
        icon: Download,
      },
      {
        title: "Mes Licences",
        url: "/dashboard/my-licenses",
        icon: Key,
      },
    ]
  },
  {
    label: "Ventes & Logistique",
    items: [
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
        title: "Réservations",
        url: "/dashboard/bookings",
        icon: Calendar,
      },
      {
        title: "Inventaire",
        url: "/dashboard/inventory",
        icon: Warehouse,
      },
      {
        title: "Expéditions",
        url: "/dashboard/shipping",
        icon: Truck,
      },
    ]
  },
  {
    label: "Finance & Paiements",
    items: [
      {
        title: "Paiements",
        url: "/dashboard/payments",
        icon: CreditCard,
      },
      {
        title: "Solde à Payer",
        url: "/dashboard/pay-balance",
        icon: DollarSign,
      },
      {
        title: "Gestion Paiements",
        url: "/dashboard/payment-management",
        icon: FileText,
      },
    ]
  },
  {
    label: "Marketing & Croissance",
    items: [
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
        title: "Parrainage",
        url: "/dashboard/referrals",
        icon: UserPlus,
      },
      {
        title: "Affiliation",
        url: "/dashboard/affiliates",
        icon: TrendingUp,
      },
      {
        title: "Cours Promus",
        url: "/affiliate/courses",
        icon: GraduationCap,
      },
    ]
  },
  {
    label: "Analytics & SEO",
    items: [
      {
        title: "Statistiques",
        url: "/dashboard/analytics",
        icon: BarChart3,
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
    ]
  },
  {
    label: "Configuration",
    items: [
      {
        title: "KYC",
        url: "/dashboard/kyc",
        icon: Shield,
      },
      {
        title: "Paramètres",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ]
  },
];

// Menu flat pour rétrocompatibilité
const menuItems = menuSections.flatMap(section => section.items);

// Menu Admin organisé par sections
const adminMenuSections = [
  {
    label: "Administration",
    items: [
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
    ]
  },
  {
    label: "Catalogue",
    items: [
      {
        title: "Produits",
        url: "/admin/products",
        icon: Package,
      },
      {
        title: "Cours",
        url: "/admin/courses",
        icon: GraduationCap,
      },
      {
        title: "Licences",
        url: "/dashboard/license-management",
        icon: Key,
      },
    ]
  },
  {
    label: "Commerce",
    items: [
      {
        title: "Ventes",
        url: "/admin/sales",
        icon: ShoppingCart,
      },
      {
        title: "Commandes",
        url: "/admin/orders",
        icon: BoxIcon,
      },
      {
        title: "Inventaire Global",
        url: "/admin/inventory",
        icon: Warehouse,
      },
      {
        title: "Expéditions",
        url: "/admin/shipping",
        icon: Truck,
      },
    ]
  },
  {
    label: "Finance",
    items: [
      {
        title: "Revenus Plateforme",
        url: "/admin/revenue",
        icon: DollarSign,
      },
      {
        title: "Paiements",
        url: "/admin/payments",
        icon: CreditCard,
      },
      {
        title: "Litiges",
        url: "/admin/disputes",
        icon: Scale,
      },
    ]
  },
  {
    label: "Croissance",
    items: [
      {
        title: "Parrainages",
        url: "/admin/referrals",
        icon: UserPlus,
      },
      {
        title: "Affiliation",
        url: "/admin/affiliates",
        icon: TrendingUp,
      },
      {
        title: "Analytics",
        url: "/admin/analytics",
        icon: BarChart3,
      },
    ]
  },
  {
    label: "Sécurité & Support",
    items: [
      {
        title: "Admin KYC",
        url: "/admin/kyc",
        icon: ShieldCheck,
      },
      {
        title: "Activité",
        url: "/admin/activity",
        icon: History,
      },
      {
        title: "Support",
        url: "/admin/support",
        icon: Headphones,
      },
      {
        title: "Notifications",
        url: "/admin/notifications",
        icon: Bell,
      },
    ]
  },
  {
    label: "Configuration",
    items: [
      {
        title: "Paramètres",
        url: "/admin/settings",
        icon: Settings,
      },
    ]
  },
];

// Menu Admin flat pour rétrocompatibilité
const adminMenuItems = adminMenuSections.flatMap(section => section.items);

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

        {/* Menu Items - Organisé par sections */}
        {menuSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="!text-black">
              {!isCollapsed && section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
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
        ))}

        {/* Admin Menu Items - Organisé par sections */}
        {isAdmin && adminMenuSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="!text-black">
              {!isCollapsed && section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
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
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-4 space-y-2">
        {!isCollapsed && (
          <LanguageSwitcher variant="outline" showLabel={true} className="w-full" />
        )}
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
