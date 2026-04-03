import { useState, useMemo, useCallback } from 'react';
import type { Store } from '@/hooks/useStores';
import type { StoreOpeningHours, StoreLegalPages, StoreMarketingContent } from '@/hooks/useStores';
import type { ExtendedStore, StoreFormState, StoreThemeConfig } from '@/components/store/types/store-form';
import { useStore } from '@/hooks/useStore';
import { useStoreContext } from '@/contexts/StoreContext';
import { useToast } from '@/hooks/use-toast';
import { validateStoreForm } from '@/lib/validation-utils';
import { validateStoreUpdate } from '@/lib/store-validation';

function initState(store: ExtendedStore): StoreFormState {
  return {
    name: store.name,
    description: store.description || '',
    logoUrl: store.logo_url || '',
    bannerUrl: store.banner_url || '',
    faviconUrl: store.favicon_url || '',
    appleTouchIconUrl: store.apple_touch_icon_url || '',
    watermarkUrl: store.watermark_url || '',
    placeholderImageUrl: store.placeholder_image_url || '',
    about: store.about || '',
    contactEmail: store.contact_email || '',
    contactPhone: store.contact_phone || '',
    facebookUrl: store.facebook_url || '',
    instagramUrl: store.instagram_url || '',
    twitterUrl: store.twitter_url || '',
    linkedinUrl: store.linkedin_url || '',
    youtubeUrl: store.youtube_url || '',
    tiktokUrl: store.tiktok_url || '',
    pinterestUrl: store.pinterest_url || '',
    snapchatUrl: store.snapchat_url || '',
    discordUrl: store.discord_url || '',
    twitchUrl: store.twitch_url || '',
    supportEmail: store.support_email || '',
    salesEmail: store.sales_email || '',
    pressEmail: store.press_email || '',
    partnershipEmail: store.partnership_email || '',
    supportPhone: store.support_phone || '',
    salesPhone: store.sales_phone || '',
    whatsappNumber: store.whatsapp_number || '',
    telegramUsername: store.telegram_username || '',
    infoMessage: store.info_message || '',
    infoMessageColor: store.info_message_color || '#3b82f6',
    infoMessageFont: store.info_message_font || 'Inter',
    primaryColor: store.primary_color || '#3b82f6',
    secondaryColor: store.secondary_color || '#8b5cf6',
    accentColor: store.accent_color || '#f59e0b',
    backgroundColor: store.background_color || '#ffffff',
    textColor: store.text_color || '#1f2937',
    textSecondaryColor: store.text_secondary_color || '#6b7280',
    buttonPrimaryColor: store.button_primary_color || '#3b82f6',
    buttonPrimaryText: store.button_primary_text || '#ffffff',
    buttonSecondaryColor: store.button_secondary_color || '#e5e7eb',
    buttonSecondaryText: store.button_secondary_text || '#1f2937',
    linkColor: store.link_color || '#3b82f6',
    linkHoverColor: store.link_hover_color || '#2563eb',
    borderRadius: store.border_radius || 'md',
    shadowIntensity: store.shadow_intensity || 'md',
    headingFont: store.heading_font || 'Inter',
    bodyFont: store.body_font || 'Inter',
    fontSizeBase: store.font_size_base || '16px',
    headingSizeH1: store.heading_size_h1 || '2.5rem',
    headingSizeH2: store.heading_size_h2 || '2rem',
    headingSizeH3: store.heading_size_h3 || '1.5rem',
    lineHeight: store.line_height || '1.6',
    letterSpacing: store.letter_spacing || 'normal',
    headerStyle: store.header_style || 'standard',
    footerStyle: store.footer_style || 'standard',
    sidebarEnabled: store.sidebar_enabled || false,
    sidebarPosition: store.sidebar_position || 'left',
    productGridColumns: store.product_grid_columns || 3,
    productCardStyle: store.product_card_style || 'standard',
    navigationStyle: store.navigation_style || 'horizontal',
    metaTitle: store.meta_title || '',
    metaDescription: store.meta_description || '',
    metaKeywords: store.meta_keywords || '',
    ogTitle: store.og_title || '',
    ogDescription: store.og_description || '',
    ogImageUrl: store.og_image || '',
    addressLine1: store.address_line1 || '',
    addressLine2: store.address_line2 || '',
    city: store.city || '',
    stateProvince: store.state_province || '',
    postalCode: store.postal_code || '',
    country: store.country || '',
    latitude: store.latitude || null,
    longitude: store.longitude || null,
    timezone: store.timezone || 'Africa/Ouagadougou',
    openingHours: store.opening_hours || null,
    legalPages: store.legal_pages || null,
    marketingContent: store.marketing_content || null,
    googleAnalyticsId: store.google_analytics_id || '',
    googleAnalyticsEnabled: store.google_analytics_enabled || false,
    facebookPixelId: store.facebook_pixel_id || '',
    facebookPixelEnabled: store.facebook_pixel_enabled || false,
    googleTagManagerId: store.google_tag_manager_id || '',
    googleTagManagerEnabled: store.google_tag_manager_enabled || false,
    tiktokPixelId: store.tiktok_pixel_id || '',
    tiktokPixelEnabled: store.tiktok_pixel_enabled || false,
    customTrackingScripts: store.custom_tracking_scripts || '',
    customScriptsEnabled: store.custom_scripts_enabled || false,
  };
}

export function useStoreFormState(store: ExtendedStore) {
  // --- All form fields as individual useState (for granular re-renders) ---
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description || '');
  const [logoUrl, setLogoUrl] = useState(store.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(store.banner_url || '');
  const [faviconUrl, setFaviconUrl] = useState(store.favicon_url || '');
  const [appleTouchIconUrl, setAppleTouchIconUrl] = useState(store.apple_touch_icon_url || '');
  const [watermarkUrl, setWatermarkUrl] = useState(store.watermark_url || '');
  const [placeholderImageUrl, setPlaceholderImageUrl] = useState(store.placeholder_image_url || '');
  const [about, setAbout] = useState(store.about || '');
  const [contactEmail, setContactEmail] = useState(store.contact_email || '');
  const [contactPhone, setContactPhone] = useState(store.contact_phone || '');
  const [facebookUrl, setFacebookUrl] = useState(store.facebook_url || '');
  const [instagramUrl, setInstagramUrl] = useState(store.instagram_url || '');
  const [twitterUrl, setTwitterUrl] = useState(store.twitter_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(store.linkedin_url || '');
  const [youtubeUrl, setYoutubeUrl] = useState(store.youtube_url || '');
  const [tiktokUrl, setTiktokUrl] = useState(store.tiktok_url || '');
  const [pinterestUrl, setPinterestUrl] = useState(store.pinterest_url || '');
  const [snapchatUrl, setSnapchatUrl] = useState(store.snapchat_url || '');
  const [discordUrl, setDiscordUrl] = useState(store.discord_url || '');
  const [twitchUrl, setTwitchUrl] = useState(store.twitch_url || '');
  const [supportEmail, setSupportEmail] = useState(store.support_email || '');
  const [salesEmail, setSalesEmail] = useState(store.sales_email || '');
  const [pressEmail, setPressEmail] = useState(store.press_email || '');
  const [partnershipEmail, setPartnershipEmail] = useState(store.partnership_email || '');
  const [supportPhone, setSupportPhone] = useState(store.support_phone || '');
  const [salesPhone, setSalesPhone] = useState(store.sales_phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(store.whatsapp_number || '');
  const [telegramUsername, setTelegramUsername] = useState(store.telegram_username || '');
  const [infoMessage, setInfoMessage] = useState(store.info_message || '');
  const [infoMessageColor, setInfoMessageColor] = useState(store.info_message_color || '#3b82f6');
  const [infoMessageFont, setInfoMessageFont] = useState(store.info_message_font || 'Inter');
  const [primaryColor, setPrimaryColor] = useState(store.primary_color || '#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState(store.secondary_color || '#8b5cf6');
  const [accentColor, setAccentColor] = useState(store.accent_color || '#f59e0b');
  const [backgroundColor, setBackgroundColor] = useState(store.background_color || '#ffffff');
  const [textColor, setTextColor] = useState(store.text_color || '#1f2937');
  const [textSecondaryColor, setTextSecondaryColor] = useState(store.text_secondary_color || '#6b7280');
  const [buttonPrimaryColor, setButtonPrimaryColor] = useState(store.button_primary_color || '#3b82f6');
  const [buttonPrimaryText, setButtonPrimaryText] = useState(store.button_primary_text || '#ffffff');
  const [buttonSecondaryColor, setButtonSecondaryColor] = useState(store.button_secondary_color || '#e5e7eb');
  const [buttonSecondaryText, setButtonSecondaryText] = useState(store.button_secondary_text || '#1f2937');
  const [linkColor, setLinkColor] = useState(store.link_color || '#3b82f6');
  const [linkHoverColor, setLinkHoverColor] = useState(store.link_hover_color || '#2563eb');
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>(store.border_radius || 'md');
  const [shadowIntensity, setShadowIntensity] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>(store.shadow_intensity || 'md');
  const [headingFont, setHeadingFont] = useState(store.heading_font || 'Inter');
  const [bodyFont, setBodyFont] = useState(store.body_font || 'Inter');
  const [fontSizeBase, setFontSizeBase] = useState(store.font_size_base || '16px');
  const [headingSizeH1, setHeadingSizeH1] = useState(store.heading_size_h1 || '2.5rem');
  const [headingSizeH2, setHeadingSizeH2] = useState(store.heading_size_h2 || '2rem');
  const [headingSizeH3, setHeadingSizeH3] = useState(store.heading_size_h3 || '1.5rem');
  const [lineHeight, setLineHeight] = useState(store.line_height || '1.6');
  const [letterSpacing, setLetterSpacing] = useState(store.letter_spacing || 'normal');
  const [headerStyle, setHeaderStyle] = useState<'minimal' | 'standard' | 'extended'>(store.header_style || 'standard');
  const [footerStyle, setFooterStyle] = useState<'minimal' | 'standard' | 'extended'>(store.footer_style || 'standard');
  const [sidebarEnabled, setSidebarEnabled] = useState(store.sidebar_enabled || false);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>(store.sidebar_position || 'left');
  const [productGridColumns, setProductGridColumns] = useState(store.product_grid_columns || 3);
  const [productCardStyle, setProductCardStyle] = useState<'minimal' | 'standard' | 'detailed'>(store.product_card_style || 'standard');
  const [navigationStyle, setNavigationStyle] = useState<'horizontal' | 'vertical' | 'mega'>(store.navigation_style || 'horizontal');
  const [metaTitle, setMetaTitle] = useState(store.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(store.meta_description || '');
  const [metaKeywords, setMetaKeywords] = useState(store.meta_keywords || '');
  const [ogTitle, setOgTitle] = useState(store.og_title || '');
  const [ogDescription, setOgDescription] = useState(store.og_description || '');
  const [ogImageUrl, setOgImageUrl] = useState(store.og_image || '');
  const [addressLine1, setAddressLine1] = useState(store.address_line1 || '');
  const [addressLine2, setAddressLine2] = useState(store.address_line2 || '');
  const [city, setCity] = useState(store.city || '');
  const [stateProvince, setStateProvince] = useState(store.state_province || '');
  const [postalCode, setPostalCode] = useState(store.postal_code || '');
  const [country, setCountry] = useState(store.country || '');
  const [latitude, setLatitude] = useState<number | null>(store.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(store.longitude || null);
  const [timezone, setTimezone] = useState(store.timezone || 'Africa/Ouagadougou');
  const [openingHours, setOpeningHours] = useState<StoreOpeningHours | null>(store.opening_hours || null);
  const [legalPages, setLegalPages] = useState<StoreLegalPages | null>(store.legal_pages || null);
  const [marketingContent, setMarketingContent] = useState<StoreMarketingContent | null>(store.marketing_content || null);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(store.google_analytics_id || '');
  const [googleAnalyticsEnabled, setGoogleAnalyticsEnabled] = useState(store.google_analytics_enabled || false);
  const [facebookPixelId, setFacebookPixelId] = useState(store.facebook_pixel_id || '');
  const [facebookPixelEnabled, setFacebookPixelEnabled] = useState(store.facebook_pixel_enabled || false);
  const [googleTagManagerId, setGoogleTagManagerId] = useState(store.google_tag_manager_id || '');
  const [googleTagManagerEnabled, setGoogleTagManagerEnabled] = useState(store.google_tag_manager_enabled || false);
  const [tiktokPixelId, setTiktokPixelId] = useState(store.tiktok_pixel_id || '');
  const [tiktokPixelEnabled, setTiktokPixelEnabled] = useState(store.tiktok_pixel_enabled || false);
  const [customTrackingScripts, setCustomTrackingScripts] = useState(store.custom_tracking_scripts || '');
  const [customScriptsEnabled, setCustomScriptsEnabled] = useState(store.custom_scripts_enabled || false);

  // --- UI state ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('settings');
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  const { updateStore, getStoreUrl, checkSlugAvailability } = useStore();
  const { refreshStores } = useStoreContext();
  const { toast } = useToast();

  const storeUrl = useMemo(() => getStoreUrl(), [getStoreUrl]);

  // --- Collected form state ---
  const formState: StoreFormState = {
    name, description, logoUrl, bannerUrl, faviconUrl, appleTouchIconUrl, watermarkUrl, placeholderImageUrl,
    about, contactEmail, contactPhone,
    facebookUrl, instagramUrl, twitterUrl, linkedinUrl, youtubeUrl, tiktokUrl, pinterestUrl, snapchatUrl, discordUrl, twitchUrl,
    supportEmail, salesEmail, pressEmail, partnershipEmail, supportPhone, salesPhone, whatsappNumber, telegramUsername,
    infoMessage, infoMessageColor, infoMessageFont,
    primaryColor, secondaryColor, accentColor, backgroundColor, textColor, textSecondaryColor,
    buttonPrimaryColor, buttonPrimaryText, buttonSecondaryColor, buttonSecondaryText,
    linkColor, linkHoverColor, borderRadius, shadowIntensity,
    headingFont, bodyFont, fontSizeBase, headingSizeH1, headingSizeH2, headingSizeH3, lineHeight, letterSpacing,
    headerStyle, footerStyle, sidebarEnabled, sidebarPosition, productGridColumns, productCardStyle, navigationStyle,
    metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription, ogImageUrl,
    addressLine1, addressLine2, city, stateProvince, postalCode, country, latitude, longitude, timezone, openingHours,
    legalPages, marketingContent,
    googleAnalyticsId, googleAnalyticsEnabled, facebookPixelId, facebookPixelEnabled,
    googleTagManagerId, googleTagManagerEnabled, tiktokPixelId, tiktokPixelEnabled,
    customTrackingScripts, customScriptsEnabled,
  };

  const setters = {
    setName, setDescription, setLogoUrl, setBannerUrl, setFaviconUrl, setAppleTouchIconUrl, setWatermarkUrl, setPlaceholderImageUrl,
    setAbout, setContactEmail, setContactPhone,
    setFacebookUrl, setInstagramUrl, setTwitterUrl, setLinkedinUrl, setYoutubeUrl, setTiktokUrl, setPinterestUrl, setSnapchatUrl, setDiscordUrl, setTwitchUrl,
    setSupportEmail, setSalesEmail, setPressEmail, setPartnershipEmail, setSupportPhone, setSalesPhone, setWhatsappNumber, setTelegramUsername,
    setInfoMessage, setInfoMessageColor, setInfoMessageFont,
    setPrimaryColor, setSecondaryColor, setAccentColor, setBackgroundColor, setTextColor, setTextSecondaryColor,
    setButtonPrimaryColor, setButtonPrimaryText, setButtonSecondaryColor, setButtonSecondaryText,
    setLinkColor, setLinkHoverColor, setBorderRadius, setShadowIntensity,
    setHeadingFont, setBodyFont, setFontSizeBase, setHeadingSizeH1, setHeadingSizeH2, setHeadingSizeH3, setLineHeight, setLetterSpacing,
    setHeaderStyle, setFooterStyle, setSidebarEnabled, setSidebarPosition, setProductGridColumns, setProductCardStyle, setNavigationStyle,
    setMetaTitle, setMetaDescription, setMetaKeywords, setOgTitle, setOgDescription, setOgImageUrl,
    setAddressLine1, setAddressLine2, setCity, setStateProvince, setPostalCode, setCountry, setLatitude, setLongitude, setTimezone, setOpeningHours,
    setLegalPages, setMarketingContent,
    setGoogleAnalyticsId, setGoogleAnalyticsEnabled, setFacebookPixelId, setFacebookPixelEnabled,
    setGoogleTagManagerId, setGoogleTagManagerEnabled, setTiktokPixelId, setTiktokPixelEnabled,
    setCustomTrackingScripts, setCustomScriptsEnabled,
  };

  // --- Apply a theme config (from template or import) ---
  const applyConfig = useCallback((config: StoreThemeConfig) => {
    if (config.primary_color) setPrimaryColor(config.primary_color);
    if (config.secondary_color) setSecondaryColor(config.secondary_color);
    if (config.accent_color) setAccentColor(config.accent_color);
    if (config.background_color) setBackgroundColor(config.background_color);
    if (config.text_color) setTextColor(config.text_color);
    if (config.text_secondary_color) setTextSecondaryColor(config.text_secondary_color);
    if (config.button_primary_color) setButtonPrimaryColor(config.button_primary_color);
    if (config.button_primary_text) setButtonPrimaryText(config.button_primary_text);
    if (config.button_secondary_color) setButtonSecondaryColor(config.button_secondary_color);
    if (config.button_secondary_text) setButtonSecondaryText(config.button_secondary_text);
    if (config.link_color) setLinkColor(config.link_color);
    if (config.link_hover_color) setLinkHoverColor(config.link_hover_color);
    if (config.border_radius) setBorderRadius(config.border_radius as 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full');
    if (config.shadow_intensity) setShadowIntensity(config.shadow_intensity as 'none' | 'sm' | 'md' | 'lg' | 'xl');
    if (config.heading_font) setHeadingFont(config.heading_font);
    if (config.body_font) setBodyFont(config.body_font);
    if (config.font_size_base) setFontSizeBase(config.font_size_base);
    if (config.heading_size_h1) setHeadingSizeH1(config.heading_size_h1);
    if (config.heading_size_h2) setHeadingSizeH2(config.heading_size_h2);
    if (config.heading_size_h3) setHeadingSizeH3(config.heading_size_h3);
    if (config.line_height) setLineHeight(config.line_height);
    if (config.letter_spacing) setLetterSpacing(config.letter_spacing);
    if (config.header_style) setHeaderStyle(config.header_style);
    if (config.footer_style) setFooterStyle(config.footer_style);
    if (config.product_grid_columns) setProductGridColumns(config.product_grid_columns);
    if (config.product_card_style) setProductCardStyle(config.product_card_style);
    if (config.navigation_style) setNavigationStyle(config.navigation_style);
    if (config.meta_title) setMetaTitle(config.meta_title);
    if (config.meta_description) setMetaDescription(config.meta_description);
    if (config.meta_keywords) setMetaKeywords(config.meta_keywords);
    if (config.og_title) setOgTitle(config.og_title);
    if (config.og_description) setOgDescription(config.og_description);
    if (config.og_image) setOgImageUrl(config.og_image);
  }, []);

  // --- Build the update payload ---
  const buildUpdatePayload = useCallback((): Partial<Store> & Record<string, unknown> => ({
    name: name.trim(),
    description: description.trim() || null,
    logo_url: logoUrl || null,
    banner_url: bannerUrl || null,
    favicon_url: faviconUrl || null,
    apple_touch_icon_url: appleTouchIconUrl || null,
    watermark_url: watermarkUrl || null,
    placeholder_image_url: placeholderImageUrl || null,
    about: about.trim() || null,
    info_message: infoMessage.trim() || null,
    info_message_color: infoMessageColor || '#3b82f6',
    info_message_font: infoMessageFont || 'Inter',
    contact_email: contactEmail.trim() || null,
    contact_phone: contactPhone.trim() || null,
    facebook_url: facebookUrl.trim() || null,
    instagram_url: instagramUrl.trim() || null,
    twitter_url: twitterUrl.trim() || null,
    linkedin_url: linkedinUrl.trim() || null,
    support_email: supportEmail.trim() || null,
    sales_email: salesEmail.trim() || null,
    press_email: pressEmail.trim() || null,
    partnership_email: partnershipEmail.trim() || null,
    support_phone: supportPhone.trim() || null,
    sales_phone: salesPhone.trim() || null,
    whatsapp_number: whatsappNumber.trim() || null,
    telegram_username: telegramUsername.trim() || null,
    youtube_url: youtubeUrl.trim() || null,
    tiktok_url: tiktokUrl.trim() || null,
    pinterest_url: pinterestUrl.trim() || null,
    snapchat_url: snapchatUrl.trim() || null,
    discord_url: discordUrl.trim() || null,
    twitch_url: twitchUrl.trim() || null,
    primary_color: primaryColor || null,
    secondary_color: secondaryColor || null,
    accent_color: accentColor || null,
    background_color: backgroundColor || null,
    text_color: textColor || null,
    text_secondary_color: textSecondaryColor || null,
    button_primary_color: buttonPrimaryColor || null,
    button_primary_text: buttonPrimaryText || null,
    button_secondary_color: buttonSecondaryColor || null,
    button_secondary_text: buttonSecondaryText || null,
    link_color: linkColor || null,
    link_hover_color: linkHoverColor || null,
    border_radius: borderRadius,
    shadow_intensity: shadowIntensity,
    heading_font: headingFont || null,
    body_font: bodyFont || null,
    font_size_base: fontSizeBase || null,
    heading_size_h1: headingSizeH1 || null,
    heading_size_h2: headingSizeH2 || null,
    heading_size_h3: headingSizeH3 || null,
    line_height: lineHeight || null,
    letter_spacing: letterSpacing || null,
    header_style: headerStyle,
    footer_style: footerStyle,
    sidebar_enabled: sidebarEnabled,
    sidebar_position: sidebarPosition,
    product_grid_columns: productGridColumns,
    product_card_style: productCardStyle,
    navigation_style: navigationStyle,
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    meta_keywords: metaKeywords || null,
    og_title: ogTitle || null,
    og_description: ogDescription || null,
    og_image: ogImageUrl || null,
    address_line1: addressLine1 || null,
    address_line2: addressLine2 || null,
    city: city || null,
    state_province: stateProvince || null,
    postal_code: postalCode || null,
    country: country || null,
    latitude,
    longitude,
    timezone: timezone || null,
    opening_hours: openingHours || null,
    legal_pages: legalPages || null,
    marketing_content: marketingContent || null,
    google_analytics_id: googleAnalyticsId.trim() || null,
    google_analytics_enabled: googleAnalyticsEnabled,
    facebook_pixel_id: facebookPixelId.trim() || null,
    facebook_pixel_enabled: facebookPixelEnabled,
    google_tag_manager_id: googleTagManagerId.trim() || null,
    google_tag_manager_enabled: googleTagManagerEnabled,
    tiktok_pixel_id: tiktokPixelId.trim() || null,
    tiktok_pixel_enabled: tiktokPixelEnabled,
    custom_tracking_scripts: customTrackingScripts.trim() || null,
    custom_scripts_enabled: customScriptsEnabled,
  }), [
    name, description, logoUrl, bannerUrl, faviconUrl, appleTouchIconUrl, watermarkUrl, placeholderImageUrl,
    about, infoMessage, infoMessageColor, infoMessageFont, contactEmail, contactPhone,
    facebookUrl, instagramUrl, twitterUrl, linkedinUrl,
    supportEmail, salesEmail, pressEmail, partnershipEmail, supportPhone, salesPhone, whatsappNumber, telegramUsername,
    youtubeUrl, tiktokUrl, pinterestUrl, snapchatUrl, discordUrl, twitchUrl,
    primaryColor, secondaryColor, accentColor, backgroundColor, textColor, textSecondaryColor,
    buttonPrimaryColor, buttonPrimaryText, buttonSecondaryColor, buttonSecondaryText,
    linkColor, linkHoverColor, borderRadius, shadowIntensity,
    headingFont, bodyFont, fontSizeBase, headingSizeH1, headingSizeH2, headingSizeH3, lineHeight, letterSpacing,
    headerStyle, footerStyle, sidebarEnabled, sidebarPosition, productGridColumns, productCardStyle, navigationStyle,
    metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription, ogImageUrl,
    addressLine1, addressLine2, city, stateProvince, postalCode, country, latitude, longitude, timezone, openingHours,
    legalPages, marketingContent,
    googleAnalyticsId, googleAnalyticsEnabled, facebookPixelId, facebookPixelEnabled,
    googleTagManagerId, googleTagManagerEnabled, tiktokPixelId, tiktokPixelEnabled,
    customTrackingScripts, customScriptsEnabled,
  ]);

  // --- Validation ---
  const validateEmail = useCallback((email: string): string | null => {
    if (!email.trim()) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : "Format d'email invalide";
  }, []);

  const validateUrl = useCallback((url: string): string | null => {
    if (!url.trim()) return null;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return null;
    } catch {
      return "Format d'URL invalide (ex: https://example.com)";
    }
  }, []);

  const handleFieldBlur = useCallback((fieldName: string) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const validateField = useCallback(
    (fieldName: string, value: string) => {
      if (!fieldTouched[fieldName]) return null;
      switch (fieldName) {
        case 'contact_email': case 'support_email': case 'sales_email': case 'press_email': case 'partnership_email':
          return validateEmail(value);
        case 'facebook_url': case 'instagram_url': case 'twitter_url': case 'linkedin_url':
        case 'youtube_url': case 'tiktok_url': case 'pinterest_url': case 'snapchat_url': case 'discord_url': case 'twitch_url':
          return validateUrl(value);
        case 'name':
          if (!value.trim()) return 'Le nom de la boutique est requis';
          if (value.trim().length < 3) return 'Le nom doit contenir au moins 3 caractères';
          return null;
        default:
          return null;
      }
    },
    [fieldTouched, validateEmail, validateUrl]
  );

  // --- Submit ---
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    const formData = {
      name: name.trim(),
      description: description.trim() || undefined,
      contact_email: contactEmail.trim() || undefined,
      contact_phone: contactPhone.trim() || undefined,
      facebook_url: facebookUrl.trim() || undefined,
      instagram_url: instagramUrl.trim() || undefined,
      twitter_url: twitterUrl.trim() || undefined,
      linkedin_url: linkedinUrl.trim() || undefined,
    };

    const zodValidation = validateStoreUpdate(formData);
    const manualValidation = validateStoreForm(formData);

    const allErrors = {
      ...(zodValidation.valid ? {} : zodValidation.errors),
      ...(manualValidation.valid ? {} : manualValidation.errors),
    };

    if (Object.keys(allErrors).length > 0) {
      toast({
        title: 'Erreurs de validation',
        description: 'Veuillez corriger les erreurs avant de continuer.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const updates = buildUpdatePayload();
    const success = await updateStore(updates);

    if (success) {
      await refreshStores().catch(() => {});
      setIsEditing(false);
      setFieldTouched({});
      setLastSaved(new Date());
      toast({ title: 'Boutique mise à jour', description: 'Toutes les modifications ont été enregistrées.', duration: 3000 });
    } else {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder les modifications. Veuillez réessayer.', variant: 'destructive', duration: 5000 });
    }

    setIsSubmitting(false);
  }, [name, description, contactEmail, contactPhone, facebookUrl, instagramUrl, twitterUrl, linkedinUrl, buildUpdatePayload, updateStore, refreshStores, toast]);

  // --- Cancel ---
  const resetForm = useCallback(() => {
    const initial = initState(store);
    setName(initial.name);
    setDescription(initial.description);
    setLogoUrl(initial.logoUrl);
    setBannerUrl(initial.bannerUrl);
    setFaviconUrl(initial.faviconUrl);
    setAppleTouchIconUrl(initial.appleTouchIconUrl);
    setWatermarkUrl(initial.watermarkUrl);
    setPlaceholderImageUrl(initial.placeholderImageUrl);
    setAbout(initial.about);
    setContactEmail(initial.contactEmail);
    setContactPhone(initial.contactPhone);
    setFacebookUrl(initial.facebookUrl);
    setInstagramUrl(initial.instagramUrl);
    setTwitterUrl(initial.twitterUrl);
    setLinkedinUrl(initial.linkedinUrl);
    setInfoMessage(initial.infoMessage);
    setInfoMessageColor(initial.infoMessageColor);
    setInfoMessageFont(initial.infoMessageFont);
    setIsEditing(false);
    setFieldTouched({});
    setShowCancelConfirm(false);
  }, [store]);

  const handleCancel = useCallback(() => {
    const hasChanges =
      name !== store.name ||
      description !== (store.description || '') ||
      contactEmail !== (store.contact_email || '') ||
      logoUrl !== (store.logo_url || '');

    if (hasChanges && isEditing) {
      setShowCancelConfirm(true);
      return;
    }
    resetForm();
  }, [name, store, description, contactEmail, logoUrl, isEditing, resetForm]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: 'Lien copié !', description: 'Le lien de votre boutique a été copié dans le presse-papiers.' });
  }, [storeUrl, toast]);

  const handleSlugUpdate = useCallback(async (newSlug: string): Promise<boolean> => {
    return await updateStore({ slug: newSlug });
  }, [updateStore]);

  // --- Color/Typography/Layout change handlers ---
  const handleColorChange = useCallback((field: string, value: string) => {
    const map: Record<string, (v: string) => void> = {
      primary_color: setPrimaryColor, secondary_color: setSecondaryColor, accent_color: setAccentColor,
      background_color: setBackgroundColor, text_color: setTextColor, text_secondary_color: setTextSecondaryColor,
      button_primary_color: setButtonPrimaryColor, button_primary_text: setButtonPrimaryText,
      button_secondary_color: setButtonSecondaryColor, button_secondary_text: setButtonSecondaryText,
      link_color: setLinkColor, link_hover_color: setLinkHoverColor,
      border_radius: v => setBorderRadius(v as 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'),
      shadow_intensity: v => setShadowIntensity(v as 'none' | 'sm' | 'md' | 'lg' | 'xl'),
    };
    map[field]?.(value);
  }, []);

  const handleTypographyChange = useCallback((field: string, value: string) => {
    const map: Record<string, (v: string) => void> = {
      heading_font: setHeadingFont, body_font: setBodyFont, font_size_base: setFontSizeBase,
      heading_size_h1: setHeadingSizeH1, heading_size_h2: setHeadingSizeH2, heading_size_h3: setHeadingSizeH3,
      line_height: setLineHeight, letter_spacing: setLetterSpacing,
    };
    map[field]?.(value);
  }, []);

  const handleLayoutChange = useCallback((field: string, value: string | number | boolean) => {
    const map: Record<string, (v: string | number | boolean) => void> = {
      header_style: v => setHeaderStyle(v as 'minimal' | 'standard' | 'extended'),
      footer_style: v => setFooterStyle(v as 'minimal' | 'standard' | 'extended'),
      sidebar_enabled: v => setSidebarEnabled(Boolean(v)),
      sidebar_position: v => setSidebarPosition(v as 'left' | 'right'),
      product_grid_columns: v => setProductGridColumns(Number(v)),
      product_card_style: v => setProductCardStyle(v as 'minimal' | 'standard' | 'detailed'),
      navigation_style: v => setNavigationStyle(v as 'horizontal' | 'vertical' | 'mega'),
    };
    map[field]?.(value);
  }, []);

  const handleSeoChange = useCallback((field: string, value: string) => {
    const map: Record<string, (v: string) => void> = {
      meta_title: setMetaTitle, meta_description: setMetaDescription, meta_keywords: setMetaKeywords,
      og_title: setOgTitle, og_description: setOgDescription, og_image_url: setOgImageUrl,
    };
    map[field]?.(value);
  }, []);

  const handleAddressChange = useCallback((field: string, value: string) => {
    const map: Record<string, (v: string) => void> = {
      address_line1: setAddressLine1, address_line2: setAddressLine2, city: setCity,
      state_province: setStateProvince, postal_code: setPostalCode, country: setCountry,
    };
    map[field]?.(value);
  }, []);

  return {
    // Form state
    formState,
    setters,
    // UI state
    isEditing, setIsEditing,
    isSubmitting,
    showCancelConfirm, setShowCancelConfirm,
    lastSaved,
    currentTab, setCurrentTab,
    fieldTouched,
    // Store utilities
    storeUrl,
    updateStore,
    checkSlugAvailability,
    toast,
    // Handlers
    handleSubmit,
    handleCancel,
    resetForm,
    handleCopyUrl,
    handleSlugUpdate,
    applyConfig,
    handleColorChange,
    handleTypographyChange,
    handleLayoutChange,
    handleSeoChange,
    handleAddressChange,
    handleFieldBlur,
    validateField,
  };
}
