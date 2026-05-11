/**
 * useStoreDetailsForm – extracted form state from StoreDetails (3333 lines)
 * Manages all 60+ state variables for the store details form.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Store, StoreOpeningHours, StoreLegalPages, StoreMarketingContent } from '@/hooks/useStores';
import { useStore } from '@/hooks/useStore';
import { useStoreContext } from '@/contexts/StoreContext';
import { useToast } from '@/hooks/use-toast';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { validateStoreForm } from '@/lib/validation-utils';
import { validateStoreUpdate } from '@/lib/store-validation';

interface ExtendedStore extends Store {
  [key: string]: unknown;
}

export function useStoreDetailsForm(store: ExtendedStore) {
  // ---- Basic info ----
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('settings');
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const { updateStore, getStoreUrl, checkSlugAvailability } = useStore();
  const { refreshStores } = useStoreContext();
  const { toast } = useToast();

  // ---- All form fields ----
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description || '');
  const [logoUrl, setLogoUrl] = useState(store.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(store.banner_url || '');
  const [faviconUrl, setFaviconUrl] = useState((store as any).favicon_url || '');
  const [appleTouchIconUrl, setAppleTouchIconUrl] = useState((store as any).apple_touch_icon_url || '');
  const [watermarkUrl, setWatermarkUrl] = useState((store as any).watermark_url || '');
  const [placeholderImageUrl, setPlaceholderImageUrl] = useState((store as any).placeholder_image_url || '');
  const [about, setAbout] = useState(store.about || '');
  const [contactEmail, setContactEmail] = useState(store.contact_email || '');
  const [contactPhone, setContactPhone] = useState(store.contact_phone || '');
  const [facebookUrl, setFacebookUrl] = useState(store.facebook_url || '');
  const [instagramUrl, setInstagramUrl] = useState(store.instagram_url || '');
  const [twitterUrl, setTwitterUrl] = useState(store.twitter_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(store.linkedin_url || '');
  const [supportEmail, setSupportEmail] = useState((store as any).support_email || '');
  const [salesEmail, setSalesEmail] = useState((store as any).sales_email || '');
  const [pressEmail, setPressEmail] = useState((store as any).press_email || '');
  const [partnershipEmail, setPartnershipEmail] = useState((store as any).partnership_email || '');
  const [supportPhone, setSupportPhone] = useState((store as any).support_phone || '');
  const [salesPhone, setSalesPhone] = useState((store as any).sales_phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState((store as any).whatsapp_number || '');
  const [telegramUsername, setTelegramUsername] = useState((store as any).telegram_username || '');
  const [youtubeUrl, setYoutubeUrl] = useState((store as any).youtube_url || '');
  const [tiktokUrl, setTiktokUrl] = useState((store as any).tiktok_url || '');
  const [pinterestUrl, setPinterestUrl] = useState((store as any).pinterest_url || '');
  const [snapchatUrl, setSnapchatUrl] = useState((store as any).snapchat_url || '');
  const [discordUrl, setDiscordUrl] = useState((store as any).discord_url || '');
  const [twitchUrl, setTwitchUrl] = useState((store as any).twitch_url || '');
  const [infoMessage, setInfoMessage] = useState(store.info_message || '');
  const [infoMessageColor, setInfoMessageColor] = useState(store.info_message_color || '#3b82f6');
  const [infoMessageFont, setInfoMessageFont] = useState(store.info_message_font || 'Inter');

  // Theme
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
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>((store.border_radius as any) || 'md');
  const [shadowIntensity, setShadowIntensity] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>((store.shadow_intensity as any) || 'sm');

  // Typography
  const [headingFont, setHeadingFont] = useState(store.heading_font || 'Inter');
  const [bodyFont, setBodyFont] = useState(store.body_font || 'Inter');
  const [fontSizeBase, setFontSizeBase] = useState(store.font_size_base || '16px');
  const [headingSizeH1, setHeadingSizeH1] = useState(store.heading_size_h1 || '2.5rem');
  const [headingSizeH2, setHeadingSizeH2] = useState(store.heading_size_h2 || '2rem');
  const [headingSizeH3, setHeadingSizeH3] = useState(store.heading_size_h3 || '1.5rem');
  const [lineHeight, setLineHeight] = useState(store.line_height || '1.6');
  const [letterSpacing, setLetterSpacing] = useState(store.letter_spacing || 'normal');

  // Layout
  const [headerStyle, setHeaderStyle] = useState<'minimal' | 'standard' | 'extended'>((store.header_style as any) || 'standard');
  const [footerStyle, setFooterStyle] = useState<'minimal' | 'standard' | 'extended'>((store.footer_style as any) || 'standard');
  const [sidebarEnabled, setSidebarEnabled] = useState(store.sidebar_enabled || false);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>((store.sidebar_position as any) || 'left');
  const [productGridColumns, setProductGridColumns] = useState(store.product_grid_columns || 3);
  const [productCardStyle, setProductCardStyle] = useState<'minimal' | 'standard' | 'detailed'>((store.product_card_style as any) || 'standard');
  const [navigationStyle, setNavigationStyle] = useState<'horizontal' | 'vertical' | 'mega'>((store.navigation_style as any) || 'horizontal');

  // SEO
  const [metaTitle, setMetaTitle] = useState(store.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(store.meta_description || '');
  const [metaKeywords, setMetaKeywords] = useState(store.meta_keywords || '');
  const [ogTitle, setOgTitle] = useState(store.og_title || '');
  const [ogDescription, setOgDescription] = useState(store.og_description || '');
  const [ogImageUrl, setOgImageUrl] = useState(store.og_image || '');

  // Location
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

  // Legal & Marketing
  const [legalPages, setLegalPages] = useState<StoreLegalPages | null>(store.legal_pages || null);
  const [marketingContent, setMarketingContent] = useState<StoreMarketingContent | null>(store.marketing_content || null);

  // Analytics
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState((store as any).google_analytics_id || '');
  const [googleAnalyticsEnabled, setGoogleAnalyticsEnabled] = useState((store as any).google_analytics_enabled || false);
  const [facebookPixelId, setFacebookPixelId] = useState((store as any).facebook_pixel_id || '');
  const [facebookPixelEnabled, setFacebookPixelEnabled] = useState((store as any).facebook_pixel_enabled || false);
  const [googleTagManagerId, setGoogleTagManagerId] = useState((store as any).google_tag_manager_id || '');
  const [googleTagManagerEnabled, setGoogleTagManagerEnabled] = useState((store as any).google_tag_manager_enabled || false);
  const [tiktokPixelId, setTiktokPixelId] = useState((store as any).tiktok_pixel_id || '');
  const [tiktokPixelEnabled, setTiktokPixelEnabled] = useState((store as any).tiktok_pixel_enabled || false);
  const [customTrackingScripts, setCustomTrackingScripts] = useState((store as any).custom_tracking_scripts || '');
  const [customScriptsEnabled, setCustomScriptsEnabled] = useState((store as any).custom_scripts_enabled || false);

  // ---- Validation helpers ----
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

  const validateField = useCallback((fieldName: string, value: string) => {
    if (!fieldTouched[fieldName]) return null;
    const emailFields = ['contact_email', 'support_email', 'sales_email', 'press_email', 'partnership_email'];
    const urlFields = ['facebook_url', 'instagram_url', 'twitter_url', 'linkedin_url', 'youtube_url', 'tiktok_url', 'pinterest_url', 'snapchat_url', 'discord_url', 'twitch_url'];
    if (emailFields.includes(fieldName)) return validateEmail(value);
    if (urlFields.includes(fieldName)) return validateUrl(value);
    if (fieldName === 'name') {
      if (!value.trim()) return 'Le nom de la boutique est requis';
      if (value.trim().length < 3) return 'Le nom doit contenir au moins 3 caractères';
    }
    return null;
  }, [fieldTouched, validateEmail, validateUrl]);

  const storeUrl = useMemo(() => getStoreUrl(), [getStoreUrl]);

  // ---- Apply config (theme import / template) ----
  const applyConfig = useCallback((config: Record<string, any>) => {
    const map: Record<string, (v: any) => void> = {
      primary_color: setPrimaryColor, secondary_color: setSecondaryColor,
      accent_color: setAccentColor, background_color: setBackgroundColor,
      text_color: setTextColor, text_secondary_color: setTextSecondaryColor,
      button_primary_color: setButtonPrimaryColor, button_primary_text: setButtonPrimaryText,
      button_secondary_color: setButtonSecondaryColor, button_secondary_text: setButtonSecondaryText,
      link_color: setLinkColor, link_hover_color: setLinkHoverColor,
      border_radius: setBorderRadius, shadow_intensity: setShadowIntensity,
      heading_font: setHeadingFont, body_font: setBodyFont,
      font_size_base: setFontSizeBase, heading_size_h1: setHeadingSizeH1,
      heading_size_h2: setHeadingSizeH2, heading_size_h3: setHeadingSizeH3,
      line_height: setLineHeight, letter_spacing: setLetterSpacing,
      header_style: setHeaderStyle, footer_style: setFooterStyle,
      product_grid_columns: setProductGridColumns, product_card_style: setProductCardStyle,
      navigation_style: setNavigationStyle,
      meta_title: setMetaTitle, meta_description: setMetaDescription,
      meta_keywords: setMetaKeywords, og_title: setOgTitle,
      og_description: setOgDescription, og_image: setOgImageUrl,
    };
    Object.entries(config).forEach(([key, value]) => {
      if (value && map[key]) map[key](value);
    });
  }, []);

  // ---- Build updates object ----
  const buildUpdates = useCallback((): Partial<Store> & Record<string, unknown> => ({
    name: name.trim(), description: description.trim() || null,
    logo_url: logoUrl || null, banner_url: bannerUrl || null,
    favicon_url: faviconUrl || null, apple_touch_icon_url: appleTouchIconUrl || null,
    watermark_url: watermarkUrl || null, placeholder_image_url: placeholderImageUrl || null,
    about: about.trim() || null, info_message: infoMessage.trim() || null,
    info_message_color: infoMessageColor || '#3b82f6', info_message_font: infoMessageFont || 'Inter',
    contact_email: contactEmail.trim() || null, contact_phone: contactPhone.trim() || null,
    facebook_url: facebookUrl.trim() || null, instagram_url: instagramUrl.trim() || null,
    twitter_url: twitterUrl.trim() || null, linkedin_url: linkedinUrl.trim() || null,
    support_email: supportEmail.trim() || null, sales_email: salesEmail.trim() || null,
    press_email: pressEmail.trim() || null, partnership_email: partnershipEmail.trim() || null,
    support_phone: supportPhone.trim() || null, sales_phone: salesPhone.trim() || null,
    whatsapp_number: whatsappNumber.trim() || null, telegram_username: telegramUsername.trim() || null,
    youtube_url: youtubeUrl.trim() || null, tiktok_url: tiktokUrl.trim() || null,
    pinterest_url: pinterestUrl.trim() || null, snapchat_url: snapchatUrl.trim() || null,
    discord_url: discordUrl.trim() || null, twitch_url: twitchUrl.trim() || null,
    primary_color: primaryColor || null, secondary_color: secondaryColor || null,
    accent_color: accentColor || null, background_color: backgroundColor || null,
    text_color: textColor || null, text_secondary_color: textSecondaryColor || null,
    button_primary_color: buttonPrimaryColor || null, button_primary_text: buttonPrimaryText || null,
    button_secondary_color: buttonSecondaryColor || null, button_secondary_text: buttonSecondaryText || null,
    link_color: linkColor || null, link_hover_color: linkHoverColor || null,
    border_radius: borderRadius, shadow_intensity: shadowIntensity,
    heading_font: headingFont || null, body_font: bodyFont || null,
    font_size_base: fontSizeBase || null, heading_size_h1: headingSizeH1 || null,
    heading_size_h2: headingSizeH2 || null, heading_size_h3: headingSizeH3 || null,
    line_height: lineHeight || null, letter_spacing: letterSpacing || null,
    header_style: headerStyle, footer_style: footerStyle,
    sidebar_enabled: sidebarEnabled, sidebar_position: sidebarPosition,
    product_grid_columns: productGridColumns, product_card_style: productCardStyle,
    navigation_style: navigationStyle,
    meta_title: metaTitle || null, meta_description: metaDescription || null,
    meta_keywords: metaKeywords || null, og_title: ogTitle || null,
    og_description: ogDescription || null, og_image: ogImageUrl || null,
    address_line1: addressLine1 || null, address_line2: addressLine2 || null,
    city: city || null, state_province: stateProvince || null,
    postal_code: postalCode || null, country: country || null,
    latitude, longitude, timezone: timezone || null,
    opening_hours: openingHours || null, legal_pages: legalPages || null,
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
    supportEmail, salesEmail, pressEmail, partnershipEmail, supportPhone, salesPhone,
    whatsappNumber, telegramUsername, youtubeUrl, tiktokUrl, pinterestUrl, snapchatUrl, discordUrl, twitchUrl,
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

  // ---- Submit ----
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
      toast({ title: 'Erreurs de validation', description: 'Veuillez corriger les erreurs avant de continuer.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const success = await updateStore(buildUpdates());

    if (success) {
      await refreshStores().catch(() => {});
      setIsEditing(false);
      setFieldTouched({});
      setLastSaved(new Date());
      toast({ title: 'Boutique mise à jour', description: 'Toutes les modifications ont été enregistrées.', duration: 3000 });
    } else {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder les modifications.', variant: 'destructive', duration: 5000 });
    }
    setIsSubmitting(false);
  }, [name, description, contactEmail, contactPhone, facebookUrl, instagramUrl, twitterUrl, linkedinUrl, updateStore, buildUpdates, refreshStores, toast]);

  // ---- Cancel ----
  const confirmCancel = useCallback(() => {
    setName(store.name);
    setDescription(store.description || '');
    setLogoUrl(store.logo_url || '');
    setBannerUrl(store.banner_url || '');
    setFaviconUrl((store as any).favicon_url || '');
    setAppleTouchIconUrl((store as any).apple_touch_icon_url || '');
    setWatermarkUrl((store as any).watermark_url || '');
    setPlaceholderImageUrl((store as any).placeholder_image_url || '');
    setAbout(store.about || '');
    setInfoMessage(store.info_message || '');
    setInfoMessageColor(store.info_message_color || '#3b82f6');
    setInfoMessageFont(store.info_message_font || 'Inter');
    setContactEmail(store.contact_email || '');
    setContactPhone(store.contact_phone || '');
    setFacebookUrl(store.facebook_url || '');
    setInstagramUrl(store.instagram_url || '');
    setTwitterUrl(store.twitter_url || '');
    setLinkedinUrl(store.linkedin_url || '');
    setIsEditing(false);
    setFieldTouched({});
    setShowCancelConfirm(false);
  }, [store]);

  const handleCancel = useCallback(() => {
    const hasChanges = name !== store.name || description !== (store.description || '') ||
      contactEmail !== (store.contact_email || '') || logoUrl !== (store.logo_url || '');
    if (hasChanges && isEditing) { setShowCancelConfirm(true); return; }
    confirmCancel();
  }, [name, store, description, contactEmail, logoUrl, isEditing, confirmCancel]);

  const handleSlugUpdate = useCallback(async (newSlug: string): Promise<boolean> => {
    return await updateStore({ slug: newSlug });
  }, [updateStore]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: 'Lien copié !', description: 'Le lien de votre boutique a été copié dans le presse-papiers.' });
  }, [storeUrl, toast]);

  // ---- Color/Typography/Layout change handlers ----
  const onColorChange = useCallback((field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      primary_color: setPrimaryColor, secondary_color: setSecondaryColor,
      accent_color: setAccentColor, background_color: setBackgroundColor,
      text_color: setTextColor, text_secondary_color: setTextSecondaryColor,
      button_primary_color: setButtonPrimaryColor, button_primary_text: setButtonPrimaryText,
      button_secondary_color: setButtonSecondaryColor, button_secondary_text: setButtonSecondaryText,
      link_color: setLinkColor, link_hover_color: setLinkHoverColor,
      border_radius: v => setBorderRadius(v as any), shadow_intensity: v => setShadowIntensity(v as any),
    };
    setters[field]?.(value);
  }, []);

  const onTypographyChange = useCallback((field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      heading_font: setHeadingFont, body_font: setBodyFont,
      font_size_base: setFontSizeBase, heading_size_h1: setHeadingSizeH1,
      heading_size_h2: setHeadingSizeH2, heading_size_h3: setHeadingSizeH3,
      line_height: setLineHeight, letter_spacing: setLetterSpacing,
    };
    setters[field]?.(value);
  }, []);

  const onLayoutChange = useCallback((field: string, value: string | number | boolean) => {
    const setters: Record<string, (v: any) => void> = {
      header_style: setHeaderStyle, footer_style: setFooterStyle,
      sidebar_enabled: setSidebarEnabled, sidebar_position: setSidebarPosition,
      product_grid_columns: setProductGridColumns, product_card_style: setProductCardStyle,
      navigation_style: setNavigationStyle,
    };
    setters[field]?.(value);
  }, []);

  return {
    // State
    isEditing, setIsEditing, isSubmitting, showCancelConfirm, setShowCancelConfirm,
    lastSaved, currentTab, setCurrentTab, fieldTouched,
    handleSpaceKeyDown, storeUrl, checkSlugAvailability,
    // Form fields
    name, setName, description, setDescription,
    logoUrl, setLogoUrl, bannerUrl, setBannerUrl,
    faviconUrl, setFaviconUrl, appleTouchIconUrl, setAppleTouchIconUrl,
    watermarkUrl, setWatermarkUrl, placeholderImageUrl, setPlaceholderImageUrl,
    about, setAbout, contactEmail, setContactEmail, contactPhone, setContactPhone,
    facebookUrl, setFacebookUrl, instagramUrl, setInstagramUrl,
    twitterUrl, setTwitterUrl, linkedinUrl, setLinkedinUrl,
    supportEmail, setSupportEmail, salesEmail, setSalesEmail,
    pressEmail, setPressEmail, partnershipEmail, setPartnershipEmail,
    supportPhone, setSupportPhone, salesPhone, setSalesPhone,
    whatsappNumber, setWhatsappNumber, telegramUsername, setTelegramUsername,
    youtubeUrl, setYoutubeUrl, tiktokUrl, setTiktokUrl,
    pinterestUrl, setPinterestUrl, snapchatUrl, setSnapchatUrl,
    discordUrl, setDiscordUrl, twitchUrl, setTwitchUrl,
    infoMessage, setInfoMessage, infoMessageColor, setInfoMessageColor,
    infoMessageFont, setInfoMessageFont,
    // Theme
    primaryColor, secondaryColor, accentColor, backgroundColor,
    textColor, textSecondaryColor, buttonPrimaryColor, buttonPrimaryText,
    buttonSecondaryColor, buttonSecondaryText, linkColor, linkHoverColor,
    borderRadius, shadowIntensity,
    // Typography
    headingFont, bodyFont, fontSizeBase,
    headingSizeH1, headingSizeH2, headingSizeH3, lineHeight, letterSpacing,
    // Layout
    headerStyle, footerStyle, sidebarEnabled, sidebarPosition,
    productGridColumns, productCardStyle, navigationStyle,
    // SEO
    metaTitle, setMetaTitle, metaDescription, setMetaDescription,
    metaKeywords, setMetaKeywords, ogTitle, setOgTitle,
    ogDescription, setOgDescription, ogImageUrl, setOgImageUrl,
    // Location
    addressLine1, setAddressLine1, addressLine2, setAddressLine2,
    city, setCity, stateProvince, setStateProvince,
    postalCode, setPostalCode, country, setCountry,
    latitude, setLatitude, longitude, setLongitude,
    timezone, setTimezone, openingHours, setOpeningHours,
    // Legal & Marketing
    legalPages, setLegalPages, marketingContent, setMarketingContent,
    // Analytics
    googleAnalyticsId, setGoogleAnalyticsId, googleAnalyticsEnabled, setGoogleAnalyticsEnabled,
    facebookPixelId, setFacebookPixelId, facebookPixelEnabled, setFacebookPixelEnabled,
    googleTagManagerId, setGoogleTagManagerId, googleTagManagerEnabled, setGoogleTagManagerEnabled,
    tiktokPixelId, setTiktokPixelId, tiktokPixelEnabled, setTiktokPixelEnabled,
    customTrackingScripts, setCustomTrackingScripts, customScriptsEnabled, setCustomScriptsEnabled,
    // Handlers
    handleSubmit, handleCancel, confirmCancel, handleSlugUpdate, handleCopyUrl,
    handleFieldBlur, validateField, applyConfig,
    onColorChange, onTypographyChange, onLayoutChange,
    // Store operations
    updateStore,
  };
}
