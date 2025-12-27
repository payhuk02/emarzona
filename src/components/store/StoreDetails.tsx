import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Copy,
  ExternalLink,
  Save,
  X,
  BarChart3,
  Settings,
  Palette,
  Globe,
  Search,
  MapPin,
  FileText,
  MessageSquare,
  CheckCircle2,
  Truck,
  Bell,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import type { Store } from '@/hooks/useStores';
import { useToast } from '@/hooks/use-toast';
import StoreSlugEditor from './StoreSlugEditor';
import StoreImageUpload from './StoreImageUpload';
import StoreAnalytics from './StoreAnalytics';
import { validateStoreForm } from '@/lib/validation-utils';
import { validateStoreUpdate } from '@/lib/store-validation';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { StoreThemeSettings } from './StoreThemeSettings';
import { StoreSEOSettings } from './StoreSEOSettings';
import { StoreLocationSettings } from './StoreLocationSettings';
import { StoreLegalPagesComponent } from './StoreLegalPages';
import { StoreMarketingContentComponent } from './StoreMarketingContent';
import { StoreDomainSettings } from './StoreDomainSettings';
import { StoreFieldWithValidation } from './StoreFieldWithValidation';
import { StoreThemeTemplateSelector } from './StoreThemeTemplateSelector';
import { StorePreview } from './StorePreview';
import { StoreConfigManager } from './StoreConfigManager';
import { StoreSEOValidator } from './StoreSEOValidator';
import { StoreSitemapGenerator } from './StoreSitemapGenerator';
import { StoreAnalyticsSettings } from './StoreAnalyticsSettings';
import { StoreCommerceSettings } from './StoreCommerceSettings';
import { StoreNotificationSettings } from './StoreNotificationSettings';
import { StoreCustomizationWizard } from './StoreCustomizationWizard';
import { applyThemeTemplate } from '@/lib/store-theme-templates';
import { generateStoreUrl } from '@/lib/store-utils';
import { useStoreContext } from '@/contexts/StoreContext';
import type { StoreOpeningHours, StoreLegalPages, StoreMarketingContent } from '@/hooks/useStores';

interface ExtendedStore extends Omit<
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
  is_active: boolean; // Requis depuis Store
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
  // Phase 1 - Nouveaux champs
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
  // Domain management fields
  custom_domain?: string | null | undefined;
  domain_status?: 'not_configured' | 'pending' | 'verified' | 'error' | null | undefined;
  domain_verification_token?: string | null | undefined;
  domain_verified_at?: string | null | undefined;
  domain_error_message?: string | null | undefined;
  ssl_enabled?: boolean | null | undefined;
  redirect_www?: boolean | null | undefined;
  redirect_https?: boolean | null | undefined;
  dns_records?: Array<Record<string, unknown>> | null | undefined;
  // Images supplémentaires
  favicon_url?: string | null;
  apple_touch_icon_url?: string | null;
  watermark_url?: string | null;
  placeholder_image_url?: string | null;
  // Contacts supplémentaires
  support_email?: string | null;
  sales_email?: string | null;
  press_email?: string | null;
  partnership_email?: string | null;
  support_phone?: string | null;
  sales_phone?: string | null;
  whatsapp_number?: string | null;
  telegram_username?: string | null;
  // Réseaux sociaux supplémentaires
  youtube_url?: string | null;
  tiktok_url?: string | null;
  pinterest_url?: string | null;
  snapchat_url?: string | null;
  discord_url?: string | null;
  twitch_url?: string | null;
  // Phase 2 - Analytics et Tracking
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

interface StoreDetailsProps {
  store: ExtendedStore;
}

const StoreDetails = ({ store }: StoreDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description || '');
  const [logoUrl, setLogoUrl] = useState(store.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(store.banner_url || '');
  const [faviconUrl, setFaviconUrl] = useState((store as ExtendedStore).favicon_url || '');
  const [appleTouchIconUrl, setAppleTouchIconUrl] = useState(
    (store as ExtendedStore).apple_touch_icon_url || ''
  );
  const [watermarkUrl, setWatermarkUrl] = useState((store as ExtendedStore).watermark_url || '');
  const [placeholderImageUrl, setPlaceholderImageUrl] = useState(
    (store as ExtendedStore).placeholder_image_url || ''
  );
  const [about, setAbout] = useState(store.about || '');
  const [contactEmail, setContactEmail] = useState(store.contact_email || '');
  const [contactPhone, setContactPhone] = useState(store.contact_phone || '');
  const [facebookUrl, setFacebookUrl] = useState(store.facebook_url || '');
  const [instagramUrl, setInstagramUrl] = useState(store.instagram_url || '');
  const [twitterUrl, setTwitterUrl] = useState(store.twitter_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(store.linkedin_url || '');
  // Contacts supplémentaires
  const [supportEmail, setSupportEmail] = useState((store as ExtendedStore).support_email || '');
  const [salesEmail, setSalesEmail] = useState((store as ExtendedStore).sales_email || '');
  const [pressEmail, setPressEmail] = useState((store as ExtendedStore).press_email || '');
  const [partnershipEmail, setPartnershipEmail] = useState(
    (store as ExtendedStore).partnership_email || ''
  );
  const [supportPhone, setSupportPhone] = useState((store as ExtendedStore).support_phone || '');
  const [salesPhone, setSalesPhone] = useState((store as ExtendedStore).sales_phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(
    (store as ExtendedStore).whatsapp_number || ''
  );
  const [telegramUsername, setTelegramUsername] = useState(
    (store as ExtendedStore).telegram_username || ''
  );
  // Réseaux sociaux supplémentaires
  const [youtubeUrl, setYoutubeUrl] = useState((store as ExtendedStore).youtube_url || '');
  const [tiktokUrl, setTiktokUrl] = useState((store as ExtendedStore).tiktok_url || '');
  const [pinterestUrl, setPinterestUrl] = useState((store as ExtendedStore).pinterest_url || '');
  const [snapchatUrl, setSnapchatUrl] = useState((store as ExtendedStore).snapchat_url || '');
  const [discordUrl, setDiscordUrl] = useState((store as ExtendedStore).discord_url || '');
  const [twitchUrl, setTwitchUrl] = useState((store as ExtendedStore).twitch_url || '');
  const [infoMessage, setInfoMessage] = useState(store.info_message || '');
  const [infoMessageColor, setInfoMessageColor] = useState(store.info_message_color || '#3b82f6');
  const [infoMessageFont, setInfoMessageFont] = useState(store.info_message_font || 'Inter');

  // Phase 1 - Thème et couleurs
  const [primaryColor, setPrimaryColor] = useState(store.primary_color || '#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState(store.secondary_color || '#8b5cf6');
  const [accentColor, setAccentColor] = useState(store.accent_color || '#f59e0b');
  const [backgroundColor, setBackgroundColor] = useState(store.background_color || '#ffffff');
  const [textColor, setTextColor] = useState(store.text_color || '#1f2937');
  const [textSecondaryColor, setTextSecondaryColor] = useState(
    store.text_secondary_color || '#6b7280'
  );
  const [buttonPrimaryColor, setButtonPrimaryColor] = useState(
    store.button_primary_color || '#3b82f6'
  );
  const [buttonPrimaryText, setButtonPrimaryText] = useState(
    store.button_primary_text || '#ffffff'
  );
  const [buttonSecondaryColor, setButtonSecondaryColor] = useState(
    store.button_secondary_color || '#e5e7eb'
  );
  const [buttonSecondaryText, setButtonSecondaryText] = useState(
    store.button_secondary_text || '#1f2937'
  );
  const [linkColor, setLinkColor] = useState(store.link_color || '#3b82f6');
  const [linkHoverColor, setLinkHoverColor] = useState(store.link_hover_color || '#2563eb');
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>(
    store.border_radius || 'md'
  );
  const [shadowIntensity, setShadowIntensity] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>(
    store.shadow_intensity || 'md'
  );

  // Typographie
  const [headingFont, setHeadingFont] = useState(store.heading_font || 'Inter');
  const [bodyFont, setBodyFont] = useState(store.body_font || 'Inter');
  const [fontSizeBase, setFontSizeBase] = useState(store.font_size_base || '16px');
  const [headingSizeH1, setHeadingSizeH1] = useState(store.heading_size_h1 || '2.5rem');
  const [headingSizeH2, setHeadingSizeH2] = useState(store.heading_size_h2 || '2rem');
  const [headingSizeH3, setHeadingSizeH3] = useState(store.heading_size_h3 || '1.5rem');
  const [lineHeight, setLineHeight] = useState(store.line_height || '1.6');
  const [letterSpacing, setLetterSpacing] = useState(store.letter_spacing || 'normal');

  // Layout
  const [headerStyle, setHeaderStyle] = useState<'minimal' | 'standard' | 'extended'>(
    store.header_style || 'standard'
  );
  const [footerStyle, setFooterStyle] = useState<'minimal' | 'standard' | 'extended'>(
    store.footer_style || 'standard'
  );
  const [sidebarEnabled, setSidebarEnabled] = useState(store.sidebar_enabled || false);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>(
    store.sidebar_position || 'left'
  );
  const [productGridColumns, setProductGridColumns] = useState(store.product_grid_columns || 3);
  const [productCardStyle, setProductCardStyle] = useState<'minimal' | 'standard' | 'detailed'>(
    store.product_card_style || 'standard'
  );
  const [navigationStyle, setNavigationStyle] = useState<'horizontal' | 'vertical' | 'mega'>(
    store.navigation_style || 'horizontal'
  );

  // SEO
  const [metaTitle, setMetaTitle] = useState(store.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(store.meta_description || '');
  const [metaKeywords, setMetaKeywords] = useState(store.meta_keywords || '');
  const [ogTitle, setOgTitle] = useState(store.og_title || '');
  const [ogDescription, setOgDescription] = useState(store.og_description || '');
  const [ogImageUrl, setOgImageUrl] = useState(store.og_image || '');

  // Localisation
  const [addressLine1, setAddressLine1] = useState(store.address_line1 || '');
  const [addressLine2, setAddressLine2] = useState(store.address_line2 || '');
  const [city, setCity] = useState(store.city || '');
  const [stateProvince, setStateProvince] = useState(store.state_province || '');
  const [postalCode, setPostalCode] = useState(store.postal_code || '');
  const [country, setCountry] = useState(store.country || '');
  const [latitude, setLatitude] = useState<number | null>(store.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(store.longitude || null);
  const [timezone, setTimezone] = useState(store.timezone || 'Africa/Ouagadougou');
  const [openingHours, setOpeningHours] = useState<StoreOpeningHours | null>(
    store.opening_hours || null
  );

  // Pages légales
  const [legalPages, setLegalPages] = useState<StoreLegalPages | null>(store.legal_pages || null);

  // Contenu marketing
  const [marketingContent, setMarketingContent] = useState<StoreMarketingContent | null>(
    store.marketing_content || null
  );

  // Phase 2 - Analytics et Tracking
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(store.google_analytics_id || '');
  const [googleAnalyticsEnabled, setGoogleAnalyticsEnabled] = useState(
    store.google_analytics_enabled || false
  );
  const [facebookPixelId, setFacebookPixelId] = useState(store.facebook_pixel_id || '');
  const [facebookPixelEnabled, setFacebookPixelEnabled] = useState(
    store.facebook_pixel_enabled || false
  );
  const [googleTagManagerId, setGoogleTagManagerId] = useState(store.google_tag_manager_id || '');
  const [googleTagManagerEnabled, setGoogleTagManagerEnabled] = useState(
    store.google_tag_manager_enabled || false
  );
  const [tiktokPixelId, setTiktokPixelId] = useState(store.tiktok_pixel_id || '');
  const [tiktokPixelEnabled, setTiktokPixelEnabled] = useState(store.tiktok_pixel_enabled || false);
  const [customTrackingScripts, setCustomTrackingScripts] = useState(
    store.custom_tracking_scripts || ''
  );
  const [customScriptsEnabled, setCustomScriptsEnabled] = useState(
    store.custom_scripts_enabled || false
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('settings');
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const { updateStore, getStoreUrl, checkSlugAvailability } = useStore();
  const { refreshStores } = useStoreContext();
  const { toast } = useToast();

  const handleSlugUpdate = useCallback(
    async (newSlug: string): Promise<boolean> => {
      return await updateStore({ slug: newSlug });
    },
    [updateStore]
  );

  // ✅ PHASE 4: Mémoriser la validation du formulaire pour éviter recalculs
  const formDataForValidation = useMemo(
    () => ({
      name: name.trim(),
      description: description.trim() || undefined,
      contact_email: contactEmail.trim() || undefined,
      contact_phone: contactPhone.trim() || undefined,
      facebook_url: facebookUrl.trim() || undefined,
      instagram_url: instagramUrl.trim() || undefined,
      twitter_url: twitterUrl.trim() || undefined,
      linkedin_url: linkedinUrl.trim() || undefined,
    }),
    [
      name,
      description,
      contactEmail,
      contactPhone,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      linkedinUrl,
    ]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation du formulaire
      const formData = formDataForValidation;

      // Validation Zod complète
      const zodValidation = validateStoreUpdate(formData);

      // Conserver la validation manuelle pour compatibilité
      const manualValidation = validateStoreForm({
        name: formData.name,
        description: formData.description,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        twitter_url: formData.twitter_url,
        linkedin_url: formData.linkedin_url,
      });

      // Combiner les erreurs
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

      const  updates: Partial<Store> & Record<string, unknown> = {
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
        // Contacts supplémentaires
        support_email: supportEmail.trim() || null,
        sales_email: salesEmail.trim() || null,
        press_email: pressEmail.trim() || null,
        partnership_email: partnershipEmail.trim() || null,
        support_phone: supportPhone.trim() || null,
        sales_phone: salesPhone.trim() || null,
        whatsapp_number: whatsappNumber.trim() || null,
        telegram_username: telegramUsername.trim() || null,
        // Réseaux sociaux supplémentaires
        youtube_url: youtubeUrl.trim() || null,
        tiktok_url: tiktokUrl.trim() || null,
        pinterest_url: pinterestUrl.trim() || null,
        snapchat_url: snapchatUrl.trim() || null,
        discord_url: discordUrl.trim() || null,
        twitch_url: twitchUrl.trim() || null,
        // Phase 1 - Thème et couleurs
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
        // Typographie
        heading_font: headingFont || null,
        body_font: bodyFont || null,
        font_size_base: fontSizeBase || null,
        heading_size_h1: headingSizeH1 || null,
        heading_size_h2: headingSizeH2 || null,
        heading_size_h3: headingSizeH3 || null,
        line_height: lineHeight || null,
        letter_spacing: letterSpacing || null,
        // Layout
        header_style: headerStyle,
        footer_style: footerStyle,
        sidebar_enabled: sidebarEnabled,
        sidebar_position: sidebarPosition,
        product_grid_columns: productGridColumns,
        product_card_style: productCardStyle,
        navigation_style: navigationStyle,
        // SEO
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        meta_keywords: metaKeywords || null,
        og_title: ogTitle || null,
        og_description: ogDescription || null,
        og_image: ogImageUrl || null,
        // Localisation
        address_line1: addressLine1 || null,
        address_line2: addressLine2 || null,
        city: city || null,
        state_province: stateProvince || null,
        postal_code: postalCode || null,
        country: country || null,
        latitude: latitude,
        longitude: longitude,
        timezone: timezone || null,
        opening_hours: openingHours || null,
        // Pages légales
        legal_pages: legalPages || null,
        // Contenu marketing
        marketing_content: marketingContent || null,
        // Phase 2 - Analytics et Tracking
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
      };

      const success = await updateStore(updates);

      if (success) {
        // Rafraîchir la liste des boutiques afin que les props `store`
        // (logo_url, banner_url, favicon_url, etc.) reflètent bien les nouvelles valeurs
        await refreshStores().catch(() => {
          // On journalise simplement : l'UI reste à jour grâce aux states locaux (logoUrl, bannerUrl, ...)
          // même si le refetch échoue.
        });

        setIsEditing(false);
        setFieldTouched({});
        setLastSaved(new Date());
        toast({
          title: 'Boutique mise à jour',
          description: 'Toutes les modifications ont été enregistrées.',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de sauvegarder les modifications. Veuillez réessayer.',
          variant: 'destructive',
          duration: 5000,
        });
      }

      setIsSubmitting(false);
    },
    [
      formDataForValidation,
      updateStore,
      toast,
      refreshStores,
      name,
      description,
      logoUrl,
      bannerUrl,
      faviconUrl,
      appleTouchIconUrl,
      watermarkUrl,
      placeholderImageUrl,
      about,
      infoMessage,
      infoMessageColor,
      infoMessageFont,
      contactEmail,
      contactPhone,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      linkedinUrl,
      supportEmail,
      salesEmail,
      pressEmail,
      partnershipEmail,
      supportPhone,
      salesPhone,
      whatsappNumber,
      telegramUsername,
      youtubeUrl,
      tiktokUrl,
      pinterestUrl,
      snapchatUrl,
      discordUrl,
      twitchUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      textSecondaryColor,
      buttonPrimaryColor,
      buttonPrimaryText,
      buttonSecondaryColor,
      buttonSecondaryText,
      linkColor,
      linkHoverColor,
      borderRadius,
      shadowIntensity,
      headingFont,
      bodyFont,
      fontSizeBase,
      headingSizeH1,
      headingSizeH2,
      headingSizeH3,
      lineHeight,
      letterSpacing,
      headerStyle,
      footerStyle,
      sidebarEnabled,
      sidebarPosition,
      productGridColumns,
      productCardStyle,
      navigationStyle,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogTitle,
      ogDescription,
      ogImageUrl,
      addressLine1,
      addressLine2,
      city,
      stateProvince,
      postalCode,
      country,
      latitude,
      longitude,
      timezone,
      openingHours,
      legalPages,
      marketingContent,
      googleAnalyticsId,
      googleAnalyticsEnabled,
      facebookPixelId,
      facebookPixelEnabled,
      googleTagManagerId,
      googleTagManagerEnabled,
      tiktokPixelId,
      tiktokPixelEnabled,
      customTrackingScripts,
      customScriptsEnabled,
    ]
  );

  // Validation en temps réel pour les emails
  const validateEmail = useCallback((email: string): string | null => {
    if (!email.trim()) return null; // Email optionnel
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : "Format d'email invalide";
  }, []);

  // Validation en temps réel pour les URLs
  const validateUrl = useCallback((url: string): string | null => {
    if (!url.trim()) return null; // URL optionnelle
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return null;
    } catch {
      return "Format d'URL invalide (ex: https://example.com)";
    }
  }, []);

  // Handler pour marquer un champ comme touché
  const handleFieldBlur = useCallback((fieldName: string) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  // Validation en temps réel d'un champ
  const validateField = useCallback(
    (fieldName: string, value: string) => {
      if (!fieldTouched[fieldName]) return null;

      switch (fieldName) {
        case 'contact_email':
        case 'support_email':
        case 'sales_email':
        case 'press_email':
        case 'partnership_email':
          return validateEmail(value);
        case 'facebook_url':
        case 'instagram_url':
        case 'twitter_url':
        case 'linkedin_url':
        case 'youtube_url':
        case 'tiktok_url':
        case 'pinterest_url':
        case 'snapchat_url':
        case 'discord_url':
        case 'twitch_url':
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

  // Mémoriser l'URL de la boutique
  const storeUrl = useMemo(() => getStoreUrl(), [getStoreUrl]);

  // Handler pour copier l'URL avec feedback
  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(storeUrl);
    toast({
      title: 'Lien copié !',
      description: 'Le lien de votre boutique a été copié dans le presse-papiers.',
    });
  }, [storeUrl, toast]);

  const confirmCancel = useCallback(() => {
    setName(store.name);
    setDescription(store.description || '');
    setLogoUrl(store.logo_url || '');
    setBannerUrl(store.banner_url || '');
    setFaviconUrl((store as ExtendedStore).favicon_url || '');
    setAppleTouchIconUrl((store as ExtendedStore).apple_touch_icon_url || '');
    setWatermarkUrl((store as ExtendedStore).watermark_url || '');
    setPlaceholderImageUrl((store as ExtendedStore).placeholder_image_url || '');
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
    // Réinitialiser tous les autres champs...
    setIsEditing(false);
    setFieldTouched({});
    setShowCancelConfirm(false);
  }, [store]);

  const handleCancel = useCallback(() => {
    // Vérifier s'il y a des modifications non sauvegardées
    const hasChanges =
      name !== store.name ||
      description !== (store.description || '') ||
      contactEmail !== (store.contact_email || '') ||
      logoUrl !== (store.logo_url || '');

    if (hasChanges && isEditing) {
      setShowCancelConfirm(true);
      return;
    }

    // Réinitialiser sans confirmation si pas de changements
    confirmCancel();
  }, [name, store, description, contactEmail, logoUrl, isEditing, confirmCancel]);

  /**
   * Fonction helper pour rendre le contenu de chaque onglet dans le wizard
   */
  const renderTabContent = useCallback(
    (tabKey: string) => {
      switch (tabKey) {
        case 'settings':
          return (
            <div className="space-y-4 sm:space-y-6">
              {/* Export/Import Configuration */}
              {isEditing && (
                <StoreConfigManager
                  store={store as Store}
                  onImportConfig={config => {
                    if (config.primary_color) setPrimaryColor(config.primary_color);
                    if (config.secondary_color) setSecondaryColor(config.secondary_color);
                    if (config.accent_color) setAccentColor(config.accent_color);
                    if (config.background_color) setBackgroundColor(config.background_color);
                    if (config.text_color) setTextColor(config.text_color);
                    if (config.text_secondary_color)
                      setTextSecondaryColor(config.text_secondary_color);
                    if (config.button_primary_color)
                      setButtonPrimaryColor(config.button_primary_color);
                    if (config.button_primary_text)
                      setButtonPrimaryText(config.button_primary_text);
                    if (config.button_secondary_color)
                      setButtonSecondaryColor(config.button_secondary_color);
                    if (config.button_secondary_text)
                      setButtonSecondaryText(config.button_secondary_text);
                    if (config.link_color) setLinkColor(config.link_color);
                    if (config.link_hover_color) setLinkHoverColor(config.link_hover_color);
                    if (config.border_radius)
                      setBorderRadius(
                        config.border_radius as 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
                      );
                    if (config.shadow_intensity)
                      setShadowIntensity(
                        config.shadow_intensity as 'none' | 'sm' | 'md' | 'lg' | 'xl'
                      );
                    if (config.heading_font) setHeadingFont(config.heading_font);
                    if (config.body_font) setBodyFont(config.body_font);
                    if (config.font_size_base) setFontSizeBase(config.font_size_base);
                    if (config.heading_size_h1) setHeadingSizeH1(config.heading_size_h1);
                    if (config.heading_size_h2) setHeadingSizeH2(config.heading_size_h2);
                    if (config.heading_size_h3) setHeadingSizeH3(config.heading_size_h3);
                    if (config.line_height) setLineHeight(config.line_height);
                    if (config.letter_spacing) setLetterSpacing(config.letter_spacing);
                    if (config.header_style)
                      setHeaderStyle(config.header_style as 'minimal' | 'standard' | 'extended');
                    if (config.footer_style)
                      setFooterStyle(config.footer_style as 'minimal' | 'standard' | 'extended');
                    if (config.product_grid_columns)
                      setProductGridColumns(config.product_grid_columns);
                    if (config.product_card_style)
                      setProductCardStyle(
                        config.product_card_style as 'minimal' | 'standard' | 'detailed'
                      );
                    if (config.navigation_style)
                      setNavigationStyle(
                        config.navigation_style as 'horizontal' | 'vertical' | 'mega'
                      );
                    if (config.meta_title) setMetaTitle(config.meta_title);
                    if (config.meta_description) setMetaDescription(config.meta_description);
                    if (config.meta_keywords) setMetaKeywords(config.meta_keywords);
                    if (
                      'og_title' in config &&
                      config.og_title &&
                      typeof config.og_title === 'string'
                    )
                      setOgTitle(config.og_title);
                    if (
                      'og_description' in config &&
                      config.og_description &&
                      typeof config.og_description === 'string'
                    )
                      setOgDescription(config.og_description);
                    if (config.og_image) setOgImageUrl(config.og_image);
                    toast({
                      title: 'Configuration importée',
                      description:
                        'La configuration a été importée. Vérifiez les modifications avant de sauvegarder.',
                    });
                  }}
                />
              )}

              <Card className="store-card">
                <CardHeader className="store-card-header">
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-semibold">
                      Paramètres de la boutique
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base mt-1">
                      Gérez tous les détails de votre boutique en ligne
                    </CardDescription>
                    {lastSaved && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Dernière sauvegarde :{' '}
                        {lastSaved.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="store-card-content">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Nom de la boutique *</Label>
                        <Input
                          id="edit-name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          onKeyDown={handleSpaceKeyDown}
                          required
                          disabled={isSubmitting}
                        />
                        {name !== store.name && (
                          <p className="text-xs text-muted-foreground">
                            Nouveau slug :{' '}
                            {name
                              .toLowerCase()
                              .trim()
                              .replace(/[^a-z0-9\s-]/g, '')
                              .replace(/\s+/g, '-')}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Description courte</Label>
                        <Textarea
                          id="edit-description"
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          onKeyDown={handleSpaceKeyDown}
                          rows={3}
                          placeholder="Une brève description de votre boutique"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StoreFieldWithValidation
                          id="contact-email"
                          label="Email de contact"
                          type="email"
                          value={contactEmail}
                          onChange={setContactEmail}
                          onBlur={() => handleFieldBlur('contact_email')}
                          placeholder="contact@votreboutique.com"
                          disabled={isSubmitting}
                          touched={fieldTouched.contact_email}
                          validationFn={val => validateField('contact_email', val)}
                          hint="Email principal pour les contacts clients"
                        />
                        <StoreFieldWithValidation
                          id="contact-phone"
                          label="Téléphone de contact"
                          type="tel"
                          value={contactPhone}
                          onChange={setContactPhone}
                          onBlur={() => handleFieldBlur('contact_phone')}
                          placeholder="+225 XX XX XX XX"
                          disabled={isSubmitting}
                          touched={fieldTouched.contact_phone}
                          hint="Format international recommandé"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="about">À propos de votre boutique</Label>
                        <Textarea
                          id="about"
                          value={about}
                          onChange={e => setAbout(e.target.value)}
                          onKeyDown={handleSpaceKeyDown}
                          rows={8}
                          placeholder="Racontez l'histoire de votre boutique, vos valeurs, votre mission..."
                          disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                          Ce texte apparaîtra dans l'onglet "À propos" de votre boutique
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nom</p>
                        <p className="text-base font-semibold">{store.name}</p>
                      </div>
                      {store.description && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Description</p>
                          <p className="text-sm">{store.description}</p>
                        </div>
                      )}
                      {store.contact_email && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Email de contact
                          </p>
                          <p className="text-sm">{store.contact_email}</p>
                        </div>
                      )}
                      {store.contact_phone && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                          <p className="text-sm">{store.contact_phone}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );

        case 'appearance':
          return (
            <div className="space-y-4 sm:space-y-6">
              {isEditing && (
                <StoreThemeTemplateSelector
                  onSelectTemplate={template => {
                    const config = applyThemeTemplate(template);
                    if (config.primary_color) setPrimaryColor(config.primary_color);
                    if (config.secondary_color) setSecondaryColor(config.secondary_color);
                    if (config.accent_color) setAccentColor(config.accent_color);
                    if (config.background_color) setBackgroundColor(config.background_color);
                    if (config.text_color) setTextColor(config.text_color);
                    if (config.text_secondary_color)
                      setTextSecondaryColor(config.text_secondary_color);
                    if (config.button_primary_color)
                      setButtonPrimaryColor(config.button_primary_color);
                    if (config.button_primary_text)
                      setButtonPrimaryText(config.button_primary_text);
                    if (config.button_secondary_color)
                      setButtonSecondaryColor(config.button_secondary_color);
                    if (config.button_secondary_text)
                      setButtonSecondaryText(config.button_secondary_text);
                    if (config.link_color) setLinkColor(config.link_color);
                    if (config.link_hover_color) setLinkHoverColor(config.link_hover_color);
                    if (config.heading_font) setHeadingFont(config.heading_font);
                    if (config.body_font) setBodyFont(config.body_font);
                    if (config.font_size_base) setFontSizeBase(config.font_size_base);
                    if (config.heading_size_h1) setHeadingSizeH1(config.heading_size_h1);
                    if (config.heading_size_h2) setHeadingSizeH2(config.heading_size_h2);
                    if (config.heading_size_h3) setHeadingSizeH3(config.heading_size_h3);
                    if (config.line_height) setLineHeight(config.line_height);
                    if (config.letter_spacing) setLetterSpacing(config.letter_spacing);
                    if (config.border_radius) setBorderRadius(config.border_radius);
                    if (config.shadow_intensity) setShadowIntensity(config.shadow_intensity);
                    if (config.header_style) setHeaderStyle(config.header_style);
                    if (config.footer_style) setFooterStyle(config.footer_style);
                    if (config.product_grid_columns)
                      setProductGridColumns(config.product_grid_columns);
                    if (config.product_card_style) setProductCardStyle(config.product_card_style);
                    if (config.navigation_style) setNavigationStyle(config.navigation_style);
                    toast({
                      title: 'Thème appliqué',
                      description: `Le thème "${template.name}" a été appliqué avec succès.`,
                    });
                  }}
                />
              )}
              {isEditing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl font-semibold">
                      Prévisualisation
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Aperçu en temps réel de vos personnalisations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StorePreview
                      store={{ ...store, is_active: store.is_active ?? true } as Store}
                      previewData={{
                        primaryColor,
                        secondaryColor,
                        accentColor,
                        backgroundColor,
                        textColor,
                        headingFont,
                        bodyFont,
                        headerStyle,
                        footerStyle,
                        productGridColumns,
                        productCardStyle,
                      }}
                    />
                  </CardContent>
                </Card>
              )}
              <StoreThemeSettings
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                accentColor={accentColor}
                backgroundColor={backgroundColor}
                textColor={textColor}
                textSecondaryColor={textSecondaryColor}
                buttonPrimaryColor={buttonPrimaryColor}
                buttonPrimaryText={buttonPrimaryText}
                buttonSecondaryColor={buttonSecondaryColor}
                buttonSecondaryText={buttonSecondaryText}
                linkColor={linkColor}
                linkHoverColor={linkHoverColor}
                borderRadius={borderRadius}
                shadowIntensity={shadowIntensity}
                headingFont={headingFont}
                bodyFont={bodyFont}
                fontSizeBase={fontSizeBase}
                headingSizeH1={headingSizeH1}
                headingSizeH2={headingSizeH2}
                headingSizeH3={headingSizeH3}
                lineHeight={lineHeight}
                letterSpacing={letterSpacing}
                headerStyle={headerStyle}
                footerStyle={footerStyle}
                sidebarEnabled={sidebarEnabled}
                sidebarPosition={sidebarPosition}
                productGridColumns={productGridColumns}
                productCardStyle={productCardStyle}
                navigationStyle={navigationStyle}
                onColorChange={(field, value) => {
                  const  setters: Record<string, (v: string) => void> = {
                    primary_color: setPrimaryColor,
                    secondary_color: setSecondaryColor,
                    accent_color: setAccentColor,
                    background_color: setBackgroundColor,
                    text_color: setTextColor,
                    text_secondary_color: setTextSecondaryColor,
                    button_primary_color: setButtonPrimaryColor,
                    button_primary_text: setButtonPrimaryText,
                    button_secondary_color: setButtonSecondaryColor,
                    button_secondary_text: setButtonSecondaryText,
                    link_color: setLinkColor,
                    link_hover_color: setLinkHoverColor,
                    border_radius: v =>
                      setBorderRadius(v as 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'),
                    shadow_intensity: v =>
                      setShadowIntensity(v as 'none' | 'sm' | 'md' | 'lg' | 'xl'),
                  };
                  setters[field]?.(value);
                }}
                onTypographyChange={(field, value) => {
                  const  setters: Record<string, (v: string) => void> = {
                    heading_font: setHeadingFont,
                    body_font: setBodyFont,
                    font_size_base: setFontSizeBase,
                    heading_size_h1: setHeadingSizeH1,
                    heading_size_h2: setHeadingSizeH2,
                    heading_size_h3: setHeadingSizeH3,
                    line_height: setLineHeight,
                    letter_spacing: setLetterSpacing,
                  };
                  setters[field]?.(value);
                }}
                onLayoutChange={(field, value) => {
                  type HeaderFooterStyle = 'minimal' | 'standard' | 'extended';
                  type SidebarPosition = 'left' | 'right';
                  type ProductCardStyle = 'minimal' | 'standard' | 'detailed';
                  type NavigationStyle = 'horizontal' | 'vertical' | 'mega';

                  const  setters: Record<string, (v: string | number | boolean) => void> = {
                    header_style: v => setHeaderStyle(v as HeaderFooterStyle),
                    footer_style: v => setFooterStyle(v as HeaderFooterStyle),
                    sidebar_enabled: v => setSidebarEnabled(Boolean(v)),
                    sidebar_position: v => setSidebarPosition(v as SidebarPosition),
                    product_grid_columns: v => setProductGridColumns(Number(v)),
                    product_card_style: v => setProductCardStyle(v as ProductCardStyle),
                    navigation_style: v => setNavigationStyle(v as NavigationStyle),
                  };
                  setters[field]?.(value);
                }}
              />
              <Card className="store-card">
                <CardHeader className="store-card-header">
                  <CardTitle className="text-lg sm:text-xl font-semibold">
                    Images de la boutique
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Logo et bannière de votre boutique
                  </CardDescription>
                </CardHeader>
                <CardContent className="store-card-content">
                  {isEditing ? (
                    <div className="space-y-6">
                      <StoreImageUpload
                        label="Logo de la boutique"
                        value={logoUrl}
                        onChange={setLogoUrl}
                        disabled={isSubmitting}
                        aspectRatio="square"
                        description="Format carré recommandé (ex: 500x500px)"
                        imageType="store-logo"
                      />
                      <StoreImageUpload
                        label="Bannière de la boutique"
                        value={bannerUrl}
                        onChange={setBannerUrl}
                        disabled={isSubmitting}
                        aspectRatio="banner"
                        description="Format paysage recommandé (ex: 1920x640px)"
                        imageType="store-banner"
                      />
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold">Images supplémentaires</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <StoreImageUpload
                            label="Favicon"
                            value={faviconUrl}
                            onChange={setFaviconUrl}
                            disabled={isSubmitting}
                            aspectRatio="square"
                            description="Format carré recommandé (16×16, 32×32, 48×48px)"
                            imageType="store-favicon"
                          />
                          <StoreImageUpload
                            label="Apple Touch Icon"
                            value={appleTouchIconUrl}
                            onChange={setAppleTouchIconUrl}
                            disabled={isSubmitting}
                            aspectRatio="square"
                            description="Format carré 180×180px recommandé"
                            imageType="store-apple-touch-icon"
                          />
                          <StoreImageUpload
                            label="Filigrane (Watermark)"
                            value={watermarkUrl}
                            onChange={setWatermarkUrl}
                            disabled={isSubmitting}
                            aspectRatio="square"
                            description="Image de filigrane pour protéger vos images"
                            imageType="store-watermark"
                          />
                          <StoreImageUpload
                            label="Image placeholder"
                            value={placeholderImageUrl}
                            onChange={setPlaceholderImageUrl}
                            disabled={isSubmitting}
                            aspectRatio="square"
                            description="Image par défaut pour les produits sans image"
                            imageType="store-placeholder"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(logoUrl || store.logo_url) && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Logo</p>
                            <img
                              src={logoUrl || store.logo_url || ''}
                              alt={`Logo de la boutique ${store.name}`}
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                        {(bannerUrl || store.banner_url) && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground mb-2">Bannière</p>
                            <img
                              src={bannerUrl || store.banner_url || ''}
                              alt={`Bannière de la boutique ${store.name}`}
                              className="w-full max-h-48 object-cover object-bottom rounded-lg border"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="pt-4 border-t">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </div>
          );

        case 'seo':
          return (
            <div className="space-y-4 sm:space-y-6">
              <Card className="store-card">
                <CardHeader className="store-card-header">
                  <CardTitle className="text-lg sm:text-xl font-semibold">
                    Configuration SEO
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Optimisez le référencement de votre boutique pour les moteurs de recherche
                  </CardDescription>
                </CardHeader>
                <CardContent className="store-card-content">
                  <StoreSEOSettings
                    metaTitle={metaTitle}
                    metaDescription={metaDescription}
                    metaKeywords={metaKeywords}
                    ogTitle={ogTitle}
                    ogDescription={ogDescription}
                    ogImageUrl={ogImageUrl}
                    storeUrl={
                      store.custom_domain
                        ? `https://${store.custom_domain}`
                        : store.slug
                          ? generateStoreUrl(store.slug)
                          : undefined
                    }
                    faviconUrl={(store as ExtendedStore).favicon_url || undefined}
                    onChange={(field, value) => {
                      const  setters: Record<string, (v: string) => void> = {
                        meta_title: setMetaTitle,
                        meta_description: setMetaDescription,
                        meta_keywords: setMetaKeywords,
                        og_title: setOgTitle,
                        og_description: setOgDescription,
                        og_image_url: setOgImageUrl,
                      };
                      setters[field]?.(value);
                    }}
                  />
                  <div className="pt-4 border-t mt-6">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );

        case 'location':
          return (
            <div className="space-y-4 sm:space-y-6">
              <Card className="store-card">
                <CardHeader className="store-card-header">
                  <CardTitle className="text-lg sm:text-xl font-semibold">
                    Localisation et horaires
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Configurez l'adresse et les horaires d'ouverture de votre boutique
                  </CardDescription>
                </CardHeader>
                <CardContent className="store-card-content">
                  <StoreLocationSettings
                    addressLine1={addressLine1}
                    addressLine2={addressLine2}
                    city={city}
                    stateProvince={stateProvince}
                    postalCode={postalCode}
                    country={country}
                    latitude={latitude}
                    longitude={longitude}
                    timezone={timezone}
                    openingHours={openingHours}
                    onAddressChange={(field, value) => {
                      const  setters: Record<string, (v: string) => void> = {
                        address_line1: setAddressLine1,
                        address_line2: setAddressLine2,
                        city: setCity,
                        state_province: setStateProvince,
                        postal_code: setPostalCode,
                        country: setCountry,
                      };
                      setters[field]?.(value);
                    }}
                    onLocationChange={(field, value) => {
                      if (field === 'latitude') setLatitude(value);
                      if (field === 'longitude') setLongitude(value);
                    }}
                    onTimezoneChange={setTimezone}
                    onOpeningHoursChange={setOpeningHours}
                  />
                  <div className="pt-4 border-t mt-6">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );

        case 'legal':
          return (
            <div className="space-y-4 sm:space-y-6">
              <Card className="store-card">
                <CardHeader className="store-card-header">
                  <CardTitle className="text-lg sm:text-xl font-semibold">Pages légales</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Gérez les pages légales de votre boutique (CGV, politique de confidentialité,
                    etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="store-card-content">
                  <StoreLegalPagesComponent
                    legalPages={legalPages}
                    onChange={(field, value) => {
                      setLegalPages(
                        prev =>
                          ({
                            ...prev,
                            [field]: value,
                          }) as StoreLegalPages
                      );
                    }}
                  />
                  <div className="pt-4 border-t mt-6">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );

        case 'url':
          return (
            <div className="space-y-6">
              <StoreSlugEditor
                currentSlug={store.slug}
                onSlugChange={handleSlugUpdate}
                onCheckAvailability={checkSlugAvailability}
                storeId={store.id}
              />
              <Card className="shadow-medium border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Lien de votre boutique</CardTitle>
                  <CardDescription className="text-sm">
                    Partagez ce lien pour que vos clients accèdent à votre boutique
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      value={storeUrl}
                      readOnly
                      className="font-mono text-xs sm:text-sm flex-1 touch-manipulation"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUrl}
                      className="touch-manipulation shrink-0"
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Copier
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <StoreDomainSettings
                store={store as unknown as Parameters<typeof StoreDomainSettings>[0]['store']}
                onUpdateStore={async (updates: Partial<Store>) => {
                  const success = await updateStore(updates);
                  if (success) {
                    // Rafraîchir les données du store si nécessaire
                  }
                  return success;
                }}
              />
            </div>
          );

        case 'marketing':
          return (
            <div className="space-y-4 sm:space-y-6">
              <StoreMarketingContentComponent
                marketingContent={marketingContent}
                onChange={setMarketingContent}
              />
            </div>
          );

        case 'analytics':
          return (
            <div className="space-y-4 sm:space-y-6">
              <Card className="store-card">
                <CardHeader className="store-card-header">
                  <CardTitle className="text-lg sm:text-xl font-semibold">
                    Analytics de votre boutique
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Suivez les performances de votre boutique avec des statistiques détaillées
                  </CardDescription>
                </CardHeader>
                <CardContent className="store-card-content">
                  <StoreAnalytics storeId={store.id} />
                </CardContent>
              </Card>
              {isEditing && (
                <Card className="store-card">
                  <CardHeader className="store-card-header">
                    <CardTitle className="text-lg sm:text-xl font-semibold">
                      Configuration du tracking
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Configurez vos outils de suivi et d'analyse pour mesurer les performances de
                      votre boutique
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="store-card-content">
                    <StoreAnalyticsSettings
                      googleAnalyticsId={googleAnalyticsId}
                      googleAnalyticsEnabled={googleAnalyticsEnabled}
                      onGoogleAnalyticsChange={(id, enabled) => {
                        setGoogleAnalyticsId(id);
                        setGoogleAnalyticsEnabled(enabled);
                      }}
                      facebookPixelId={facebookPixelId}
                      facebookPixelEnabled={facebookPixelEnabled}
                      onFacebookPixelChange={(id, enabled) => {
                        setFacebookPixelId(id);
                        setFacebookPixelEnabled(enabled);
                      }}
                      googleTagManagerId={googleTagManagerId}
                      googleTagManagerEnabled={googleTagManagerEnabled}
                      onGoogleTagManagerChange={(id, enabled) => {
                        setGoogleTagManagerId(id);
                        setGoogleTagManagerEnabled(enabled);
                      }}
                      tiktokPixelId={tiktokPixelId}
                      tiktokPixelEnabled={tiktokPixelEnabled}
                      onTiktokPixelChange={(id, enabled) => {
                        setTiktokPixelId(id);
                        setTiktokPixelEnabled(enabled);
                      }}
                      customScripts={customTrackingScripts}
                      customScriptsEnabled={customScriptsEnabled}
                      onCustomScriptsChange={(scripts, enabled) => {
                        setCustomTrackingScripts(scripts);
                        setCustomScriptsEnabled(enabled);
                      }}
                    />
                    <div className="pt-4 border-t mt-6">
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );

        case 'commerce':
          return (
            <div className="space-y-4 sm:space-y-6">
              <StoreCommerceSettings storeId={store.id} />
            </div>
          );

        case 'notifications':
          return (
            <div className="space-y-4 sm:space-y-6">
              <StoreNotificationSettings storeId={store.id} />
            </div>
          );

        default:
          return <div>Contenu non disponible pour {tabKey}</div>;
      }
    },
    [
      isEditing,
      store,
      lastSaved,
      isSubmitting,
      name,
      description,
      logoUrl,
      bannerUrl,
      faviconUrl,
      appleTouchIconUrl,
      watermarkUrl,
      placeholderImageUrl,
      about,
      infoMessage,
      infoMessageColor,
      infoMessageFont,
      contactEmail,
      contactPhone,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      linkedinUrl,
      supportEmail,
      salesEmail,
      pressEmail,
      partnershipEmail,
      supportPhone,
      salesPhone,
      whatsappNumber,
      telegramUsername,
      youtubeUrl,
      tiktokUrl,
      pinterestUrl,
      snapchatUrl,
      discordUrl,
      twitchUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      textSecondaryColor,
      buttonPrimaryColor,
      buttonPrimaryText,
      buttonSecondaryColor,
      buttonSecondaryText,
      linkColor,
      linkHoverColor,
      borderRadius,
      shadowIntensity,
      headingFont,
      bodyFont,
      fontSizeBase,
      headingSizeH1,
      headingSizeH2,
      headingSizeH3,
      lineHeight,
      letterSpacing,
      headerStyle,
      footerStyle,
      sidebarEnabled,
      sidebarPosition,
      productGridColumns,
      productCardStyle,
      navigationStyle,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogTitle,
      ogDescription,
      ogImageUrl,
      addressLine1,
      addressLine2,
      city,
      stateProvince,
      postalCode,
      country,
      latitude,
      longitude,
      timezone,
      openingHours,
      legalPages,
      marketingContent,
      googleAnalyticsId,
      googleAnalyticsEnabled,
      facebookPixelId,
      facebookPixelEnabled,
      googleTagManagerId,
      googleTagManagerEnabled,
      tiktokPixelId,
      tiktokPixelEnabled,
      customTrackingScripts,
      customScriptsEnabled,
      storeUrl,
      handleSubmit,
      handleCancel,
      handleCopyUrl,
      handleSlugUpdate,
      checkSlugAvailability,
      updateStore,
      toast,
      setPrimaryColor,
      setSecondaryColor,
      setAccentColor,
      setBackgroundColor,
      setTextColor,
      setTextSecondaryColor,
      setButtonPrimaryColor,
      setButtonPrimaryText,
      setButtonSecondaryColor,
      setButtonSecondaryText,
      setLinkColor,
      setLinkHoverColor,
      setBorderRadius,
      setShadowIntensity,
      setHeadingFont,
      setBodyFont,
      setFontSizeBase,
      setHeadingSizeH1,
      setHeadingSizeH2,
      setHeadingSizeH3,
      setLineHeight,
      setLetterSpacing,
      setHeaderStyle,
      setFooterStyle,
      setProductGridColumns,
      setProductCardStyle,
      setNavigationStyle,
      setMetaTitle,
      setMetaDescription,
      setMetaKeywords,
      setOgTitle,
      setOgDescription,
      setOgImageUrl,
      setAddressLine1,
      setAddressLine2,
      setCity,
      setStateProvince,
      setPostalCode,
      setCountry,
      setLatitude,
      setLongitude,
      setTimezone,
      setOpeningHours,
      setLegalPages,
      setMarketingContent,
      setGoogleAnalyticsId,
      setGoogleAnalyticsEnabled,
      setFacebookPixelId,
      setFacebookPixelEnabled,
      setGoogleTagManagerId,
      setGoogleTagManagerEnabled,
      setTiktokPixelId,
      setTiktokPixelEnabled,
      setCustomTrackingScripts,
      setCustomScriptsEnabled,
    ]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header avec informations de la boutique */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 sm:p-6 border border-primary/20 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {logoUrl || store.logo_url ? (
              <img
                src={logoUrl || store.logo_url || ''}
                alt={`Logo ${store.name}`}
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover border border-border shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center border border-purple-500/30">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
                {store.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Boutique en ligne</p>
              {store.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                  {store.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10"
                aria-label="Modifier la boutique"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Modifier</span>
                <span className="sm:hidden">Modif.</span>
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10"
                  aria-label="Enregistrer les modifications"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Enregistrement...</span>
                      <span className="sm:hidden">Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Enregistrer</span>
                      <span className="sm:hidden">Sauver</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10"
                  aria-label="Annuler les modifications"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Annuler</span>
                  <span className="sm:hidden">Annul.</span>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/stores/${store.slug}`, '_blank')}
              className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10"
              aria-label={`Ouvrir la boutique ${store.name} dans un nouvel onglet`}
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Voir la boutique</span>
              <span className="sm:hidden">Voir</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10"
              aria-label={`Copier le lien de la boutique ${store.name}`}
            >
              <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Copier le lien</span>
              <span className="sm:hidden">Copier</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Store Customization Wizard avec cartes en grille */}
      <StoreCustomizationWizard
        store={store as Store}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        renderContent={renderTabContent}
      />

      {/* Tabs pour le contenu - masqués car le contenu est rendu dans le wizard */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full hidden">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto hidden">
          {/* 1. Configuration Essentielle */}
          <TabsTrigger
            value="settings"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Paramètres</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>

          {/* 2. Apparence & Design (Fusion Apparence + Thème) */}
          <TabsTrigger
            value="appearance"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
          >
            <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Apparence</span>
            <span className="sm:hidden">Style</span>
          </TabsTrigger>

          {/* 3. Localisation */}
          <TabsTrigger
            value="location"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
          >
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Localisation</span>
            <span className="sm:hidden">Local.</span>
          </TabsTrigger>

          {/* 4. SEO */}
          <TabsTrigger
            value="seo"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
          >
            <Search className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">SEO</span>
            <span className="sm:hidden">SEO</span>
          </TabsTrigger>

          {/* 5. Pages légales */}
          <TabsTrigger
            value="legal"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Pages Légales</span>
            <span className="sm:hidden">Légal</span>
          </TabsTrigger>

          {/* 6. URL & Domaine */}
          <TabsTrigger
            value="url"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
          >
            <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">URL</span>
            <span className="sm:hidden">Lien</span>
          </TabsTrigger>

          {/* 7. Marketing */}
          <TabsTrigger
            value="marketing"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
          >
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Marketing</span>
            <span className="sm:hidden">Marketing</span>
          </TabsTrigger>

          {/* 8. Analytics */}
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>

          {/* 9. Commerce */}
          <TabsTrigger
            value="commerce"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
          >
            <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Commerce</span>
            <span className="sm:hidden">Shop</span>
          </TabsTrigger>

          {/* 10. Notifications */}
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Alerts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4 sm:space-y-6">
          {/* Export/Import Configuration */}
          {isEditing && (
            <StoreConfigManager
              store={store as Store}
              onImportConfig={config => {
                // Appliquer la configuration importée
                if (config.primary_color) setPrimaryColor(config.primary_color);
                if (config.secondary_color) setSecondaryColor(config.secondary_color);
                if (config.accent_color) setAccentColor(config.accent_color);
                if (config.background_color) setBackgroundColor(config.background_color);
                if (config.text_color) setTextColor(config.text_color);
                if (config.text_secondary_color) setTextSecondaryColor(config.text_secondary_color);
                if (config.button_primary_color) setButtonPrimaryColor(config.button_primary_color);
                if (config.button_primary_text) setButtonPrimaryText(config.button_primary_text);
                if (config.button_secondary_color)
                  setButtonSecondaryColor(config.button_secondary_color);
                if (config.button_secondary_text)
                  setButtonSecondaryText(config.button_secondary_text);
                if (config.link_color) setLinkColor(config.link_color);
                if (config.link_hover_color) setLinkHoverColor(config.link_hover_color);
                if (config.border_radius)
                  setBorderRadius(
                    config.border_radius as 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
                  );
                if (config.shadow_intensity)
                  setShadowIntensity(config.shadow_intensity as 'none' | 'sm' | 'md' | 'lg' | 'xl');
                if (config.heading_font) setHeadingFont(config.heading_font);
                if (config.body_font) setBodyFont(config.body_font);
                if (config.font_size_base) setFontSizeBase(config.font_size_base);
                if (config.heading_size_h1) setHeadingSizeH1(config.heading_size_h1);
                if (config.heading_size_h2) setHeadingSizeH2(config.heading_size_h2);
                if (config.heading_size_h3) setHeadingSizeH3(config.heading_size_h3);
                if (config.line_height) setLineHeight(config.line_height);
                if (config.letter_spacing) setLetterSpacing(config.letter_spacing);
                if (config.header_style)
                  setHeaderStyle(config.header_style as 'minimal' | 'standard' | 'extended');
                if (config.footer_style)
                  setFooterStyle(config.footer_style as 'minimal' | 'standard' | 'extended');
                if (config.product_grid_columns) setProductGridColumns(config.product_grid_columns);
                if (config.product_card_style)
                  setProductCardStyle(
                    config.product_card_style as 'minimal' | 'standard' | 'detailed'
                  );
                if (config.navigation_style)
                  setNavigationStyle(config.navigation_style as 'horizontal' | 'vertical' | 'mega');
                if (config.meta_title) setMetaTitle(config.meta_title);
                if (config.meta_description) setMetaDescription(config.meta_description);
                if (config.meta_keywords) setMetaKeywords(config.meta_keywords);
                if ('og_title' in config && config.og_title && typeof config.og_title === 'string')
                  setOgTitle(config.og_title);
                if (
                  'og_description' in config &&
                  config.og_description &&
                  typeof config.og_description === 'string'
                )
                  setOgDescription(config.og_description);
                if (config.og_image) setOgImageUrl(config.og_image);
                toast({
                  title: 'Configuration importée',
                  description:
                    'La configuration a été importée. Vérifiez les modifications avant de sauvegarder.',
                });
              }}
            />
          )}

          <Card className="store-card">
            <CardHeader className="store-card-header">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl font-semibold">
                    Paramètres de la boutique
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base mt-1">
                    Gérez tous les détails de votre boutique en ligne
                  </CardDescription>
                  {lastSaved && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Dernière sauvegarde :{' '}
                      {lastSaved.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="store-card-content">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nom de la boutique *</Label>
                    <Input
                      id="edit-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={handleSpaceKeyDown}
                      required
                      disabled={isSubmitting}
                    />
                    {name !== store.name && (
                      <p className="text-xs text-muted-foreground">
                        Nouveau slug :{' '}
                        {name
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9\s-]/g, '')
                          .replace(/\s+/g, '-')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description courte</Label>
                    <Textarea
                      id="edit-description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      onKeyDown={handleSpaceKeyDown}
                      rows={3}
                      placeholder="Une brève description de votre boutique"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StoreFieldWithValidation
                      id="contact-email"
                      label="Email de contact"
                      type="email"
                      value={contactEmail}
                      onChange={setContactEmail}
                      onBlur={() => handleFieldBlur('contact_email')}
                      placeholder="contact@votreboutique.com"
                      disabled={isSubmitting}
                      touched={fieldTouched.contact_email}
                      validationFn={val => validateField('contact_email', val)}
                      hint="Email principal pour les contacts clients"
                    />
                    <StoreFieldWithValidation
                      id="contact-phone"
                      label="Téléphone de contact"
                      type="tel"
                      value={contactPhone}
                      onChange={setContactPhone}
                      onBlur={() => handleFieldBlur('contact_phone')}
                      placeholder="+225 XX XX XX XX"
                      disabled={isSubmitting}
                      touched={fieldTouched.contact_phone}
                      hint="Format international recommandé"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about">À propos de votre boutique</Label>
                    <Textarea
                      id="about"
                      value={about}
                      onChange={e => setAbout(e.target.value)}
                      onKeyDown={handleSpaceKeyDown}
                      rows={8}
                      placeholder="Racontez l'histoire de votre boutique, vos valeurs, votre mission..."
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ce texte apparaîtra dans l'onglet "À propos" de votre boutique
                    </p>
                  </div>

                  {/* Contacts supplémentaires */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold">Contacts supplémentaires</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <StoreFieldWithValidation
                        id="support-email"
                        label="Email support"
                        type="email"
                        value={supportEmail}
                        onChange={setSupportEmail}
                        onBlur={() => handleFieldBlur('support_email')}
                        placeholder="support@votreboutique.com"
                        disabled={isSubmitting}
                        touched={fieldTouched.support_email}
                        validationFn={val => validateField('support_email', val)}
                        hint="Email dédié au support client"
                      />
                      <StoreFieldWithValidation
                        id="sales-email"
                        label="Email ventes"
                        type="email"
                        value={salesEmail}
                        onChange={setSalesEmail}
                        onBlur={() => handleFieldBlur('sales_email')}
                        placeholder="ventes@votreboutique.com"
                        disabled={isSubmitting}
                        touched={fieldTouched.sales_email}
                        validationFn={val => validateField('sales_email', val)}
                        hint="Email dédié aux ventes"
                      />
                      <StoreFieldWithValidation
                        id="press-email"
                        label="Email presse"
                        type="email"
                        value={pressEmail}
                        onChange={setPressEmail}
                        onBlur={() => handleFieldBlur('press_email')}
                        placeholder="presse@votreboutique.com"
                        disabled={isSubmitting}
                        touched={fieldTouched.press_email}
                        validationFn={val => validateField('press_email', val)}
                        hint="Email pour les relations presse"
                      />
                      <StoreFieldWithValidation
                        id="partnership-email"
                        label="Email partenariats"
                        type="email"
                        value={partnershipEmail}
                        onChange={setPartnershipEmail}
                        onBlur={() => handleFieldBlur('partnership_email')}
                        placeholder="partenariats@votreboutique.com"
                        disabled={isSubmitting}
                        touched={fieldTouched.partnership_email}
                        validationFn={val => validateField('partnership_email', val)}
                        hint="Email pour les partenariats"
                      />
                      <div className="space-y-2">
                        <Label htmlFor="support-phone">Téléphone support</Label>
                        <Input
                          id="support-phone"
                          type="tel"
                          value={supportPhone}
                          onChange={e => setSupportPhone(e.target.value)}
                          placeholder="+225 XX XX XX XX"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sales-phone">Téléphone ventes</Label>
                        <Input
                          id="sales-phone"
                          type="tel"
                          value={salesPhone}
                          onChange={e => setSalesPhone(e.target.value)}
                          placeholder="+225 XX XX XX XX"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-number">WhatsApp</Label>
                        <Input
                          id="whatsapp-number"
                          type="tel"
                          value={whatsappNumber}
                          onChange={e => setWhatsappNumber(e.target.value)}
                          placeholder="+225 XX XX XX XX"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telegram-username">Telegram</Label>
                        <Input
                          id="telegram-username"
                          type="text"
                          value={telegramUsername}
                          onChange={e => setTelegramUsername(e.target.value)}
                          placeholder="@username"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Réseaux sociaux supplémentaires */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold">Réseaux sociaux supplémentaires</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <StoreFieldWithValidation
                        id="youtube-url"
                        label="YouTube"
                        type="url"
                        value={youtubeUrl}
                        onChange={setYoutubeUrl}
                        onBlur={() => handleFieldBlur('youtube_url')}
                        placeholder="https://youtube.com/@votreboutique"
                        disabled={isSubmitting}
                        touched={fieldTouched.youtube_url}
                        validationFn={val => validateField('youtube_url', val)}
                      />
                      <StoreFieldWithValidation
                        id="tiktok-url"
                        label="TikTok"
                        type="url"
                        value={tiktokUrl}
                        onChange={setTiktokUrl}
                        onBlur={() => handleFieldBlur('tiktok_url')}
                        placeholder="https://tiktok.com/@votreboutique"
                        disabled={isSubmitting}
                        touched={fieldTouched.tiktok_url}
                        validationFn={val => validateField('tiktok_url', val)}
                      />
                      <StoreFieldWithValidation
                        id="pinterest-url"
                        label="Pinterest"
                        type="url"
                        value={pinterestUrl}
                        onChange={setPinterestUrl}
                        onBlur={() => handleFieldBlur('pinterest_url')}
                        placeholder="https://pinterest.com/votreboutique"
                        disabled={isSubmitting}
                        touched={fieldTouched.pinterest_url}
                        validationFn={val => validateField('pinterest_url', val)}
                      />
                      <StoreFieldWithValidation
                        id="snapchat-url"
                        label="Snapchat"
                        type="url"
                        value={snapchatUrl}
                        onChange={setSnapchatUrl}
                        onBlur={() => handleFieldBlur('snapchat_url')}
                        placeholder="https://snapchat.com/add/votreboutique"
                        disabled={isSubmitting}
                        touched={fieldTouched.snapchat_url}
                        validationFn={val => validateField('snapchat_url', val)}
                      />
                      <StoreFieldWithValidation
                        id="discord-url"
                        label="Discord"
                        type="url"
                        value={discordUrl}
                        onChange={setDiscordUrl}
                        onBlur={() => handleFieldBlur('discord_url')}
                        placeholder="https://discord.gg/votreboutique"
                        disabled={isSubmitting}
                        touched={fieldTouched.discord_url}
                        validationFn={val => validateField('discord_url', val)}
                      />
                      <StoreFieldWithValidation
                        id="twitch-url"
                        label="Twitch"
                        type="url"
                        value={twitchUrl}
                        onChange={setTwitchUrl}
                        onBlur={() => handleFieldBlur('twitch_url')}
                        placeholder="https://twitch.tv/votreboutique"
                        disabled={isSubmitting}
                        touched={fieldTouched.twitch_url}
                        validationFn={val => validateField('twitch_url', val)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="info_message">Message informatif (optionnel)</Label>
                      <Textarea
                        id="info_message"
                        value={infoMessage}
                        onChange={e => setInfoMessage(e.target.value)}
                        onKeyDown={handleSpaceKeyDown}
                        placeholder="Ex: 🎉 Promotion spéciale : -20% sur tous les produits jusqu'au 31 janvier !"
                        rows={3}
                        maxLength={500}
                        disabled={isSubmitting}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Message qui s'affichera en haut de votre boutique (promotions, alertes,
                          annonces, etc.)
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {infoMessage.length}/500
                        </span>
                      </div>
                    </div>

                    {infoMessage && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="info_message_color" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Couleur du message
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="info_message_color"
                              type="color"
                              value={infoMessageColor}
                              onChange={e => setInfoMessageColor(e.target.value)}
                              className="h-10 w-20 cursor-pointer"
                              disabled={isSubmitting}
                            />
                            <Input
                              type="text"
                              value={infoMessageColor}
                              onChange={e => setInfoMessageColor(e.target.value)}
                              placeholder="#3b82f6"
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                              className="flex-1 font-mono text-sm"
                              disabled={isSubmitting}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Format hexadécimal (ex: #3b82f6)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="info_message_font">Police du message</Label>
                          <Select
                            value={infoMessageFont}
                            onValueChange={setInfoMessageFont}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger id="info_message_font">
                              <SelectValue placeholder="Choisir une police" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter (par défaut)</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Open Sans">Open Sans</SelectItem>
                              <SelectItem value="Lato">Lato</SelectItem>
                              <SelectItem value="Montserrat">Montserrat</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                              <SelectItem value="Raleway">Raleway</SelectItem>
                              <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                              <SelectItem value="Nunito">Nunito</SelectItem>
                              <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Police utilisée pour afficher le message
                          </p>
                        </div>
                      </div>
                    )}

                    {infoMessage && (
                      <div className="space-y-2">
                        <Label>Aperçu du message</Label>
                        <div
                          className="p-4 rounded-lg border-2 border-dashed"
                          style={{
                            backgroundColor: `${infoMessageColor}15`,
                            borderColor: `${infoMessageColor}40`,
                          }}
                        >
                          <p
                            className="text-sm text-center"
                            style={{
                              color: infoMessageColor,
                              fontFamily: infoMessageFont,
                            }}
                          >
                            {infoMessage || 'Votre message apparaîtra ici...'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Aperçu de l'apparence du message sur votre boutique
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{store.name}</p>
                  </div>

                  {store.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm">{store.description}</p>
                    </div>
                  )}

                  {(store.contact_email || store.contact_phone) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {store.contact_email && (
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="text-sm">{store.contact_email}</p>
                        </div>
                      )}
                      {store.contact_phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Téléphone</p>
                          <p className="text-sm">{store.contact_phone}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contacts supplémentaires */}
                  {((store as ExtendedStore).support_email ||
                    (store as ExtendedStore).sales_email ||
                    (store as ExtendedStore).press_email ||
                    (store as ExtendedStore).partnership_email ||
                    (store as ExtendedStore).support_phone ||
                    (store as ExtendedStore).sales_phone ||
                    (store as ExtendedStore).whatsapp_number ||
                    (store as ExtendedStore).telegram_username) && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3">Contacts supplémentaires</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(store as ExtendedStore).support_email && (
                          <div>
                            <p className="text-sm text-muted-foreground">Email support</p>
                            <p className="text-sm">{(store as ExtendedStore).support_email}</p>
                          </div>
                        )}
                        {(store as ExtendedStore).sales_email && (
                          <div>
                            <p className="text-sm text-muted-foreground">Email ventes</p>
                            <p className="text-sm">{(store as ExtendedStore).sales_email}</p>
                          </div>
                        )}
                        {(store as ExtendedStore).press_email && (
                          <div>
                            <p className="text-sm text-muted-foreground">Email presse</p>
                            <p className="text-sm">{(store as ExtendedStore).press_email}</p>
                          </div>
                        )}
                        {(store as ExtendedStore).partnership_email && (
                          <div>
                            <p className="text-sm text-muted-foreground">Email partenariats</p>
                            <p className="text-sm">{(store as ExtendedStore).partnership_email}</p>
                          </div>
                        )}
                        {(store as ExtendedStore).support_phone && (
                          <div>
                            <p className="text-sm text-muted-foreground">Téléphone support</p>
                            <p className="text-sm">{(store as ExtendedStore).support_phone}</p>
                          </div>
                        )}
                        {(store as ExtendedStore).sales_phone && (
                          <div>
                            <p className="text-sm text-muted-foreground">Téléphone ventes</p>
                            <p className="text-sm">{(store as ExtendedStore).sales_phone}</p>
                          </div>
                        )}
                        {(store as ExtendedStore).whatsapp_number && (
                          <div>
                            <p className="text-sm text-muted-foreground">WhatsApp</p>
                            <p className="text-sm">{(store as ExtendedStore).whatsapp_number}</p>
                          </div>
                        )}
                        {(store as ExtendedStore).telegram_username && (
                          <div>
                            <p className="text-sm text-muted-foreground">Telegram</p>
                            <p className="text-sm">{(store as ExtendedStore).telegram_username}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {store.about && (
                    <div>
                      <p className="text-sm text-muted-foreground">À propos</p>
                      <p className="text-sm whitespace-pre-wrap">{store.about}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Apparence & Design (Fusion Logo/Bannière + Thème) */}
        <TabsContent value="appearance" className="space-y-4 sm:space-y-6">
          {/* Templates de thème */}
          {isEditing && (
            <StoreThemeTemplateSelector
              onSelectTemplate={template => {
                const config = applyThemeTemplate(template);
                // Appliquer les couleurs
                if (config.primary_color) setPrimaryColor(config.primary_color);
                if (config.secondary_color) setSecondaryColor(config.secondary_color);
                if (config.accent_color) setAccentColor(config.accent_color);
                if (config.background_color) setBackgroundColor(config.background_color);
                if (config.text_color) setTextColor(config.text_color);
                if (config.text_secondary_color) setTextSecondaryColor(config.text_secondary_color);
                if (config.button_primary_color) setButtonPrimaryColor(config.button_primary_color);
                if (config.button_primary_text) setButtonPrimaryText(config.button_primary_text);
                if (config.button_secondary_color)
                  setButtonSecondaryColor(config.button_secondary_color);
                if (config.button_secondary_text)
                  setButtonSecondaryText(config.button_secondary_text);
                if (config.link_color) setLinkColor(config.link_color);
                if (config.link_hover_color) setLinkHoverColor(config.link_hover_color);
                // Appliquer la typographie
                if (config.heading_font) setHeadingFont(config.heading_font);
                if (config.body_font) setBodyFont(config.body_font);
                if (config.font_size_base) setFontSizeBase(config.font_size_base);
                if (config.heading_size_h1) setHeadingSizeH1(config.heading_size_h1);
                if (config.heading_size_h2) setHeadingSizeH2(config.heading_size_h2);
                if (config.heading_size_h3) setHeadingSizeH3(config.heading_size_h3);
                if (config.line_height) setLineHeight(config.line_height);
                if (config.letter_spacing) setLetterSpacing(config.letter_spacing);
                // Appliquer le layout
                if (config.border_radius) setBorderRadius(config.border_radius);
                if (config.shadow_intensity) setShadowIntensity(config.shadow_intensity);
                if (config.header_style) setHeaderStyle(config.header_style);
                if (config.footer_style) setFooterStyle(config.footer_style);
                if (config.product_grid_columns) setProductGridColumns(config.product_grid_columns);
                if (config.product_card_style) setProductCardStyle(config.product_card_style);
                if (config.navigation_style) setNavigationStyle(config.navigation_style);
                toast({
                  title: 'Thème appliqué',
                  description: `Le thème "${template.name}" a été appliqué avec succès.`,
                });
              }}
            />
          )}

          {/* Prévisualisation */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-semibold">Prévisualisation</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Aperçu en temps réel de vos personnalisations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StorePreview
                  store={{ ...store, is_active: store.is_active ?? true } as Store}
                  previewData={{
                    primaryColor,
                    secondaryColor,
                    accentColor,
                    backgroundColor,
                    textColor,
                    headingFont,
                    bodyFont,
                    headerStyle,
                    footerStyle,
                    productGridColumns,
                    productCardStyle,
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Section Images */}
          <Card className="store-card">
            <CardHeader className="store-card-header">
              <CardTitle className="text-lg sm:text-xl font-semibold">
                Images de la boutique
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Logo et bannière de votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="store-card-content">
              {isEditing ? (
                <div className="space-y-6">
                  <StoreImageUpload
                    label="Logo de la boutique"
                    value={logoUrl}
                    onChange={setLogoUrl}
                    disabled={isSubmitting}
                    aspectRatio="square"
                    description="Format carré recommandé (ex: 500x500px)"
                    imageType="store-logo"
                  />

                  <StoreImageUpload
                    label="Bannière de la boutique"
                    value={bannerUrl}
                    onChange={setBannerUrl}
                    disabled={isSubmitting}
                    aspectRatio="banner"
                    description="Format paysage recommandé (ex: 1920x640px)"
                    imageType="store-banner"
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Images supplémentaires</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <StoreImageUpload
                        label="Favicon"
                        value={faviconUrl}
                        onChange={setFaviconUrl}
                        disabled={isSubmitting}
                        aspectRatio="square"
                        description="Format carré recommandé (16×16, 32×32, 48×48px)"
                        imageType="store-favicon"
                      />

                      <StoreImageUpload
                        label="Apple Touch Icon"
                        value={appleTouchIconUrl}
                        onChange={setAppleTouchIconUrl}
                        disabled={isSubmitting}
                        aspectRatio="square"
                        description="Format carré 180×180px recommandé"
                        imageType="store-apple-touch-icon"
                      />

                      <StoreImageUpload
                        label="Filigrane (Watermark)"
                        value={watermarkUrl}
                        onChange={setWatermarkUrl}
                        disabled={isSubmitting}
                        aspectRatio="square"
                        description="Image de filigrane pour protéger vos images"
                        imageType="store-watermark"
                      />

                      <StoreImageUpload
                        label="Image placeholder"
                        value={placeholderImageUrl}
                        onChange={setPlaceholderImageUrl}
                        disabled={isSubmitting}
                        aspectRatio="square"
                        description="Image par défaut pour les produits sans image"
                        imageType="store-placeholder"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(logoUrl || store.logo_url) && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Logo</p>
                        <img
                          src={logoUrl || store.logo_url || ''}
                          alt={`Logo de la boutique ${store.name}`}
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {(bannerUrl || store.banner_url) && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground mb-2">Bannière</p>
                        <img
                          src={bannerUrl || store.banner_url || ''}
                          alt={`Bannière de la boutique ${store.name}`}
                          className="w-full max-h-48 object-cover object-bottom rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  {(faviconUrl ||
                    (store as ExtendedStore).favicon_url ||
                    appleTouchIconUrl ||
                    (store as ExtendedStore).apple_touch_icon_url ||
                    watermarkUrl ||
                    (store as ExtendedStore).watermark_url ||
                    placeholderImageUrl ||
                    (store as ExtendedStore).placeholder_image_url) && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-4">Images supplémentaires</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(faviconUrl || (store as ExtendedStore).favicon_url) && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Favicon</p>
                              <img
                                src={faviconUrl || (store as ExtendedStore).favicon_url!}
                                alt="Favicon"
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            </div>
                          )}
                          {(appleTouchIconUrl || (store as ExtendedStore).apple_touch_icon_url) && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Apple Touch Icon</p>
                              <img
                                src={
                                  appleTouchIconUrl ||
                                  (store as ExtendedStore).apple_touch_icon_url!
                                }
                                alt={`Apple Touch Icon de la boutique ${store.name}`}
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            </div>
                          )}
                          {(watermarkUrl || (store as ExtendedStore).watermark_url) && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Filigrane</p>
                              <img
                                src={watermarkUrl || (store as ExtendedStore).watermark_url!}
                                alt={`Filigrane de la boutique ${store.name}`}
                                className="w-32 h-32 object-cover rounded-lg border"
                              />
                            </div>
                          )}
                          {(placeholderImageUrl ||
                            (store as ExtendedStore).placeholder_image_url) && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Image placeholder
                              </p>
                              <img
                                src={
                                  placeholderImageUrl ||
                                  (store as ExtendedStore).placeholder_image_url!
                                }
                                alt={`Image placeholder de la boutique ${store.name}`}
                                className="w-32 h-32 object-cover rounded-lg border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Thème et Personnalisation */}
          <Card className="store-card">
            <CardHeader className="store-card-header">
              <CardTitle className="text-lg sm:text-xl font-semibold">
                Personnalisation du thème
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Personnalisez les couleurs, la typographie et la mise en page de votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="store-card-content">
              <StoreThemeSettings
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                accentColor={accentColor}
                backgroundColor={backgroundColor}
                textColor={textColor}
                textSecondaryColor={textSecondaryColor}
                buttonPrimaryColor={buttonPrimaryColor}
                buttonPrimaryText={buttonPrimaryText}
                buttonSecondaryColor={buttonSecondaryColor}
                buttonSecondaryText={buttonSecondaryText}
                linkColor={linkColor}
                linkHoverColor={linkHoverColor}
                borderRadius={borderRadius}
                shadowIntensity={shadowIntensity}
                headingFont={headingFont}
                bodyFont={bodyFont}
                fontSizeBase={fontSizeBase}
                headingSizeH1={headingSizeH1}
                headingSizeH2={headingSizeH2}
                headingSizeH3={headingSizeH3}
                lineHeight={lineHeight}
                letterSpacing={letterSpacing}
                headerStyle={headerStyle}
                footerStyle={footerStyle}
                sidebarEnabled={sidebarEnabled}
                sidebarPosition={sidebarPosition}
                productGridColumns={productGridColumns}
                productCardStyle={productCardStyle}
                navigationStyle={navigationStyle}
                onColorChange={(field, value) => {
                  const  setters: Record<string, (v: string) => void> = {
                    primary_color: setPrimaryColor,
                    secondary_color: setSecondaryColor,
                    accent_color: setAccentColor,
                    background_color: setBackgroundColor,
                    text_color: setTextColor,
                    text_secondary_color: setTextSecondaryColor,
                    button_primary_color: setButtonPrimaryColor,
                    button_primary_text: setButtonPrimaryText,
                    button_secondary_color: setButtonSecondaryColor,
                    button_secondary_text: setButtonSecondaryText,
                    link_color: setLinkColor,
                    link_hover_color: setLinkHoverColor,
                    border_radius: v =>
                      setBorderRadius(v as 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'),
                    shadow_intensity: v =>
                      setShadowIntensity(v as 'none' | 'sm' | 'md' | 'lg' | 'xl'),
                  };
                  setters[field]?.(value);
                }}
                onTypographyChange={(field, value) => {
                  const  setters: Record<string, (v: string) => void> = {
                    heading_font: setHeadingFont,
                    body_font: setBodyFont,
                    font_size_base: setFontSizeBase,
                    heading_size_h1: setHeadingSizeH1,
                    heading_size_h2: setHeadingSizeH2,
                    heading_size_h3: setHeadingSizeH3,
                    line_height: setLineHeight,
                    letter_spacing: setLetterSpacing,
                  };
                  setters[field]?.(value);
                }}
                onLayoutChange={(field, value) => {
                  const  setters: Record<string, (v: string | number | boolean) => void> = {
                    header_style: v => setHeaderStyle(v as 'minimal' | 'standard' | 'extended'),
                    footer_style: v => setFooterStyle(v as 'minimal' | 'standard' | 'extended'),
                    sidebar_enabled: v => setSidebarEnabled(typeof v === 'boolean' ? v : false),
                    sidebar_position: v => setSidebarPosition(v as 'left' | 'right'),
                    product_grid_columns: v => setProductGridColumns(typeof v === 'number' ? v : 3),
                    product_card_style: v =>
                      setProductCardStyle(v as 'minimal' | 'standard' | 'detailed'),
                    navigation_style: v =>
                      setNavigationStyle(v as 'horizontal' | 'vertical' | 'mega'),
                  };
                  setters[field]?.(value);
                }}
              />
              <div className="pt-4 border-t mt-6">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet SEO */}
        <TabsContent value="seo" className="space-y-4 sm:space-y-6">
          <Card className="store-card">
            <CardHeader className="store-card-header">
              <CardTitle className="text-lg sm:text-xl font-semibold">Configuration SEO</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Optimisez le référencement de votre boutique pour les moteurs de recherche
              </CardDescription>
            </CardHeader>
            <CardContent className="store-card-content">
              <StoreSEOSettings
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                metaKeywords={metaKeywords}
                ogTitle={ogTitle}
                ogDescription={ogDescription}
                ogImageUrl={ogImageUrl}
                storeUrl={
                  store.custom_domain
                    ? `https://${store.custom_domain}`
                    : store.slug
                      ? generateStoreUrl(store.slug)
                      : undefined
                }
                faviconUrl={(store as ExtendedStore).favicon_url || undefined}
                onChange={(field, value) => {
                  const  setters: Record<string, (v: string) => void> = {
                    meta_title: setMetaTitle,
                    meta_description: setMetaDescription,
                    meta_keywords: setMetaKeywords,
                    og_title: setOgTitle,
                    og_description: setOgDescription,
                    og_image_url: setOgImageUrl,
                  };
                  setters[field]?.(value);
                }}
              />
              <div className="pt-4 border-t mt-6">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validation SEO */}
          <StoreSEOValidator store={{ ...store, is_active: store.is_active ?? true } as Store} />

          {/* Génération Sitemap */}
          <StoreSitemapGenerator
            store={{ ...store, is_active: store.is_active ?? true } as Store}
          />
        </TabsContent>

        {/* Onglet Localisation */}
        <TabsContent value="location" className="space-y-4 sm:space-y-6">
          <Card className="store-card">
            <CardHeader className="store-card-header">
              <CardTitle className="text-lg sm:text-xl font-semibold">
                Localisation et horaires
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configurez l'adresse et les horaires d'ouverture de votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="store-card-content">
              <StoreLocationSettings
                addressLine1={addressLine1}
                addressLine2={addressLine2}
                city={city}
                stateProvince={stateProvince}
                postalCode={postalCode}
                country={country}
                latitude={latitude}
                longitude={longitude}
                timezone={timezone}
                openingHours={openingHours}
                onAddressChange={(field, value) => {
                  const  setters: Record<string, (v: string) => void> = {
                    address_line1: setAddressLine1,
                    address_line2: setAddressLine2,
                    city: setCity,
                    state_province: setStateProvince,
                    postal_code: setPostalCode,
                    country: setCountry,
                  };
                  setters[field]?.(value);
                }}
                onLocationChange={(field, value) => {
                  if (field === 'latitude') setLatitude(value);
                  if (field === 'longitude') setLongitude(value);
                }}
                onTimezoneChange={setTimezone}
                onOpeningHoursChange={setOpeningHours}
              />
              <div className="pt-4 border-t mt-6">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Pages légales */}
        <TabsContent value="legal" className="space-y-4 sm:space-y-6">
          <Card className="store-card">
            <CardHeader className="store-card-header">
              <CardTitle className="text-lg sm:text-xl font-semibold">Pages légales</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Gérez les pages légales de votre boutique (CGV, politique de confidentialité, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="store-card-content">
              <StoreLegalPagesComponent
                legalPages={legalPages}
                onChange={(field, value) => {
                  setLegalPages(
                    prev =>
                      ({
                        ...prev,
                        [field]: value,
                      }) as StoreLegalPages
                  );
                }}
              />
              <div className="pt-4 border-t mt-6">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4 sm:space-y-6">
          <StoreMarketingContentComponent
            marketingContent={marketingContent}
            onChange={setMarketingContent}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          {/* Statistiques */}
          <Card className="store-card">
            <CardHeader className="store-card-header">
              <CardTitle className="text-lg sm:text-xl font-semibold">
                Analytics de votre boutique
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Suivez les performances de votre boutique avec des statistiques détaillées
              </CardDescription>
            </CardHeader>
            <CardContent className="store-card-content">
              <StoreAnalytics storeId={store.id} />
            </CardContent>
          </Card>

          {/* Configuration des codes de tracking */}
          {isEditing && (
            <Card className="store-card">
              <CardHeader className="store-card-header">
                <CardTitle className="text-lg sm:text-xl font-semibold">
                  Configuration du tracking
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Configurez vos outils de suivi et d'analyse pour mesurer les performances de votre
                  boutique
                </CardDescription>
              </CardHeader>
              <CardContent className="store-card-content">
                <StoreAnalyticsSettings
                  googleAnalyticsId={googleAnalyticsId}
                  googleAnalyticsEnabled={googleAnalyticsEnabled}
                  onGoogleAnalyticsChange={(id, enabled) => {
                    setGoogleAnalyticsId(id);
                    setGoogleAnalyticsEnabled(enabled);
                  }}
                  facebookPixelId={facebookPixelId}
                  facebookPixelEnabled={facebookPixelEnabled}
                  onFacebookPixelChange={(id, enabled) => {
                    setFacebookPixelId(id);
                    setFacebookPixelEnabled(enabled);
                  }}
                  googleTagManagerId={googleTagManagerId}
                  googleTagManagerEnabled={googleTagManagerEnabled}
                  onGoogleTagManagerChange={(id, enabled) => {
                    setGoogleTagManagerId(id);
                    setGoogleTagManagerEnabled(enabled);
                  }}
                  tiktokPixelId={tiktokPixelId}
                  tiktokPixelEnabled={tiktokPixelEnabled}
                  onTiktokPixelChange={(id, enabled) => {
                    setTiktokPixelId(id);
                    setTiktokPixelEnabled(enabled);
                  }}
                  customScripts={customTrackingScripts}
                  customScriptsEnabled={customScriptsEnabled}
                  onCustomScriptsChange={(scripts, enabled) => {
                    setCustomTrackingScripts(scripts);
                    setCustomScriptsEnabled(enabled);
                  }}
                />
                <div className="pt-4 border-t mt-6">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Commerce */}
        <TabsContent value="commerce" className="space-y-4 sm:space-y-6">
          <StoreCommerceSettings storeId={store.id} />
        </TabsContent>

        {/* Onglet Notifications */}
        <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
          <StoreNotificationSettings storeId={store.id} />
        </TabsContent>

        <TabsContent value="url" className="space-y-6">
          {/* Section Slug */}
          <StoreSlugEditor
            currentSlug={store.slug}
            onSlugChange={handleSlugUpdate}
            onCheckAvailability={checkSlugAvailability}
            storeId={store.id}
          />

          {/* Section Lien de la boutique */}
          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Lien de votre boutique</CardTitle>
              <CardDescription className="text-sm">
                Partagez ce lien pour que vos clients accèdent à votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  value={storeUrl}
                  readOnly
                  className="font-mono text-xs sm:text-sm flex-1 touch-manipulation"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    title="Copier le lien"
                    className="touch-manipulation flex-1 sm:flex-none"
                    aria-label="Copier le lien de la boutique"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(storeUrl, '_blank')}
                    title="Ouvrir dans un nouvel onglet"
                    className="touch-manipulation flex-1 sm:flex-none"
                    aria-label="Ouvrir la boutique dans un nouvel onglet"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-muted rounded-lg">
                <p className="text-xs sm:text-sm">
                  <strong>Format du lien :</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  {store.custom_domain
                    ? `https://${store.slug}.${store.custom_domain}`
                    : `${window.location.origin}/stores/${store.slug}`}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Vos produits seront accessibles à :<br />
                  <code className="text-xs break-all">
                    {store.custom_domain
                      ? `https://${store.slug}.${store.custom_domain}/nom-du-produit`
                      : `${window.location.origin}/stores/${store.slug}/products/nom-du-produit`}
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section Domaine personnalisé */}
          <Card className="shadow-medium border-primary/20">
            <CardContent className="pt-6">
              <StoreDomainSettings
                store={store as unknown as Parameters<typeof StoreDomainSettings>[0]['store']}
                onUpdateStore={async (updates: Partial<Store>) => {
                  const success = await updateStore(updates);
                  if (success) {
                    // Rafraîchir les données du store si nécessaire
                    // Le composant parent devrait gérer le rafraîchissement
                  }
                  return success;
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Réseaux sociaux */}
      {(store.facebook_url ||
        store.instagram_url ||
        store.twitter_url ||
        store.linkedin_url ||
        (store as ExtendedStore).youtube_url ||
        (store as ExtendedStore).tiktok_url ||
        (store as ExtendedStore).pinterest_url ||
        (store as ExtendedStore).snapchat_url ||
        (store as ExtendedStore).discord_url ||
        (store as ExtendedStore).twitch_url) && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Réseaux sociaux</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {store.facebook_url && (
                <a
                  href={store.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Facebook
                </a>
              )}
              {store.instagram_url && (
                <a
                  href={store.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Instagram
                </a>
              )}
              {store.twitter_url && (
                <a
                  href={store.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Twitter
                </a>
              )}
              {store.linkedin_url && (
                <a
                  href={store.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  LinkedIn
                </a>
              )}
              {(store as ExtendedStore).youtube_url && (
                <a
                  href={(store as ExtendedStore).youtube_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  YouTube
                </a>
              )}
              {(store as ExtendedStore).tiktok_url && (
                <a
                  href={(store as ExtendedStore).tiktok_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  TikTok
                </a>
              )}
              {(store as ExtendedStore).pinterest_url && (
                <a
                  href={(store as ExtendedStore).pinterest_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Pinterest
                </a>
              )}
              {(store as ExtendedStore).snapchat_url && (
                <a
                  href={(store as ExtendedStore).snapchat_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Snapchat
                </a>
              )}
              {(store as ExtendedStore).discord_url && (
                <a
                  href={(store as ExtendedStore).discord_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Discord
                </a>
              )}
              {(store as ExtendedStore).twitch_url && (
                <a
                  href={(store as ExtendedStore).twitch_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Twitch
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation pour annuler */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler les modifications ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir les annuler ?
              Toutes vos modifications seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelConfirm(false)}>
              Continuer l'édition
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Annuler les modifications
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StoreDetails;






