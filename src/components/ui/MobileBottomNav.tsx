/**
 * Mobile Bottom Navigation - Phase 2 UX
 * Navigation en bas d'écran optimisée pour mobile
 */

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingBag,
  User,
  Menu,
  Search,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  ariaLabel: string;
}

const navItems: NavItem[] = [
  {
    label: "Accueil",
    icon: Home,
    path: "/",
    ariaLabel: "Aller à l'accueil",
  },
  {
    label: "Marketplace",
    icon: ShoppingBag,
    path: "/marketplace",
    ariaLabel: "Aller à la marketplace",
  },
  {
    label: "Recherche",
    icon: Search,
    path: "/marketplace?search=true",
    ariaLabel: "Rechercher des produits",
  },
  {
    label: "Menu",
    icon: Menu,
    path: "/dashboard",
    ariaLabel: "Ouvrir le menu",
  },
  {
    label: "Compte",
    icon: User,
    path: "/account",
    ariaLabel: "Aller à mon compte",
  },
];

/**
 * Navigation en bas d'écran pour mobile
 */
export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom md:hidden"
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                "min-w-[44px] min-h-[44px]", // Touch target optimal
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}



