/**
 * Store Configuration Export/Import
 * Utilitaires pour exporter et importer les configurations de boutique
 */

import type { Store } from '@/hooks/useStores';

export interface StoreConfigExport {
  version: string;
  exportDate: string;
  store: {
    // Informations de base
    name: string;
    description: string | null;
    about: string | null;
    // Images
    logo_url: string | null;
    banner_url: string | null;
    favicon_url: string | null;
    apple_touch_icon_url: string | null;
    watermark_url: string | null;
    placeholder_image_url: string | null;
    // Thème
    primary_color: string | null;
    secondary_color: string | null;
    accent_color: string | null;
    background_color: string | null;
    text_color: string | null;
    text_secondary_color: string | null;
    button_primary_color: string | null;
    button_primary_text: string | null;
    button_secondary_color: string | null;
    button_secondary_text: string | null;
    link_color: string | null;
    link_hover_color: string | null;
    border_radius: string | null;
    shadow_intensity: string | null;
    // Typographie
    heading_font: string | null;
    body_font: string | null;
    font_size_base: string | null;
    heading_size_h1: string | null;
    heading_size_h2: string | null;
    heading_size_h3: string | null;
    line_height: string | null;
    letter_spacing: string | null;
    // Layout
    header_style: string | null;
    footer_style: string | null;
    sidebar_enabled: boolean | null;
    sidebar_position: string | null;
    product_grid_columns: number | null;
    product_card_style: string | null;
    navigation_style: string | null;
    // SEO
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image: string | null;
    // Messages
    info_message: string | null;
    info_message_color: string | null;
    info_message_font: string | null;
    // Contenu marketing
    marketing_content: Record<string, unknown> | null;
    // Pages légales
    legal_pages: Record<string, unknown> | null;
  };
}

const CURRENT_VERSION = '1.0.0';

/**
 * Exporte la configuration d'une boutique vers un fichier JSON
 */
export function exportStoreConfig(store: Store): StoreConfigExport {
  return {
    version: CURRENT_VERSION,
    exportDate: new Date().toISOString(),
    store: {
      name: store.name,
      description: store.description,
      about: store.about || null,
      logo_url: store.logo_url || null,
      banner_url: store.banner_url || null,
      favicon_url: store.favicon_url || null,
      apple_touch_icon_url: store.apple_touch_icon_url || null,
      watermark_url: store.watermark_url || null,
      placeholder_image_url: store.placeholder_image_url || null,
      primary_color: store.primary_color || null,
      secondary_color: store.secondary_color || null,
      accent_color: store.accent_color || null,
      background_color: store.background_color || null,
      text_color: store.text_color || null,
      text_secondary_color: store.text_secondary_color || null,
      button_primary_color: store.button_primary_color || null,
      button_primary_text: store.button_primary_text || null,
      button_secondary_color: store.button_secondary_color || null,
      button_secondary_text: store.button_secondary_text || null,
      link_color: store.link_color || null,
      link_hover_color: store.link_hover_color || null,
      border_radius: store.border_radius || null,
      shadow_intensity: store.shadow_intensity || null,
      heading_font: store.heading_font || null,
      body_font: store.body_font || null,
      font_size_base: store.font_size_base || null,
      heading_size_h1: store.heading_size_h1 || null,
      heading_size_h2: store.heading_size_h2 || null,
      heading_size_h3: store.heading_size_h3 || null,
      line_height: store.line_height || null,
      letter_spacing: store.letter_spacing || null,
      header_style: store.header_style || null,
      footer_style: store.footer_style || null,
      sidebar_enabled: store.sidebar_enabled || null,
      sidebar_position: store.sidebar_position || null,
      product_grid_columns: store.product_grid_columns || null,
      product_card_style: store.product_card_style || null,
      navigation_style: store.navigation_style || null,
      meta_title: store.meta_title || null,
      meta_description: store.meta_description || null,
      meta_keywords: store.meta_keywords || null,
      og_title: store.og_title || null,
      og_description: store.og_description || null,
      og_image: store.og_image || null,
      info_message: 'info_message' in store && typeof store.info_message === 'string' ? store.info_message : null,
      info_message_color: 'info_message_color' in store && typeof store.info_message_color === 'string' ? store.info_message_color : null,
      info_message_font: 'info_message_font' in store && typeof store.info_message_font === 'string' ? store.info_message_font : null,
      marketing_content: store.marketing_content || null,
      legal_pages: store.legal_pages || null,
    },
  };
}

/**
 * Télécharge la configuration exportée
 */
export function downloadStoreConfig(store: Store, filename?: string): void {
  const config = exportStoreConfig(store);
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `store-config-${store.slug}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Valide un fichier de configuration importé
 */
export function validateStoreConfig(data: unknown): { valid: boolean; error?: string; config?: StoreConfigExport } {
  try {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Format de fichier invalide' };
    }

    const config = data as StoreConfigExport;

    if (!config.version) {
      return { valid: false, error: 'Version manquante dans le fichier' };
    }

    if (!config.store) {
      return { valid: false, error: 'Données de boutique manquantes' };
    }

    if (!config.store.name) {
      return { valid: false, error: 'Nom de boutique manquant' };
    }

    return { valid: true, config };
  } catch (error) {
    return { valid: false, error: `Erreur de validation: ${error instanceof Error ? error.message : 'Erreur inconnue'}` };
  }
}

/**
 * Importe une configuration depuis un fichier
 */
export async function importStoreConfig(file: File): Promise<{ success: boolean; config?: StoreConfigExport; error?: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const validation = validateStoreConfig(data);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    return { success: true, config: validation.config };
  } catch (error) {
    return {
      success: false,
      error: `Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * Applique une configuration importée à un objet de mise à jour
 */
export function applyImportedConfig(config: StoreConfigExport): Partial<Store> {
  return {
    ...config.store,
  };
}








