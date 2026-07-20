import { useReducer, useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Store } from '@/hooks/useStores';
import type {
  ExtendedStore,
  StoreFormState,
  StoreThemeConfig,
} from '@/components/store/types/store-form';
import { useStore } from '@/hooks/useStore';
import { useStores } from '@/hooks/useStores';
import { useStoreContext } from '@/contexts/StoreContext';
import { useToast } from '@/hooks/use-toast';
import { sanitizeStorePayload } from '@/lib/store-payload-utils';
import { validateStoreForm } from '@/lib/validation-utils';
import { validateStoreUpdate } from '@/lib/store-validation';
import {
  publishStoreAppearance,
  saveStoreAppearanceDraft,
} from '@/lib/storefront/store-appearance-publish';
import {
  hasUnpublishedContentDraft as storeHasContentDraft,
  publishStoreContent,
  saveStoreContentDraft,
  type StoreSeoDraft,
} from '@/lib/storefront/store-content-publish';
import { tabToContentDomain } from '@/lib/storefront/storefront-publish-model';
import {
  appearanceFormFromState,
  computeHasUnpublishedAppearanceDraft,
  initStoreFormState,
  initialHasRemoteAppearanceDraft,
  initialPublishedAppearanceBaseline,
} from '@/lib/storefront/store-appearance-form-state';
import type { StoreAppearanceFormDraft } from '@/lib/storefront/store-preview-draft';
import {
  createStoreFormSetters,
  FIELD_MAPPINGS,
  storeFormActions,
  storeFormReducer,
} from '@/hooks/store-form-reducer';

export function useStoreFormState(store: ExtendedStore) {
  const { t } = useTranslation();
  const [formState, dispatch] = useReducer(storeFormReducer, store, initStoreFormState);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('settings');
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [hasRemoteAppearanceDraft, setHasRemoteAppearanceDraft] = useState(() =>
    initialHasRemoteAppearanceDraft(store)
  );
  const [publishedAppearanceBaseline, setPublishedAppearanceBaseline] =
    useState<StoreAppearanceFormDraft | null>(() => initialPublishedAppearanceBaseline(store));

  const lastPublishedAtRef = useRef(store.appearance_published_at ?? null);

  const setters = useMemo(() => createStoreFormSetters(dispatch), [dispatch]);

  const syncAppearanceFieldsFromStore = useCallback((source: ExtendedStore) => {
    dispatch(storeFormActions.initFromStore(source));
    setHasRemoteAppearanceDraft(initialHasRemoteAppearanceDraft(source));
    setPublishedAppearanceBaseline(initialPublishedAppearanceBaseline(source));
  }, []);

  useEffect(() => {
    const publishedAt = store.appearance_published_at ?? null;
    if (publishedAt === lastPublishedAtRef.current) return;
    lastPublishedAtRef.current = publishedAt;
    syncAppearanceFieldsFromStore(store);
  }, [store, syncAppearanceFieldsFromStore]);

  const { getStoreUrl, checkSlugAvailability } = useStore();
  const { updateStore: updateStoreById } = useStores();
  const { refreshStores } = useStoreContext();
  const { toast } = useToast();

  const storeUrl = useMemo(() => getStoreUrl(), [getStoreUrl]);

  const applyConfig = useCallback((config: StoreThemeConfig) => {
    dispatch(storeFormActions.setTheme(config));
  }, []);

  const buildUpdatePayload = useCallback((): Partial<Store> & Record<string, unknown> => {
    const {
      name,
      description,
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
      logoUrl,
      bannerUrl,
      faviconUrl,
      appleTouchIconUrl,
      watermarkUrl,
      placeholderImageUrl,
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
    } = formState;

    const settingsPayload = {
      name: name.trim(),
      description: description.trim() || null,
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
    };

    const appearancePayload = {
      logo_url: logoUrl || null,
      banner_url: bannerUrl || null,
      favicon_url: faviconUrl || null,
      apple_touch_icon_url: appleTouchIconUrl || null,
      watermark_url: watermarkUrl || null,
      placeholder_image_url: placeholderImageUrl || null,
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
    };

    const locationPayload = {
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
    };

    const seoPayload = {
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      meta_keywords: metaKeywords || null,
      og_title: ogTitle || null,
      og_description: ogDescription || null,
      og_image: ogImageUrl || null,
    };

    const analyticsPayload = {
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

    switch (currentTab) {
      case 'appearance':
        return appearancePayload;
      case 'location':
        return locationPayload;
      case 'seo':
        return seoPayload;
      case 'legal':
        return { legal_pages: legalPages || null };
      case 'marketing':
        return { marketing_content: marketingContent || null };
      case 'analytics':
        return analyticsPayload;
      case 'settings':
      default:
        return settingsPayload;
    }
  }, [currentTab, formState]);

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

  const appearanceFormDraft = useMemo(() => appearanceFormFromState(formState), [formState]);

  const hasUnpublishedAppearanceDraft = useMemo(
    () =>
      computeHasUnpublishedAppearanceDraft({
        store,
        form: appearanceFormDraft,
        hasRemoteDraft: hasRemoteAppearanceDraft,
        publishedBaseline: publishedAppearanceBaseline,
      }),
    [hasRemoteAppearanceDraft, store, publishedAppearanceBaseline, appearanceFormDraft]
  );

  const hasUnpublishedContentDraft = useMemo(() => {
    const domain = tabToContentDomain(currentTab);
    if (!domain) return false;
    return storeHasContentDraft(store, domain);
  }, [store, currentTab]);

  const buildContentDraftPayload = useCallback(() => {
    const domain = tabToContentDomain(currentTab);
    if (!domain) return null;

    if (domain === 'seo') {
      const draft: StoreSeoDraft = {
        meta_title: formState.metaTitle || null,
        meta_description: formState.metaDescription || null,
        meta_keywords: formState.metaKeywords || null,
        og_title: formState.ogTitle || null,
        og_description: formState.ogDescription || null,
        og_image: formState.ogImageUrl || null,
      };
      return { domain, draft };
    }

    if (domain === 'marketing') {
      return { domain, draft: formState.marketingContent || null };
    }

    return { domain, draft: formState.legalPages || null };
  }, [currentTab, formState]);

  const handleSaveContentDraft = useCallback(async () => {
    const payload = buildContentDraftPayload();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      await saveStoreContentDraft(store.id, payload.domain, payload.draft);
      await refreshStores().catch(() => {});
      setLastSaved(new Date());
      toast({
        title: t('store.content.draftSavedTitle'),
        description: t('store.content.draftSavedDescription'),
        duration: 3000,
      });
    } catch {
      toast({
        title: t('store.form.common.error'),
        description: t('store.content.draftSaveError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [buildContentDraftPayload, store.id, refreshStores, toast, t]);

  const handlePublishContent = useCallback(async () => {
    const payload = buildContentDraftPayload();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      await saveStoreContentDraft(store.id, payload.domain, payload.draft);
      await publishStoreContent(store.id, payload.domain);
      await refreshStores().catch(() => {});
      setLastSaved(new Date());
      toast({
        title: t('store.content.publishedTitle'),
        description: t('store.content.publishedDescription'),
        duration: 3000,
      });
    } catch {
      toast({
        title: t('store.form.common.error'),
        description: t('store.content.publishError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [buildContentDraftPayload, store.id, refreshStores, toast, t]);

  const handleSaveAppearanceDraft = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await saveStoreAppearanceDraft(store.id, appearanceFormDraft);
      await refreshStores().catch(() => {});
      setHasRemoteAppearanceDraft(true);
      setLastSaved(new Date());
      toast({
        title: t('store.appearance.draftSavedTitle'),
        description: t('store.appearance.draftSavedDescription'),
        duration: 3000,
      });
    } catch {
      toast({
        title: t('store.form.common.error'),
        description: t('store.appearance.draftSaveError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [store.id, appearanceFormDraft, refreshStores, toast, t]);

  const handlePublishAppearance = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await saveStoreAppearanceDraft(store.id, appearanceFormDraft);
      await publishStoreAppearance(store.id);
      await refreshStores().catch(() => {});
      setHasRemoteAppearanceDraft(false);
      setPublishedAppearanceBaseline(appearanceFormDraft);
      setLastSaved(new Date());
      toast({
        title: t('store.appearance.publishedTitle'),
        description: t('store.appearance.publishedDescription'),
        duration: 3000,
      });
    } catch {
      toast({
        title: t('store.form.common.error'),
        description: t('store.appearance.publishError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [store.id, appearanceFormDraft, refreshStores, toast, t]);

  const handleAppearanceRestored = useCallback(async () => {
    await refreshStores().catch(() => {});
    toast({
      title: t('store.appearance.restoredTitle'),
      description: t('store.appearance.restoredDescription'),
      duration: 3000,
    });
  }, [refreshStores, toast, t]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (currentTab === 'appearance') {
        await handleSaveAppearanceDraft();
        return;
      }

      if (tabToContentDomain(currentTab)) {
        await handleSaveContentDraft();
        return;
      }

      const formData = {
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        contact_email: formState.contactEmail.trim() || undefined,
        contact_phone: formState.contactPhone.trim() || undefined,
        facebook_url: formState.facebookUrl.trim() || undefined,
        instagram_url: formState.instagramUrl.trim() || undefined,
        twitter_url: formState.twitterUrl.trim() || undefined,
        linkedin_url: formState.linkedinUrl.trim() || undefined,
      };

      const zodValidation = validateStoreUpdate(formData);
      const manualValidation = validateStoreForm(formData);

      const allErrors = {
        ...(zodValidation.valid ? {} : zodValidation.errors),
        ...(manualValidation.valid ? {} : manualValidation.errors),
      };

      if (Object.keys(allErrors).length > 0) {
        toast({
          title: t('store.form.toast.validationErrorsTitle'),
          description: t('store.form.toast.validationErrorsDescription'),
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const updates = sanitizeStorePayload(buildUpdatePayload());
        await updateStoreById({ storeId: store.id, updates });
        await refreshStores().catch(() => {});

        setIsEditing(false);
        setFieldTouched({});
        setLastSaved(new Date());
      } catch {
        // useStores.updateStore affiche déjà un toast d'erreur
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      currentTab,
      handleSaveAppearanceDraft,
      handleSaveContentDraft,
      formState,
      buildUpdatePayload,
      updateStoreById,
      store.id,
      refreshStores,
      toast,
      t,
    ]
  );

  const resetForm = useCallback(() => {
    const initial = initStoreFormState(store);
    dispatch(
      storeFormActions.setFields({
        name: initial.name,
        description: initial.description,
        logoUrl: initial.logoUrl,
        bannerUrl: initial.bannerUrl,
        faviconUrl: initial.faviconUrl,
        appleTouchIconUrl: initial.appleTouchIconUrl,
        watermarkUrl: initial.watermarkUrl,
        placeholderImageUrl: initial.placeholderImageUrl,
        about: initial.about,
        contactEmail: initial.contactEmail,
        contactPhone: initial.contactPhone,
        facebookUrl: initial.facebookUrl,
        instagramUrl: initial.instagramUrl,
        twitterUrl: initial.twitterUrl,
        linkedinUrl: initial.linkedinUrl,
        infoMessage: initial.infoMessage,
        infoMessageColor: initial.infoMessageColor,
        infoMessageFont: initial.infoMessageFont,
      })
    );
    setIsEditing(false);
    setFieldTouched({});
    setShowCancelConfirm(false);
  }, [store]);

  const handleCancel = useCallback(() => {
    const hasChanges =
      formState.name !== store.name ||
      formState.description !== (store.description || '') ||
      formState.contactEmail !== (store.contact_email || '') ||
      formState.logoUrl !== (store.logo_url || '');

    if (hasChanges && isEditing) {
      setShowCancelConfirm(true);
      return;
    }
    resetForm();
  }, [formState, store, isEditing, resetForm]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(storeUrl);
    toast({
      title: 'Lien copié !',
      description: 'Le lien de votre boutique a été copié dans le presse-papiers.',
    });
  }, [storeUrl, toast]);

  const handleSlugUpdate = useCallback(
    async (newSlug: string): Promise<boolean> => {
      return await updateStoreById({ storeId: store.id, updates: { slug: newSlug } })
        .then(() => true)
        .catch(() => false);
    },
    [updateStoreById, store.id]
  );

  const dispatchFieldChange = useCallback((field: string, value: string | number | boolean) => {
    const mapped = FIELD_MAPPINGS[field];
    if (mapped) {
      dispatch(storeFormActions.setField(mapped, value));
    }
  }, []);

  const handleColorChange = useCallback(
    (field: string, value: string) => dispatchFieldChange(field, value),
    [dispatchFieldChange]
  );

  const handleTypographyChange = useCallback(
    (field: string, value: string) => dispatchFieldChange(field, value),
    [dispatchFieldChange]
  );

  const handleLayoutChange = useCallback(
    (field: string, value: string | number | boolean) => dispatchFieldChange(field, value),
    [dispatchFieldChange]
  );

  const handleSeoChange = useCallback(
    (field: string, value: string) => dispatchFieldChange(field, value),
    [dispatchFieldChange]
  );

  const handleAddressChange = useCallback(
    (field: string, value: string) => dispatchFieldChange(field, value),
    [dispatchFieldChange]
  );

  return {
    formState,
    setters,
    isEditing,
    setIsEditing,
    isSubmitting,
    showCancelConfirm,
    setShowCancelConfirm,
    lastSaved,
    currentTab,
    setCurrentTab,
    fieldTouched,
    hasUnpublishedAppearanceDraft,
    hasUnpublishedContentDraft,
    storeUrl,
    checkSlugAvailability,
    toast,
    handleSubmit,
    handleSaveAppearanceDraft,
    handlePublishAppearance,
    handleSaveContentDraft,
    handlePublishContent,
    handleAppearanceRestored,
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
    updateStore: updateStoreById,
  };
}
