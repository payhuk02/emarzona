/**
 * Configuration centralisée pour les types de produits
 * Utilisée dans tous les composants du dashboard
 */

import { FileText, Package, Wrench, GraduationCap, Palette, type LucideIcon } from 'lucide-react';

import type { ProductType } from '@/types/unified-product';
export type { ProductType } from '@/types/unified-product';

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
const NEUTRAL_UI = {
  textColor: 'text-black font-bold',
  bgColor: 'bg-transparent',
  hoverColor: 'hover:bg-black/5',
  borderColor: 'border-black/25',
} as const;

export const PRODUCT_TYPE_CONFIG: Record<ProductType, ProductTypeConfig> = {
  digital: {
    label: 'Digitaux',
    icon: FileText,
    color: 'bg-transparent',
    ...NEUTRAL_UI,
  },
  physical: {
    label: 'Physiques',
    icon: Package,
    color: 'bg-transparent',
    ...NEUTRAL_UI,
  },
  service: {
    label: 'Services',
    icon: Wrench,
    color: 'bg-transparent',
    ...NEUTRAL_UI,
  },
  course: {
    label: 'Cours',
    icon: GraduationCap,
    color: 'bg-transparent',
    ...NEUTRAL_UI,
  },
  artist: {
    label: 'Artistes',
    icon: Palette,
    color: 'bg-transparent',
    ...NEUTRAL_UI,
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
