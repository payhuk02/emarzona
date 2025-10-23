import { useState, useCallback, useEffect } from 'react';
import * as Sentry from '@sentry/react';

/**
 * Configuration pour l'historique des prix
 */
const MAX_PRICE_HISTORY_ENTRIES = 5;

/**
 * Interface pour une entrée d'historique de prix
 */
interface PriceHistoryEntry {
  date: string;
  price: number;
  promotional_price?: number;
}

/**
 * Interface pour les données de tarification du produit
 */
interface ProductPricingData {
  price: number;
  promotional_price: number | null;
  cost_price?: number | null;
  slug?: string;
}

/**
 * Hook personnalisé pour gérer la logique de tarification des produits
 * 
 * Gère:
 * - Calcul du pourcentage de réduction
 * - Conversion pourcentage → prix promotionnel
 * - Calcul de la marge brute
 * - Historique des prix avec persistance localStorage
 * 
 * @param formData - Données du formulaire contenant les prix
 * @param updateFormData - Fonction pour mettre à jour les données du formulaire
 * @returns Objet contenant les fonctions et états liés à la tarification
 * 
 * @example
 * ```tsx
 * const {
 *   priceHistory,
 *   getDiscountPercentage,
 *   setDiscountFromPercent,
 *   addPriceToHistory,
 *   calculateMargin
 * } = useProductPricing(formData, updateFormData);
 * ```
 */
export const useProductPricing = (
  formData: ProductPricingData,
  updateFormData: (field: string, value: any) => void
) => {
  // Charger l'historique des prix depuis localStorage au montage
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>(() => {
    try {
      const storageKey = `priceHistory_${formData.slug || 'new'}`;
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'load_price_history', hook: 'useProductPricing' },
      });
      return [];
    }
  });

  // Persister l'historique des prix dans localStorage
  useEffect(() => {
    if (priceHistory.length > 0 && formData.slug) {
      try {
        const storageKey = `priceHistory_${formData.slug}`;
        localStorage.setItem(storageKey, JSON.stringify(priceHistory));
      } catch (error) {
        Sentry.captureException(error, {
          tags: { action: 'save_price_history', hook: 'useProductPricing' },
          extra: { slug: formData.slug, historyLength: priceHistory.length },
        });
      }
    }
  }, [priceHistory, formData.slug]);

  /**
   * Calcule le pourcentage de réduction entre le prix normal et le prix promotionnel
   * @returns Pourcentage de réduction (0-100) ou 0 si pas de réduction
   */
  const getDiscountPercentage = useCallback(() => {
    if (
      formData.price &&
      formData.promotional_price &&
      formData.promotional_price < formData.price
    ) {
      return Math.round(
        ((formData.price - formData.promotional_price) / formData.price) * 100
      );
    }
    return 0;
  }, [formData.price, formData.promotional_price]);

  /**
   * Calcule et applique le prix promotionnel à partir d'un pourcentage de réduction
   * Le pourcentage est plafonné entre 0% et 95%
   * @param percent - Pourcentage de réduction souhaité (0-95)
   */
  const setDiscountFromPercent = useCallback(
    (percent: number, maxDiscountPercent: number = 95) => {
      const normalized = Math.max(0, Math.min(maxDiscountPercent, percent || 0));
      if (!formData.price || formData.price <= 0) return;

      const newPromo = Number((formData.price * (1 - normalized / 100)).toFixed(2));
      updateFormData('promotional_price', normalized > 0 ? newPromo : null);
      addPriceToHistory(formData.price, normalized > 0 ? newPromo : undefined);
    },
    [formData.price, updateFormData]
  );

  /**
   * Ajoute une entrée à l'historique des prix
   * Conserve les MAX_PRICE_HISTORY_ENTRIES dernières modifications pour le suivi
   * @param price - Prix principal du produit
   * @param promotionalPrice - Prix promotionnel optionnel
   */
  const addPriceToHistory = useCallback(
    (price: number, promotionalPrice?: number) => {
      const newEntry: PriceHistoryEntry = {
        date: new Date().toISOString(),
        price,
        promotional_price: promotionalPrice,
      };
      setPriceHistory((prev) => [newEntry, ...prev.slice(0, MAX_PRICE_HISTORY_ENTRIES - 1)]);
    },
    []
  );

  /**
   * Calcule la marge brute du produit
   * @returns Objet contenant la marge en valeur absolue et en pourcentage
   */
  const calculateMargin = useCallback(() => {
    if (!formData.price || formData.cost_price === null || formData.cost_price === undefined) {
      return { marginValue: 0, marginPercent: 0 };
    }

    const sellingPrice = formData.promotional_price ?? formData.price;
    const marginValue = Math.max(0, sellingPrice - formData.cost_price);
    const marginPercent = formData.cost_price
      ? Math.max(0, Math.round((marginValue / Math.max(1, sellingPrice)) * 100))
      : 0;

    return { marginValue, marginPercent };
  }, [formData.price, formData.promotional_price, formData.cost_price]);

  /**
   * Calcule l'économie réalisée avec le prix promotionnel
   * @returns Valeur de l'économie ou 0
   */
  const calculateSavings = useCallback(() => {
    if (formData.price && formData.promotional_price && formData.promotional_price < formData.price) {
      return formData.price - formData.promotional_price;
    }
    return 0;
  }, [formData.price, formData.promotional_price]);

  return {
    priceHistory,
    getDiscountPercentage,
    setDiscountFromPercent,
    addPriceToHistory,
    calculateMargin,
    calculateSavings,
  };
};

