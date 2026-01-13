/**
 * Composant LazyIcon - Import dynamique des icônes lucide-react
 * Réduit la taille du bundle initial en chargeant les icônes à la demande
 *
 * @example
 * ```tsx
 * <LazyIcon name="ShoppingCart" className="h-4 w-4" />
 * ```
 */

import React, { Suspense, lazy, ComponentType } from 'react';
// ✅ OPTIMISATION: Loader2 reste importé directement car utilisé pour les fallbacks
// Toutes les autres icônes sont lazy-loaded pour réduire le bundle principal
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

// Cache pour les composants d'icônes déjà chargés
const iconCache = new Map<string, ComponentType<Record<string, never>>>();

// Mapping des noms d'icônes vers leurs imports
const  iconImports: Record<
  string,
  () => Promise<{ default: ComponentType<Record<string, never>> }>
> = {
  // Navigation et layout
  LayoutDashboard: () => import('lucide-react').then(m => ({ default: m.LayoutDashboard })),
  Package: () => import('lucide-react').then(m => ({ default: m.Package })),
  ShoppingCart: () => import('lucide-react').then(m => ({ default: m.ShoppingCart })),
  Users: () => import('lucide-react').then(m => ({ default: m.Users })),
  Settings: () => import('lucide-react').then(m => ({ default: m.Settings })),
  Store: () => import('lucide-react').then(m => ({ default: m.Store })),
  User: () => import('lucide-react').then(m => ({ default: m.User })),
  Heart: () => import('lucide-react').then(m => ({ default: m.Heart })),
  Receipt: () => import('lucide-react').then(m => ({ default: m.Receipt })),
  RotateCcw: () => import('lucide-react').then(m => ({ default: m.RotateCcw })),
  Download: () => import('lucide-react').then(m => ({ default: m.Download })),
  Bell: () => import('lucide-react').then(m => ({ default: m.Bell })),

  // Commerce
  CreditCard: () => import('lucide-react').then(m => ({ default: m.CreditCard })),
  DollarSign: () => import('lucide-react').then(m => ({ default: m.DollarSign })),
  Tag: () => import('lucide-react').then(m => ({ default: m.Tag })),
  Percent: () => import('lucide-react').then(m => ({ default: m.Percent })),
  Gift: () => import('lucide-react').then(m => ({ default: m.Gift })),
  ShoppingBag: () => import('lucide-react').then(m => ({ default: m.ShoppingBag })),

  // Analytics
  BarChart3: () => import('lucide-react').then(m => ({ default: m.BarChart3 })),
  TrendingUp: () => import('lucide-react').then(m => ({ default: m.TrendingUp })),
  Target: () => import('lucide-react').then(m => ({ default: m.Target })),

  // Sécurité
  Shield: () => import('lucide-react').then(m => ({ default: m.Shield })),
  ShieldCheck: () => import('lucide-react').then(m => ({ default: m.ShieldCheck })),
  Key: () => import('lucide-react').then(m => ({ default: m.Key })),

  // Communication
  MessageSquare: () => import('lucide-react').then(m => ({ default: m.MessageSquare })),
  Search: () => import('lucide-react').then(m => ({ default: m.Search })),
  Mail: () => import('lucide-react').then(m => ({ default: m.Mail })),

  // Contenu
  BookOpen: () => import('lucide-react').then(m => ({ default: m.BookOpen })),
  GraduationCap: () => import('lucide-react').then(m => ({ default: m.GraduationCap })),
  FileText: () => import('lucide-react').then(m => ({ default: m.FileText })),

  // Logistique
  Truck: () => import('lucide-react').then(m => ({ default: m.Truck })),
  Warehouse: () => import('lucide-react').then(m => ({ default: m.Warehouse })),
  Calendar: () => import('lucide-react').then(m => ({ default: m.Calendar })),

  // Utilitaires
  LogOut: () => import('lucide-react').then(m => ({ default: m.LogOut })),
  UserPlus: () => import('lucide-react').then(m => ({ default: m.UserPlus })),
  History: () => import('lucide-react').then(m => ({ default: m.History })),
  Palette: () => import('lucide-react').then(m => ({ default: m.Palette })),
  Layout: () => import('lucide-react').then(m => ({ default: m.Layout })),
  Sparkles: () => import('lucide-react').then(m => ({ default: m.Sparkles })),
  Webhook: () => import('lucide-react').then(m => ({ default: m.Webhook })),
  Star: () => import('lucide-react').then(m => ({ default: m.Star })),
  Repeat: () => import('lucide-react').then(m => ({ default: m.Repeat })),
  GanttChart: () => import('lucide-react').then(m => ({ default: m.GanttChart })),
  Boxes: () => import('lucide-react').then(m => ({ default: m.Boxes })),
  PackageSearch: () => import('lucide-react').then(m => ({ default: m.PackageSearch })),
  Factory: () => import('lucide-react').then(m => ({ default: m.Factory })),
  Hash: () => import('lucide-react').then(m => ({ default: m.Hash })),
  Building2: () => import('lucide-react').then(m => ({ default: m.Building2 })),
  BarChart: () => import('lucide-react').then(m => ({ default: m.BarChart })),
  Layers: () => import('lucide-react').then(m => ({ default: m.Layers })),
  FileBarChart: () => import('lucide-react').then(m => ({ default: m.FileBarChart })),
  Camera: () => import('lucide-react').then(m => ({ default: m.Camera })),
  Globe: () => import('lucide-react').then(m => ({ default: m.Globe })),
  Trophy: () => import('lucide-react').then(m => ({ default: m.Trophy })),
  AlertTriangle: () => import('lucide-react').then(m => ({ default: m.AlertTriangle })),
  Phone: () => import('lucide-react').then(m => ({ default: m.Phone })),
  Wallet: () => import('lucide-react').then(m => ({ default: m.Wallet })),
  Scale: () => import('lucide-react').then(m => ({ default: m.Scale })),
  Headphones: () => import('lucide-react').then(m => ({ default: m.Headphones })),
  Menu: () => import('lucide-react').then(m => ({ default: m.Menu })),
  X: () => import('lucide-react').then(m => ({ default: m.X })),
  Activity: () => import('lucide-react').then(m => ({ default: m.Activity })),
  Zap: () => import('lucide-react').then(m => ({ default: m.Zap })),
  Eye: () => import('lucide-react').then(m => ({ default: m.Eye })),
  Save: () => import('lucide-react').then(m => ({ default: m.Save })),
  MoreVertical: () => import('lucide-react').then(m => ({ default: m.MoreVertical })),
  Loader2: () => import('lucide-react').then(m => ({ default: m.Loader2 })),
  CheckCircle2: () => import('lucide-react').then(m => ({ default: m.CheckCircle2 })),
  XCircle: () => import('lucide-react').then(m => ({ default: m.XCircle })),
  AlertCircle: () => import('lucide-react').then(m => ({ default: m.AlertCircle })),
  Trash2: () => import('lucide-react').then(m => ({ default: m.Trash2 })),
  Plus: () => import('lucide-react').then(m => ({ default: m.Plus })),
  Minus: () => import('lucide-react').then(m => ({ default: m.Minus })),
  RefreshCw: () => import('lucide-react').then(m => ({ default: m.RefreshCw })),
  Check: () => import('lucide-react').then(m => ({ default: m.Check })),
  Link2: () => import('lucide-react').then(m => ({ default: m.Link2 })),
  Clock: () => import('lucide-react').then(m => ({ default: m.Clock })),
  ArrowUpRight: () => import('lucide-react').then(m => ({ default: m.ArrowUpRight })),
  ArrowDownRight: () => import('lucide-react').then(m => ({ default: m.ArrowDownRight })),
  MoreHorizontal: () => import('lucide-react').then(m => ({ default: m.MoreHorizontal })),
  Filter: () => import('lucide-react').then(m => ({ default: m.Filter })),
  Share2: () => import('lucide-react').then(m => ({ default: m.Share2 })),
  TrendingDown: () => import('lucide-react').then(m => ({ default: m.TrendingDown })),
  Accessibility: () => import('lucide-react').then(m => ({ default: m.Accessibility })),
  Info: () => import('lucide-react').then(m => ({ default: m.Info })),
  ChevronsLeft: () => import('lucide-react').then(m => ({ default: m.ChevronsLeft })),
  ChevronsRight: () => import('lucide-react').then(m => ({ default: m.ChevronsRight })),
  ChevronLeft: () => import('lucide-react').then(m => ({ default: m.ChevronLeft })),
  ChevronRight: () => import('lucide-react').then(m => ({ default: m.ChevronRight })),
  Copy: () => import('lucide-react').then(m => ({ default: m.Copy })),
  ExternalLink: () => import('lucide-react').then(m => ({ default: m.ExternalLink })),
  MousePointerClick: () => import('lucide-react').then(m => ({ default: m.MousePointerClick })),
  Link: () => import('lucide-react').then(m => ({ default: m.Link })),
  Workflow: () => import('lucide-react').then(m => ({ default: m.Workflow })),
};

interface LazyIconProps extends React.SVGProps<SVGSVGElement> {
  /**
   * Nom de l'icône (doit correspondre à un nom dans iconImports)
   */
  name: keyof typeof iconImports;
  /**
   * Taille de l'icône (par défaut: "1em")
   */
  size?: number | string;
  /**
   * Classe CSS additionnelle
   */
  className?: string;
  /**
   * Fallback à afficher pendant le chargement
   */
  fallback?: React.ReactNode;
}

/**
 * Charge une icône de manière dynamique
 */
function _loadIcon(name: keyof typeof iconImports): ComponentType<Record<string, never>> | null {
  // Vérifier le cache
  if (iconCache.has(name)) {
    return iconCache.get(name)!;
  }

  // Si l'icône n'est pas dans le mapping, retourner null
  if (!iconImports[name]) {
    // ✅ PHASE 2: Remplacer console.warn par logger
    logger.warn(`Icon "${name}" not found in iconImports mapping`, { iconName: name });
    return null;
  }

  return null; // Sera chargé par lazy()
}

/**
 * Composant LazyIcon avec chargement dynamique
 */
export const LazyIcon : React.FC<LazyIconProps> = ({
  name,
  size = '1em',
  className,
  fallback,
  ...props
}) => {
  // Créer un composant lazy pour cette icône
  const LazyIconComponent = React.useMemo(() => {
    if (!iconImports[name]) {
      // ✅ PHASE 2: Remplacer console.warn par logger
      logger.warn(`Icon "${name}" not found`, { iconName: name });
      return null;
    }

    // Vérifier le cache
    if (iconCache.has(name)) {
      const CachedIcon = iconCache.get(name)!;
      return CachedIcon;
    }

    // Créer un composant lazy
    const Lazy = lazy(iconImports[name]);

    // Mettre en cache après le premier chargement
    iconImports[name]().then(module => {
      iconCache.set(name, module.default);
    });

    return Lazy;
  }, [name]);

  if (!LazyIconComponent) {
    return fallback || <span className={cn('inline-block', className)} aria-hidden="true" />;
  }

  return (
    <Suspense
      fallback={fallback || <Loader2 className={cn('animate-spin', className)} size={size} />}
    >
      <LazyIconComponent size={size} className={className} {...props} />
    </Suspense>
  );
};

/**
 * Hook pour précharger une icône (utile pour le prefetching)
 */
export function usePreloadIcon(name: keyof typeof iconImports) {
  React.useEffect(() => {
    if (iconImports[name] && !iconCache.has(name)) {
      iconImports[name]().then(module => {
        iconCache.set(name, module.default);
      });
    }
  }, [name]);
}







