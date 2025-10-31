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
  Palette,
  Layout,
  Sparkles,
  X,
  Command,
} from "lucide-react";
import payhukLogo from "@/assets/payhuk-logo.png";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useMemo, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
    label: "Templates & Design",
    items: [
      {
        title: "Marketplace Templates",
        url: "/demo/templates-ui",
        icon: Palette,
      },
      {
        title: "Mes Templates",
        url: "/dashboard/my-templates",
        icon: Layout,
      },
      {
        title: "Créer avec Template",
        url: "/dashboard/products/new",
        icon: Sparkles,
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
        title: "Avis",
        url: "/admin/reviews",
        icon: FileText,
      },
      {
        title: "Licences",
        url: "/dashboard/license-management",
        icon: Key,
      },
    ]
  },
  {
    label: "Templates & Design",
    items: [
      {
        title: "Marketplace Templates",
        url: "/demo/templates-ui",
        icon: Palette,
      },
      {
        title: "Gestion Templates",
        url: "/admin/templates",
        icon: Layout,
      },
      {
        title: "Templates Premium",
        url: "/admin/templates-premium",
        icon: Sparkles,
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
        title: "Sécurité 2FA",
        url: "/admin/security",
        icon: Shield,
      },
      {
        title: "Activité",
        url: "/admin/activity",
        icon: History,
      },
      {
        title: "Audit",
        url: "/admin/audit",
        icon: FileText,
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

// Interface pour les items avec badges
interface MenuItemWithBadge {
  title: string;
  url: string;
  icon: any;
  badge?: number | string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  tooltip?: string;
  shortcut?: string;
}

interface MenuSection {
  label: string;
  items: MenuItemWithBadge[];
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const isCollapsed = state === "collapsed";
  const { data: unreadCount = 0 } = useUnreadCount();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  // Détecte si on est sur une page admin
  const isOnAdminPage = location.pathname.startsWith('/admin');

  // Recherche dans le menu
  const filteredMenuSections = useMemo(() => {
    if (!searchQuery.trim()) return menuSections;
    
    const query = searchQuery.toLowerCase();
    return menuSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.title.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query)
        )
      }))
      .filter(section => section.items.length > 0);
  }, [searchQuery]);

  const filteredAdminMenuSections = useMemo(() => {
    if (!searchQuery.trim()) return adminMenuSections;
    
    const query = searchQuery.toLowerCase();
    return adminMenuSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.title.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query)
        )
      }))
      .filter(section => section.items.length > 0);
  }, [searchQuery]);

  // Raccourci clavier pour la recherche (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchVisible(true);
      }
      if (e.key === 'Escape' && isSearchVisible) {
        setIsSearchVisible(false);
        setSearchQuery("");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchVisible]);

  // Ajout de badges dynamiques pour certains items
  const menuSectionsWithBadges = useMemo(() => {
    return menuSections.map(section => ({
      ...section,
      items: section.items.map(item => {
        // Ajouter badge de notifications pour certaines pages
        if (item.url === "/notifications" || item.url === "/dashboard/orders") {
          return { ...item, badge: unreadCount > 0 ? unreadCount : undefined };
        }
        return item;
      })
    }));
  }, [unreadCount]);

  const handleLogout = useCallback(async () => {
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
  }, [toast, navigate]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Utiliser les sections filtrées ou avec badges
  const sectionsToRender = searchQuery ? filteredMenuSections : menuSectionsWithBadges;
  const adminSectionsToRender = searchQuery ? filteredAdminMenuSections : adminMenuSections;

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar 
        collapsible="icon" 
        className="border-r bg-card/50 backdrop-blur-sm transition-all duration-300"
      >
        <SidebarContent className="overflow-y-auto overscroll-contain">
          {/* Logo avec animation */}
          <div className="p-3 sm:p-4 border-b border-border/50 bg-gradient-to-r from-background to-muted/20">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <img 
                      src={payhukLogo} 
                      alt="Payhuk" 
                      className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 object-contain transition-transform hover:scale-110" 
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden lg:block">
                  <p>Tableau de bord Payhuk</p>
                </TooltipContent>
              </Tooltip>
              {!isCollapsed && (
                <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate animate-in fade-in duration-300">
                  Payhuk
                </span>
              )}
            </div>
          </div>

          {/* Barre de recherche améliorée */}
          {!isCollapsed && (
            <div className="p-3 sm:p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher dans le menu..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-9 h-9 text-sm bg-background/50 border-border/50 focus:bg-background transition-all duration-200"
                  onFocus={() => setIsSearchVisible(true)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchVisible(false);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                {!searchQuery && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">
                      <Command className="h-3 w-3" />
                    </kbd>
                    <span className="text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">K</kbd>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message si aucun résultat de recherche */}
          {searchQuery && sectionsToRender.length === 0 && !isOnAdminPage && (
            <div className="p-6 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
            </div>
          )}

          {/* Menu Items - Organisé par sections (masqué sur pages admin) */}
          {!isOnAdminPage && sectionsToRender.map((section) => (
            <SidebarGroup key={section.label} className="animate-in fade-in slide-in-from-left-2 duration-300">
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                {!isCollapsed && section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.url || 
                      (item.url === "/dashboard" && location.pathname === "/dashboard");
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton asChild className="w-full">
                              <NavLink
                                to={item.url}
                                end={item.url === "/dashboard"}
                                className={({ isActive: navIsActive }) =>
                                  cn(
                                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    navIsActive || isActive
                                      ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary shadow-sm"
                                      : "text-foreground/70 hover:text-foreground"
                                  )
                                }
                              >
                                <item.icon className={cn(
                                  "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                                  isActive && "scale-110"
                                )} />
                                {!isCollapsed && (
                                  <>
                                    <span className="flex-1 truncate">{item.title}</span>
                                    {item.badge && (
                                      <Badge 
                                        variant={item.badgeVariant || "destructive"} 
                                        className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px] font-semibold animate-in zoom-in duration-200"
                                      >
                                        {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                                      </Badge>
                                    )}
                                    {item.shortcut && !item.badge && (
                                      <kbd className="ml-auto hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                        {item.shortcut}
                                      </kbd>
                                    )}
                                  </>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {isCollapsed && (
                            <TooltipContent side="right" className="flex items-center gap-2">
                              <span>{item.title}</span>
                              {item.badge && (
                                <Badge variant={item.badgeVariant || "destructive"} className="text-[10px]">
                                  {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                                </Badge>
                              )}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          {/* Message si aucun résultat de recherche (admin) */}
          {searchQuery && adminSectionsToRender.length === 0 && isOnAdminPage && (
            <div className="p-6 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
            </div>
          )}

          {/* Bouton Retour Dashboard (visible uniquement sur pages admin) */}
          {isAdmin && isOnAdminPage && (
            <SidebarGroup className="animate-in fade-in slide-in-from-left-2 duration-300">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to="/dashboard"
                            className={cn(
                              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                              "text-primary hover:bg-primary/10 hover:translate-x-1"
                            )}
                          >
                            <LayoutDashboard className="h-4 w-4 transition-transform group-hover:scale-110" />
                            {!isCollapsed && <span>← Retour Dashboard</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          <p>Retour au tableau de bord</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Admin Menu Items - Organisé par sections */}
          {isAdmin && adminSectionsToRender.map((section) => (
            <SidebarGroup key={section.label} className="animate-in fade-in slide-in-from-left-2 duration-300">
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                {!isCollapsed && section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.url;
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton asChild className="w-full">
                              <NavLink
                                to={item.url}
                                className={({ isActive: navIsActive }) =>
                                  cn(
                                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    navIsActive || isActive
                                      ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary shadow-sm"
                                      : "text-foreground/70 hover:text-foreground"
                                  )
                                }
                              >
                                <item.icon className={cn(
                                  "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                                  isActive && "scale-110"
                                )} />
                                {!isCollapsed && (
                                  <>
                                    <span className="flex-1 truncate">{item.title}</span>
                                    {item.badge && (
                                      <Badge 
                                        variant={item.badgeVariant || "destructive"} 
                                        className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px] font-semibold animate-in zoom-in duration-200"
                                      >
                                        {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {isCollapsed && (
                            <TooltipContent side="right" className="flex items-center gap-2">
                              <span>{item.title}</span>
                              {item.badge && (
                                <Badge variant={item.badgeVariant || "destructive"} className="text-[10px]">
                                  {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                                </Badge>
                              )}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* Footer amélioré */}
        <SidebarFooter className="border-t border-border/50 bg-muted/30 p-3 sm:p-4 space-y-2 backdrop-blur-sm">
          {!isCollapsed && (
            <div className="animate-in fade-in duration-300">
              <LanguageSwitcher variant="outline" showLabel={true} className="w-full" />
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 transition-all duration-200",
                  "hover:bg-destructive/10 hover:text-destructive",
                  "text-foreground/70"
                )}
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
                {!isCollapsed && (
                  <span className="font-medium">Déconnexion</span>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Se déconnecter</p>
              </TooltipContent>
            )}
          </Tooltip>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
