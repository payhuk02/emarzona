/**
 * Store form reducer — remplace ~60 useState par un useReducer centralisé.
 */

import type { Dispatch } from 'react';
import type {
  ExtendedStore,
  StoreFormSetters,
  StoreFormState,
  StoreThemeConfig,
} from '@/components/store/types/store-form';
import { initStoreFormState } from '@/lib/storefront/store-appearance-form-state';

export type { StoreFormState };

export type StoreFormField = keyof StoreFormState;

export type StoreFormAction =
  | { type: 'SET_FIELD'; field: StoreFormField; value: unknown }
  | { type: 'SET_FIELDS'; fields: Partial<StoreFormState> }
  | { type: 'SET_THEME'; config: StoreThemeConfig }
  | { type: 'RESET'; initialState: StoreFormState }
  | { type: 'RESET_SECTION'; section: string }
  | { type: 'INIT_FROM_STORE'; store: ExtendedStore };

export const createInitialState = (store: ExtendedStore): StoreFormState =>
  initStoreFormState(store);

export function themeConfigToFormFields(config: StoreThemeConfig): Partial<StoreFormState> {
  const fields: Partial<StoreFormState> = {};
  if (config.primary_color) fields.primaryColor = config.primary_color;
  if (config.secondary_color) fields.secondaryColor = config.secondary_color;
  if (config.accent_color) fields.accentColor = config.accent_color;
  if (config.background_color) fields.backgroundColor = config.background_color;
  if (config.text_color) fields.textColor = config.text_color;
  if (config.text_secondary_color) fields.textSecondaryColor = config.text_secondary_color;
  if (config.button_primary_color) fields.buttonPrimaryColor = config.button_primary_color;
  if (config.button_primary_text) fields.buttonPrimaryText = config.button_primary_text;
  if (config.button_secondary_color) fields.buttonSecondaryColor = config.button_secondary_color;
  if (config.button_secondary_text) fields.buttonSecondaryText = config.button_secondary_text;
  if (config.link_color) fields.linkColor = config.link_color;
  if (config.link_hover_color) fields.linkHoverColor = config.link_hover_color;
  if (config.border_radius) {
    fields.borderRadius = config.border_radius as StoreFormState['borderRadius'];
  }
  if (config.shadow_intensity) {
    fields.shadowIntensity = config.shadow_intensity as StoreFormState['shadowIntensity'];
  }
  if (config.heading_font) fields.headingFont = config.heading_font;
  if (config.body_font) fields.bodyFont = config.body_font;
  if (config.font_size_base) fields.fontSizeBase = config.font_size_base;
  if (config.heading_size_h1) fields.headingSizeH1 = config.heading_size_h1;
  if (config.heading_size_h2) fields.headingSizeH2 = config.heading_size_h2;
  if (config.heading_size_h3) fields.headingSizeH3 = config.heading_size_h3;
  if (config.line_height) fields.lineHeight = config.line_height;
  if (config.letter_spacing) fields.letterSpacing = config.letter_spacing;
  if (config.header_style) fields.headerStyle = config.header_style;
  if (config.footer_style) fields.footerStyle = config.footer_style;
  if (config.product_grid_columns) fields.productGridColumns = config.product_grid_columns;
  if (config.product_card_style) {
    fields.productCardStyle = config.product_card_style;
  }
  if (config.navigation_style) fields.navigationStyle = config.navigation_style;
  if (config.meta_title) fields.metaTitle = config.meta_title;
  if (config.meta_description) fields.metaDescription = config.meta_description;
  if (config.meta_keywords) fields.metaKeywords = config.meta_keywords;
  if (config.og_title) fields.ogTitle = config.og_title;
  if (config.og_description) fields.ogDescription = config.og_description;
  if (config.og_image) fields.ogImageUrl = config.og_image;
  return fields;
}

export function storeFormReducer(state: StoreFormState, action: StoreFormAction): StoreFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_FIELDS':
      return { ...state, ...action.fields };

    case 'SET_THEME':
      return { ...state, ...themeConfigToFormFields(action.config) };

    case 'RESET':
      return action.initialState;

    case 'RESET_SECTION': {
      const sectionDefaults: Record<string, Partial<StoreFormState>> = {
        colors: {
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
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          fontSizeBase: '16px',
          headingSizeH1: '2.5rem',
          headingSizeH2: '2rem',
          headingSizeH3: '1.5rem',
          lineHeight: '1.6',
          letterSpacing: 'normal',
        },
        layout: {
          borderRadius: 'md',
          shadowIntensity: 'md',
          headerStyle: 'standard',
          footerStyle: 'standard',
          sidebarEnabled: false,
          sidebarPosition: 'left',
          productGridColumns: 3,
          productCardStyle: 'standard',
          navigationStyle: 'horizontal',
        },
      };
      return { ...state, ...sectionDefaults[action.section] };
    }

    case 'INIT_FROM_STORE':
      return initStoreFormState(action.store);

    default:
      return state;
  }
}

export const storeFormActions = {
  setField: (field: StoreFormField, value: unknown): StoreFormAction => ({
    type: 'SET_FIELD',
    field,
    value,
  }),

  setFields: (fields: Partial<StoreFormState>): StoreFormAction => ({
    type: 'SET_FIELDS',
    fields,
  }),

  setTheme: (config: StoreThemeConfig): StoreFormAction => ({
    type: 'SET_THEME',
    config,
  }),

  reset: (initialState: StoreFormState): StoreFormAction => ({
    type: 'RESET',
    initialState,
  }),

  resetSection: (section: string): StoreFormAction => ({
    type: 'RESET_SECTION',
    section,
  }),

  initFromStore: (store: ExtendedStore): StoreFormAction => ({
    type: 'INIT_FROM_STORE',
    store,
  }),
};

/** Maps snake_case DB / handler field names to camelCase form keys. */
export const FIELD_MAPPINGS: Record<string, StoreFormField> = {
  name: 'name',
  description: 'description',
  about: 'about',
  logo_url: 'logoUrl',
  banner_url: 'bannerUrl',
  favicon_url: 'faviconUrl',
  apple_touch_icon_url: 'appleTouchIconUrl',
  watermark_url: 'watermarkUrl',
  placeholder_image_url: 'placeholderImageUrl',
  contact_email: 'contactEmail',
  contact_phone: 'contactPhone',
  support_email: 'supportEmail',
  sales_email: 'salesEmail',
  press_email: 'pressEmail',
  partnership_email: 'partnershipEmail',
  support_phone: 'supportPhone',
  sales_phone: 'salesPhone',
  whatsapp_number: 'whatsappNumber',
  telegram_username: 'telegramUsername',
  facebook_url: 'facebookUrl',
  instagram_url: 'instagramUrl',
  twitter_url: 'twitterUrl',
  linkedin_url: 'linkedinUrl',
  youtube_url: 'youtubeUrl',
  tiktok_url: 'tiktokUrl',
  pinterest_url: 'pinterestUrl',
  snapchat_url: 'snapchatUrl',
  discord_url: 'discordUrl',
  twitch_url: 'twitchUrl',
  primary_color: 'primaryColor',
  secondary_color: 'secondaryColor',
  accent_color: 'accentColor',
  background_color: 'backgroundColor',
  text_color: 'textColor',
  text_secondary_color: 'textSecondaryColor',
  button_primary_color: 'buttonPrimaryColor',
  button_primary_text: 'buttonPrimaryText',
  button_secondary_color: 'buttonSecondaryColor',
  button_secondary_text: 'buttonSecondaryText',
  link_color: 'linkColor',
  link_hover_color: 'linkHoverColor',
  border_radius: 'borderRadius',
  shadow_intensity: 'shadowIntensity',
  heading_font: 'headingFont',
  body_font: 'bodyFont',
  font_size_base: 'fontSizeBase',
  heading_size_h1: 'headingSizeH1',
  heading_size_h2: 'headingSizeH2',
  heading_size_h3: 'headingSizeH3',
  line_height: 'lineHeight',
  letter_spacing: 'letterSpacing',
  header_style: 'headerStyle',
  footer_style: 'footerStyle',
  sidebar_enabled: 'sidebarEnabled',
  sidebar_position: 'sidebarPosition',
  product_grid_columns: 'productGridColumns',
  product_card_style: 'productCardStyle',
  navigation_style: 'navigationStyle',
  meta_title: 'metaTitle',
  meta_description: 'metaDescription',
  meta_keywords: 'metaKeywords',
  og_title: 'ogTitle',
  og_description: 'ogDescription',
  og_image_url: 'ogImageUrl',
  address_line1: 'addressLine1',
  address_line2: 'addressLine2',
  city: 'city',
  country: 'country',
  latitude: 'latitude',
  longitude: 'longitude',
  timezone: 'timezone',
  opening_hours: 'openingHours',
  legal_pages: 'legalPages',
  marketing_content: 'marketingContent',
  state_province: 'stateProvince',
  postal_code: 'postalCode',
  google_analytics_id: 'googleAnalyticsId',
  google_analytics_enabled: 'googleAnalyticsEnabled',
  facebook_pixel_id: 'facebookPixelId',
  facebook_pixel_enabled: 'facebookPixelEnabled',
  google_tag_manager_id: 'googleTagManagerId',
  google_tag_manager_enabled: 'googleTagManagerEnabled',
  tiktok_pixel_id: 'tiktokPixelId',
  tiktok_pixel_enabled: 'tiktokPixelEnabled',
  custom_tracking_scripts: 'customTrackingScripts',
  custom_scripts_enabled: 'customScriptsEnabled',
  info_message: 'infoMessage',
  info_message_color: 'infoMessageColor',
  info_message_font: 'infoMessageFont',
};

const ALL_STORE_FORM_FIELDS: StoreFormField[] = [
  'name',
  'description',
  'logoUrl',
  'bannerUrl',
  'faviconUrl',
  'appleTouchIconUrl',
  'watermarkUrl',
  'placeholderImageUrl',
  'about',
  'contactEmail',
  'contactPhone',
  'facebookUrl',
  'instagramUrl',
  'twitterUrl',
  'linkedinUrl',
  'youtubeUrl',
  'tiktokUrl',
  'pinterestUrl',
  'snapchatUrl',
  'discordUrl',
  'twitchUrl',
  'supportEmail',
  'salesEmail',
  'pressEmail',
  'partnershipEmail',
  'supportPhone',
  'salesPhone',
  'whatsappNumber',
  'telegramUsername',
  'infoMessage',
  'infoMessageColor',
  'infoMessageFont',
  'primaryColor',
  'secondaryColor',
  'accentColor',
  'backgroundColor',
  'textColor',
  'textSecondaryColor',
  'buttonPrimaryColor',
  'buttonPrimaryText',
  'buttonSecondaryColor',
  'buttonSecondaryText',
  'linkColor',
  'linkHoverColor',
  'borderRadius',
  'shadowIntensity',
  'headingFont',
  'bodyFont',
  'fontSizeBase',
  'headingSizeH1',
  'headingSizeH2',
  'headingSizeH3',
  'lineHeight',
  'letterSpacing',
  'headerStyle',
  'footerStyle',
  'sidebarEnabled',
  'sidebarPosition',
  'productGridColumns',
  'productCardStyle',
  'navigationStyle',
  'metaTitle',
  'metaDescription',
  'metaKeywords',
  'ogTitle',
  'ogDescription',
  'ogImageUrl',
  'addressLine1',
  'addressLine2',
  'city',
  'stateProvince',
  'postalCode',
  'country',
  'latitude',
  'longitude',
  'timezone',
  'openingHours',
  'legalPages',
  'marketingContent',
  'googleAnalyticsId',
  'googleAnalyticsEnabled',
  'facebookPixelId',
  'facebookPixelEnabled',
  'googleTagManagerId',
  'googleTagManagerEnabled',
  'tiktokPixelId',
  'tiktokPixelEnabled',
  'customTrackingScripts',
  'customScriptsEnabled',
];

/** Setters compatibles avec l'API useState existante (StoreDetails, tabs). */
export function createStoreFormSetters(dispatch: Dispatch<StoreFormAction>): StoreFormSetters {
  const setters = {} as StoreFormSetters;

  for (const field of ALL_STORE_FORM_FIELDS) {
    const setterName =
      `set${field.charAt(0).toUpperCase()}${field.slice(1)}` as keyof StoreFormSetters;
    (setters as Record<string, (value: unknown) => void>)[setterName] = (value: unknown) => {
      dispatch(storeFormActions.setField(field, value));
    };
  }

  return setters;
}
