/**
 * Fonctions d'export pour Analytics Inventaire
 * Date: 31 Janvier 2025
 * 
 * Export CSV des données d'analytics inventaire
 */

import { logger } from './logger';

export interface InventoryAnalyticsExport {
  product_id: string;
  product_name: string;
  current_stock: number;
  total_sold: number;
  total_revenue: number;
  average_cost: number;
  turnover_rate: number;
  days_in_stock: number;
  abc_category: 'A' | 'B' | 'C';
  movement_type: 'fast' | 'medium' | 'slow' | 'dead';
}

/**
 * Exporte les analytics inventaire en CSV
 */
export function exportInventoryAnalyticsToCSV(
  data: InventoryAnalyticsExport[],
  filename?: string
): void {
  try {
    if (!data || data.length === 0) {
      logger.warn('No data to export');
      return;
    }

    // En-têtes CSV
    const headers = [
      'Produit',
      'Stock Actuel',
      'Ventes',
      'Revenus (XOF)',
      'Coût Moyen (XOF)',
      'Taux Rotation',
      'Jours en Stock',
      'Catégorie ABC',
      'Type Mouvement',
    ];

    // Lignes de données
    const rows = data.map((item) => [
      item.product_name || 'N/A',
      item.current_stock.toString(),
      item.total_sold.toString(),
      item.total_revenue.toLocaleString('fr-FR'),
      item.average_cost.toLocaleString('fr-FR'),
      item.turnover_rate.toFixed(2),
      item.days_in_stock.toString(),
      item.abc_category,
      item.movement_type,
    ]);

    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Ajouter BOM UTF-8 pour Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Créer le lien de téléchargement
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      filename || `inventory-analytics-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Inventory analytics exported to CSV', { count: data.length });
  } catch (error) {
    logger.error('Error exporting inventory analytics to CSV', { error });
    throw error;
  }
}

/**
 * Exporte les suggestions de réapprovisionnement en CSV
 */
export function exportReorderSuggestionsToCSV(
  data: Array<{
    product_name: string;
    current_stock: number;
    forecasted_demand: number;
    safety_stock: number;
    reorder_point: number;
    suggested_quantity: number;
    urgency_level: string;
    estimated_stockout_date?: string;
    estimated_cost?: number;
    status: string;
  }>,
  filename?: string
): void {
  try {
    if (!data || data.length === 0) {
      logger.warn('No data to export');
      return;
    }

    const headers = [
      'Produit',
      'Stock Actuel',
      'Demande Prévue',
      'Stock Sécurité',
      'Point Réappro.',
      'Quantité Suggérée',
      'Urgence',
      'Date Rupture Estimée',
      'Coût Estimé (XOF)',
      'Statut',
    ];

    const rows = data.map((item) => [
      item.product_name || 'N/A',
      item.current_stock.toString(),
      item.forecasted_demand.toString(),
      item.safety_stock.toString(),
      item.reorder_point.toString(),
      item.suggested_quantity.toString(),
      item.urgency_level,
      item.estimated_stockout_date || 'N/A',
      item.estimated_cost ? item.estimated_cost.toLocaleString('fr-FR') : 'N/A',
      item.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      filename || `reorder-suggestions-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Reorder suggestions exported to CSV', { count: data.length });
  } catch (error) {
    logger.error('Error exporting reorder suggestions to CSV', { error });
    throw error;
  }
}

/**
 * Exporte les prévisions de demande en CSV
 */
export function exportDemandForecastsToCSV(
  data: Array<{
    product_name: string;
    forecast_period_start: string;
    forecast_period_end: string;
    forecast_type: string;
    forecasted_quantity: number;
    confidence_level: number;
    forecast_method: string;
    historical_data_points: number;
    mae?: number;
    mse?: number;
    mape?: number;
  }>,
  filename?: string
): void {
  try {
    if (!data || data.length === 0) {
      logger.warn('No data to export');
      return;
    }

    const headers = [
      'Produit',
      'Période Début',
      'Période Fin',
      'Type Prévision',
      'Quantité Prévue',
      'Niveau Confiance (%)',
      'Méthode',
      'Points Données',
      'MAE',
      'MSE',
      'MAPE (%)',
    ];

    const rows = data.map((item) => [
      item.product_name || 'N/A',
      item.forecast_period_start,
      item.forecast_period_end,
      item.forecast_type,
      item.forecasted_quantity.toString(),
      (item.confidence_level * 100).toFixed(1),
      item.forecast_method,
      item.historical_data_points.toString(),
      item.mae ? item.mae.toFixed(2) : 'N/A',
      item.mse ? item.mse.toFixed(2) : 'N/A',
      item.mape ? item.mape.toFixed(2) : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      filename || `demand-forecasts-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Demand forecasts exported to CSV', { count: data.length });
  } catch (error) {
    logger.error('Error exporting demand forecasts to CSV', { error });
    throw error;
  }
}

