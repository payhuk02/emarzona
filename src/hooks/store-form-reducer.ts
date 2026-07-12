/**
 * Store Form Reducer
 * Refactored state management using useReducer pattern
 * Replaces 60+ individual useState hooks with a single reducer
 * 
 * Benefits:
 * - Reduced re-renders (only affected fields trigger updates)
 * - Centralized state logic
 * - Easier to debug and test
 * - Better performance for large forms
 */

import type { StoreThemeConfig } from '@/components/store/types/store-form';
import type { Store } from '@/hooks/useStores';

// ============================================================================
// TYPES
// ============================================================================

export interface StoreFormState {
  // Basic Info
  name: string;
  slug: string;
  description: string;
  about: string;
  defaultCurrency: string;

  // Images
  logoUrl: string | null;
  bannerUrl: string | null;
  faviconUrl: string | null;
  appleTouchIconUrl: string | null;
  watermarkUrl: string | null;
  placeholderImageUrl: string | null;

  // Contact
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  salesEmail: string;
  pressEmail: string;
  partnershipEmail: string;
  supportPhone: string;
  salesPhone: string;
  whatsappNumber: string;
  telegramUsername: string;

  // Social Media
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  pinterestUrl: string;
  snapchatUrl: string;
  discordUrl: string;
  twitchUrl: string;

  // Colors
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

  // Typography
  headingFont: string;
  bodyFont: string;
  fontSizeBase: string;
  headingSizeH1: string;
  headingSizeH2: string;
  headingSizeH3: string;
  lineHeight: string;
  letterSpacing: string;

  // Layout
  borderRadius: string | null;
  shadowIntensity: string | null;
  headerStyle: string | null;
  footerStyle: string | null;
  sidebarEnabled: boolean | null;
  sidebarPosition: string | null;
  productGridColumns: number | null;
  productCardStyle: string | null;
  navigationStyle: string | null;

  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;

  // Location
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  openingHours: string;

  // Legal
  legalPages: Record<string, string> | null;

  // Marketing
  marketingContent: string;

  // Analytics
  googleAnalyticsId: string;
  googleAnalyticsEnabled: boolean;
  facebookPixelId: string;
  facebookPixelEnabled: boolean;
  googleTagManagerId: string;
  googleTagManagerEnabled: boolean;
  tiktokPixelId: string;
  tiktokPixelEnabled: boolean;
  customTrackingScripts: string;
  customScriptsEnabled: boolean;

  // Info Message
  infoMessage: string;
  infoMessageColor: string;
  infoMessageFont: string;

  // Commerce Type
  commerceType: string;
}

export type StoreFormField = keyof StoreFormState;

export type StoreFormAction =
  | { type: 'SET_FIELD'; field: StoreFormField; value: unknown }
  | { type: 'SET_FIELDS'; fields: Partial<StoreFormState> }
  | { type: 'SET_THEME'; config: StoreThemeConfig }
  | { type: 'RESET'; initialState: StoreFormState }
  | { type: 'RESET_SECTION'; section: string }
  | { type: 'INIT_FROM_STORE'; store: Store };

// ============================================================================
// INITIAL STATE
// ============================================================================

export const createInitialState = (store?: Store): StoreFormState => ({
  // Basic Info
  name: store?.name || '',
  slug: store?.slug || '',
  description: store?.description || '',
  about: store?.about || '',
  defaultCurrency: store?.default_currency || 'XOF',

  // Images
  logoUrl: store?.logo_url || null,
  bannerUrl: store?.banner_url || null,
  faviconUrl: store?.favicon_url || null,
  appleTouchIconUrl: store?.apple_touch_icon_url || null,
  watermarkUrl: store?.watermark_url || null,
  placeholderImageUrl: store?.placeholder_image_url || null,

  // Contact
  contactEmail: store?.contact_email || '',
  contactPhone: store?.contact_phone || '',
  supportEmail: store?.support_email || '',
  salesEmail: store?.sales_email || '',
  pressEmail: store?.press_email || '',
  partnershipEmail: store?.partnership_email || '',
  supportPhone: store?.support_phone || '',
  salesPhone: store?.sales_phone || '',
  whatsappNumber: store?.whatsapp_number || '',
  telegramUsername: store?.telegram_username || '',

  // Social Media
  facebookUrl: store?.facebook_url || '',
  instagramUrl: store?.instagram_url || '',
  twitterUrl: store?.twitter_url || '',
  linkedinUrl: store?.linkedin_url || '',
  youtubeUrl: store?.youtube_url || '',
  tiktokUrl: store?.tiktok_url || '',
  pinterestUrl: store?.pinterest_url || '',
  snapchatUrl: store?.snapchat_url || '',
  discordUrl: store?.discord_url || '',
  twitchUrl: store?.twitch_url || '',

  // Colors
  primaryColor: store?.primary_color || '#3b82f6',
  secondaryColor: store?.secondary_color || '#10b981',
  accentColor: store?.accent_color || '#f59e0b',
  backgroundColor: store?.background_color || '#ffffff',
  textColor: store?.text_color || '#1f2937',
  textSecondaryColor: store?.text_secondary_color || '#6b7280',
  buttonPrimaryColor: store?.button_primary_color || '#3b82f6',
  buttonPrimaryText: store?.button_primary_text || '#ffffff',
  buttonSecondaryColor: store?.button_secondary_color || '#6b7280',
  buttonSecondaryText: store?.button_secondary_text || '#ffffff',
  linkColor: store?.link_color || '#3b82f6',
  linkHoverColor: store?.link_hover_color || '#2563eb',

  // Typography
  headingFont: store?.heading_font || 'Inter',
  bodyFont: store?.body_font || 'Inter',
  fontSizeBase: store?.font_size_base || '16',
  headingSizeH1: store?.heading_size_h1 || '48',
  headingSizeH2: store?.heading_size_h2 || '36',
  headingSizeH3: store?.heading_size_h3 || '24',
  lineHeight: store?.line_height || '1.5',
  letterSpacing: store?.letter_spacing || '0',

  // Layout
  borderRadius: store?.border_radius || 'md',
  shadowIntensity: store?.shadow_intensity || 'md',
  headerStyle: store?.header_style || 'standard',
  footerStyle: store?.footer_style || 'standard',
  sidebarEnabled: store?.sidebar_enabled ?? false,
  sidebarPosition: store?.sidebar_position || 'left',
  productGridColumns: store?.product_grid_columns || 3,
  productCardStyle: store?.product_card_style || 'standard',
  navigationStyle: store?.navigation_style || 'horizontal',

  // SEO
  metaTitle: store?.meta_title || '',
  metaDescription: store?.meta_description || '',
  metaKeywords: store?.meta_keywords || '',
  ogTitle: store?.og_title || '',
  ogDescription: store?.og_description || '',
  ogImage: store?.og_image || '',

  // Location
  addressLine1: store?.address_line1 || '',
  addressLine2: store?.address_line2 || '',
  city: store?.city || '',
  stateProvince: store?.state_province || '',
  postalCode: store?.postal_code || '',
  country: store?.country || '',
  latitude: store?.latitude || null,
  longitude: store?.longitude || null,
  timezone: store?.timezone || '',
  openingHours: store?.opening_hours || '',

  // Legal
  legalPages: store?.legal_pages || null,

  // Marketing
  marketingContent: store?.marketing_content || '',

  // Analytics
  googleAnalyticsId: store?.google_analytics_id || '',
  googleAnalyticsEnabled: store?.google_analytics_enabled || false,
  facebookPixelId: store?.facebook_pixel_id || '',
  facebookPixelEnabled: store?.facebook_pixel_enabled || false,
  googleTagManagerId: store?.google_tag_manager_id || '',
  googleTagManagerEnabled: store?.google_tag_manager_enabled || false,
  tiktokPixelId: store?.tiktok_pixel_id || '',
  tiktokPixelEnabled: store?.tiktok_pixel_enabled || false,
  customTrackingScripts: store?.custom_tracking_scripts || '',
  customScriptsEnabled: store?.custom_scripts_enabled || false,

  // Info Message
  infoMessage: store?.info_message || '',
  infoMessageColor: store?.info_message_color || '#3b82f6',
  infoMessageFont: store?.info_message_font || 'Inter',

  // Commerce Type
  commerceType: store?.commerce_type || 'physical',
});

// ============================================================================
// REDUCER
// ============================================================================

export function storeFormReducer(state: StoreFormState, action: StoreFormAction): StoreFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
      };

    case 'SET_FIELDS':
      return {
        ...state,
        ...action.fields,
      };

    case 'SET_THEME':
      return {
        ...state,
        ...action.config,
      };

    case 'RESET':
      return action.initialState;

    case 'RESET_SECTION': {
      // Reset specific sections based on section name
      const sectionDefaults: Record<string, Partial<StoreFormState>> = {
        colors: {
          primaryColor: '#3b82f6',
          secondaryColor: '#10b981',
          accentColor: '#f59e0b',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          textSecondaryColor: '#6b7280',
          buttonPrimaryColor: '#3b82f6',
          buttonPrimaryText: '#ffffff',
          buttonSecondaryColor: '#6b7280',
          buttonSecondaryText: '#ffffff',
          linkColor: '#3b82f6',
          linkHoverColor: '#2563eb',
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          fontSizeBase: '16',
          headingSizeH1: '48',
          headingSizeH2: '36',
          headingSizeH3: '24',
          lineHeight: '1.5',
          letterSpacing: '0',
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

      return {
        ...state,
        ...sectionDefaults[action.section],
      };
    }

    case 'INIT_FROM_STORE':
      return createInitialState(action.store);

    default:
      return state;
  }
}

// ============================================================================
// ACTION CREATORS
// ============================================================================

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

  initFromStore: (store: any): StoreFormAction => ({
    type: 'INIT_FROM_STORE',
    store,
  }),
};

// ============================================================================
// FIELD MAPPINGS (for backward compatibility)
// ============================================================================

// Maps old field names to new camelCase field names
export const FIELD_MAPPINGS: Record<string, StoreFormField> = {
  // Basic Info
  'name': 'name',
  'slug': 'slug',
  'description': 'description',
  'about': 'about',
  'default_currency': 'defaultCurrency',

  // Images
  'logo_url': 'logoUrl',
  'banner_url': 'bannerUrl',
  'favicon_url': 'faviconUrl',
  'apple_touch_icon_url': 'appleTouchIconUrl',
  'watermark_url': 'watermarkUrl',
  'placeholder_image_url': 'placeholderImageUrl',

  // Contact
  'contact_email': 'contactEmail',
  'contact_phone': 'contactPhone',
  'support_email': 'supportEmail',
  'sales_email': 'salesEmail',
  'press_email': 'pressEmail',
  'partnership_email': 'partnershipEmail',
  'support_phone': 'supportPhone',
  'sales_phone': 'salesPhone',
  'whatsapp_number': 'whatsappNumber',
  'telegram_username': 'telegramUsername',

  // Social Media
  'facebook_url': 'facebookUrl',
  'instagram_url': 'instagramUrl',
  'twitter_url': 'twitterUrl',
  'linkedin_url': 'linkedinUrl',
  'youtube_url': 'youtubeUrl',
  'tiktok_url': 'tiktokUrl',
  'pinterest_url': 'pinterestUrl',
  'snapchat_url': 'snapchatUrl',
  'discord_url': 'discordUrl',
  'twitch_url': 'twitchUrl',

  // Colors
  'primary_color': 'primaryColor',
  'secondary_color': 'secondaryColor',
  'accent_color': 'accentColor',
  'background_color': 'backgroundColor',
  'text_color': 'textColor',
  'text_secondary_color': 'textSecondaryColor',
  'button_primary_color': 'buttonPrimaryColor',
  'button_primary_text': 'buttonPrimaryText',
  'button_secondary_color': 'buttonSecondaryColor',
  'button_secondary_text': 'buttonSecondaryText',
  'link_color': 'linkColor',
  'link_hover_color': 'linkHoverColor',

  // Typography
  'heading_font': 'headingFont',
  'body_font': 'bodyFont',
  'font_size_base': 'fontSizeBase',
  'heading_size_h1': 'headingSizeH1',
  'heading_size_h2': 'headingSizeH2',
  'heading_size_h3': 'headingSizeH3',
  'line_height': 'lineHeight',
  'letter_spacing': 'letterSpacing',

  // Layout
  'border_radius': 'borderRadius',
  'shadow_intensity': 'shadowIntensity',
  'header_style': 'headerStyle',
  'footer_style': 'footerStyle',
  'sidebar_enabled': 'sidebarEnabled',
  'sidebar_position': 'sidebarPosition',
  'product_grid_columns': 'productGridColumns',
  'product_card_style': 'productCardStyle',
  'navigation_style': 'navigationStyle',

  // SEO
  'meta_title': 'metaTitle',
  'meta_description': 'metaDescription',
  'meta_keywords': 'metaKeywords',
  'og_title': 'ogTitle',
  'og_description': 'ogDescription',
  'og_image': 'ogImage',

  // Location
  'address_line1': 'addressLine1',
  'address_line2': 'addressLine2',
  'state_province': 'stateProvince',
  'postal_code': 'postalCode',
  'opening_hours': 'openingHours',

  // Analytics
  'google_analytics_id': 'googleAnalyticsId',
  'google_analytics_enabled': 'googleAnalyticsEnabled',
  'facebook_pixel_id': 'facebookPixelId',
  'facebook_pixel_enabled': 'facebookPixelEnabled',
  'google_tag_manager_id': 'googleTagManagerId',
  'google_tag_manager_enabled': 'googleTagManagerEnabled',
  'tiktok_pixel_id': 'tiktokPixelId',
  'tiktok_pixel_enabled': 'tiktokPixelEnabled',
  'custom_tracking_scripts': 'customTrackingScripts',
  'custom_scripts_enabled': 'customScriptsEnabled',

  // Info Message
  'info_message': 'infoMessage',
  'info_message_color': 'infoMessageColor',
  'info_message_font': 'infoMessageFont',

  // Commerce Type
  'commerce_type': 'commerceType',
};
