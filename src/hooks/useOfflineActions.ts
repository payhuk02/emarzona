/**
 * Hook spécialisé pour les actions offline-first
 * Fournit des fonctions prêtes à l'emploi pour les actions courantes
 */

import { useOfflineMode } from './useOfflineMode';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

// Types pour les payloads d'actions
export interface OrderPayload {
  order_number: string;
  total_amount: number;
  currency?: string;
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown>;
  payment_method: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface ProductUpdatePayload {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface CartItemPayload {
  product_id: string;
  quantity: number;
}

export const useOfflineActions = () => {
  const { executeAction, isActionable } = useOfflineMode();
  const { toast } = useToast();

  /**
   * Crée une commande avec support offline
   */
  const createOrder = async (
    storeId: string,
    orderData: OrderPayload
  ): Promise<{ success: boolean; orderId?: string; offline: boolean }> => {
    return executeAction(
      { success: true, orderId: undefined, offline: false },
      'create_order',
      storeId,
      orderData,
      // Action online
      async () => {
        // Ici on pourrait appeler l'API directement, mais comme on utilise offline-first,
        // on laisse la synchronisation gérer cela
        logger.info('Commande créée en mode online:', orderData.order_number);
        return { success: true, orderId: `order_${Date.now()}`, offline: false };
      },
      // Options
      {
        priority: 5, // Haute priorité pour les commandes
        fallbackValue: { success: true, offline: true }
      }
    );
  };

  /**
   * Met à jour un produit avec support offline
   */
  const updateProduct = async (
    storeId: string,
    productData: ProductUpdatePayload
  ): Promise<{ success: boolean; offline: boolean }> => {
    return executeAction(
      { success: true, offline: false },
      'update_product',
      storeId,
      productData,
      // Action online
      async () => {
        logger.info('Produit mis à jour en mode online:', productData.id);
        return { success: true, offline: false };
      },
      {
        priority: 4, // Priorité moyenne pour les mises à jour produit
        fallbackValue: { success: true, offline: true }
      }
    );
  };

  /**
   * Ajoute un produit au panier avec support offline
   */
  const addToCart = async (
    storeId: string,
    cartData: CartItemPayload & { user_id?: string }
  ): Promise<{ success: boolean; offline: boolean }> => {
    return executeAction(
      { success: true, offline: false },
      'add_to_cart',
      storeId,
      cartData,
      // Action online
      async () => {
        logger.info('Produit ajouté au panier en mode online');
        return { success: true, offline: false };
      },
      {
        priority: 3, // Priorité normale pour le panier
        fallbackValue: { success: true, offline: true }
      }
    );
  };

  /**
   * Crée une boutique (admin seulement)
   */
  const createStore = async (
    storeData: {
      name: string;
      description?: string;
      owner_id: string;
    }
  ): Promise<{ success: boolean; offline: boolean }> => {
    return executeAction(
      { success: true, offline: false },
      'create_store',
      storeData.owner_id, // store_id temporaire
      storeData,
      // Action online
      async () => {
        logger.info('Boutique créée en mode online:', storeData.name);
        return { success: true, offline: false };
      },
      {
        priority: 5, // Haute priorité
        fallbackValue: { success: true, offline: true }
      }
    );
  };

  /**
   * Crée un utilisateur (admin seulement)
   */
  const createUser = async (
    userData: {
      email: string;
      full_name?: string;
      role?: string;
    }
  ): Promise<{ success: boolean; offline: boolean }> => {
    return executeAction(
      { success: true, offline: false },
      'create_user',
      'admin', // store_id spécial pour admin
      userData,
      // Action online
      async () => {
        logger.info('Utilisateur créé en mode online:', userData.email);
        return { success: true, offline: false };
      },
      {
        priority: 4, // Haute priorité
        fallbackValue: { success: true, offline: true }
      }
    );
  };

  /**
   * Wrapper générique pour toute action personnalisée
   */
  const executeCustomAction = async <T>(
    actionType: string,
    storeId: string,
    payload: Record<string, unknown>,
    onlineAction: () => Promise<T>,
    options: {
      priority?: number;
      fallbackValue?: T;
      skipOfflineQueue?: boolean;
    } = {}
  ): Promise<T> => {
    return executeAction(
      options.fallbackValue,
      actionType as any, // Type assertion car les types sont extensibles
      storeId,
      payload,
      onlineAction,
      options
    );
  };

  return {
    // État
    isOnline: isActionable,

    // Actions spécialisées
    createOrder,
    updateProduct,
    addToCart,
    createStore,
    createUser,

    // Action générique
    executeCustomAction,

    // Utilitaires
    showOfflineMessage: () => {
      toast({
        title: "Mode hors ligne",
        description: "Votre action sera synchronisée automatiquement",
      });
    }
  };
};

export { useOfflineActions };