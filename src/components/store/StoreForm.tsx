import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencySelect } from "@/components/ui/currency-select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/store-utils";
import { logger } from "@/lib/logger";
import { useStoreContext } from "@/contexts/StoreContext";
import { Loader2, Check, X, Globe, Phone, Info } from '@/components/icons';
import { Image as ImageIcon, Mail, Facebook, Instagram, Twitter, Linkedin, Palette, Search, MapPin, FileText } from 'lucide-react';
import StoreImageUpload from "./StoreImageUpload";
import { useSpaceInputFix } from "@/hooks/useSpaceInputFix";
import { StoreThemeSettings } from "./StoreThemeSettings";
import { StoreSEOSettings } from "./StoreSEOSettings";
import { StoreLocationSettings } from "./StoreLocationSettings";
import { StoreLegalPagesComponent } from "./StoreLegalPages";
import type { StoreOpeningHours, StoreLegalPages } from "@/hooks/useStores";

interface StoreFormProps {
  onSuccess: () => void;
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
  };
}

const StoreForm = ({ onSuccess, initialData }: StoreFormProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [defaultCurrency, setDefaultCurrency] = useState(initialData?.default_currency || "XOF");
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || "");
  const [bannerUrl, setBannerUrl] = useState(initialData?.banner_url || "");
  const [about, setAbout] = useState(initialData?.about || "");
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email || "");
  const [contactPhone, setContactPhone] = useState(initialData?.contact_phone || "");
  const [facebookUrl, setFacebookUrl] = useState(initialData?.facebook_url || "");
  const [instagramUrl, setInstagramUrl] = useState(initialData?.instagram_url || "");
  const [twitterUrl, setTwitterUrl] = useState(initialData?.twitter_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedin_url || "");
  const [infoMessage, setInfoMessage] = useState(initialData?.info_message || "");
  const [infoMessageColor, setInfoMessageColor] = useState(initialData?.info_message_color || "#3b82f6");
  const [infoMessageFont, setInfoMessageFont] = useState(initialData?.info_message_font || "Inter");
  
  // Phase 1 - Thème et couleurs
  const [primaryColor, setPrimaryColor] = useState(initialData?.primary_color || "#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState(initialData?.secondary_color || "#8b5cf6");
  const [accentColor, setAccentColor] = useState(initialData?.accent_color || "#f59e0b");
  const [backgroundColor, setBackgroundColor] = useState(initialData?.background_color || "#ffffff");
  const [textColor, setTextColor] = useState(initialData?.text_color || "#1f2937");
  const [textSecondaryColor, setTextSecondaryColor] = useState(initialData?.text_secondary_color || "#6b7280");
  const [buttonPrimaryColor, setButtonPrimaryColor] = useState(initialData?.button_primary_color || "#3b82f6");
  const [buttonPrimaryText, setButtonPrimaryText] = useState(initialData?.button_primary_text || "#ffffff");
  const [buttonSecondaryColor, setButtonSecondaryColor] = useState(initialData?.button_secondary_color || "#e5e7eb");
  const [buttonSecondaryText, setButtonSecondaryText] = useState(initialData?.button_secondary_text || "#1f2937");
  const [linkColor, setLinkColor] = useState(initialData?.link_color || "#3b82f6");
  const [linkHoverColor, setLinkHoverColor] = useState(initialData?.link_hover_color || "#2563eb");
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>(initialData?.border_radius || 'md');
  const [shadowIntensity, setShadowIntensity] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>(initialData?.shadow_intensity || 'md');
  
  // Typographie
  const [headingFont, setHeadingFont] = useState(initialData?.heading_font || "Inter");
  const [bodyFont, setBodyFont] = useState(initialData?.body_font || "Inter");
  const [fontSizeBase, setFontSizeBase] = useState(initialData?.font_size_base || "16px");
  const [headingSizeH1, setHeadingSizeH1] = useState(initialData?.heading_size_h1 || "2.5rem");
  const [headingSizeH2, setHeadingSizeH2] = useState(initialData?.heading_size_h2 || "2rem");
  const [headingSizeH3, setHeadingSizeH3] = useState(initialData?.heading_size_h3 || "1.5rem");
  const [lineHeight, setLineHeight] = useState(initialData?.line_height || "1.6");
  const [letterSpacing, setLetterSpacing] = useState(initialData?.letter_spacing || "normal");
  
  // Layout
  const [headerStyle, setHeaderStyle] = useState<'minimal' | 'standard' | 'extended'>(initialData?.header_style || 'standard');
  const [footerStyle, setFooterStyle] = useState<'minimal' | 'standard' | 'extended'>(initialData?.footer_style || 'standard');
  const [sidebarEnabled, setSidebarEnabled] = useState(initialData?.sidebar_enabled || false);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>(initialData?.sidebar_position || 'left');
  const [productGridColumns, setProductGridColumns] = useState(initialData?.product_grid_columns || 3);
  const [productCardStyle, setProductCardStyle] = useState<'minimal' | 'standard' | 'detailed'>(initialData?.product_card_style || 'standard');
  const [navigationStyle, setNavigationStyle] = useState<'horizontal' | 'vertical' | 'mega'>(initialData?.navigation_style || 'horizontal');
  
  // SEO
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || "");
  const [metaKeywords, setMetaKeywords] = useState(initialData?.meta_keywords || "");
  const [ogTitle, setOgTitle] = useState(initialData?.og_title || "");
  const [ogDescription, setOgDescription] = useState(initialData?.og_description || "");
  const [ogImageUrl, setOgImageUrl] = useState(initialData?.og_image || "");
  
  // Localisation
  const [addressLine1, setAddressLine1] = useState(initialData?.address_line1 || "");
  const [addressLine2, setAddressLine2] = useState(initialData?.address_line2 || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [stateProvince, setStateProvince] = useState(initialData?.state_province || "");
  const [postalCode, setPostalCode] = useState(initialData?.postal_code || "");
  const [country, setCountry] = useState(initialData?.country || "");
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude || null);
  const [timezone, setTimezone] = useState(initialData?.timezone || "Africa/Ouagadougou");
  const [openingHours, setOpeningHours] = useState<StoreOpeningHours | null>(initialData?.opening_hours || null);
  
  // Pages légales
  const [legalPages, setLegalPages] = useState<StoreLegalPages | null>(initialData?.legal_pages || null);
  
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { refreshStores } = useStoreContext();
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    if (!slugToCheck) {
      setSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    try {
      const { data, error } = await supabase.rpc('is_store_slug_available', {
        check_slug: slugToCheck,
        exclude_store_id: initialData?.id ?? undefined,
      });

      if (error) throw error;
      setSlugAvailable(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error("Error checking slug", { error: errorMessage, slug: slugToCheck });
      setSlugAvailable(null);
    } finally {
      setIsCheckingSlug(false);
    }
  }, [initialData?.id]); // Note: toast est stable

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    const generatedSlug = generateSlug(value);
    setSlug(generatedSlug);
    if (generatedSlug) {
      checkSlugAvailability(generatedSlug);
    }
  }, [checkSlugAvailability]);

  const handleSlugChange = useCallback((value: string) => {
    const cleanSlug = generateSlug(value);
    setSlug(cleanSlug);
    if (cleanSlug) {
      checkSlugAvailability(cleanSlug);
    }
  }, [checkSlugAvailability]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug) {
      toast({
        title: "Erreur",
        description: "Le nom et le slug sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (slugAvailable === false) {
      toast({
        title: "Erreur",
        description: "Ce nom de boutique est déjà utilisé",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Vous devez être connecté");
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
          [key: string]: unknown;
        }
        const updateData: StoreUpdateData = {
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
          info_message_color: infoMessageColor || "#3b82f6",
          info_message_font: infoMessageFont || "Inter",
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
        };

        const { error } = await supabase
          .from('stores')
          .update(updateData)
          .eq('id', initialData.id);

        if (error) throw error;

        toast({
          title: "Boutique mise à jour",
          description: "Votre boutique a été mise à jour avec succès",
        });
      } else {
        // Create new store - Vérifier la limite de 3 boutiques
        const { data: existingStores, error: checkError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id);

        if (checkError) {
          throw checkError;
        }

        const storeCount = existingStores?.length || 0;
        if (storeCount >= 3) {
          toast({
            title: "Limite atteinte",
            description: "Limite de 3 boutiques par utilisateur atteinte. Vous devez supprimer une boutique existante avant d'en créer une nouvelle.",
            variant: "destructive",
          });
          return;
        }

        interface StoreInsertData {
          user_id: string;
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
          [key: string]: unknown;
        }
        const insertData: StoreInsertData = {
            user_id: user.id,
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
          info_message_color: infoMessageColor || "#3b82f6",
          info_message_font: infoMessageFont || "Inter",
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
        };

        const { error } = await supabase
          .from('stores')
          .insert(insertData);

        if (error) {
          // Gérer l'erreur spécifique de limite de la base de données
          if (error.message && error.message.includes('Limite de 3 boutiques')) {
            toast({
              title: "Limite atteinte",
              description: "Limite de 3 boutiques par utilisateur atteinte. Vous devez supprimer une boutique existante avant d'en créer une nouvelle.",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Boutique créée",
          description: "Votre boutique a été créée avec succès",
        });

        // Rafraîchir la liste des boutiques et sélectionner la nouvelle
        await refreshStores();
        // La nouvelle boutique sera automatiquement sélectionnée par le contexte
      }

      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name, slug, slugAvailable, defaultCurrency, description, logoUrl, bannerUrl, about,
    contactEmail, contactPhone, facebookUrl, instagramUrl, twitterUrl, linkedinUrl,
    infoMessage, infoMessageColor, infoMessageFont,
    // Phase 1
    primaryColor, secondaryColor, accentColor, backgroundColor, textColor, textSecondaryColor,
    buttonPrimaryColor, buttonPrimaryText, buttonSecondaryColor, buttonSecondaryText,
    linkColor, linkHoverColor, borderRadius, shadowIntensity,
    headingFont, bodyFont, fontSizeBase, headingSizeH1, headingSizeH2, headingSizeH3,
    lineHeight, letterSpacing,
    headerStyle, footerStyle, sidebarEnabled, sidebarPosition, productGridColumns,
    productCardStyle, navigationStyle,
    metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription, ogImageUrl,
    addressLine1, addressLine2, city, stateProvince, postalCode, country,
    latitude, longitude, timezone, openingHours,
    legalPages,
    initialData, onSuccess, refreshStores, toast
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Modifier la boutique" : "Créer votre boutique"}
        </CardTitle>
        <CardDescription>
          {initialData 
            ? "Mettez à jour les informations de votre boutique" 
            : "Configurez votre boutique en ligne"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 gap-1 overflow-x-auto">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Informations</span>
                <span className="sm:hidden">Infos</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Image & Design</span>
                <span className="sm:hidden">Design</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Contact & Réseaux</span>
                <span className="sm:hidden">Contact</span>
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden lg:inline">Thème</span>
                <span className="lg:hidden">Thème</span>
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline">SEO</span>
                <span className="lg:hidden">SEO</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden lg:inline">Localisation</span>
                <span className="lg:hidden">Local.</span>
              </TabsTrigger>
              <TabsTrigger value="legal" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">Pages Légales</span>
                <span className="lg:hidden">Légal</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Informations de base */}
            <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la boutique *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
              placeholder="Ma Boutique Pro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Nom d'URL (slug) *
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
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="ma-boutique-pro"
              required
            />
            {slug && (
              <p className="text-sm text-muted-foreground">
                Votre boutique sera accessible à : 
                <span className="font-mono ml-1">https://{slug}.lovableproject.com</span>
              </p>
            )}
            {slugAvailable === false && (
              <p className="text-sm text-destructive">
                Ce nom de boutique est déjà pris. Veuillez en choisir un autre.
              </p>
            )}
          </div>

          <div className="space-y-2">
                <Label htmlFor="description">Description courte</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  placeholder="Décrivez votre boutique en quelques mots..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Cette description apparaîtra sur la page de votre boutique
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">À propos (optionnel)</Label>
                <Textarea
                  id="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  placeholder="Racontez l'histoire de votre boutique, vos valeurs, votre mission..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Texte détaillé qui apparaîtra dans l'onglet "À propos" de votre boutique
                </p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="info_message">Message informatif (optionnel)</Label>
                  <Textarea
                    id="info_message"
                    value={infoMessage}
                    onChange={(e) => setInfoMessage(e.target.value)}
                    onKeyDown={handleSpaceKeyDown}
                    placeholder="Ex: 🎉 Promotion spéciale : -20% sur tous les produits jusqu'au 31 janvier !"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Message qui s'affichera en haut de votre boutique (promotions, alertes, annonces, etc.)
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {infoMessage.length}/500
                    </span>
                  </div>
                </div>

                {infoMessage && (
                  <>
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
                            onChange={(e) => setInfoMessageColor(e.target.value)}
                            className="h-10 w-20 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={infoMessageColor}
                            onChange={(e) => setInfoMessageColor(e.target.value)}
                            placeholder="#3b82f6"
                            pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            className="flex-1 font-mono text-sm"
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
                          {infoMessage || "Votre message apparaîtra ici..."}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Aperçu de l'apparence du message sur votre boutique
                      </p>
                    </div>
                  </>
                )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Devise par défaut</Label>
            <CurrencySelect
              value={defaultCurrency}
              onValueChange={setDefaultCurrency}
            />
            <p className="text-sm text-muted-foreground">
              Cette devise sera utilisée par défaut pour vos nouveaux produits
            </p>
          </div>
            </TabsContent>

            {/* Onglet Image & Design */}
            <TabsContent value="branding" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images de votre boutique
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Personnalisez l'apparence de votre boutique avec un logo et une bannière professionnels
                  </p>
                </div>

                <div className="space-y-4">
                  <StoreImageUpload
                    label="Logo de la boutique"
                    value={logoUrl}
                    onChange={setLogoUrl}
                    aspectRatio="square"
                    description="Format recommandé: 500×500 (ratio 1:1) pour les logos. Le logo apparaîtra sur votre page boutique."
                    maxSize={5}
                    imageType="store-logo"
                  />

                  <StoreImageUpload
                    label="Bannière de la boutique"
                    value={bannerUrl}
                    onChange={setBannerUrl}
                    aspectRatio="banner"
                    description="Format recommandé: 1920×600 (ratio 16:5) pour les bannières. La bannière apparaîtra en haut de votre page boutique."
                    maxSize={10}
                    imageType="store-banner"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Onglet Contact & Réseaux sociaux */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Informations de contact
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Permettez à vos clients de vous contacter facilement
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">
                    <Mail className="inline-block h-4 w-4 mr-2" />
                    Email de contact
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@votreboutique.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cet email sera affiché sur votre page boutique pour les demandes de contact
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">
                    <Phone className="inline-block h-4 w-4 mr-2" />
                    Téléphone de contact
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+226 XX XX XX XX"
                  />
                  <p className="text-xs text-muted-foreground">
                    Numéro de téléphone pour contacter votre boutique
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Réseaux sociaux
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Liez vos réseaux sociaux pour renforcer votre présence en ligne
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/votreboutique"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram_url" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/votreboutique"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter_url" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-blue-400" />
                      Twitter / X
                    </Label>
                    <Input
                      id="twitter_url"
                      type="url"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      placeholder="https://twitter.com/votreboutique"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/company/votreboutique"
                    />
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
                    border_radius: (v) => setBorderRadius(v as any),
                    shadow_intensity: (v) => setShadowIntensity(v as any),
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
                  type LayoutSetter = (v: 'minimal' | 'standard' | 'extended' | null) => void;
                  const setters: Record<string, LayoutSetter> = {
                    header_style: (v) => setHeaderStyle(v as 'minimal' | 'standard' | 'extended' | null),
                    footer_style: (v) => setFooterStyle(v as 'minimal' | 'standard' | 'extended' | null),
                    sidebar_enabled: setSidebarEnabled,
                    sidebar_position: (v) => setSidebarPosition(v as any),
                    product_grid_columns: setProductGridColumns,
                    product_card_style: (v) => setProductCardStyle(v as any),
                    navigation_style: (v) => setNavigationStyle(v as any),
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
                onChange={(field, value) => {
                  setLegalPages((prev) => ({
                    ...prev,
                    [field]: value,
                  } as StoreLegalPages));
                }}
              />
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t">
          <Button
            type="submit" 
            className="w-full"
            disabled={isSubmitting || slugAvailable === false}
              size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? "Mise à jour..." : "Création..."}
              </>
            ) : (
                <>
                  {initialData ? "Mettre à jour la boutique" : "Créer ma boutique"}
                </>
            )}
          </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StoreForm;
