/**
 * Import/Export System
 * Date: 28 Janvier 2025
 * 
 * Système d'import/export pour produits, commandes, clients
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type ImportExportType = 'products' | 'orders' | 'customers';
export type ImportExportFormat = 'csv' | 'json';

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    field?: string;
    error: string;
  }>;
}

/**
 * Exporter des données en CSV
 */
export async function exportToCSV(
  storeId: string,
  type: ImportExportType,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    let data: any[] = [];

    switch (type) {
      case 'products':
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId);
        data = products || [];
        break;

      case 'orders':
        let ordersQuery = supabase
          .from('orders')
          .select('*')
          .eq('store_id', storeId);
        
        if (startDate) {
          ordersQuery = ordersQuery.gte('created_at', startDate);
        }
        if (endDate) {
          ordersQuery = ordersQuery.lte('created_at', endDate);
        }
        
        const { data: orders } = await ordersQuery;
        data = orders || [];
        break;

      case 'customers':
        const { data: customers } = await supabase
          .from('customers')
          .select('*')
          .eq('store_id', storeId);
        data = customers || [];
        break;
    }

    // Convertir en CSV
    const csv = convertToCSV(data);

    return { success: true, data: csv };
  } catch (error: any) {
    logger.error('Error exporting to CSV', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Exporter des données en JSON
 */
export async function exportToJSON(
  storeId: string,
  type: ImportExportType,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    let data: any[] = [];

    switch (type) {
      case 'products':
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId);
        data = products || [];
        break;

      case 'orders':
        let ordersQuery = supabase
          .from('orders')
          .select('*')
          .eq('store_id', storeId);
        
        if (startDate) {
          ordersQuery = ordersQuery.gte('created_at', startDate);
        }
        if (endDate) {
          ordersQuery = ordersQuery.lte('created_at', endDate);
        }
        
        const { data: orders } = await ordersQuery;
        data = orders || [];
        break;

      case 'customers':
        const { data: customers } = await supabase
          .from('customers')
          .select('*')
          .eq('store_id', storeId);
        data = customers || [];
        break;
    }

    return { success: true, data };
  } catch (error: any) {
    logger.error('Error exporting to JSON', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Importer des données depuis CSV
 */
export async function importFromCSV(
  storeId: string,
  type: ImportExportType,
  csvContent: string
): Promise<ImportResult> {
  try {
    const rows = parseCSV(csvContent);
    const errors: ImportResult['errors'] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const result = await importRow(storeId, type, row);
        if (result.success) {
          imported++;
        } else {
          errors.push({
            row: i + 2, // +2 car ligne 1 = headers
            error: result.error || 'Unknown error',
          });
        }
      } catch (error: any) {
        errors.push({
          row: i + 2,
          error: error.message || 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      failed: errors.length,
      errors,
    };
  } catch (error: any) {
    logger.error('Error importing from CSV', { error: error.message });
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [{ row: 0, error: error.message }],
    };
  }
}

/**
 * Importer des données depuis JSON
 */
export async function importFromJSON(
  storeId: string,
  type: ImportExportType,
  jsonData: any[]
): Promise<ImportResult> {
  try {
    const errors: ImportResult['errors'] = [];
    let imported = 0;

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      try {
        const result = await importRow(storeId, type, row);
        if (result.success) {
          imported++;
        } else {
          errors.push({
            row: i + 1,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error: any) {
        errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      failed: errors.length,
      errors,
    };
  } catch (error: any) {
    logger.error('Error importing from JSON', { error: error.message });
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [{ row: 0, error: error.message }],
    };
  }
}

/**
 * Importer une ligne
 */
async function importRow(
  storeId: string,
  type: ImportExportType,
  row: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (type) {
      case 'products':
        const { error: productError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            name: row.name || row.nom,
            description: row.description,
            price: parseFloat(row.price || row.prix || '0'),
            currency: row.currency || row.devise || 'XOF',
            product_type: row.product_type || row.type_produit || 'digital',
            category_id: row.category_id,
            tags: row.tags ? (Array.isArray(row.tags) ? row.tags : row.tags.split(',')) : [],
            is_active: row.is_active !== undefined ? row.is_active : true,
          });

        if (productError) throw productError;
        break;

      case 'customers':
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            store_id: storeId,
            name: row.name || row.nom,
            email: row.email,
            phone: row.phone || row.telephone,
          });

        if (customerError) throw customerError;
        break;

      case 'orders':
        // Les commandes sont généralement créées via le système de paiement
        // On peut juste logger une erreur
        return { success: false, error: 'Orders cannot be imported directly' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Convertir des données en CSV
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).replace(/"/g, '""');
    }).map(v => `"${v}"`).join(',')
  );

  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
}

/**
 * Parser un CSV
 */
function parseCSV(csv: string): Record<string, any>[] {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

