/**
 * Navigation spécifique aux sous-domaines de boutiques (*.myemarzona.shop)
 * Affiche les liens vers les sections de la boutique : Boutique, Portfolio, Collections, Enchères
 * Utilise les couleurs du thème de la boutique si disponibles
 */

import { Link, useLocation } from 'react-router-dom';
import { Store, Palette, FolderOpen, Gavel, ShoppingCart, Menu, X } from 'lucide-react';
import { useState, useMemo, CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StoreThemeColors {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface StoreSubdomainNavProps {
  storeName?: string;
  logoUrl?: string;
  themeColors?: StoreThemeColors;
}

const navItems = [
  { label: 'Boutique', path: '/', icon: Store },
  { label: 'Portfolio', path: '/portfolio', icon: Palette },
  { label: 'Collections', path: '/collections', icon: FolderOpen },
  { label: 'Enchères', path: '/auctions', icon: Gavel },
];

/**
 * Convertit un hex en rgba avec opacité
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function StoreSubdomainNav({ storeName, logoUrl, themeColors }: StoreSubdomainNavProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasTheme = themeColors?.primaryColor;

  const navStyle = useMemo<CSSProperties>(() => {
    if (!hasTheme) return {};
    return {
      backgroundColor: themeColors.backgroundColor || undefined,
      borderColor: themeColors.primaryColor ? hexToRgba(themeColors.primaryColor, 0.15) : undefined,
      color: themeColors.textColor || undefined,
    };
  }, [themeColors, hasTheme]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getItemStyle = (active: boolean): CSSProperties => {
    if (!hasTheme) return {};
    if (active) {
      return {
        backgroundColor: hexToRgba(themeColors.primaryColor!, 0.12),
        color: themeColors.primaryColor,
      };
    }
    return {
      color: themeColors.textColor ? hexToRgba(themeColors.textColor, 0.65) : undefined,
    };
  };

  const logoStyle = useMemo<CSSProperties>(() => {
    if (!hasTheme) return {};
    return { color: themeColors.primaryColor };
  }, [themeColors, hasTheme]);

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b backdrop-blur bg-background/95 supports-[backdrop-filter]:bg-background/60"
      style={navStyle}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo / Store name */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName || 'Boutique'}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <Store className="h-5 w-5" style={logoStyle} />
            )}
            <span
              className="font-semibold text-sm sm:text-base truncate max-w-[150px] sm:max-w-[200px]"
              style={{ color: themeColors?.textColor || undefined }}
            >
              {storeName || 'Boutique'}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    !hasTheme && (active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')
                  )}
                  style={getItemStyle(active)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Cart + mobile toggle */}
          <div className="flex items-center gap-2">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative" style={{ color: themeColors?.textColor || undefined }}>
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              style={{ color: themeColors?.textColor || undefined }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t"
          style={{ backgroundColor: themeColors?.backgroundColor || undefined }}
        >
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    !hasTheme && (active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')
                  )}
                  style={getItemStyle(active)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
