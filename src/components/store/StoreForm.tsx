import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { CurrencySelect } from '@/components/ui/currency-select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug, generateStoreUrl } from '@/lib/store-utils';
import { isSubdomainReserved } from '@/lib/subdomain-detector';
import { logger } from '@/lib/logger';
import { toUserErrorMessage } from '@/lib/user-error-message';
import { useStoreContext } from '@/contexts/StoreContext';
import { validateStoreCreate, validateStoreUpdate, getFieldHelp } from '@/lib/store-validation';
import { Loader2, Check, X, Globe, Phone, Info } from '@/components/icons';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Image as ImageIcon,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Palette,
  Search,
  MapPin,
  FileText,
  BarChart3,
} from 'lucide-react';
import StoreImageUpload from './StoreImageUpload';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { StoreThemeSettings } from './StoreThemeSettings';
import { StoreSEOSettings } from './StoreSEOSettings';
import { StoreLocationSettings } from './StoreLocationSettings';
import { StoreLegalPagesComponent } from './StoreLegalPages';
import { StoreAnalyticsSettings } from './StoreAnalyticsSettings';
import { RequireTermsConsent } from './RequireTermsConsent';
import { StoreFieldHelper } from './StoreFieldHelper';
import { StoreSuggestions } from './StoreSuggestions';
import type { Store, StoreOpeningHours, StoreLegalPages } from '@/hooks/useStores';
import { useStores } from '@/hooks/useStores';
import { sanitizeStorePayload } from '@/lib/store-payload-utils';
import {
  STORE_COMMERCE_TYPE_LABELS,
  type StoreCommerceType,
} from '@/constants/store-commerce-types';
import { resolveStoreCommerceTypeFromStore } from '@/lib/commerce/store-capability-map';
import { useStoreCommerceTypeGuard } from '@/hooks/useStoreCommerceTypeGuard';
import { getStoreCustomizationPath } from '@/lib/commerce/store-vertical-config';
import { isStoreSlugAvailable } from '@/lib/store/create-store-service';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StoreFormProps {
  onSuccess: () => void;
  wizardMode?: boolean;
  wizardStep?: string;
  onNextStep?: () => void;
  onPreviousStep?: () => void;
  currentStep?: number;
  totalSteps?: number;
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    default_currency?: string;
    logo_url?: string | null;
    banner_url?: string | null;
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
    // Phase 2 - Images supplémentaires
    favicon_url?: string | null;
    apple_touch_icon_url?: string | null;
    watermark_url?: string | null;
    placeholder_image_url?: string | null;
    // Phase 2 - Contacts supplémentaires
    support_email?: string | null;
    sales_email?: string | null;
    press_email?: string | null;
    partnership_email?: string | null;
    support_phone?: string | null;
    sales_phone?: string | null;
    whatsapp_number?: string | null;
    telegram_username?: string | null;
    // Phase 2 - Réseaux sociaux supplémentaires
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
    metadata?: Record<string, unknown> | null;
  };
}

const StoreForm = ({
  onSuccess,
  initialData,
  wizardMode = false,
  wizardStep,
  onNextStep,
  onPreviousStep,
  currentStep,
  totalSteps,
}: StoreFormProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [defaultCurrency, setDefaultCurrency] = useState(initialData?.default_currency || 'XOF');
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(initialData?.banner_url || '');
  const [about, setAbout] = useState(initialData?.about || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email || '');
  const [contactPhone, setContactPhone] = useState(initialData?.contact_phone || '');
  const [facebookUrl, setFacebookUrl] = useState(initialData?.facebook_url || '');
  const [instagramUrl, setInstagramUrl] = useState(initialData?.instagram_url || '');
  const [twitterUrl, setTwitterUrl] = useState(initialData?.twitter_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedin_url || '');
  const [infoMessage, setInfoMessage] = useState(initialData?.info_message || '');
  const [infoMessageColor, setInfoMessageColor] = useState(
    initialData?.info_message_color || '#3b82f6'
  );
  const [infoMessageFont, setInfoMessageFont] = useState(initialData?.info_message_font || 'Inter');
  const formRef = useRef<HTMLFormElement>(null);

  // Phase 2 - Images supplémentaires
  const [faviconUrl, setFaviconUrl] = useState(initialData?.favicon_url || '');
  const [appleTouchIconUrl, setAppleTouchIconUrl] = useState(
    initialData?.apple_touch_icon_url || ''
  );
  const [watermarkUrl, setWatermarkUrl] = useState(initialData?.watermark_url || '');
  const [placeholderImageUrl, setPlaceholderImageUrl] = useState(
    initialData?.placeholder_image_url || ''
  );

  // Phase 2 - Contacts supplémentaires
  const [supportEmail, setSupportEmail] = useState(initialData?.support_email || '');
  const [salesEmail, setSalesEmail] = useState(initialData?.sales_email || '');
  const [pressEmail, setPressEmail] = useState(initialData?.press_email || '');
  const [partnershipEmail, setPartnershipEmail] = useState(initialData?.partnership_email || '');
  const [supportPhone, setSupportPhone] = useState(initialData?.support_phone || '');
  const [salesPhone, setSalesPhone] = useState(initialData?.sales_phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialData?.whatsapp_number || '');
  const [telegramUsername, setTelegramUsername] = useState(initialData?.telegram_username || '');

  // Phase 2 - Réseaux sociaux supplémentaires
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtube_url || '');
  const [tiktokUrl, setTiktokUrl] = useState(initialData?.tiktok_url || '');
  const [pinterestUrl, setPinterestUrl] = useState(initialData?.pinterest_url || '');
  const [snapchatUrl, setSnapchatUrl] = useState(initialData?.snapchat_url || '');
  const [discordUrl, setDiscordUrl] = useState(initialData?.discord_url || '');
  const [twitchUrl, setTwitchUrl] = useState(initialData?.twitch_url || '');

  // Phase 2 - Analytics et Tracking
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(
    initialData?.google_analytics_id || ''
  );
  const [googleAnalyticsEnabled, setGoogleAnalyticsEnabled] = useState(
    initialData?.google_analytics_enabled || false
  );
  const [facebookPixelId, setFacebookPixelId] = useState(initialData?.facebook_pixel_id || '');
  const [facebookPixelEnabled, setFacebookPixelEnabled] = useState(
    initialData?.facebook_pixel_enabled || false
  );
  const [googleTagManagerId, setGoogleTagManagerId] = useState(
    initialData?.google_tag_manager_id || ''
  );
  const [googleTagManagerEnabled, setGoogleTagManagerEnabled] = useState(
    initialData?.google_tag_manager_enabled || false
  );
  const [tiktokPixelId, setTiktokPixelId] = useState(initialData?.tiktok_pixel_id || '');
  const [tiktokPixelEnabled, setTiktokPixelEnabled] = useState(
    initialData?.tiktok_pixel_enabled || false
  );
  const [customTrackingScripts, setCustomTrackingScripts] = useState(
    initialData?.custom_tracking_scripts || ''
  );
  const [customScriptsEnabled, setCustomScriptsEnabled] = useState(
    initialData?.custom_scripts_enabled || false
  );
  const [commerceType, setCommerceType] = useState<StoreCommerceType>(() =>
    initialData
      ? resolveStoreCommerceTypeFromStore(
          initialData as { commerce_type?: unknown; metadata?: Record<string, unknown> | null }
        )
      : 'physical'
  );

  // Phase 1 - Thème et couleurs
  const [primaryColor, setPrimaryColor] = useState(initialData?.primary_color || '#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.secondary_color || '#8b5cf6');
  const [accentColor, setAccentColor] = useState(initialData?.accent_color || '#f59e0b');
  const [backgroundColor, setBackgroundColor] = useState(
    initialData?.background_color || '#ffffff'
  );
  const [textColor, setTextColor] = useState(initialData?.text_color || '#1f2937');
  const [textSecondaryColor, setTextSecondaryColor] = useState(
    initialData?.text_secondary_color || '#6b7280'
  );
  const [buttonPrimaryColor, setButtonPrimaryColor] = useState(
    initialData?.button_primary_color || '#3b82f6'
  );
  const [buttonPrimaryText, setButtonPrimaryText] = useState(
    initialData?.button_primary_text || '#ffffff'
  );
  const [buttonSecondaryColor, setButtonSecondaryColor] = useState(
    initialData?.button_secondary_color || '#e5e7eb'
  );
  const [buttonSecondaryText, setButtonSecondaryText] = useState(
    initialData?.button_secondary_text || '#1f2937'
  );
  const [linkColor, setLinkColor] = useState(initialData?.link_color || '#3b82f6');
  const [linkHoverColor, setLinkHoverColor] = useState(initialData?.link_hover_color || '#2563eb');
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>(
    initialData?.border_radius || 'md'
  );
  const [shadowIntensity, setShadowIntensity] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>(
    initialData?.shadow_intensity || 'md'
  );

  // Typographie
  const [headingFont, setHeadingFont] = useState(initialData?.heading_font || 'Inter');
  const [bodyFont, setBodyFont] = useState(initialData?.body_font || 'Inter');
  const [fontSizeBase, setFontSizeBase] = useState(initialData?.font_size_base || '16px');
  const [headingSizeH1, setHeadingSizeH1] = useState(initialData?.heading_size_h1 || '2.5rem');
  const [headingSizeH2, setHeadingSizeH2] = useState(initialData?.heading_size_h2 || '2rem');
  const [headingSizeH3, setHeadingSizeH3] = useState(initialData?.heading_size_h3 || '1.5rem');
  const [lineHeight, setLineHeight] = useState(initialData?.line_height || '1.6');
  const [letterSpacing, setLetterSpacing] = useState(initialData?.letter_spacing || 'normal');

  // Layout
  const [headerStyle, setHeaderStyle] = useState<'minimal' | 'standard' | 'extended'>(
    initialData?.header_style || 'standard'
  );
  const [footerStyle, setFooterStyle] = useState<'minimal' | 'standard' | 'extended'>(
    initialData?.footer_style || 'standard'
  );
  const [sidebarEnabled, setSidebarEnabled] = useState(initialData?.sidebar_enabled || false);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>(
    initialData?.sidebar_position || 'left'
  );
  const [productGridColumns, setProductGridColumns] = useState(
    initialData?.product_grid_columns || 3
  );
  const [productCardStyle, setProductCardStyle] = useState<'minimal' | 'standard' | 'detailed'>(
    initialData?.product_card_style || 'standard'
  );
  const [navigationStyle, setNavigationStyle] = useState<'horizontal' | 'vertical' | 'mega'>(
    initialData?.navigation_style || 'horizontal'
  );

  // SEO
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || '');
  const [metaKeywords, setMetaKeywords] = useState(initialData?.meta_keywords || '');
  const [ogTitle, setOgTitle] = useState(initialData?.og_title || '');
  const [ogDescription, setOgDescription] = useState(initialData?.og_description || '');
  const [ogImageUrl, setOgImageUrl] = useState(initialData?.og_image || '');

  // Localisation
  const [addressLine1, setAddressLine1] = useState(initialData?.address_line1 || '');
  const [addressLine2, setAddressLine2] = useState(initialData?.address_line2 || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [stateProvince, setStateProvince] = useState(initialData?.state_province || '');
  const [postalCode, setPostalCode] = useState(initialData?.postal_code || '');
  const [country, setCountry] = useState(initialData?.country || '');
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude || null);
  const [timezone, setTimezone] = useState(initialData?.timezone || 'Africa/Ouagadougou');
  const [openingHours, setOpeningHours] = useState<StoreOpeningHours | null>(
    initialData?.opening_hours || null
  );

  // Pages légales
  const [legalPages, setLegalPages] = useState<StoreLegalPages | null>(
    initialData?.legal_pages || {
      terms_of_service: '',
      privacy_policy: '',
      return_policy: '',
      shipping_policy: '',
      refund_policy: '',
      cookie_policy: '',
      disclaimer: '',
      faq_content: '',
    }
  );
  const [currentLegalTab, setCurrentLegalTab] = useState('terms');

  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Mode avancé conservé pour une future extension de l'UI (structure des tabs),
  // mais le setter n'est pas encore utilisé.
  const [advancedMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshStores, canCreateStore, setSelectedStoreId } = useStoreContext();
  const { createStore, updateStore } = useStores();
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const isEditing = Boolean(initialData?.id);
  const { data: commerceTypeGuard } = useStoreCommerceTypeGuard(initialData?.id);
  const commerceTypeLocked = isEditing && commerceTypeGuard?.can_change === false;
  const catalogProductCount = commerceTypeGuard?.product_count ?? 0;

  const checkSlugAvailability = useCallback(
    async (slugToCheck: string) => {
      if (!slugToCheck) {
        setSlugAvailable(null);
        return;
      }

      // Vérifier d'abord si le slug est réservé (côté client)
      if (isSubdomainReserved(slugToCheck)) {
        setSlugAvailable(false);
        setValidationErrors(prev => ({
          ...prev,
          slug: t('store.form.common.slugReserved', { slug: slugToCheck }),
        }));
        return;
      } else {
        setValidationErrors(prev => {
          const { slug: _, ...rest } = prev;
          return rest;
        });
      }

      setIsCheckingSlug(true);
      try {
        const available = await isStoreSlugAvailable(slugToCheck, initialData?.id);
        setSlugAvailable(available);
      } catch (_error: unknown) {
        const errorMessage = toUserErrorMessage(_error) || 'Erreur inconnue';
        logger.error('Error checking slug', { error: errorMessage, slug: slugToCheck });
        setSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    },
    [initialData?.id, t]
  ); // Note: toast est stable

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      // En création uniquement : le lien suit le nom (modifiable ensuite dans le champ slug).
      if (!isEditing) {
        const generatedSlug = generateSlug(value);
        setSlug(generatedSlug);
        if (generatedSlug) {
          checkSlugAvailability(generatedSlug);
        }
      }
    },
    [checkSlugAvailability, isEditing]
  );

  const handleSlugChange = useCallback(
    (value: string) => {
      const cleanSlug = generateSlug(value);
      setSlug(cleanSlug);
      if (cleanSlug) {
        checkSlugAvailability(cleanSlug);
      }
    },
    [checkSlugAvailability]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setValidationErrors({});

      // Préparer les données du formulaire
      const formData = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        default_currency: defaultCurrency,
        commerce_type: commerceType,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        facebook_url: facebookUrl.trim() || undefined,
        instagram_url: instagramUrl.trim() || undefined,
        twitter_url: twitterUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        favicon_url: faviconUrl.trim() || undefined,
        apple_touch_icon_url: appleTouchIconUrl.trim() || undefined,
        watermark_url: watermarkUrl.trim() || undefined,
        placeholder_image_url: placeholderImageUrl.trim() || undefined,
        support_email: supportEmail.trim() || undefined,
        sales_email: salesEmail.trim() || undefined,
        press_email: pressEmail.trim() || undefined,
        partnership_email: partnershipEmail.trim() || undefined,
        support_phone: supportPhone.trim() || undefined,
        sales_phone: salesPhone.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
        telegram_username: telegramUsername.trim() || undefined,
        youtube_url: youtubeUrl.trim() || undefined,
        tiktok_url: tiktokUrl.trim() || undefined,
        pinterest_url: pinterestUrl.trim() || undefined,
        snapchat_url: snapchatUrl.trim() || undefined,
        discord_url: discordUrl.trim() || undefined,
        twitch_url: twitchUrl.trim() || undefined,
        google_analytics_id: googleAnalyticsId.trim() || undefined,
        google_analytics_enabled: googleAnalyticsEnabled,
        facebook_pixel_id: facebookPixelId.trim() || undefined,
        facebook_pixel_enabled: facebookPixelEnabled,
        google_tag_manager_id: googleTagManagerId.trim() || undefined,
        google_tag_manager_enabled: googleTagManagerEnabled,
        tiktok_pixel_id: tiktokPixelId.trim() || undefined,
        tiktok_pixel_enabled: tiktokPixelEnabled,
        custom_tracking_scripts: customTrackingScripts.trim() || undefined,
        custom_scripts_enabled: customScriptsEnabled,
      };

      // Validation Zod
      const validation = initialData
        ? validateStoreUpdate(formData)
        : validateStoreCreate(formData);

      if (!validation.valid) {
        setValidationErrors(validation.errors);
        toast({
          title: t('store.form.common.validationErrorsTitle'),
          description: t('store.form.common.validationErrorsDescription'),
          variant: 'destructive',
        });
        return;
      }

      if (slugAvailable === false) {
        toast({
          title: t('store.form.common.error'),
          description: t('store.form.common.slugTaken'),
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(t('store.form.common.mustBeLoggedIn'));
        }

        if (initialData) {
          // Update existing store
          interface StoreUpdateData {
            name: string;
            slug: string;
            description: string | null;
            default_currency: string;
            logo_url?: string | null;
            banner_url?: string | null;
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
            // Phase 2 - Images supplémentaires
            favicon_url?: string | null;
            apple_touch_icon_url?: string | null;
            watermark_url?: string | null;
            placeholder_image_url?: string | null;
            // Phase 2 - Contacts supplémentaires
            support_email?: string | null;
            sales_email?: string | null;
            press_email?: string | null;
            partnership_email?: string | null;
            support_phone?: string | null;
            sales_phone?: string | null;
            whatsapp_number?: string | null;
            telegram_username?: string | null;
            // Phase 2 - Réseaux sociaux supplémentaires
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
            commerce_type?: StoreCommerceType;
            metadata?: Record<string, unknown> | null;
            [key: string]: unknown;
          }
          const rawUpdateData: StoreUpdateData = {
            name,
            slug,
            description: description || null,
            default_currency: defaultCurrency,
            logo_url: logoUrl || null,
            banner_url: bannerUrl || null,
            about: about || null,
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            facebook_url: facebookUrl || null,
            instagram_url: instagramUrl || null,
            twitter_url: twitterUrl || null,
            linkedin_url: linkedinUrl || null,
            info_message: infoMessage || null,
            info_message_color: infoMessageColor || '#3b82f6',
            info_message_font: infoMessageFont || 'Inter',
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
            // Phase 2 - Images supplémentaires
            favicon_url: faviconUrl || null,
            apple_touch_icon_url: appleTouchIconUrl || null,
            watermark_url: watermarkUrl || null,
            placeholder_image_url: placeholderImageUrl || null,
            // Phase 2 - Contacts supplémentaires
            support_email: supportEmail || null,
            sales_email: salesEmail || null,
            press_email: pressEmail || null,
            partnership_email: partnershipEmail || null,
            support_phone: supportPhone || null,
            sales_phone: salesPhone || null,
            whatsapp_number: whatsappNumber || null,
            telegram_username: telegramUsername || null,
            // Phase 2 - Réseaux sociaux supplémentaires
            youtube_url: youtubeUrl || null,
            tiktok_url: tiktokUrl || null,
            pinterest_url: pinterestUrl || null,
            snapchat_url: snapchatUrl || null,
            discord_url: discordUrl || null,
            twitch_url: twitchUrl || null,
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
            ...(commerceTypeLocked
              ? {}
              : {
                  commerce_type: commerceType,
                  metadata: {
                    ...(initialData?.metadata ?? {}),
                    commerce_type: commerceType,
                  },
                }),
          };

          const updateData = sanitizeStorePayload(rawUpdateData);

          await updateStore({
            storeId: initialData.id,
            updates: updateData as Partial<Store>,
          });
          await refreshStores();
        } else {
          if (!canCreateStore()) {
            toast({
              title: t('store.form.common.limitReachedTitle'),
              description: t('store.form.common.limitReachedDescription'),
              variant: 'destructive',
            });
            return;
          }

          const rawCreateData = {
            name,
            slug,
            description: description || null,
            default_currency: defaultCurrency,
            logo_url: logoUrl || null,
            banner_url: bannerUrl || null,
            about: about || null,
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            facebook_url: facebookUrl || null,
            instagram_url: instagramUrl || null,
            twitter_url: twitterUrl || null,
            linkedin_url: linkedinUrl || null,
            info_message: infoMessage || null,
            info_message_color: infoMessageColor || '#3b82f6',
            info_message_font: infoMessageFont || 'Inter',
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
            latitude: latitude,
            longitude: longitude,
            timezone: timezone || null,
            opening_hours: openingHours || null,
            legal_pages: legalPages || null,
            favicon_url: faviconUrl || null,
            apple_touch_icon_url: appleTouchIconUrl || null,
            watermark_url: watermarkUrl || null,
            placeholder_image_url: placeholderImageUrl || null,
            support_email: supportEmail || null,
            sales_email: salesEmail || null,
            press_email: pressEmail || null,
            partnership_email: partnershipEmail || null,
            support_phone: supportPhone || null,
            sales_phone: salesPhone || null,
            whatsapp_number: whatsappNumber || null,
            telegram_username: telegramUsername || null,
            youtube_url: youtubeUrl || null,
            tiktok_url: tiktokUrl || null,
            pinterest_url: pinterestUrl || null,
            snapchat_url: snapchatUrl || null,
            discord_url: discordUrl || null,
            twitch_url: twitchUrl || null,
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
            commerce_type: commerceType,
            metadata: {
              commerce_type: commerceType,
            },
          };

          const createdStore = await createStore(
            sanitizeStorePayload(rawCreateData) as Partial<Store>
          );

          await refreshStores();
          setSelectedStoreId(createdStore.id);
          navigate(getStoreCustomizationPath(createdStore.id), { replace: true });
        }

        onSuccess();
      } catch (_error: unknown) {
        const errorMessage = toUserErrorMessage(_error) || t('store.form.common.unknownError');
        toast({
          title: t('store.form.common.error'),
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      name,
      slug,
      slugAvailable,
      defaultCurrency,
      description,
      logoUrl,
      bannerUrl,
      about,
      contactEmail,
      contactPhone,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      linkedinUrl,
      infoMessage,
      infoMessageColor,
      infoMessageFont,
      // Phase 1
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
      // Phase 2 - Images supplémentaires
      faviconUrl,
      appleTouchIconUrl,
      watermarkUrl,
      placeholderImageUrl,
      // Phase 2 - Contacts supplémentaires
      supportEmail,
      salesEmail,
      pressEmail,
      partnershipEmail,
      supportPhone,
      salesPhone,
      whatsappNumber,
      telegramUsername,
      // Phase 2 - Réseaux sociaux supplémentaires
      youtubeUrl,
      tiktokUrl,
      pinterestUrl,
      snapchatUrl,
      discordUrl,
      twitchUrl,
      // Phase 2 - Analytics et Tracking
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
      commerceType,
      commerceTypeLocked,
      navigate,
      // Autres
      legalPages,
      initialData,
      onSuccess,
      refreshStores,
      setSelectedStoreId,
      createStore,
      updateStore,
      canCreateStore,
      toast,
      t,
    ]
  );

  const submitCreateStore = useCallback(
    async (e?: React.MouseEvent | React.FormEvent) => {
      e?.preventDefault();
      await handleSubmit({
        preventDefault() {},
      } as React.FormEvent);
    },
    [handleSubmit]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? t('store.form.card.editTitle') : t('store.form.card.createTitle')}
        </CardTitle>
        <CardDescription>
          {initialData
            ? t('store.form.card.editDescription')
            : t('store.form.card.createDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="store-create-form"
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate={wizardMode || !initialData}
          className="space-y-6"
        >
          <Tabs
            defaultValue={wizardMode && wizardStep ? wizardStep : 'basic'}
            className="w-full"
            value={wizardMode && wizardStep ? wizardStep : undefined}
          >
            <TabsList
              className={`grid w-full gap-1 overflow-x-auto ${advancedMode ? 'grid-cols-3 lg:grid-cols-7' : 'grid-cols-3'}`}
            >
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">{t('store.wizard.steps.basic.title')}</span>
                <span className="sm:hidden">{t('store.form.wizardTabs.basicShort')}</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t('store.wizard.steps.branding.title')}</span>
                <span className="sm:hidden">{t('store.form.wizardTabs.brandingShort')}</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{t('store.wizard.steps.contact.title')}</span>
                <span className="sm:hidden">{t('store.form.wizardTabs.contactShort')}</span>
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden lg:inline">{t('store.wizard.steps.theme.title')}</span>
                <span className="lg:hidden">{t('store.form.wizardTabs.themeShort')}</span>
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline">{t('store.wizard.steps.seo.title')}</span>
                <span className="lg:hidden">{t('store.form.wizardTabs.seoShort')}</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden lg:inline">{t('store.wizard.steps.location.title')}</span>
                <span className="lg:hidden">{t('store.form.wizardTabs.locationShort')}</span>
              </TabsTrigger>
              <TabsTrigger value="legal" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">{t('store.wizard.steps.legal.title')}</span>
                <span className="lg:hidden">{t('store.form.wizardTabs.legalShort')}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden lg:inline">{t('store.wizard.steps.analytics.title')}</span>
                <span className="lg:hidden">{t('store.form.wizardTabs.analyticsShort')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Informations de base */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Suggestions automatiques */}
              <StoreSuggestions
                name={name}
                slug={slug}
                description={description}
                slugAvailable={slugAvailable}
                onSlugSuggestion={suggestion => {
                  setSlug(suggestion);
                  checkSlugAvailability(suggestion);
                }}
                onMetaTitleSuggestion={suggestion => setMetaTitle(suggestion)}
                onMetaDescriptionSuggestion={suggestion => setMetaDescription(suggestion)}
              />
              <div className="space-y-2">
                <Label htmlFor="commerce_type">{t('store.form.basicInfo.commerceType')}</Label>
                <Select
                  value={commerceType}
                  onValueChange={value => setCommerceType(value as StoreCommerceType)}
                  disabled={commerceTypeLocked}
                >
                  <SelectTrigger id="commerce_type">
                    <SelectValue placeholder={t('store.form.basicInfo.commerceTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STORE_COMMERCE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {commerceTypeLocked ? (
                  <Alert>
                    <AlertDescription>
                      {t('store.form.basicInfo.commerceTypeLocked', { count: catalogProductCount })}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {isEditing
                      ? t('store.form.basicInfo.commerceTypeEditHint')
                      : t('store.form.basicInfo.commerceTypeCreateHint')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('store.form.basicInfo.storeName')} *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  placeholder={t('store.form.basicInfo.namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <StoreFieldHelper field="slug">
                  <Label htmlFor="slug">
                    {t('store.form.basicInfo.urlSlug')}
                    {isCheckingSlug && (
                      <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />
                    )}
                    {!isCheckingSlug && slugAvailable === true && (
                      <Check className="inline-block ml-2 h-4 w-4 text-accent" />
                    )}
                    {!isCheckingSlug && slugAvailable === false && (
                      <X className="inline-block ml-2 h-4 w-4 text-destructive" />
                    )}
                  </Label>
                </StoreFieldHelper>
                <Input
                  id="slug"
                  value={slug}
                  onChange={e => {
                    handleSlugChange(e.target.value);
                    if (validationErrors.slug) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.slug;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder={t('store.form.basicInfo.urlSlugPlaceholder')}
                  required
                  className={validationErrors.slug ? 'border-destructive' : ''}
                />
                {validationErrors.slug && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.slug}</p>
                )}
                {getFieldHelp('slug') && !validationErrors.slug && (
                  <p className="text-xs text-muted-foreground mt-1">💡 {getFieldHelp('slug')}</p>
                )}
                {slug && (
                  <p className="text-sm text-muted-foreground">
                    {t('store.form.basicInfo.storeAccessibleAt')}
                    <span className="font-mono ml-1">
                      {generateStoreUrl(slug, null, undefined)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {t('store.form.basicInfo.subdomainAuto')}
                    </span>
                  </p>
                )}
                {slugAvailable === false && (
                  <p className="text-sm text-destructive">
                    {t('store.form.common.slugTakenChooseOther')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('store.form.basicInfo.shortDescription')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  placeholder={t('store.form.basicInfo.descriptionPlaceholder')}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {t('store.form.basicInfo.descriptionHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">{t('store.form.basicInfo.aboutOptional')}</Label>
                <Textarea
                  id="about"
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  placeholder={t('store.form.basicInfo.aboutPlaceholder')}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  {t('store.form.basicInfo.aboutTabHint')}
                </p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="info_message">{t('store.form.infoMessage.label')}</Label>
                  <Textarea
                    id="info_message"
                    value={infoMessage}
                    onChange={e => setInfoMessage(e.target.value)}
                    onKeyDown={handleSpaceKeyDown}
                    placeholder={t('store.form.infoMessage.placeholder')}
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {t('store.form.infoMessage.hint')}
                    </p>
                    <span className="text-xs text-muted-foreground">{infoMessage.length}/500</span>
                  </div>
                </div>

                {infoMessage && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="info_message_color" className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          {t('store.form.infoMessage.color')}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="info_message_color"
                            type="color"
                            value={infoMessageColor}
                            onChange={e => setInfoMessageColor(e.target.value)}
                            className="h-10 w-20 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={infoMessageColor}
                            onChange={e => setInfoMessageColor(e.target.value)}
                            placeholder="#3b82f6"
                            pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('store.form.infoMessage.colorHint')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="info_message_font">
                          {t('store.form.infoMessage.font')}
                        </Label>
                        <Select value={infoMessageFont} onValueChange={setInfoMessageFont}>
                          <SelectTrigger id="info_message_font">
                            <SelectValue placeholder={t('store.form.common.chooseFont')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">
                              {t('store.form.common.fontDefaultInter')}
                            </SelectItem>
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
                          {t('store.form.infoMessage.fontHint')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('store.form.infoMessage.preview')}</Label>
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
                          {infoMessage || t('store.form.infoMessage.previewPlaceholder')}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('store.form.infoMessage.previewHint')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">{t('store.form.basicInfo.defaultCurrency')}</Label>
                <CurrencySelect value={defaultCurrency} onValueChange={setDefaultCurrency} />
                <p className="text-sm text-muted-foreground">
                  {t('store.form.basicInfo.currencyDefaultHint')}
                </p>
              </div>
            </TabsContent>

            {/* Onglet Image & Design */}
            <TabsContent value="branding" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {t('store.form.branding.imagesTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('store.form.branding.imagesDescription')}
                  </p>
                </div>

                <div className="space-y-4">
                  <StoreImageUpload
                    label={t('store.form.branding.logoLabel')}
                    value={logoUrl}
                    onChange={setLogoUrl}
                    aspectRatio="square"
                    description={t('store.form.branding.logoDescription')}
                    maxSize={5}
                    imageType="store-logo"
                    storeId={initialData?.id}
                  />

                  <StoreImageUpload
                    label={t('store.form.branding.bannerLabel')}
                    value={bannerUrl}
                    onChange={setBannerUrl}
                    aspectRatio="banner"
                    description={t('store.form.branding.bannerDescription')}
                    maxSize={10}
                    imageType="store-banner"
                    storeId={initialData?.id}
                  />

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">
                      {t('store.form.branding.extraImagesTitle')}
                    </h4>
                    <div className="space-y-4">
                      <StoreImageUpload
                        label={t('store.form.branding.faviconLabel')}
                        value={faviconUrl}
                        onChange={setFaviconUrl}
                        aspectRatio="square"
                        description={t('store.form.branding.faviconDescription')}
                        maxSize={1}
                        imageType="store-favicon"
                        storeId={initialData?.id}
                      />

                      <StoreImageUpload
                        label={t('store.form.branding.appleTouchLabel')}
                        value={appleTouchIconUrl}
                        onChange={setAppleTouchIconUrl}
                        aspectRatio="square"
                        description={t('store.form.branding.appleTouchDescription')}
                        maxSize={2}
                        imageType="store-apple-touch-icon"
                        storeId={initialData?.id}
                      />

                      <StoreImageUpload
                        label={t('store.form.branding.watermarkLabel')}
                        value={watermarkUrl}
                        onChange={setWatermarkUrl}
                        aspectRatio="square"
                        description={t('store.form.branding.watermarkDescription')}
                        maxSize={5}
                        imageType="store-watermark"
                        storeId={initialData?.id}
                      />

                      <StoreImageUpload
                        label={t('store.form.branding.placeholderLabel')}
                        value={placeholderImageUrl}
                        onChange={setPlaceholderImageUrl}
                        aspectRatio="square"
                        description={t('store.form.branding.placeholderDescription')}
                        maxSize={5}
                        imageType="store-placeholder"
                        storeId={initialData?.id}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Contact & Réseaux sociaux */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('store.form.contact.sectionTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('store.form.contact.sectionDescription')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">
                    <Mail className="inline-block h-4 w-4 mr-2" />
                    {t('store.form.contact.email')}
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder={t('store.form.contact.emailPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('store.form.contact.emailHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">
                    <Phone className="inline-block h-4 w-4 mr-2" />
                    {t('store.form.contact.phone')}
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder={t('store.form.contact.phonePlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('store.form.contact.phoneHint')}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">
                    {t('store.form.contact.extraTitle')}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('store.form.contact.extraDescription')}
                  </p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="support_email">
                          <Mail className="inline-block h-4 w-4 mr-2" />
                          {t('store.form.contact.supportEmail')}
                        </Label>
                        <Input
                          id="support_email"
                          type="email"
                          value={supportEmail}
                          onChange={e => setSupportEmail(e.target.value)}
                          placeholder={t('store.form.contact.supportEmailPlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sales_email">
                          <Mail className="inline-block h-4 w-4 mr-2" />
                          {t('store.form.contact.salesEmail')}
                        </Label>
                        <Input
                          id="sales_email"
                          type="email"
                          value={salesEmail}
                          onChange={e => setSalesEmail(e.target.value)}
                          placeholder={t('store.form.contact.salesEmailPlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="press_email">
                          <Mail className="inline-block h-4 w-4 mr-2" />
                          {t('store.form.contact.pressEmail')}
                        </Label>
                        <Input
                          id="press_email"
                          type="email"
                          value={pressEmail}
                          onChange={e => setPressEmail(e.target.value)}
                          placeholder={t('store.form.contact.pressEmailPlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="partnership_email">
                          <Mail className="inline-block h-4 w-4 mr-2" />
                          {t('store.form.contact.partnershipEmail')}
                        </Label>
                        <Input
                          id="partnership_email"
                          type="email"
                          value={partnershipEmail}
                          onChange={e => setPartnershipEmail(e.target.value)}
                          placeholder={t('store.form.contact.partnershipEmailPlaceholder')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="support_phone">
                          <Phone className="inline-block h-4 w-4 mr-2" />
                          {t('store.form.contact.supportPhone')}
                        </Label>
                        <Input
                          id="support_phone"
                          type="tel"
                          value={supportPhone}
                          onChange={e => setSupportPhone(e.target.value)}
                          placeholder={t('store.form.contact.phonePlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sales_phone">
                          <Phone className="inline-block h-4 w-4 mr-2" />
                          {t('store.form.contact.salesPhone')}
                        </Label>
                        <Input
                          id="sales_phone"
                          type="tel"
                          value={salesPhone}
                          onChange={e => setSalesPhone(e.target.value)}
                          placeholder={t('store.form.contact.phonePlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp_number">
                          <Phone className="inline-block h-4 w-4 mr-2" />
                          {t('store.form.contact.whatsapp')}
                        </Label>
                        <Input
                          id="whatsapp_number"
                          type="tel"
                          value={whatsappNumber}
                          onChange={e => setWhatsappNumber(e.target.value)}
                          placeholder={t('store.form.contact.phonePlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telegram_username">
                          <Globe className="inline-block h-4 w-4 mr-2" />
                          {t('store.form.contact.telegram')}
                        </Label>
                        <Input
                          id="telegram_username"
                          type="text"
                          value={telegramUsername}
                          onChange={e => setTelegramUsername(e.target.value)}
                          placeholder={t('store.form.contact.telegramPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t('store.form.social.title')}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('store.form.social.description')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      {t('store.form.social.facebook')}
                    </Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={facebookUrl}
                      onChange={e => setFacebookUrl(e.target.value)}
                      placeholder={t('store.form.social.facebookPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram_url" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      {t('store.form.social.instagram')}
                    </Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={instagramUrl}
                      onChange={e => setInstagramUrl(e.target.value)}
                      placeholder={t('store.form.social.instagramPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter_url" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-blue-400" />
                      {t('store.form.social.twitter')}
                    </Label>
                    <Input
                      id="twitter_url"
                      type="url"
                      value={twitterUrl}
                      onChange={e => setTwitterUrl(e.target.value)}
                      placeholder={t('store.form.social.twitterPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      {t('store.form.social.linkedin')}
                    </Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      value={linkedinUrl}
                      onChange={e => setLinkedinUrl(e.target.value)}
                      placeholder={t('store.form.social.linkedinPlaceholder')}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">
                    {t('store.form.social.extraTitle')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="youtube_url" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-red-600" />
                        {t('store.form.social.youtube')}
                      </Label>
                      <Input
                        id="youtube_url"
                        type="url"
                        value={youtubeUrl}
                        onChange={e => setYoutubeUrl(e.target.value)}
                        placeholder={t('store.form.social.youtubePlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tiktok_url" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-black" />
                        {t('store.form.social.tiktok')}
                      </Label>
                      <Input
                        id="tiktok_url"
                        type="url"
                        value={tiktokUrl}
                        onChange={e => setTiktokUrl(e.target.value)}
                        placeholder={t('store.form.social.tiktokPlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pinterest_url" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-red-700" />
                        {t('store.form.social.pinterest')}
                      </Label>
                      <Input
                        id="pinterest_url"
                        type="url"
                        value={pinterestUrl}
                        onChange={e => setPinterestUrl(e.target.value)}
                        placeholder={t('store.form.social.pinterestPlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="snapchat_url" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-yellow-400" />
                        {t('store.form.social.snapchat')}
                      </Label>
                      <Input
                        id="snapchat_url"
                        type="url"
                        value={snapchatUrl}
                        onChange={e => setSnapchatUrl(e.target.value)}
                        placeholder={t('store.form.social.snapchatPlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discord_url" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-indigo-600" />
                        {t('store.form.social.discord')}
                      </Label>
                      <Input
                        id="discord_url"
                        type="url"
                        value={discordUrl}
                        onChange={e => setDiscordUrl(e.target.value)}
                        placeholder={t('store.form.social.discordPlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitch_url" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-purple-600" />
                        {t('store.form.social.twitch')}
                      </Label>
                      <Input
                        id="twitch_url"
                        type="url"
                        value={twitchUrl}
                        onChange={e => setTwitchUrl(e.target.value)}
                        placeholder={t('store.form.social.twitchPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Thème */}
            <TabsContent value="theme" className="mt-4">
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
                  type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
                  type ShadowIntensity = 'none' | 'sm' | 'md' | 'lg' | 'xl';

                  const setters: Record<string, (v: string) => void> = {
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
                    border_radius: v => setBorderRadius(v as BorderRadius),
                    shadow_intensity: v => setShadowIntensity(v as ShadowIntensity),
                  };
                  setters[field]?.(value);
                }}
                onTypographyChange={(field, value) => {
                  const setters: Record<string, (v: string) => void> = {
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

                  const setters: Record<string, (v: string | number | boolean) => void> = {
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
            </TabsContent>

            {/* Onglet SEO */}
            <TabsContent value="seo" className="mt-4">
              <StoreSEOSettings
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                metaKeywords={metaKeywords}
                ogTitle={ogTitle}
                ogDescription={ogDescription}
                ogImageUrl={ogImageUrl}
                storeUrl={slug ? generateStoreUrl(slug, null, undefined) : undefined}
                faviconUrl={initialData?.favicon_url || undefined}
                onChange={(field, value) => {
                  const setters: Record<string, (v: string) => void> = {
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
            </TabsContent>

            {/* Onglet Localisation */}
            <TabsContent value="location" className="mt-4">
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
                  const setters: Record<string, (v: string) => void> = {
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
            </TabsContent>

            {/* Onglet Pages légales */}
            <TabsContent value="legal" className="mt-4">
              <StoreLegalPagesComponent
                legalPages={legalPages}
                currentTab={currentLegalTab}
                onTabChange={setCurrentLegalTab}
                onChange={(field, value) => {
                  setLegalPages(
                    prev =>
                      ({
                        ...prev,
                        [field]: value,
                      }) as StoreLegalPages
                  );
                }}
                onSave={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            {/* Onglet Analytics */}
            <TabsContent value="analytics" className="mt-4">
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
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t">
            {wizardMode ? (
              <div className="flex items-center justify-between gap-4">
                {onPreviousStep && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onPreviousStep}
                    disabled={currentStep === 1}
                    className="flex-1 sm:flex-none"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {t('store.form.common.previous')}
                  </Button>
                )}

                {currentStep === totalSteps ? (
                  !initialData ? (
                    <RequireTermsConsent
                      actionLabel={t('store.form.common.createStoreAction')}
                      onAction={submitCreateStore}
                    >
                      <Button
                        type="button"
                        data-testid="store-create-submit"
                        className="flex-1 sm:flex-none"
                        disabled={isSubmitting || slugAvailable === false}
                        size="lg"
                        onClick={submitCreateStore}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('store.form.common.creating')}
                          </>
                        ) : (
                          <>{t('store.form.common.createStore')}</>
                        )}
                      </Button>
                    </RequireTermsConsent>
                  ) : (
                    <Button
                      type="submit"
                      className="flex-1 sm:flex-none"
                      disabled={isSubmitting || slugAvailable === false}
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('store.form.common.updating')}
                        </>
                      ) : (
                        <>{t('store.form.common.update')}</>
                      )}
                    </Button>
                  )
                ) : (
                  onNextStep && (
                    <Button
                      type="button"
                      onClick={onNextStep}
                      className="flex-1 sm:flex-none ml-auto"
                      size="lg"
                    >
                      {t('store.form.common.next')}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )
                )}
              </div>
            ) : (
              <>
                {!initialData ? (
                  <RequireTermsConsent
                    actionLabel={t('store.form.common.createStoreAction')}
                    onAction={submitCreateStore}
                  >
                    <Button
                      type="button"
                      data-testid="store-create-submit"
                      className="w-full"
                      disabled={isSubmitting || slugAvailable === false}
                      size="lg"
                      onClick={submitCreateStore}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('store.form.common.creating')}
                        </>
                      ) : (
                        <>{t('store.form.common.createStore')}</>
                      )}
                    </Button>
                  </RequireTermsConsent>
                ) : (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || slugAvailable === false}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('store.form.common.updating')}
                      </>
                    ) : (
                      <>{t('store.form.common.updateStore')}</>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StoreForm;
