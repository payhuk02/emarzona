/**
 * Hook pour Optimisation Automatique des Stocks
 * Date: 3 Février 2025
 * 
 * Recommandations automatiques pour optimiser les niveaux de stock
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useDemandForecast, type DemandForecast } from './useDemandForecasting';

// =====================================================
// TYPES
// =====================================================

export interface StockOptimization {
  product_id: string;
  product_name: string;
  variant_id?: string;
  sku: string;
  
  // État actuel
  current_stock: number;
  current_stock_value: number;
  reorder_point: number;
  reorder_quantity: number;
  
  // Analyse
  stock_status: 'optimal' | 'overstock' | 'understock' | 'critical';
  stock_turnover_rate: number; // Rotation des stocks
  days_of_inventory: number;
  
  // Recommandations
  recommended_stock_level: number;
  recommended_reorder_point: number;
  recommended_reorder_quantity: number;
  recommended_action: 'increase' | 'decrease' | 'maintain' | 'urgent_reorder';
  action_priority: 'high' | 'medium' | 'low';
  
  // Économies potentielles
  potential_savings: number; // Économies si optimisation appliquée
  overstock_cost: number; // Coût du surstock
  stockout_cost: number; // Coût estimé des ruptures
  
  // Prévisions
  forecast?: DemandForecast;
}

export interface StockOptimizationReport {
  total_products: number;
  optimal_count: number;
  overstock_count: number;
  understock_count: number;
  critical_count: number;
  
  total_stock_value: number;
  potential_savings: number;
  total_overstock_cost: number;
  total_stockout_cost: number;
  
  optimizations: StockOptimization[];
  urgent_actions: StockOptimization[];
}

// =====================================================
// FONCTIONS DE CALCUL
// =====================================================

/**
 * Calcule le taux de rotation des stocks
 */
function calculateTurnoverRate(
  totalSales: number,
  averageStock: number,
  periodDays: number
): number {
  if (averageStock === 0) return 0;
  const annualizedSales = (totalSales / periodDays) * 365;
  return annualizedSales / averageStock;
}

/**
 * Détermine le statut du stock
 */
function determineStockStatus(
  currentStock: number,
  reorderPoint: number,
  daysOfInventory: number,
  leadTime: number
): 'optimal' | 'overstock' | 'understock' | 'critical' {
  if (currentStock === 0) return 'critical';
  if (daysOfInventory < leadTime) return 'critical';
  if (currentStock < reorderPoint) return 'understock';
  if (daysOfInventory > leadTime * 3) return 'overstock';
  return 'optimal';
}

/**
 * Calcule le niveau de stock optimal
 */
function calculateOptimalStockLevel(
  averageDailySales: number,
  leadTime: number,
  safetyStockMultiplier: number = 1.5
): number {
  const leadTimeDemand = averageDailySales * leadTime;
  const safetyStock = leadTimeDemand * safetyStockMultiplier;
  return Math.ceil(leadTimeDemand + safetyStock);
}

/**
 * Calcule le point de réapprovisionnement optimal
 */
function calculateOptimalReorderPoint(
  averageDailySales: number,
  leadTime: number
): number {
  return Math.ceil(averageDailySales * leadTime * 1.2); // 20% de marge
}

/**
 * Calcule la quantité de réapprovisionnement optimale (EOQ simplifié)
 */
function calculateOptimalReorderQuantity(
  annualDemand: number,
  orderingCost: number = 50, // Coût de commande par défaut
  holdingCost: number = 0.2 // Coût de stockage (20% par an)
): number {
  if (annualDemand === 0 || holdingCost === 0) return 0;
  
  // Formule EOQ simplifiée
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
  return Math.ceil(eoq);
}

// =====================================================
// HOOKS
// =====================================================

/**
 * Récupère l'optimisation pour un produit
 */
export function useStockOptimization(
  productId: string,
  variantId?: string
) {
  const { data: forecast } = useDemandForecast(productId, variantId);
  
  return useQuery({
    queryKey: ['stock-optimization', productId, variantId],
    queryFn: async (): Promise<StockOptimization | null> => {
      // Récupérer l'inventaire
      const { data: inventory, error: inventoryError } = await supabase
        .from('physical_product_inventory')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (inventoryError) throw inventoryError;
      if (!inventory) return null;
      
      // Récupérer les infos du produit
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();
      
      const currentStock = inventory.quantity_available || 0;
      const reorderPoint = inventory.reorder_point || 10;
      const reorderQuantity = inventory.reorder_quantity || 50;
      const unitCost = inventory.unit_cost || 0;
      const currentStockValue = currentStock * unitCost;
      
      // Utiliser la prévision si disponible
      const averageDailySales = forecast?.average_daily_sales || 0;
      const daysOfInventory = forecast?.days_of_inventory || 0;
      const leadTime = 7; // Jours de délai par défaut
      
      // Calculer le taux de rotation
      const periodDays = 30;
      const totalSales = averageDailySales * periodDays;
      const averageStock = currentStock;
      const stockTurnoverRate = calculateTurnoverRate(totalSales, averageStock, periodDays);
      
      // Déterminer le statut
      const stockStatus = determineStockStatus(currentStock, reorderPoint, daysOfInventory, leadTime);
      
      // Calculer les recommandations
      const recommendedStockLevel = calculateOptimalStockLevel(averageDailySales, leadTime);
      const recommendedReorderPoint = calculateOptimalReorderPoint(averageDailySales, leadTime);
      const annualDemand = averageDailySales * 365;
      const recommendedReorderQuantity = calculateOptimalReorderQuantity(annualDemand);
      
      // Déterminer l'action recommandée
      let recommendedAction: 'increase' | 'decrease' | 'maintain' | 'urgent_reorder' = 'maintain';
      let actionPriority: 'high' | 'medium' | 'low' = 'low';
      
      if (stockStatus === 'critical') {
        recommendedAction = 'urgent_reorder';
        actionPriority = 'high';
      } else if (stockStatus === 'understock') {
        recommendedAction = 'increase';
        actionPriority = 'medium';
      } else if (stockStatus === 'overstock') {
        recommendedAction = 'decrease';
        actionPriority = 'low';
      }
      
      // Calculer les coûts
      const overstockAmount = Math.max(0, currentStock - recommendedStockLevel);
      const overstockCost = overstockAmount * unitCost * 0.2; // 20% de coût de stockage
      
      const stockoutRisk = forecast?.stockout_risk === 'high' ? 1 : forecast?.stockout_risk === 'medium' ? 0.5 : 0.1;
      const estimatedLostSales = averageDailySales * stockoutRisk * 30; // 30 jours
      const stockoutCost = estimatedLostSales * (unitCost * 2); // Coût estimé = 2x le coût unitaire
      
      const potentialSavings = overstockCost + stockoutCost;
      
      return {
        product_id: productId,
        product_name: product?.name || 'Produit inconnu',
        variant_id,
        sku: inventory.sku || '',
        current_stock: currentStock,
        current_stock_value: currentStockValue,
        reorder_point: reorderPoint,
        reorder_quantity: reorderQuantity,
        stock_status: stockStatus,
        stock_turnover_rate: stockTurnoverRate,
        days_of_inventory: daysOfInventory,
        recommended_stock_level: recommendedStockLevel,
        recommended_reorder_point: recommendedReorderPoint,
        recommended_reorder_quantity: recommendedReorderQuantity,
        recommended_action: recommendedAction,
        action_priority: actionPriority,
        potential_savings: potentialSavings,
        overstock_cost: overstockCost,
        stockout_cost: stockoutCost,
        forecast,
      };
    },
    enabled: !!productId,
  });
}

/**
 * Récupère le rapport d'optimisation pour toute la boutique
 */
export function useStoreStockOptimization(storeId: string) {
  return useQuery({
    queryKey: ['store-stock-optimization', storeId],
    queryFn: async (): Promise<StockOptimizationReport> => {
      // Récupérer tous les produits physiques
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('store_id', storeId)
        .eq('product_type', 'physical');
      
      if (productsError) throw productsError;
      
      const optimizations: StockOptimization[] = [];
      
      // Calculer l'optimisation pour chaque produit
      const calculateOptimization = async (productId: string, variantId?: string): Promise<StockOptimization | null> => {
        // Récupérer l'inventaire
        const { data: inventory, error: inventoryError } = await supabase
          .from('physical_product_inventory')
          .select('*')
          .eq('product_id', productId)
          .maybeSingle();
        
        if (inventoryError || !inventory) return null;
        
        // Récupérer les infos du produit
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', productId)
          .single();
        
        const currentStock = inventory.quantity_available || 0;
        const reorderPoint = inventory.reorder_point || 10;
        const reorderQuantity = inventory.reorder_quantity || 50;
        const unitCost = inventory.unit_cost || 0;
        const currentStockValue = currentStock * unitCost;
        
        // Récupérer la prévision si disponible (simplifié - on pourrait utiliser useDemandForecast mais c'est complexe dans une fonction async)
        const averageDailySales = 0; // TODO: Calculer depuis l'historique des ventes
        const daysOfInventory = 0;
        const leadTime = 7;
        
        // Calculer le taux de rotation
        const periodDays = 30;
        const totalSales = averageDailySales * periodDays;
        const averageStock = currentStock;
        const stockTurnoverRate = calculateTurnoverRate(totalSales, averageStock, periodDays);
        
        // Déterminer le statut
        const stockStatus = determineStockStatus(currentStock, reorderPoint, daysOfInventory, leadTime);
        
        // Calculer les recommandations
        const recommendedStockLevel = calculateOptimalStockLevel(averageDailySales, leadTime);
        const recommendedReorderPoint = calculateOptimalReorderPoint(averageDailySales, leadTime);
        const annualDemand = averageDailySales * 365;
        const recommendedReorderQuantity = calculateOptimalReorderQuantity(annualDemand);
        
        // Déterminer l'action recommandée
        let recommendedAction: 'increase' | 'decrease' | 'maintain' | 'urgent_reorder' = 'maintain';
        let actionPriority: 'high' | 'medium' | 'low' = 'low';
        
        if (stockStatus === 'critical') {
          recommendedAction = 'urgent_reorder';
          actionPriority = 'high';
        } else if (stockStatus === 'understock') {
          recommendedAction = 'increase';
          actionPriority = 'medium';
        } else if (stockStatus === 'overstock') {
          recommendedAction = 'decrease';
          actionPriority = 'low';
        }
        
        // Calculer les coûts
        const overstockAmount = Math.max(0, currentStock - recommendedStockLevel);
        const overstockCost = overstockAmount * unitCost * 0.2;
        const stockoutRisk = 0.1; // Par défaut
        const estimatedLostSales = averageDailySales * stockoutRisk * 30;
        const stockoutCost = estimatedLostSales * (unitCost * 2);
        const potentialSavings = overstockCost + stockoutCost;
        
        return {
          product_id: productId,
          product_name: product?.name || 'Produit inconnu',
          variant_id,
          sku: inventory.sku || '',
          current_stock: currentStock,
          current_stock_value: currentStockValue,
          reorder_point: reorderPoint,
          reorder_quantity: reorderQuantity,
          stock_status: stockStatus,
          stock_turnover_rate: stockTurnoverRate,
          days_of_inventory: daysOfInventory,
          recommended_stock_level: recommendedStockLevel,
          recommended_reorder_point: recommendedReorderPoint,
          recommended_reorder_quantity: recommendedReorderQuantity,
          recommended_action: recommendedAction,
          action_priority: actionPriority,
          potential_savings: potentialSavings,
          overstock_cost: overstockCost,
          stockout_cost: stockoutCost,
          forecast: undefined, // TODO: Intégrer les prévisions
        };
      };
      
      for (const product of products || []) {
        try {
          const optimization = await calculateOptimization(product.id);
          if (optimization) {
            optimizations.push(optimization);
          }
        } catch (error) {
          logger.warn('Error optimizing stock for product', { productId: product.id, error });
        }
      }
      
      // Agréger les statistiques
      const optimalCount = optimizations.filter((o) => o.stock_status === 'optimal').length;
      const overstockCount = optimizations.filter((o) => o.stock_status === 'overstock').length;
      const understockCount = optimizations.filter((o) => o.stock_status === 'understock').length;
      const criticalCount = optimizations.filter((o) => o.stock_status === 'critical').length;
      
      const totalStockValue = optimizations.reduce((sum, o) => sum + o.current_stock_value, 0);
      const potentialSavings = optimizations.reduce((sum, o) => sum + o.potential_savings, 0);
      const totalOverstockCost = optimizations.reduce((sum, o) => sum + o.overstock_cost, 0);
      const totalStockoutCost = optimizations.reduce((sum, o) => sum + o.stockout_cost, 0);
      
      const urgentActions = optimizations
        .filter((o) => o.action_priority === 'high')
        .sort((a, b) => b.potential_savings - a.potential_savings);
      
      return {
        total_products: optimizations.length,
        optimal_count: optimalCount,
        overstock_count: overstockCount,
        understock_count: understockCount,
        critical_count: criticalCount,
        total_stock_value: totalStockValue,
        potential_savings: potentialSavings,
        total_overstock_cost: totalOverstockCost,
        total_stockout_cost: totalStockoutCost,
        optimizations: optimizations.sort((a, b) => {
          // Trier par priorité puis par économies potentielles
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.action_priority] - priorityOrder[a.action_priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.potential_savings - a.potential_savings;
        }),
        urgent_actions: urgentActions,
      };
    },
    enabled: !!storeId,
  });
}

/**
 * Applique les recommandations d'optimisation
 */
export function useApplyStockOptimization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      productId,
      variantId,
      optimization,
    }: {
      productId: string;
      variantId?: string;
      optimization: StockOptimization;
    }) => {
      // Mettre à jour le reorder_point et reorder_quantity
      const { data: inventory } = await supabase
        .from('physical_product_inventory')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (!inventory) {
        throw new Error('Inventory item not found');
      }
      
      const { error } = await supabase
        .from('physical_product_inventory')
        .update({
          reorder_point: optimization.recommended_reorder_point,
          reorder_quantity: optimization.recommended_reorder_quantity,
        })
        .eq('id', inventory.id);
      
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-optimization'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });
}

