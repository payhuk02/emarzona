/**
 * Protection et suppression complète d'une boutique
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
 * Vérifie les dépendances avant suppression (avertissements uniquement — la suppression
 * complète reste possible avec confirmation forte côté UI).
 */
export const checkStoreDeleteProtection = async (
  storeId: string
): Promise<DeleteProtectionResult> => {
  try {
    const warnings: string[] = [];
    const errors: string[] = [];

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, is_active')
      .eq('store_id', storeId);

    if (productsError) {
      warnings.push('Impossible de vérifier les produits (la suppression reste possible)');
    }

    const productsCount = productsData?.length || 0;
    const activeProductsCount = productsData?.filter(p => p.is_active).length || 0;

    if (productsCount > 0) {
      warnings.push(
        `Cette boutique contient ${productsCount} produit(s)${
          activeProductsCount > 0 ? ` dont ${activeProductsCount} actif(s)` : ''
        }`
      );
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total_amount')
      .eq('store_id', storeId);

    if (ordersError) {
      warnings.push('Impossible de vérifier les commandes (la suppression reste possible)');
    }

    const ordersCount = ordersData?.length || 0;
    const pendingOrders =
      ordersData?.filter(o => o.status === 'pending' || o.status === 'processing') || [];
    const pendingOrdersCount = pendingOrders.length;

    if (ordersCount > 0) {
      warnings.push(`Cette boutique a ${ordersCount} commande(s) enregistrée(s)`);
    }

    if (pendingOrdersCount > 0) {
      warnings.push(
        `${pendingOrdersCount} commande(s) encore en cours ou en attente seront également supprimées`
      );
    }

    const totalRevenue =
      ordersData?.reduce(
        (sum, order) => sum + parseFloat(order.total_amount?.toString() || '0'),
        0
      ) || 0;

    if (totalRevenue > 0) {
      warnings.push(
        `Cette boutique a généré ${totalRevenue.toLocaleString('fr-FR')} FCFA de revenus`
      );
    }

    const { count: customersCount, error: customersError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);

    if (customersError) {
      warnings.push('Impossible de vérifier les clients (la suppression reste possible)');
    }

    if ((customersCount || 0) > 0) {
      warnings.push(`Cette boutique a ${customersCount} client(s) enregistré(s)`);
    }

    return {
      canDelete: true,
      dependencies: {
        productsCount,
        ordersCount,
        customersCount: customersCount || 0,
        pendingOrdersCount,
        activeProductsCount,
        totalRevenue,
      },
      warnings,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: unknown) {
    logger.error('Error checking delete protection', { error });
    return {
      canDelete: true,
      dependencies: {
        productsCount: 0,
        ordersCount: 0,
        customersCount: 0,
        pendingOrdersCount: 0,
        activeProductsCount: 0,
        totalRevenue: 0,
      },
      warnings: [
        'La vérification des dépendances a échoué. Vous pouvez tout de même confirmer la suppression.',
      ],
    };
  }
};

/**
 * Supprime complètement une boutique et ses données associées (RPC SECURITY DEFINER).
 */
export const deleteStoreWithDependencies = async (
  storeId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('delete_store_completely', {
      p_store_id: storeId,
    });

    if (error) {
      logger.error('Delete store RPC error', { error, storeId });
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression',
      };
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (!result?.success) {
      return {
        success: false,
        error: result?.error || 'Impossible de supprimer cette boutique',
      };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
    logger.error('Unexpected delete error', { error, storeId });
    return {
      success: false,
      error: message,
    };
  }
};

/**
 * Archive une boutique au lieu de la supprimer
 */
export const archiveStore = async (
  storeId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('stores')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      return {
        success: false,
        error: `Erreur lors de l'archivage : ${error.message}`,
      };
    }

    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Une erreur est survenue lors de l'archivage";
    return {
      success: false,
      error: message,
    };
  }
};
