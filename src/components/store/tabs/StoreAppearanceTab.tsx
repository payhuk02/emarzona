import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import StoreImageUpload from '../StoreImageUpload';
import { StoreThemeSettings } from '../StoreThemeSettings';
import { StoreThemeTemplateSelector } from '../StoreThemeTemplateSelector';
import { StorePreview } from '../StorePreview';
import { StoreAppearanceRevisionsPanel } from '../StoreAppearanceRevisionsPanel';
import { applyThemeTemplate } from '@/lib/store-theme-templates';
import { resolveStoreCommerceTypeFromStore } from '@/lib/commerce/store-capability-map';
import type { Store } from '@/hooks/useStores';
import type { ExtendedStore, StoreFormState, StoreThemeConfig } from '../types/store-form';
import type { useToast } from '@/hooks/use-toast';

interface StoreAppearanceTabProps {
  store: ExtendedStore;
  formState: StoreFormState;
  setters: Record<string, (v: string | null) => void>;
  isEditing: boolean;
  isSubmitting: boolean;
  hasDraftChanges?: boolean;
  onAppearanceRestored?: () => void | Promise<void>;
  applyConfig: (config: StoreThemeConfig) => void;
  handleColorChange: (field: string, value: string) => void;
  handleTypographyChange: (field: string, value: string) => void;
  handleLayoutChange: (field: string, value: string | number | boolean) => void;
  toast: ReturnType<typeof useToast>['toast'];
}

export const StoreAppearanceTab = ({
  store,
  formState,
  setters,
  isEditing,
  isSubmitting,
  hasDraftChanges: hasDraftChangesProp,
  onAppearanceRestored,
  applyConfig,
  handleColorChange,
  handleTypographyChange,
  handleLayoutChange,
  toast,
}: StoreAppearanceTabProps) => {
  const { t } = useTranslation();
  const commerceType = resolveStoreCommerceTypeFromStore(store);
  const {
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
  } = formState;

  const hasDraftChanges = hasDraftChangesProp ?? false;

  const appearanceFormDraft = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  const publishedAtLabel = useMemo(() => {
    const publishedAt = (store as Store).appearance_published_at;
    if (!publishedAt) return null;
    try {
      return t('store.appearance.publishedAt', {
        date: new Date(publishedAt).toLocaleString(),
      });
    } catch {
      return null;
    }
  }, [store, t]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {isEditing && (
        <StoreThemeTemplateSelector
          commerceType={commerceType}
          onSelectTemplate={template => {
            const config = applyThemeTemplate(template);
            applyConfig(config);
            toast({
              title: t('store.appearance.themeAppliedTitle'),
              description: t('store.appearance.themeAppliedDescription', { name: template.name }),
            });
          }}
        />
      )}

      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg sm:text-xl font-semibold">
                  {t('store.appearance.previewTitle')}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {t('store.appearance.previewDescription')}
                </CardDescription>
              </div>
              <Badge variant={hasDraftChanges ? 'secondary' : 'outline'}>
                {hasDraftChanges
                  ? t('store.appearance.draftBadge')
                  : t('store.appearance.publishedBadge')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {publishedAtLabel && !hasDraftChanges && (
              <p className="text-xs text-muted-foreground">{publishedAtLabel}</p>
            )}
            <StorePreview
              store={{ ...store, is_active: store.is_active ?? true } as Store}
              formDraft={appearanceFormDraft}
            />
          </CardContent>
        </Card>
      )}

      {isEditing && (
        <StoreAppearanceRevisionsPanel
          storeId={store.id}
          isSubmitting={isSubmitting}
          onRestored={onAppearanceRestored}
        />
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
        onColorChange={handleColorChange}
        onTypographyChange={handleTypographyChange}
        onLayoutChange={handleLayoutChange}
      />

      <Card className="store-card">
        <CardHeader className="store-card-header">
          <CardTitle className="text-lg sm:text-xl font-semibold">
            {t('store.appearance.imagesTitle')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('store.appearance.imagesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="store-card-content">
          {isEditing ? (
            <div className="space-y-6">
              <StoreImageUpload
                label={t('store.appearance.logoLabel')}
                value={logoUrl}
                onChange={setters.setLogoUrl}
                disabled={isSubmitting}
                aspectRatio="square"
                description={t('store.appearance.logoHint')}
                imageType="store-logo"
                storeId={store.id}
              />
              <StoreImageUpload
                label={t('store.appearance.bannerLabel')}
                value={bannerUrl}
                onChange={setters.setBannerUrl}
                disabled={isSubmitting}
                aspectRatio="banner"
                description={t('store.appearance.bannerHint')}
                imageType="store-banner"
                storeId={store.id}
              />
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">{t('store.appearance.extraImagesTitle')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StoreImageUpload
                    label={t('store.appearance.faviconLabel')}
                    value={faviconUrl}
                    onChange={setters.setFaviconUrl}
                    disabled={isSubmitting}
                    aspectRatio="square"
                    description={t('store.appearance.faviconHint')}
                    imageType="store-favicon"
                    storeId={store.id}
                  />
                  <StoreImageUpload
                    label={t('store.appearance.appleTouchLabel')}
                    value={appleTouchIconUrl}
                    onChange={setters.setAppleTouchIconUrl}
                    disabled={isSubmitting}
                    aspectRatio="square"
                    description={t('store.appearance.appleTouchHint')}
                    imageType="store-apple-touch-icon"
                    storeId={store.id}
                  />
                  <StoreImageUpload
                    label={t('store.appearance.watermarkLabel')}
                    value={watermarkUrl}
                    onChange={setters.setWatermarkUrl}
                    disabled={isSubmitting}
                    aspectRatio="square"
                    description={t('store.appearance.watermarkHint')}
                    imageType="store-watermark"
                    storeId={store.id}
                  />
                  <StoreImageUpload
                    label={t('store.appearance.placeholderLabel')}
                    value={placeholderImageUrl}
                    onChange={setters.setPlaceholderImageUrl}
                    disabled={isSubmitting}
                    aspectRatio="square"
                    description={t('store.appearance.placeholderHint')}
                    imageType="store-placeholder"
                    storeId={store.id}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(logoUrl || store.logo_url) && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('store.appearance.logoAlt')}
                    </p>
                    <img
                      src={logoUrl || store.logo_url || ''}
                      alt={`${t('store.appearance.logoAlt')} ${store.name}`}
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
                {(bannerUrl || store.banner_url) && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('store.appearance.bannerAlt')}
                    </p>
                    <img
                      src={bannerUrl || store.banner_url || ''}
                      alt={`${t('store.appearance.bannerAlt')} ${store.name}`}
                      className="w-full max-h-48 object-cover object-bottom rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
