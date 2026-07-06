/**
 * Interface pour le pattern Stratégie de création de commandes
 * Permet d'isoler la logique de création de commande (stock, réservation, etc.)
 * en fonction du type de produit.
 */

import type { OrderProductRecord, OrderStrategyOptions } from '@/lib/orders/order-strategy-utils';

export interface OrderStrategyContext {
  /** ID du produit de base */
  productId: string;

  /** ID de la boutique */
  storeId: string;

  /** Email du client */
  customerEmail: string;

  /** Nom du client (optionnel) */
  customerName?: string;

  /** Téléphone du client (optionnel) */
  customerPhone?: string;

  /** Quantité commandée (par défaut 1) */
  quantity?: number;

  /** Type du produit (détecté avant) */
  productType: string;

  /** Le record du produit (pour éviter de le requêter plusieurs fois) */
  productRecord?: OrderProductRecord;

  /** Options spécifiques au type (ex: shippingAddress pour physical) */
  options?: OrderStrategyOptions;

  /** URL de retour après paiement PSP */
  returnUrl?: string;

  /** URL d'annulation checkout PSP */
  cancelUrl?: string;

  /** Achat invité sans session auth */
  guestCheckout?: boolean;
}

export interface OrderCreationResult {
  /** ID de la commande créée */
  orderId: string;

  /** ID de l'order_item créé */
  orderItemId: string;

  /** URL de checkout (Moneroo, etc.) */
  checkoutUrl?: string;

  /** ID de transaction de paiement */
  transactionId?: string;

  /** Autres champs spécifiques (ex: inventoryId pour physical) */
  [key: string]: unknown;
}

export interface OrderStrategy {
  /**
   * Crée une commande et retourne les informations de checkout
   */
  createOrder(context: OrderStrategyContext): Promise<OrderCreationResult>;
}
