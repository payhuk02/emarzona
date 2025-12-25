/**
 * Hook pour l'import/export CSV de l'inventaire
 * Date: 28 Janvier 2025
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

export interface InventoryCSVRow {
  sku: string;
  product_name?: string;
  quantity_available: number;
  quantity_reserved?: number;
  reorder_point?: number;
  warehouse_location?: string;
  barcode?: string;
  cost_price?: number;
  selling_price?: number;
}

export interface CSVImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; sku: string; error: string }>;
  warnings: Array<{ row: number; sku: string; warning: string }>;
}

/**
 * Export de l'inventaire en CSV
 */
export function useExportInventoryCSV() {
  const { toast } = useToast();

  type InventoryItem = {
    sku?: string;
    quantity_available?: number;
    quantity_reserved?: number;
    reorder_point?: number;
    warehouse_location?: string;
    barcode?: string;
    cost_price?: number;
    selling_price?: number;
    total_value?: number;
    updated_at?: string;
    physical_product?: { product?: { name?: string } };
    variant?: { physical_product?: { product?: { name?: string } } };
  };
  const exportToCSV = useCallback(
    async (inventoryItems: InventoryItem[], filename?: string) => {
      if (!inventoryItems || inventoryItems.length === 0) {
        toast({
          title: 'Aucune donnée',
          description: 'Aucun article à exporter',
          variant: 'destructive',
        });
        return;
      }

      try {
        const headers = [
          'SKU',
          'Nom Produit',
          'Quantité Disponible',
          'Quantité Réservée',
          'Point Réapprovisionnement',
          'Emplacement Entrepôt',
          'Code-barres',
          'Prix Coût',
          'Prix Vente',
          'Valeur Totale',
          'Statut',
          'Date Mise à Jour',
        ];

        const rows = inventoryItems.map((item) => {
          const productName =
            item.physical_product?.product?.name ||
            item.variant?.physical_product?.product?.name ||
            'N/A';

          let status = 'Disponible';
          if (item.quantity_available === 0) {
            status = 'Rupture';
          } else if (item.quantity_available <= (item.reorder_point || 0)) {
            status = 'Stock Faible';
          }

          return [
            item.sku || '',
            productName,
            item.quantity_available || 0,
            item.quantity_reserved || 0,
            item.reorder_point || 0,
            item.warehouse_location || '',
            item.barcode || '',
            item.cost_price || '',
            item.selling_price || '',
            item.total_value || 0,
            status,
            item.updated_at || new Date().toISOString(),
          ];
        });

        const csvContent = Papa.unparse({
          fields: headers,
          data: rows,
        });

        const blob = new Blob(['\ufeff' + csvContent], {
          type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          filename || `inventaire-${new Date().toISOString().split('T')[0]}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Export réussi',
          description: `${inventoryItems.length} article(s) exporté(s)`,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Impossible d\'exporter le CSV';
        toast({
          title: 'Erreur export',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  return { exportToCSV };
}

/**
 * Import de l'inventaire depuis un fichier CSV
 */
export function useImportInventoryCSV() {
  const { toast } = useToast();

  const importFromCSV = useCallback(
    async (
      file: File,
      options?: {
        updateExisting?: boolean;
        createMissing?: boolean;
        dryRun?: boolean;
      }
    ): Promise<CSVImportResult> => {
      const {
        updateExisting = true,
        createMissing = false,
        dryRun = false,
      } = options || {};

      return new Promise((resolve, reject) => {
        const result: CSVImportResult = {
          success: 0,
          failed: 0,
          errors: [],
          warnings: [],
        };

        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            try {
              type CSVRow = Record<string, string>;
              const rows = results.data as CSVRow[];
              const errors: Array<{ row: number; sku: string; error: string }> = [];
              const warnings: Array<{ row: number; sku: string; warning: string }> = [];

              // Validation et traitement de chaque ligne
              for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowNumber = i + 2; // +2 car ligne 1 = header, index 0-based

                // Validation des champs requis
                if (!row.SKU && !row.sku) {
                  errors.push({
                    row: rowNumber,
                    sku: '',
                    error: 'SKU manquant',
                  });
                  result.failed++;
                  continue;
                }

                const sku = row.SKU || row.sku;
                const quantity = parseInt(row['Quantité Disponible'] || row.quantity_available || '0', 10);

                if (isNaN(quantity) || quantity < 0) {
                  errors.push({
                    row: rowNumber,
                    sku,
                    error: 'Quantité invalide',
                  });
                  result.failed++;
                  continue;
                }

                if (dryRun) {
                  // Mode test : validation uniquement
                  result.success++;
                  continue;
                }

                try {
                  // Rechercher l'inventory_item par SKU
                  const { data: inventoryItem, error: findError } = await supabase
                    .from('inventory_items')
                    .select('id, sku, quantity_available')
                    .eq('sku', sku)
                    .maybeSingle();

                  if (findError) {
                    errors.push({
                      row: rowNumber,
                      sku,
                      error: `Erreur recherche: ${findError.message}`,
                    });
                    result.failed++;
                    continue;
                  }

                  if (!inventoryItem) {
                    if (createMissing) {
                      warnings.push({
                        row: rowNumber,
                        sku,
                        warning: 'Article non trouvé - création non supportée automatiquement',
                      });
                      result.failed++;
                    } else {
                      errors.push({
                        row: rowNumber,
                        sku,
                        error: 'Article non trouvé',
                      });
                      result.failed++;
                    }
                    continue;
                  }

                  if (!updateExisting) {
                    warnings.push({
                      row: rowNumber,
                      sku,
                      warning: 'Mise à jour ignorée (option désactivée)',
                    });
                    continue;
                  }

                  // Mise à jour de la quantité
                  const updates: {
                    quantity_available: number;
                    updated_at: string;
                    warehouse_location?: string;
                    reorder_point?: number;
                  } = {
                    quantity_available: quantity,
                    updated_at: new Date().toISOString(),
                  };

                  // Mise à jour optionnelle des autres champs
                  if (row['Emplacement Entrepôt'] || row.warehouse_location) {
                    updates.warehouse_location =
                      row['Emplacement Entrepôt'] || row.warehouse_location;
                  }

                  if (row['Point Réapprovisionnement'] || row.reorder_point) {
                    const reorderPoint = parseInt(
                      row['Point Réapprovisionnement'] || row.reorder_point || '0',
                      10
                    );
                    if (!isNaN(reorderPoint)) {
                      updates.reorder_point = reorderPoint;
                    }
                  }

                  const { error: updateError } = await supabase
                    .from('inventory_items')
                    .update(updates)
                    .eq('id', inventoryItem.id);

                  if (updateError) {
                    errors.push({
                      row: rowNumber,
                      sku,
                      error: `Erreur mise à jour: ${updateError.message}`,
                    });
                    result.failed++;
                  } else {
                    result.success++;
                  }
                } catch (error: unknown) {
                  const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
                  errors.push({
                    row: rowNumber,
                    sku,
                    error: errorMessage,
                  });
                  result.failed++;
                }
              }

              resolve(result);
            } catch (error: unknown) {
              reject(error);
            }
          },
          error: (error) => {
            reject(new Error(`Erreur parsing CSV: ${error.message}`));
          },
        });
      });
    },
    [toast]
  );

  return { importFromCSV };
}

