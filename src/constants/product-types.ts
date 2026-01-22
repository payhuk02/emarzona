/**
 * Configuration centralisée pour les types de produits
 * Utilisée dans tous les composants du dashboard
 */

import {
  FileText,
  Package,
  Wrench,
  GraduationCap,
  Palette,
  type LucideIcon,
} from 'lucide-react';

export type ProductType = 'digital' | 'physical' | 'service' | 'course' | 'artist';

export interface ProductTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  textColor: string;
  bgColor: string;
  hoverColor?: string;
  borderColor?: string;
}

/**
 * Configuration complète pour tous les types de produits
 * Utilisée pour l'affichage, les filtres, les graphiques, etc.
 */
export const PRODUCT_TYPE_CONFIG: Record<ProductType, ProductTypeConfig> = {
  digital: {
    label: 'Digitaux',
    icon: FileText,
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    hoverColor: 'hover:bg-blue-500/20',
    borderColor: 'border-blue-500/20',
  },
  physical: {
    label: 'Physiques',
    icon: Package,
    color: 'bg-green-500',
    textColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10',
    hoverColor: 'hover:bg-green-500/20',
    borderColor: 'border-green-500/20',
  },
  service: {
    label: 'Services',
    icon: Wrench,
    color: 'bg-purple-500',
    textColor: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
    hoverColor: 'hover:bg-purple-500/20',
    borderColor: 'border-purple-500/20',
  },
  course: {
    label: 'Cours',
    icon: GraduationCap,
    color: 'bg-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
    hoverColor: 'hover:bg-orange-500/20',
    borderColor: 'border-orange-500/20',
  },
  artist: {
    label: 'Artistes',
    icon: Palette,
    color: 'bg-pink-500',
    textColor: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-500/10',
    hoverColor: 'hover:bg-pink-500/20',
    borderColor: 'border-pink-500/20',
  },
} as const;

/**
 * Couleurs pour les graphiques (format hex)
 */
export const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
  digital: '#3b82f6', // blue-500
  physical: '#10b981', // green-500
  service: '#a855f7', // purple-500
  course: '#f97316', // orange-500
  artist: '#ec4899', // pink-500
} as const;

/**
 * Labels pour les graphiques
 */
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  digital: 'Digitaux',
  physical: 'Physiques',
  service: 'Services',
  course: 'Cours',
  artist: 'Artistes',
} as const;

/**
 * Helper pour obtenir la configuration d'un type
 */
export const getProductTypeConfig = (type: ProductType): ProductTypeConfig => {
  return PRODUCT_TYPE_CONFIG[type];
};

/**
 * Helper pour obtenir toutes les clés de types
 */
export const getAllProductTypes = (): ProductType[] => {
  return Object.keys(PRODUCT_TYPE_CONFIG) as ProductType[];
};
