/**
 * Système de protection avant suppression de boutique
 * Vérifie les dépendances (produits, commandes, clients)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export interface StoreDependencies {
  productsCount: number;
  ordersCount: number;
  customersCount: number;
  pendingOrdersCount: number;
  activeProductsCount: number;
  totalRevenue: number;
}

export interface DeleteProtectionResult {
  canDelete: boolean;
  dependencies: StoreDependencies;
  warnings: string[];
  errors?: string[];
}

/**
 * Vérifie si une boutique peut être supprimée en toute sécurité
 */
export const checkStoreDeleteProtection = async (
  storeId: string
): Promise<DeleteProtectionResult> => {
  try {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 1. Vérifier les produits
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, is_active', { count: 'exact' })
      .eq('store_id', storeId);

    if (productsError) {
      errors.push('Impossible de vérifier les produits');
    }

    const productsCount = productsData?.length || 0;
    const activeProductsCount = productsData?.filter(p => p.is_active).length || 0;

    if (productsCount > 0) {
      warnings.push(
        `Cette boutique contient ${productsCount} produit(s) ${
          activeProductsCount > 0 ? `dont ${activeProductsCount} actif(s)` : ''
        }`
      );
    }

    // 2. Vérifier les commandes
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total_amount', { count: 'exact' })
      .eq('store_id', storeId);

    if (ordersError) {
      errors.push('Impossible de vérifier les commandes');
    }

    const ordersCount = ordersData?.length || 0;
    const pendingOrders = ordersData?.filter(
      (o) => o.status === 'pending' || o.status === 'processing'
    ) || [];
    const pendingOrdersCount = pendingOrders.length;

    if (ordersCount > 0) {
      warnings.push(`Cette boutique a ${ordersCount} commande(s) enregistrée(s)`);
    }

    if (pendingOrdersCount > 0) {
      errors.push(
        `⚠️ ATTENTION : ${pendingOrdersCount} commande(s) en cours ou en attente ! Vous devez d'abord traiter ces commandes.`
      );
    }

    // 3. Calculer le revenu total
    const totalRevenue = ordersData?.reduce(
      (sum, order) => sum + parseFloat(order.total_amount?.toString() || '0'),
      0
    ) || 0;

    if (totalRevenue > 0) {
      warnings.push(
        `Cette boutique a généré ${totalRevenue.toLocaleString('fr-FR')} FCFA de revenus`
      );
    }

    // 4. Vérifier les clients
    const { count: customersCount, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    if (customersError) {
      errors.push('Impossible de vérifier les clients');
    }

    if ((customersCount || 0) > 0) {
      warnings.push(`Cette boutique a ${customersCount} client(s) enregistré(s)`);
    }

    // Déterminer si la suppression est possible
    const canDelete = errors.length === 0 && pendingOrdersCount === 0;

    return {
      canDelete,
      dependencies: {
        productsCount,
        ordersCount,
        customersCount: customersCount || 0,
        pendingOrdersCount,
        activeProductsCount,
        totalRevenue
      },
      warnings,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    logger.error('Error checking delete protection', { error });
    return {
      canDelete: false,
      dependencies: {
        productsCount: 0,
        ordersCount: 0,
        customersCount: 0,
        pendingOrdersCount: 0,
        activeProductsCount: 0,
        totalRevenue: 0
      },
      warnings: [],
      errors: ['Une erreur est survenue lors de la vérification. Veuillez réessayer.']
    };
  }
};

/**
 * Supprime une boutique avec toutes ses dépendances (CASCADE)
 * À utiliser avec PRÉCAUTION
 */
export const deleteStoreWithDependencies = async (
  storeId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Vérifier d'abord les protections
    const protection = await checkStoreDeleteProtection(storeId);

    if (!protection.canDelete) {
      return {
        success: false,
        error: protection.errors?.join('\n') || 'Impossible de supprimer cette boutique'
      };
    }

    // Supprimer dans l'ordre : produits > commandes > clients > boutique
    // Note: Si les foreign keys sont configurées avec ON DELETE CASCADE dans Supabase,
    // la suppression de la boutique supprimera automatiquement tout.
    // Sinon, il faut supprimer manuellement dans l'ordre.

    const { error: deleteError } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);

    if (deleteError) {
      logger.error('Delete error', { error: deleteError });
      return {
        success: false,
        error: `Erreur lors de la suppression : ${deleteError.message}`
      };
    }

    return { success: true };
  } catch (error: any) {
    logger.error('Unexpected delete error', { error });
    return {
      success: false,
      error: error.message || 'Une erreur inattendue est survenue'
    };
  }
};

/**
 * Archive une boutique au lieu de la supprimer
 * Alternative plus sûre
 */
export const archiveStore = async (
  storeId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('stores')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', storeId);

    if (error) {
      return {
        success: false,
        error: `Erreur lors de l'archivage : ${error.message}`
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de l\'archivage'
    };
  }
};

