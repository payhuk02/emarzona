/**
 * Helper pour la gestion des types de produits
 * Date: 27 octobre 2025
 */

import { TFunction } from 'i18next';

export type ProductType = 'digital' | 'physical' | 'service' | 'course';

/**
 * Traduit le type de produit
 */
export const getProductTypeLabel = (type: string, t: TFunction): string => {
  const typeMap: Record<string, string> = {
    'digital': t('courses.productTypes.digital', 'Produit digital'),
    'physical': t('courses.productTypes.physical', 'Produit physique'),
    'service': t('courses.productTypes.service', 'Service'),
    'course': t('courses.productTypes.course', 'Cours en ligne'),
  };

  return typeMap[type] || type;
};

/**
 * Retourne la couleur associée à un type de produit (pour badges)
 */
export const getProductTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'digital': 'bg-blue-500',
    'physical': 'bg-green-500',
    'service': 'bg-purple-500',
    'course': 'bg-orange-500',
  };

  return colorMap[type] || 'bg-gray-500';
};

/**
 * Retourne l'icône associée à un type de produit
 */
export const getProductTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    'digital': 'Download',
    'physical': 'Package',
    'service': 'Briefcase',
    'course': 'GraduationCap',
  };

  return iconMap[type] || 'Package';
};

/**
 * Liste tous les types de produits disponibles
 */
export const getAllProductTypes = (): ProductType[] => {
  return ['digital', 'physical', 'service', 'course'];
};

/**
 * Vérifie si un type de produit est valide
 */
export const isValidProductType = (type: string): type is ProductType => {
  return getAllProductTypes().includes(type as ProductType);
};

