import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Save, Upload } from 'lucide-react';
import StoreImageUpload from '../StoreImageUpload';
import { StoreThemeSettings } from '../StoreThemeSettings';
import { StoreThemeTemplateSelector } from '../StoreThemeTemplateSelector';
import { StorePreview } from '../StorePreview';
import { applyThemeTemplate } from '@/lib/store-theme-templates';
import { resolveStoreCommerceTypeFromStore } from '@/lib/commerce/store-capability-map';
import { hasUnpublishedAppearance } from '@/lib/storefront/store-preview-draft';
import type { Store } from '@/hooks/useStores';
import type { ExtendedStore, StoreFormState, StoreThemeConfig } from '../types/store-form';
import type { useToast } from '@/hooks/use-toast';

interface StoreAppearanceTabProps {
  store: ExtendedStore;
  formState: StoreFormState;
  setters: Record<string, (v: string | null) => void>;
  isEditing: boolean;
  isSubmitting: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  onPublishAppearance?: () => Promise<void>;
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
  handleSubmit,
  onPublishAppearance,
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

  const hasDraftChanges = useMemo(
    () => hasUnpublishedAppearance(store as Store, appearanceFormDraft),
    [store, appearanceFormDraft]
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
            {hasDraftChanges && (
              <Alert>
                <AlertDescription>{t('store.appearance.draftHint')}</AlertDescription>
              </Alert>
            )}
            {publishedAtLabel && !hasDraftChanges && (
              <p className="text-xs text-muted-foreground">{publishedAtLabel}</p>
            )}
            {isEditing && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => void handleSubmit()}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? t('store.customization.saving') : t('store.appearance.saveDraft')}
                </Button>
                {onPublishAppearance && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => void onPublishAppearance()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isSubmitting
                      ? t('store.appearance.publishing')
                      : t('store.appearance.publish')}
                  </Button>
                )}
              </div>
            )}
            <StorePreview
              store={{ ...store, is_active: store.is_active ?? true } as Store}
              formDraft={appearanceFormDraft}
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
              />
              <StoreImageUpload
                label={t('store.appearance.bannerLabel')}
                value={bannerUrl}
                onChange={setters.setBannerUrl}
                disabled={isSubmitting}
                aspectRatio="banner"
                description={t('store.appearance.bannerHint')}
                imageType="store-banner"
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
                  />
                  <StoreImageUpload
                    label={t('store.appearance.appleTouchLabel')}
                    value={appleTouchIconUrl}
                    onChange={setters.setAppleTouchIconUrl}
                    disabled={isSubmitting}
                    aspectRatio="square"
                    description={t('store.appearance.appleTouchHint')}
                    imageType="store-apple-touch-icon"
                  />
                  <StoreImageUpload
                    label={t('store.appearance.watermarkLabel')}
                    value={watermarkUrl}
                    onChange={setters.setWatermarkUrl}
                    disabled={isSubmitting}
                    aspectRatio="square"
                    description={t('store.appearance.watermarkHint')}
                    imageType="store-watermark"
                  />
                  <StoreImageUpload
                    label={t('store.appearance.placeholderLabel')}
                    value={placeholderImageUrl}
                    onChange={setters.setPlaceholderImageUrl}
                    disabled={isSubmitting}
                    aspectRatio="square"
                    description={t('store.appearance.placeholderHint')}
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
