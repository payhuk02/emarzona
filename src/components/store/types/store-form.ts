import type { Store, StoreOpeningHours, StoreLegalPages, StoreMarketingContent } from '@/hooks/useStores';

export interface ExtendedStore extends Omit<
  Store,
  | 'custom_domain'
  | 'domain_status'
  | 'domain_verification_token'
  | 'domain_verified_at'
  | 'domain_error_message'
  | 'ssl_enabled'
  | 'redirect_www'
  | 'redirect_https'
  | 'dns_records'
> {
  is_active: boolean;
  about?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
  info_message?: string | null;
  info_message_color?: string | null;
  info_message_font?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  text_secondary_color?: string | null;
  button_primary_color?: string | null;
  button_primary_text?: string | null;
  button_secondary_color?: string | null;
  button_secondary_text?: string | null;
  link_color?: string | null;
  link_hover_color?: string | null;
  border_radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | null;
  shadow_intensity?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | null;
  heading_font?: string | null;
  body_font?: string | null;
  font_size_base?: string | null;
  heading_size_h1?: string | null;
  heading_size_h2?: string | null;
  heading_size_h3?: string | null;
  line_height?: string | null;
  letter_spacing?: string | null;
  header_style?: 'minimal' | 'standard' | 'extended' | null;
  footer_style?: 'minimal' | 'standard' | 'extended' | null;
  sidebar_enabled?: boolean | null;
  sidebar_position?: 'left' | 'right' | null;
  product_grid_columns?: number | null;
  product_card_style?: 'minimal' | 'standard' | 'detailed' | null;
  navigation_style?: 'horizontal' | 'vertical' | 'mega' | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  opening_hours?: StoreOpeningHours | null;
  legal_pages?: StoreLegalPages | null;
  marketing_content?: StoreMarketingContent | null;
  custom_domain?: string | null | undefined;
  domain_status?: 'not_configured' | 'pending' | 'verified' | 'error' | null | undefined;
  domain_verification_token?: string | null | undefined;
  domain_verified_at?: string | null | undefined;
  domain_error_message?: string | null | undefined;
  ssl_enabled?: boolean | null | undefined;
  redirect_www?: boolean | null | undefined;
  redirect_https?: boolean | null | undefined;
  dns_records?: Array<Record<string, unknown>> | null | undefined;
  favicon_url?: string | null;
  apple_touch_icon_url?: string | null;
  watermark_url?: string | null;
  placeholder_image_url?: string | null;
  support_email?: string | null;
  sales_email?: string | null;
  press_email?: string | null;
  partnership_email?: string | null;
  support_phone?: string | null;
  sales_phone?: string | null;
  whatsapp_number?: string | null;
  telegram_username?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  pinterest_url?: string | null;
  snapchat_url?: string | null;
  discord_url?: string | null;
  twitch_url?: string | null;
  google_analytics_id?: string | null;
  google_analytics_enabled?: boolean;
  facebook_pixel_id?: string | null;
  facebook_pixel_enabled?: boolean;
  google_tag_manager_id?: string | null;
  google_tag_manager_enabled?: boolean;
  tiktok_pixel_id?: string | null;
  tiktok_pixel_enabled?: boolean;
  custom_tracking_scripts?: string | null;
  custom_scripts_enabled?: boolean;
}

export interface StoreFormState {
  // Basic info
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  faviconUrl: string;
  appleTouchIconUrl: string;
  watermarkUrl: string;
  placeholderImageUrl: string;
  about: string;
  contactEmail: string;
  contactPhone: string;
  // Social media
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
  // Additional contacts
  supportEmail: string;
  salesEmail: string;
  pressEmail: string;
  partnershipEmail: string;
  supportPhone: string;
  salesPhone: string;
  whatsappNumber: string;
  telegramUsername: string;
  // Info message
  infoMessage: string;
  infoMessageColor: string;
  infoMessageFont: string;
  // Theme colors
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
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadowIntensity: 'none' | 'sm' | 'md' | 'lg' | 'xl';
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
  headerStyle: 'minimal' | 'standard' | 'extended';
  footerStyle: 'minimal' | 'standard' | 'extended';
  sidebarEnabled: boolean;
  sidebarPosition: 'left' | 'right';
  productGridColumns: number;
  productCardStyle: 'minimal' | 'standard' | 'detailed';
  navigationStyle: 'horizontal' | 'vertical' | 'mega';
  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
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
  openingHours: StoreOpeningHours | null;
  // Legal & Marketing
  legalPages: StoreLegalPages | null;
  marketingContent: StoreMarketingContent | null;
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
}

export type StoreFormSetters = {
  [K in keyof StoreFormState as `set${Capitalize<string & K>}`]: React.Dispatch<React.SetStateAction<StoreFormState[K]>>;
};

/** Config object that can be imported/applied from templates or JSON */
export interface StoreThemeConfig {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  text_secondary_color?: string;
  button_primary_color?: string;
  button_primary_text?: string;
  button_secondary_color?: string;
  button_secondary_text?: string;
  link_color?: string;
  link_hover_color?: string;
  border_radius?: string;
  shadow_intensity?: string;
  heading_font?: string;
  body_font?: string;
  font_size_base?: string;
  heading_size_h1?: string;
  heading_size_h2?: string;
  heading_size_h3?: string;
  line_height?: string;
  letter_spacing?: string;
  header_style?: 'minimal' | 'standard' | 'extended';
  footer_style?: 'minimal' | 'standard' | 'extended';
  product_grid_columns?: number;
  product_card_style?: 'minimal' | 'standard' | 'detailed';
  navigation_style?: 'horizontal' | 'vertical' | 'mega';
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}
