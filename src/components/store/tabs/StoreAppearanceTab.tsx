import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';
import StoreImageUpload from '../StoreImageUpload';
import { StoreThemeSettings } from '../StoreThemeSettings';
import { StoreThemeTemplateSelector } from '../StoreThemeTemplateSelector';
import { StorePreview } from '../StorePreview';
import { applyThemeTemplate } from '@/lib/store-theme-templates';
import type { Store } from '@/hooks/useStores';
import type { ExtendedStore, StoreFormState, StoreThemeConfig } from '../types/store-form';

interface StoreAppearanceTabProps {
  store: ExtendedStore;
  formState: StoreFormState;
  setters: Record<string, (v: any) => void>;
  isEditing: boolean;
  isSubmitting: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  applyConfig: (config: StoreThemeConfig) => void;
  handleColorChange: (field: string, value: string) => void;
  handleTypographyChange: (field: string, value: string) => void;
  handleLayoutChange: (field: string, value: string | number | boolean) => void;
  toast: any;
}

export const StoreAppearanceTab = ({
  store, formState, setters, isEditing, isSubmitting,
  handleSubmit, applyConfig, handleColorChange, handleTypographyChange, handleLayoutChange, toast,
}: StoreAppearanceTabProps) => {
  const {
    logoUrl, bannerUrl, faviconUrl, appleTouchIconUrl, watermarkUrl, placeholderImageUrl,
    primaryColor, secondaryColor, accentColor, backgroundColor, textColor, textSecondaryColor,
    buttonPrimaryColor, buttonPrimaryText, buttonSecondaryColor, buttonSecondaryText,
    linkColor, linkHoverColor, borderRadius, shadowIntensity,
    headingFont, bodyFont, fontSizeBase, headingSizeH1, headingSizeH2, headingSizeH3, lineHeight, letterSpacing,
    headerStyle, footerStyle, sidebarEnabled, sidebarPosition, productGridColumns, productCardStyle, navigationStyle,
  } = formState;

  return (
    <div className="space-y-4 sm:space-y-6">
      {isEditing && (
        <StoreThemeTemplateSelector
          onSelectTemplate={template => {
            const config = applyThemeTemplate(template);
            applyConfig(config);
            toast({ title: 'Thème appliqué', description: `Le thème "${template.name}" a été appliqué avec succès.` });
          }}
        />
      )}

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-semibold">Prévisualisation</CardTitle>
            <CardDescription className="text-sm sm:text-base">Aperçu en temps réel de vos personnalisations</CardDescription>
          </CardHeader>
          <CardContent>
            <StorePreview
              store={{ ...store, is_active: store.is_active ?? true } as Store}
              previewData={{ primaryColor, secondaryColor, accentColor, backgroundColor, textColor, headingFont, bodyFont, headerStyle, footerStyle, productGridColumns, productCardStyle }}
            />
          </CardContent>
        </Card>
      )}

      <StoreThemeSettings
        primaryColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor}
        backgroundColor={backgroundColor} textColor={textColor} textSecondaryColor={textSecondaryColor}
        buttonPrimaryColor={buttonPrimaryColor} buttonPrimaryText={buttonPrimaryText}
        buttonSecondaryColor={buttonSecondaryColor} buttonSecondaryText={buttonSecondaryText}
        linkColor={linkColor} linkHoverColor={linkHoverColor}
        borderRadius={borderRadius} shadowIntensity={shadowIntensity}
        headingFont={headingFont} bodyFont={bodyFont} fontSizeBase={fontSizeBase}
        headingSizeH1={headingSizeH1} headingSizeH2={headingSizeH2} headingSizeH3={headingSizeH3}
        lineHeight={lineHeight} letterSpacing={letterSpacing}
        headerStyle={headerStyle} footerStyle={footerStyle}
        sidebarEnabled={sidebarEnabled} sidebarPosition={sidebarPosition}
        productGridColumns={productGridColumns} productCardStyle={productCardStyle} navigationStyle={navigationStyle}
        onColorChange={handleColorChange}
        onTypographyChange={handleTypographyChange}
        onLayoutChange={handleLayoutChange}
      />

      <Card className="store-card">
        <CardHeader className="store-card-header">
          <CardTitle className="text-lg sm:text-xl font-semibold">Images de la boutique</CardTitle>
          <CardDescription className="text-sm sm:text-base">Logo et bannière de votre boutique</CardDescription>
        </CardHeader>
        <CardContent className="store-card-content">
          {isEditing ? (
            <div className="space-y-6">
              <StoreImageUpload label="Logo de la boutique" value={logoUrl} onChange={setters.setLogoUrl} disabled={isSubmitting} aspectRatio="square" description="Format carré recommandé (ex: 500x500px)" imageType="store-logo" />
              <StoreImageUpload label="Bannière de la boutique" value={bannerUrl} onChange={setters.setBannerUrl} disabled={isSubmitting} aspectRatio="banner" description="Format paysage recommandé (ex: 1920x640px)" imageType="store-banner" />
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Images supplémentaires</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StoreImageUpload label="Favicon" value={faviconUrl} onChange={setters.setFaviconUrl} disabled={isSubmitting} aspectRatio="square" description="Format carré recommandé (16×16, 32×32, 48×48px)" imageType="store-favicon" />
                  <StoreImageUpload label="Apple Touch Icon" value={appleTouchIconUrl} onChange={setters.setAppleTouchIconUrl} disabled={isSubmitting} aspectRatio="square" description="Format carré 180×180px recommandé" imageType="store-apple-touch-icon" />
                  <StoreImageUpload label="Filigrane (Watermark)" value={watermarkUrl} onChange={setters.setWatermarkUrl} disabled={isSubmitting} aspectRatio="square" description="Image de filigrane pour protéger vos images" imageType="store-watermark" />
                  <StoreImageUpload label="Image placeholder" value={placeholderImageUrl} onChange={setters.setPlaceholderImageUrl} disabled={isSubmitting} aspectRatio="square" description="Image par défaut pour les produits sans image" imageType="store-placeholder" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(logoUrl || store.logo_url) && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Logo</p>
                    <img src={logoUrl || store.logo_url || ''} alt={`Logo de la boutique ${store.name}`} className="w-32 h-32 object-cover rounded-lg border" />
                  </div>
                )}
                {(bannerUrl || store.banner_url) && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Bannière</p>
                    <img src={bannerUrl || store.banner_url || ''} alt={`Bannière de la boutique ${store.name}`} className="w-full max-h-48 object-cover object-bottom rounded-lg border" />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="pt-4 border-t">
        <Button onClick={() => handleSubmit()} disabled={isSubmitting} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </div>
  );
};
