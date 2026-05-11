/**
 * Export Promotions Utilities
 * Date: 30 Janvier 2025
 * 
 * Utilitaires pour exporter les promotions en CSV
 */

import { Promotion } from '@/hooks/usePromotions';
import { ProductPromotion } from '@/hooks/physical/usePromotions';

export interface ExportOptions {
  format: 'csv' | 'json';
  includeHeaders?: boolean;
  dateFormat?: 'iso' | 'french';
}

/**
 * Convertit une promotion en ligne CSV
 */
const promotionToCSVRow = (promotion: Promotion | ProductPromotion, dateFormat: 'iso' | 'french' = 'french'): string => {
  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    if (dateFormat === 'french') {
      return d.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return d.toISOString();
  };

  const code = 'code' in promotion ? promotion.code : (promotion as ProductPromotion).code || '';
  const description = 'description' in promotion ? promotion.description : (promotion as ProductPromotion).description || '';
  const discountType = 'discount_type' in promotion ? promotion.discount_type : (promotion as ProductPromotion).discount_type;
  const discountValue = 'discount_value' in promotion ? promotion.discount_value : (promotion as ProductPromotion).discount_value;
  const isActive = 'is_active' in promotion ? promotion.is_active : (promotion as ProductPromotion).is_active;
  const startDate = 'start_date' in promotion ? promotion.start_date : (promotion as ProductPromotion).starts_at;
  const endDate = 'end_date' in promotion ? promotion.end_date : (promotion as ProductPromotion).ends_at;
  const usedCount = 'used_count' in promotion ? promotion.used_count : (promotion as ProductPromotion).current_uses || 0;
  const maxUses = 'max_uses' in promotion ? promotion.max_uses : (promotion as ProductPromotion).max_uses;

  return [
    code,
    `"${description.replace(/"/g, '""')}"`, // Échapper les guillemets
    discountType,
    discountValue,
    isActive ? 'Oui' : 'Non',
    formatDate(startDate),
    formatDate(endDate),
    usedCount,
    maxUses || 'Illimité',
  ].join(',');
};

/**
 * Exporte les promotions en CSV
 */
export const exportPromotionsToCSV = (
  promotions: (Promotion | ProductPromotion)[],
  options: ExportOptions = { format: 'csv', includeHeaders: true, dateFormat: 'french' }
): string => {
  const headers = [
    'Code',
    'Description',
    'Type de réduction',
    'Valeur',
    'Active',
    'Date de début',
    'Date de fin',
    'Utilisations',
    'Utilisations max',
  ];

  const  rows: string[] = [];

  // Ajouter les en-têtes si demandé
  if (options.includeHeaders) {
    rows.push(headers.join(','));
  }

  // Ajouter les données
  promotions.forEach(promotion => {
    rows.push(promotionToCSVRow(promotion, options.dateFormat));
  });

  return rows.join('\n');
};

/**
 * Exporte les promotions en JSON
 */
export const exportPromotionsToJSON = (
  promotions: (Promotion | ProductPromotion)[]
): string => {
  return JSON.stringify(promotions, null, 2);
};

/**
 * Télécharge un fichier
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/csv') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporte et télécharge les promotions
 */
export const exportAndDownloadPromotions = (
  promotions: (Promotion | ProductPromotion)[],
  options: ExportOptions = { format: 'csv', includeHeaders: true, dateFormat: 'french' }
) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `promotions_${timestamp}.${options.format}`;

  let  content: string;
  let  mimeType: string;

  if (options.format === 'csv') {
    content = exportPromotionsToCSV(promotions, options);
    mimeType = 'text/csv;charset=utf-8;';
  } else {
    content = exportPromotionsToJSON(promotions);
    mimeType = 'application/json';
  }

  // Ajouter BOM pour Excel (UTF-8)
  if (options.format === 'csv') {
    content = '\uFEFF' + content;
  }

  downloadFile(content, filename, mimeType);
};







