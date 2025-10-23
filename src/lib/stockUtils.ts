/**
 * Utilitaires pour la gestion des stocks
 */

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface StockInfo {
  status: StockStatus;
  label: string;
  color: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  quantity: number;
  threshold: number;
}

/**
 * Seuil par défaut pour considérer un stock comme bas
 */
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

/**
 * Calcule le statut du stock en fonction de la quantité et du seuil
 * 
 * @param quantity - Quantité en stock (peut être null/undefined pour produits numériques)
 * @param threshold - Seuil de stock bas personnalisé
 * @param trackInventory - Si false, le stock n'est pas suivi (produits digitaux)
 * @returns Statut du stock
 */
export function calculateStockStatus(
  quantity: number | null | undefined,
  threshold: number | null | undefined = DEFAULT_LOW_STOCK_THRESHOLD,
  trackInventory: boolean = true
): StockStatus {
  // Si le suivi d'inventaire est désactivé, considérer comme en stock
  if (!trackInventory || quantity === null || quantity === undefined) {
    return 'in_stock';
  }

  const actualThreshold = threshold ?? DEFAULT_LOW_STOCK_THRESHOLD;

  if (quantity === 0) {
    return 'out_of_stock';
  }

  if (quantity <= actualThreshold) {
    return 'low_stock';
  }

  return 'in_stock';
}

/**
 * Obtient les informations de stock formatées pour l'affichage
 * 
 * @param quantity - Quantité en stock
 * @param threshold - Seuil de stock bas
 * @param trackInventory - Si le stock est suivi
 * @returns Informations de stock formatées
 */
export function getStockInfo(
  quantity: number | null | undefined,
  threshold: number | null | undefined = DEFAULT_LOW_STOCK_THRESHOLD,
  trackInventory: boolean = true
): StockInfo {
  if (!trackInventory) {
    return {
      status: 'in_stock',
      label: 'Stock non suivi',
      color: 'text-gray-500',
      variant: 'secondary',
      quantity: 0,
      threshold: 0,
    };
  }

  const actualQuantity = quantity ?? 0;
  const actualThreshold = threshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  const status = calculateStockStatus(actualQuantity, actualThreshold, trackInventory);

  switch (status) {
    case 'out_of_stock':
      return {
        status,
        label: 'Rupture de stock',
        color: 'text-red-600',
        variant: 'destructive',
        quantity: actualQuantity,
        threshold: actualThreshold,
      };
    case 'low_stock':
      return {
        status,
        label: 'Stock faible',
        color: 'text-orange-600',
        variant: 'outline',
        quantity: actualQuantity,
        threshold: actualThreshold,
      };
    case 'in_stock':
    default:
      return {
        status,
        label: 'En stock',
        color: 'text-green-600',
        variant: 'default',
        quantity: actualQuantity,
        threshold: actualThreshold,
      };
  }
}

/**
 * Vérifie si un produit nécessite un réapprovisionnement
 * 
 * @param quantity - Quantité en stock
 * @param threshold - Seuil de stock bas
 * @param trackInventory - Si le stock est suivi
 * @returns true si le produit nécessite un réapprovisionnement
 */
export function needsRestock(
  quantity: number | null | undefined,
  threshold: number | null | undefined = DEFAULT_LOW_STOCK_THRESHOLD,
  trackInventory: boolean = true
): boolean {
  if (!trackInventory) return false;
  const status = calculateStockStatus(quantity, threshold, trackInventory);
  return status === 'low_stock' || status === 'out_of_stock';
}

/**
 * Calcule le pourcentage de stock restant
 * 
 * @param currentQuantity - Quantité actuelle
 * @param maxQuantity - Quantité maximale (pour référence)
 * @returns Pourcentage entre 0 et 100
 */
export function calculateStockPercentage(
  currentQuantity: number | null | undefined,
  maxQuantity: number
): number {
  if (!currentQuantity || !maxQuantity || maxQuantity === 0) return 0;
  return Math.min(100, Math.round((currentQuantity / maxQuantity) * 100));
}

/**
 * Formatte la quantité en stock pour l'affichage
 * 
 * @param quantity - Quantité en stock
 * @param trackInventory - Si le stock est suivi
 * @returns Texte formaté
 */
export function formatStockQuantity(
  quantity: number | null | undefined,
  trackInventory: boolean = true
): string {
  if (!trackInventory) {
    return 'Illimité';
  }

  if (quantity === null || quantity === undefined) {
    return 'Non défini';
  }

  if (quantity === 0) {
    return '0 (Rupture)';
  }

  return quantity.toLocaleString();
}

/**
 * Obtient la couleur CSS pour un badge de stock
 * 
 * @param status - Statut du stock
 * @returns Classes Tailwind CSS
 */
export function getStockBadgeColor(status: StockStatus): string {
  switch (status) {
    case 'out_of_stock':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'low_stock':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'in_stock':
    default:
      return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
}

