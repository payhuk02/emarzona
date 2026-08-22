/**
 * Import/Export System
 * Date: 28 Janvier 2025
 *
 * Système d'import/export pour produits, commandes, clients
 *
 * AMÉLIORATIONS 2026:
 * - Batch processing pour import optimisé
 * - Validation unicité slug
 * - Limites taille/nombre fichiers
 * - Messages d'erreur améliorés
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { validateSkuUniqueness } from '@/lib/validation/centralized-validation';

export type ImportExportType = 'products' | 'orders' | 'customers';
export type ImportExportFormat = 'csv' | 'json';

// Exporter les fonctions utilitaires pour les tests
export { validateSlugUniqueness, retryOperation, sanitizeHtml, importRow };

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

// Interface pour le mode preview
export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  validationResults: Array<{
    row: number;
    isValid: boolean;
    errors: Array<{ field?: string; message: string }>;
    data?: Record<string, unknown>;
  }>;
  categoriesFound: Array<{ name: string; count: number; categoryId?: string }>;
  warnings: string[];
}

// Constantes de configuration
const BATCH_SIZE = 20; // Nombre de produits à importer par batch
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PRODUCTS_PER_IMPORT = 1000; // Limite de produits par import
const MAX_RETRIES = 3; // Nombre de tentatives pour erreurs réseau
const RETRY_DELAY = 1000; // Délai entre tentatives (ms)

function getUnknownErrorMessage(error: unknown, fallback = 'Erreur inconnue'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

function getUnknownErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

const EXPORT_CUSTOMER_FIELDS =
  'id,store_id,name,full_name,email,phone,address,city,country,notes,total_orders,total_spent,metadata,created_at,updated_at';
const EXPORT_ORDER_FIELDS =
  'id,store_id,customer_id,order_number,status,payment_status,payment_type,percentage_paid,remaining_amount,total_amount,currency,delivery_status,delivery_tracking,delivery_notes,delivery_confirmed_at,delivery_confirmed_by,affiliate_tracking_cookie,metadata,created_at,updated_at';
const EXPORT_PRODUCT_FIELDS =
  'id,store_id,name,slug,description,short_description,price,promotional_price,compare_at_price,currency,product_type,pricing_model,category,category_id,tags,is_active,is_draft,is_featured,is_free_preview,image_url,og_image,gallery,images,custom_fields,faqs,payment_options,discount_trigger,automatic_discount_enabled,payment_option_usage_count,hide_from_store,password_protected,product_password,collect_shipping_address,stock,cost_per_item,dimensions,weight,downloadable_files,digital_file_url,post_purchase_guide_url,preview_content_description,license_terms,licensing_type,purchase_limit,paid_product_id,free_product_id,sale_start_date,sale_end_date,rating,reviews_count,hide_downloads_count,hide_likes_count,hide_purchase_count,hide_rating,hide_recommendations_count,hide_reviews_count,watermark_enabled,meta_title,meta_description,meta_keywords,seo_title,seo_description,seo_keywords,created_at,updated_at';

/**
 * Sanitization HTML basique pour les descriptions
 * AMÉLIORATION: Sécurisation des descriptions
 */
function sanitizeHtml(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null;

  // Supprimer les balises HTML dangereuses
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Styles
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Iframes
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Objects
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Embeds
    .replace(/on\w+="[^"]*"/gi, '') // Event handlers
    .replace(/javascript:[^"']*/gi, '') // JavaScript URLs
    .replace(/vbscript:[^"']*/gi, '') // VBScript URLs
    .replace(/data:[^"']*/gi, '') // Data URLs potentiellement dangereuses
    .trim();
}

/**
 * Exporter les erreurs d'import en CSV
 * AMÉLIORATION: Export des erreurs pour analyse
 */
export function exportImportErrorsToCSV(errors: ImportResult['errors']): string {
  const csvData = [
    ['Ligne', 'Champ', 'Erreur'],
    ...errors.map(error => [error.row.toString(), error.field || '', error.error]),
  ];

  return convertToCSV(csvData);
}

/**
 * Exporter les résultats du preview en CSV
 * AMÉLIORATION: Export des résultats d'analyse
 */
export function exportPreviewResultsToCSV(previewResult: ImportPreviewResult): string {
  const csvData = [
    ['Ligne', 'Statut', 'Erreurs', 'Nom', 'Prix', 'Catégorie'],
    ...previewResult.validationResults.map(result => [
      result.row.toString(),
      result.isValid ? 'Valide' : 'Erreur',
      result.errors.map(e => `${e.field || 'Global'}: ${e.message}`).join('; '),
      result.data?.name || '',
      result.data?.price?.toString() || '',
      result.data?.category || '',
    ]),
  ];

  return convertToCSV(csvData);
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
    let data: Record<string, unknown>[] = [];

    switch (type) {
      case 'products': {
        const { data: products } = await supabase
          .from('products')
          .select(EXPORT_PRODUCT_FIELDS)
          .eq('store_id', storeId);
        data = (products || []) as Record<string, unknown>[];
        break;
      }

      case 'orders': {
        let ordersQuery = supabase
          .from('orders')
          .select(EXPORT_ORDER_FIELDS)
          .eq('store_id', storeId);

        if (startDate) {
          ordersQuery = ordersQuery.gte('created_at', startDate);
        }
        if (endDate) {
          ordersQuery = ordersQuery.lte('created_at', endDate);
        }

        const { data: orders } = await ordersQuery;
        data = (orders || []) as Record<string, unknown>[];
        break;
      }

      case 'customers': {
        const { data: customers } = await supabase
          .from('customers')
          .select(EXPORT_CUSTOMER_FIELDS)
          .eq('store_id', storeId);
        data = (customers || []) as Record<string, unknown>[];
        break;
      }
    }

    // Convertir en CSV
    const csv = convertToCSV(data);

    return { success: true, data: csv };
  } catch (caughtError: unknown) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : 'Unknown error';
    logger.error('Error exporting to CSV', { error: errorMessage });
    return { success: false, error: errorMessage };
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
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    let data: Record<string, unknown>[] = [];

    switch (type) {
      case 'products': {
        const { data: products } = await supabase
          .from('products')
          .select(EXPORT_PRODUCT_FIELDS)
          .eq('store_id', storeId);
        data = (products || []) as Record<string, unknown>[];
        break;
      }

      case 'orders': {
        let ordersQuery = supabase
          .from('orders')
          .select(EXPORT_ORDER_FIELDS)
          .eq('store_id', storeId);

        if (startDate) {
          ordersQuery = ordersQuery.gte('created_at', startDate);
        }
        if (endDate) {
          ordersQuery = ordersQuery.lte('created_at', endDate);
        }

        const { data: orders } = await ordersQuery;
        data = (orders || []) as Record<string, unknown>[];
        break;
      }

      case 'customers': {
        const { data: customers } = await supabase
          .from('customers')
          .select(EXPORT_CUSTOMER_FIELDS)
          .eq('store_id', storeId);
        data = (customers || []) as Record<string, unknown>[];
        break;
      }
    }

    return { success: true, data };
  } catch (caughtError: unknown) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : 'Unknown error';
    logger.error('Error exporting to JSON', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Importer des données depuis CSV
 * AMÉLIORATION: Batch processing pour performance optimale
 */
export async function importFromCSV(
  storeId: string,
  type: ImportExportType,
  csvContent: string,
  options?: {
    onProgress?: (progress: { imported: number; total: number; percentage: number }) => void;
  }
): Promise<ImportResult> {
  try {
    // Validation taille fichier
    const fileSize = new Blob([csvContent]).size;
    if (fileSize > MAX_FILE_SIZE) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [
          {
            row: 0,
            error: `Fichier trop volumineux. Taille maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
        ],
      };
    }

    const rows = parseCSV(csvContent);

    // Validation nombre de lignes
    if (rows.length > MAX_PRODUCTS_PER_IMPORT) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [
          {
            row: 0,
            error: `Trop de produits. Maximum: ${MAX_PRODUCTS_PER_IMPORT} produits par import`,
          },
        ],
      };
    }

    // Validation unicité slug pour produits
    if (type === 'products') {
      const slugValidation = validateSlugUniqueness(rows, storeId);
      if (!slugValidation.valid) {
        return {
          success: false,
          imported: 0,
          failed: slugValidation.duplicates.length,
          errors: slugValidation.duplicates.map((dup, idx) => ({
            row: dup.row + 2, // +2 car ligne 1 = headers
            field: 'slug',
            error: `Slug dupliqué: "${dup.slug}" (également présent ligne ${dup.duplicateRow + 2})`,
          })),
        };
      }
    }

    const errors: ImportResult['errors'] = [];
    let imported = 0;
    const total = rows.length;

    // Import par batch pour performance optimale
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      // Traiter le batch en parallèle
      const batchResults = await Promise.allSettled(
        batch.map((row, batchIndex) =>
          importRow(storeId, type, row)
            .then(result => ({
              success: result.success,
              error: result.error,
              rowIndex: i + batchIndex,
            }))
            .catch(error => ({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              rowIndex: i + batchIndex,
            }))
        )
      );

      // Traiter les résultats du batch
      batchResults.forEach((result, batchIndex) => {
        const rowIndex = i + batchIndex;
        if (result.status === 'fulfilled') {
          const { success, error, rowIndex: actualRowIndex } = result.value;
          if (success) {
            imported++;
          } else {
            errors.push({
              row: actualRowIndex + 2, // +2 car ligne 1 = headers
              error: error || 'Unknown error',
            });
          }
        } else {
          errors.push({
            row: rowIndex + 2,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });

      // Callback de progression
      if (options?.onProgress) {
        options.onProgress({
          imported,
          total,
          percentage: Math.round((imported / total) * 100),
        });
      }

      // Petit délai entre batches pour éviter surcharge DB
      if (i + BATCH_SIZE < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      success: errors.length === 0,
      imported,
      failed: errors.length,
      errors,
    };
  } catch (error: unknown) {
    logger.error('Error importing from CSV', { error: getUnknownErrorMessage(error) });
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        { row: 0, error: getUnknownErrorMessage(error, "Erreur inconnue lors de l'import") },
      ],
    };
  }
}

/**
 * Prévisualiser un import sans sauvegarder (dry-run)
 * AMÉLIORATION: Mode preview pour validation avant import
 */
export async function previewImport(
  storeId: string,
  type: ImportExportType,
  data: Record<string, unknown>[]
): Promise<ImportPreviewResult> {
  try {
    const validationResults: ImportPreviewResult['validationResults'] = [];
    const categoriesFound: Array<{ name: string; count: number; categoryId?: string }> = [];
    const categoryMap = new Map<string, number>();

    // Validation de chaque ligne sans sauvegarde
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowIndex = i + 1;

      try {
        // Validation basique comme dans importRow mais sans sauvegarde
        let isValid = true;
        const errors: Array<{ field?: string; message: string }> = [];

        if (type === 'products') {
          const name = (row.name || row.nom || '').trim();
          const slug = (row.slug || '').trim().toLowerCase();
          const sku = (row.sku || '').trim() || null;
          const price = parseFloat(row.price || row.prix || '0');
          const promotionalPrice = row.promotional_price
            ? parseFloat(row.promotional_price.toString().replace(/\s/g, '').replace(',', '.'))
            : null;
          const categoryName = (row.category || '').trim() || null;

          // Validations
          if (!name || name.length < 3) {
            isValid = false;
            errors.push({ field: 'name', message: 'Le nom doit contenir au moins 3 caractères' });
          }

          if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
            isValid = false;
            errors.push({
              field: 'slug',
              message: 'Format de slug invalide (minuscules et tirets uniquement)',
            });
          }

          if (isNaN(price) || price <= 0) {
            isValid = false;
            errors.push({ field: 'price', message: 'Le prix doit être un nombre positif' });
          }

          if (promotionalPrice !== null) {
            const promoValidation = validatePromotionalPrice(price, promotionalPrice);
            if (!promoValidation.valid) {
              isValid = false;
              errors.push({
                field: 'promotional_price',
                message: promoValidation.error || 'Prix promotionnel invalide',
              });
            }
          }

          // Validation unicité slug dans le fichier
          const duplicateSlug = validationResults.find(r => r.isValid && r.data?.slug === slug);
          if (duplicateSlug) {
            isValid = false;
            errors.push({
              field: 'slug',
              message: `Slug dupliqué avec la ligne ${duplicateSlug.row}`,
            });
          }

          // Validation unicité SKU dans le fichier (si fourni)
          if (sku) {
            const duplicateSku = validationResults.find(r => r.isValid && r.data?.sku === sku);
            if (duplicateSku) {
              isValid = false;
              errors.push({
                field: 'sku',
                message: `SKU dupliqué avec la ligne ${duplicateSku.row}`,
              });
            }
          }

          // Comptage des catégories
          if (categoryName) {
            categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
          }

          validationResults.push({
            row: rowIndex,
            isValid,
            errors,
            data: isValid
              ? {
                  name,
                  slug,
                  sku,
                  price,
                  promotional_price: promotionalPrice,
                  category: categoryName,
                  product_type: row.product_type || 'digital',
                  description: row.description || row.short_description || null,
                  short_description: row.short_description || row.accroche || null,
                  currency: row.currency || row.devise || 'XOF',
                  image_url: row.image_url || null,
                  duration_minutes: row.duration_minutes || null,
                  location_type: row.location_type || null,
                  pricing_type: row.pricing_type || null,
                  fulfillment_mode: row.fulfillment_mode || null,
                  service_type: row.service_type || null,
                }
              : undefined,
          });
        } else {
          // Pour autres types, validation basique
          validationResults.push({
            row: rowIndex,
            isValid: true,
            errors: [],
            data: row,
          });
        }
      } catch (error: unknown) {
        validationResults.push({
          row: rowIndex,
          isValid: false,
          errors: [{ message: getUnknownErrorMessage(error, 'Erreur de validation') }],
        });
      }
    }

    // Vérification des catégories dans la DB
    const warnings: string[] = [];
    for (const [categoryName, count] of categoryMap.entries()) {
      try {
        const categoryValidation = await validateCategoryExists(categoryName, 'digital');
        categoriesFound.push({
          name: categoryName,
          count,
          categoryId: categoryValidation.categoryId || undefined,
        });
      } catch (error) {
        warnings.push(`Impossible de vérifier la catégorie "${categoryName}"`);
      }
    }

    return {
      totalRows: data.length,
      validRows: validationResults.filter(r => r.isValid).length,
      invalidRows: validationResults.filter(r => !r.isValid).length,
      validationResults,
      categoriesFound,
      warnings,
    };
  } catch (error: unknown) {
    logger.error('Error in previewImport', { error: getUnknownErrorMessage(error) });
    throw new Error(`Erreur lors de la prévisualisation: ${getUnknownErrorMessage(error)}`);
  }
}

/**
 * Importer des données depuis JSON
 * AMÉLIORATION: Batch processing pour performance optimale
 */
export async function importFromJSON(
  storeId: string,
  type: ImportExportType,
  jsonData: Record<string, unknown>[],
  options?: {
    onProgress?: (progress: { imported: number; total: number; percentage: number }) => void;
  }
): Promise<ImportResult> {
  try {
    // Validation nombre de produits
    if (jsonData.length > MAX_PRODUCTS_PER_IMPORT) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [
          {
            row: 0,
            error: `Trop de produits. Maximum: ${MAX_PRODUCTS_PER_IMPORT} produits par import`,
          },
        ],
      };
    }

    // Validation unicité slug pour produits
    if (type === 'products') {
      const slugValidation = validateSlugUniqueness(jsonData, storeId);
      if (!slugValidation.valid) {
        return {
          success: false,
          imported: 0,
          failed: slugValidation.duplicates.length,
          errors: slugValidation.duplicates.map(dup => ({
            row: dup.row + 1,
            field: 'slug',
            error: `Slug dupliqué: "${dup.slug}" (également présent ligne ${dup.duplicateRow + 1})`,
          })),
        };
      }
    }

    const errors: ImportResult['errors'] = [];
    let imported = 0;
    const total = jsonData.length;

    // Import par batch pour performance optimale
    for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
      const batch = jsonData.slice(i, i + BATCH_SIZE);

      // Traiter le batch en parallèle
      const batchResults = await Promise.allSettled(
        batch.map((row, batchIndex) =>
          importRow(storeId, type, row)
            .then(result => ({
              success: result.success,
              error: result.error,
              rowIndex: i + batchIndex,
            }))
            .catch(error => ({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              rowIndex: i + batchIndex,
            }))
        )
      );

      // Traiter les résultats du batch
      batchResults.forEach((result, batchIndex) => {
        const rowIndex = i + batchIndex;
        if (result.status === 'fulfilled') {
          const { success, error, rowIndex: actualRowIndex } = result.value;
          if (success) {
            imported++;
          } else {
            errors.push({
              row: actualRowIndex + 1,
              error: error || 'Unknown error',
            });
          }
        } else {
          errors.push({
            row: rowIndex + 1,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });

      // Callback de progression
      if (options?.onProgress) {
        options.onProgress({
          imported,
          total,
          percentage: Math.round((imported / total) * 100),
        });
      }

      // Petit délai entre batches pour éviter surcharge DB
      if (i + BATCH_SIZE < jsonData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      success: errors.length === 0,
      imported,
      failed: errors.length,
      errors,
    };
  } catch (error: unknown) {
    logger.error('Error importing from JSON', { error: getUnknownErrorMessage(error) });
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        { row: 0, error: getUnknownErrorMessage(error, "Erreur inconnue lors de l'import") },
      ],
    };
  }
}

/**
 * Valider l'unicité des slugs dans les données à importer
 */
function validateSlugUniqueness(
  rows: Record<string, unknown>[],
  storeId: string
): { valid: boolean; duplicates: Array<{ row: number; slug: string; duplicateRow: number }> } {
  const slugMap = new Map<string, number>();
  const duplicates: Array<{ row: number; slug: string; duplicateRow: number }> = [];

  rows.forEach((row, index) => {
    const slug = (row.slug || '').trim().toLowerCase();
    if (!slug) return;

    if (slugMap.has(slug)) {
      const firstOccurrence = slugMap.get(slug)!;
      duplicates.push({
        row: index,
        slug,
        duplicateRow: firstOccurrence,
      });
    } else {
      slugMap.set(slug, index);
    }
  });

  return {
    valid: duplicates.length === 0,
    duplicates,
  };
}

/**
 * Retry automatique pour opérations réseau
 * AMÉLIORATION: Retry automatique pour erreurs réseau
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const code = getUnknownErrorCode(error);
      const message = getUnknownErrorMessage(error);

      // Ne pas retry pour certaines erreurs (validation, etc.)
      if (code && ['23505', '23503', 'PGRST116'].includes(code)) {
        throw error;
      }

      // Vérifier si c'est une erreur réseau
      const isNetworkError =
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout') ||
        code === 'PGRST301' ||
        !code;

      if (!isNetworkError || attempt === maxRetries) {
        throw error;
      }

      const waitTime = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      logger.info(`Retry attempt ${attempt + 1}/${maxRetries}`, { error: message });
    }
  }

  throw lastError;
}

/**
 * Valider qu'une catégorie existe dans la base de données
 * AMÉLIORATION: Validation catégories existantes
 */
async function validateCategoryExists(
  categoryName: string | null | undefined,
  productType: string
): Promise<{ valid: boolean; error?: string; categoryId?: string | null }> {
  if (!categoryName) {
    return { valid: true, categoryId: null };
  }

  try {
    // Vérifier si la catégorie existe dans la table categories avec retry
    const categoryData = await retryOperation(async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('name', categoryName.trim())
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    });

    if (categoryData) {
      return { valid: true, categoryId: categoryData.id };
    }

    // Si pas dans la table categories, on accepte quand même (fallback sur catégorie texte)
    return { valid: true, categoryId: null };
  } catch (error) {
    // En cas d'erreur, on accepte quand même (fallback)
    logger.warn('Error validating category', { error, categoryName });
    return { valid: true, categoryId: null };
  }
}

/**
 * Valider prix promotionnel < prix normal
 * AMÉLIORATION: Validation logique prix
 */
function validatePromotionalPrice(
  price: number,
  promotionalPrice: number | null | undefined
): { valid: boolean; error?: string } {
  if (!promotionalPrice || promotionalPrice === null) {
    return { valid: true };
  }

  if (promotionalPrice >= price) {
    return {
      valid: false,
      error: `Le prix promotionnel (${promotionalPrice}) doit être inférieur au prix normal (${price})`,
    };
  }

  if (promotionalPrice <= 0) {
    return {
      valid: false,
      error: 'Le prix promotionnel doit être positif',
    };
  }

  return { valid: true };
}

/**
 * Importer une ligne
 * AMÉLIORATION: Messages d'erreur plus détaillés + validation catégories + prix promo
 */
async function importRow(
  storeId: string,
  type: ImportExportType,
  row: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validation storeId
    if (!storeId || typeof storeId !== 'string') {
      return { success: false, error: 'Store ID invalide' };
    }

    switch (type) {
      case 'products': {
        const name = (row.name || row.nom || '').trim();
        const slug = (row.slug || '').trim().toLowerCase();
        const sku = (row.sku || '').trim() || null;
        const price = parseFloat(row.price || row.prix || '0');
        const promotionalPrice = row.promotional_price
          ? parseFloat(row.promotional_price.toString().replace(/\s/g, '').replace(',', '.'))
          : null;
        const categoryName = (row.category || '').trim() || null;
        const productType = row.product_type || row.type_produit || 'digital';

        // Validations spécifiques
        if (!name || name.length < 3) {
          return { success: false, error: 'Le nom du produit doit contenir au moins 3 caractères' };
        }

        if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
          return {
            success: false,
            error: 'Le slug doit être en minuscules avec tirets uniquement (ex: mon-produit)',
          };
        }

        if (isNaN(price) || price <= 0) {
          return { success: false, error: 'Le prix doit être un nombre positif' };
        }

        // Validation prix promotionnel
        if (promotionalPrice !== null) {
          const promoValidation = validatePromotionalPrice(price, promotionalPrice);
          if (!promoValidation.valid) {
            return { success: false, error: promoValidation.error || 'Prix promotionnel invalide' };
          }
        }

        // Validation catégorie (optionnel - on accepte même si pas en DB)
        const categoryValidation = await validateCategoryExists(categoryName, productType);
        if (!categoryValidation.valid) {
          return { success: false, error: categoryValidation.error || 'Catégorie invalide' };
        }

        // Validation unicité SKU (optionnel - on valide seulement si fourni)
        if (sku) {
          const skuValidation = await validateSkuUniqueness(sku, storeId);
          if (!skuValidation.valid) {
            return {
              success: false,
              error:
                skuValidation.errors?.sku ||
                skuValidation.error ||
                'Ce SKU est déjà utilisé dans cette boutique',
            };
          }
        }

        // Insertion avec retry automatique pour erreurs réseau
        try {
          await retryOperation(async () => {
            const { error } = await supabase.from('products').insert({
              store_id: storeId,
              name,
              slug,
              sku,
              description: sanitizeHtml(row.description), // ✅ Sanitization HTML
              price,
              promotional_price: promotionalPrice || null,
              currency: row.currency || row.devise || 'XOF',
              product_type: productType,
              category: categoryName, // Garder category (texte) pour compatibilité
              category_id: categoryValidation.categoryId || null, // Ajouter category_id si trouvé
              tags: row.tags
                ? Array.isArray(row.tags)
                  ? row.tags
                  : row.tags.split(',').map((t: string) => t.trim())
                : [],
              is_active: row.is_active !== undefined ? row.is_active : true,
            });

            // Ne pas retry pour erreurs de validation
            if (error) {
              if (['23505', '23503'].includes(error.code)) {
                throw error; // Erreur de validation, ne pas retry
              }
              throw error; // Autre erreur, retry possible
            }
          });
        } catch (error: unknown) {
          const code = getUnknownErrorCode(error);
          if (code === '23505') {
            return { success: false, error: `Le slug "${slug}" existe déjà dans cette boutique` };
          }
          if (code === '23503') {
            return { success: false, error: 'Catégorie invalide ou introuvable' };
          }
          return {
            success: false,
            error: getUnknownErrorMessage(error, 'Erreur lors de la création du produit'),
          };
        }
        break;
      }

      case 'customers': {
        const name = (row.name || row.nom || '').trim();
        const email = (row.email || '').trim().toLowerCase();

        if (!name || name.length < 2) {
          return { success: false, error: 'Le nom du client doit contenir au moins 2 caractères' };
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return { success: false, error: 'Email invalide' };
        }

        const { error: customerError } = await supabase.from('customers').insert({
          store_id: storeId,
          name,
          email,
          phone: row.phone || row.telephone || null,
        });

        if (customerError) {
          if (customerError.code === '23505') {
            return { success: false, error: `Un client avec l'email "${email}" existe déjà` };
          }
          return {
            success: false,
            error: customerError.message || 'Erreur lors de la création du client',
          };
        }
        break;
      }

      case 'orders':
        // Les commandes sont généralement créées via le système de paiement
        return {
          success: false,
          error:
            'Les commandes ne peuvent pas être importées directement. Utilisez le système de paiement.',
        };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = getUnknownErrorMessage(error);
    logger.error('Error in importRow', { error: errorMessage, type, row });
    return { success: false, error: errorMessage };
  }
}

/**
 * Convertir des données en CSV
 */
function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers
      .map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).replace(/"/g, '""');
      })
      .map(v => `"${v}"`)
      .join(',')
  );

  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
}

/**
 * Parser un CSV
 */
function parseCSV(csv: string): Record<string, unknown>[] {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}
