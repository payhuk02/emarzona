/**
 * Hook : useCrispProduct
 * Configurer Crisp pour une page produit spécifique
 * Universel : Fonctionne pour digital, physical, service, course
 * Date : 27 octobre 2025
 */

import { useEffect } from 'react';
import { setCrispProductContext, setCrispCheckoutContext, type ProductType } from '@/lib/crisp';

interface ProductInfo {
  id: string;
  name: string;
  type: ProductType;
  storeName?: string;
  price?: number;
}

/**
 * Configurer Crisp pour une page produit
 */
export const useCrispProduct = (product: ProductInfo | null) => {
  useEffect(() => {
    if (!product) return;

    setCrispProductContext(
      product.type,
      product.name,
      product.id,
      product.storeName
    );
  }, [product]);
};

/**
 * Configurer Crisp pour la page checkout
 */
export const useCrispCheckout = (product: ProductInfo | null) => {
  useEffect(() => {
    if (!product || !product.price) return;

    setCrispCheckoutContext(product.type, product.price);
  }, [product]);
};

