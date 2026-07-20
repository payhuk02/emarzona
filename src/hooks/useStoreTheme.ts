/**
 * Hook pour charger et préparer les données de personnalisation de la boutique
 * Fournit les valeurs de thème, couleurs, typographie et layout
 */

import { useMemo } from 'react';
import type { Store } from '@/hooks/useStores';
import {
  sanitizeCssSize,
  sanitizeHexColor,
  sanitizeStoreFont,
} from '@/lib/storefront/css-sanitize';

export interface StoreTheme {
  // Couleurs
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  textSecondaryColor: string;
  buttonPrimaryColor: string;
  buttonPrimaryText: string;
  buttonSecondaryColor: string;
  buttonSecondaryText: string;
  linkColor: string;
  linkHoverColor: string;

  // Style
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadowIntensity: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  // Typographie
  headingFont: string;
  bodyFont: string;
  fontSizeBase: string;
  headingSizeH1: string;
  headingSizeH2: string;
  headingSizeH3: string;
  lineHeight: string;
  letterSpacing: string;

  // Layout
  headerStyle: 'minimal' | 'standard' | 'extended';
  footerStyle: 'minimal' | 'standard' | 'extended';
  sidebarEnabled: boolean;
  sidebarPosition: 'left' | 'right';
  productGridColumns: number;
  productCardStyle: 'minimal' | 'standard' | 'detailed';
  navigationStyle: 'horizontal' | 'vertical' | 'mega';
}

const DEFAULT_THEME: StoreTheme = {
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  textSecondaryColor: '#6b7280',
  buttonPrimaryColor: '#3b82f6',
  buttonPrimaryText: '#ffffff',
  buttonSecondaryColor: '#e5e7eb',
  buttonSecondaryText: '#1f2937',
  linkColor: '#3b82f6',
  linkHoverColor: '#2563eb',
  borderRadius: 'md',
  shadowIntensity: 'md',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  fontSizeBase: '16px',
  headingSizeH1: '2.5rem',
  headingSizeH2: '2rem',
  headingSizeH3: '1.5rem',
  lineHeight: '1.6',
  letterSpacing: 'normal',
  headerStyle: 'standard',
  footerStyle: 'standard',
  sidebarEnabled: false,
  sidebarPosition: 'left',
  productGridColumns: 3,
  productCardStyle: 'standard',
  navigationStyle: 'horizontal',
};

export const useStoreTheme = (store: Store | null): StoreTheme => {
  return useMemo(() => {
    if (!store) {
      return DEFAULT_THEME;
    }

    return {
      primaryColor: sanitizeHexColor(store.primary_color, DEFAULT_THEME.primaryColor),
      secondaryColor: sanitizeHexColor(store.secondary_color, DEFAULT_THEME.secondaryColor),
      accentColor: sanitizeHexColor(store.accent_color, DEFAULT_THEME.accentColor),
      backgroundColor: sanitizeHexColor(store.background_color, DEFAULT_THEME.backgroundColor),
      textColor: sanitizeHexColor(store.text_color, DEFAULT_THEME.textColor),
      textSecondaryColor: sanitizeHexColor(
        store.text_secondary_color,
        DEFAULT_THEME.textSecondaryColor
      ),
      buttonPrimaryColor: sanitizeHexColor(
        store.button_primary_color,
        DEFAULT_THEME.buttonPrimaryColor
      ),
      buttonPrimaryText: sanitizeHexColor(
        store.button_primary_text,
        DEFAULT_THEME.buttonPrimaryText
      ),
      buttonSecondaryColor: sanitizeHexColor(
        store.button_secondary_color,
        DEFAULT_THEME.buttonSecondaryColor
      ),
      buttonSecondaryText: sanitizeHexColor(
        store.button_secondary_text,
        DEFAULT_THEME.buttonSecondaryText
      ),
      linkColor: sanitizeHexColor(store.link_color, DEFAULT_THEME.linkColor),
      linkHoverColor: sanitizeHexColor(store.link_hover_color, DEFAULT_THEME.linkHoverColor),
      borderRadius: store.border_radius || DEFAULT_THEME.borderRadius,
      shadowIntensity: store.shadow_intensity || DEFAULT_THEME.shadowIntensity,
      headingFont: sanitizeStoreFont(store.heading_font, DEFAULT_THEME.headingFont),
      bodyFont: sanitizeStoreFont(store.body_font, DEFAULT_THEME.bodyFont),
      fontSizeBase: sanitizeCssSize(store.font_size_base, DEFAULT_THEME.fontSizeBase),
      headingSizeH1: sanitizeCssSize(store.heading_size_h1, DEFAULT_THEME.headingSizeH1),
      headingSizeH2: sanitizeCssSize(store.heading_size_h2, DEFAULT_THEME.headingSizeH2),
      headingSizeH3: sanitizeCssSize(store.heading_size_h3, DEFAULT_THEME.headingSizeH3),
      lineHeight: sanitizeCssSize(store.line_height, DEFAULT_THEME.lineHeight),
      letterSpacing: sanitizeCssSize(store.letter_spacing, DEFAULT_THEME.letterSpacing),
      headerStyle: store.header_style || DEFAULT_THEME.headerStyle,
      footerStyle: store.footer_style || DEFAULT_THEME.footerStyle,
      sidebarEnabled: store.sidebar_enabled ?? DEFAULT_THEME.sidebarEnabled,
      sidebarPosition: store.sidebar_position || DEFAULT_THEME.sidebarPosition,
      productGridColumns: store.product_grid_columns || DEFAULT_THEME.productGridColumns,
      productCardStyle: store.product_card_style || DEFAULT_THEME.productCardStyle,
      navigationStyle: store.navigation_style || DEFAULT_THEME.navigationStyle,
    };
  }, [store]);
};

/**
 * Convertit la valeur de borderRadius en valeur CSS
 */
export const getBorderRadiusValue = (borderRadius: StoreTheme['borderRadius']): string => {
  const map: Record<StoreTheme['borderRadius'], string> = {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  };
  return map[borderRadius];
};

/**
 * Convertit la valeur de shadowIntensity en valeur CSS
 */
export const getShadowValue = (shadowIntensity: StoreTheme['shadowIntensity']): string => {
  const map: Record<StoreTheme['shadowIntensity'], string> = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  };
  return map[shadowIntensity];
};
