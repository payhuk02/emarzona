/**
 * StoreSEOSettings Component
 * Composant pour la configuration SEO complète de la boutique
 * Phase 1 - Utilise les champs existants dans la DB
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { SEOSerpPreview } from '@/components/seo/SEOSerpPreview';

interface StoreSEOSettingsProps {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  storeUrl?: string;
  faviconUrl?: string;
  onChange: (field: string, value: string) => void;
}

export const StoreSEOSettings: React.FC<StoreSEOSettingsProps> = ({
  metaTitle,
  metaDescription,
  metaKeywords,
  ogTitle,
  ogDescription,
  ogImageUrl,
  storeUrl,
  faviconUrl,
  onChange,
}) => {
  const { t } = useTranslation();
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  const metaTitleLength = metaTitle.length;
  const metaDescriptionLength = metaDescription.length;
  const metaTitleOptimal = metaTitleLength >= 50 && metaTitleLength <= 60;
  const metaDescriptionOptimal = metaDescriptionLength >= 120 && metaDescriptionLength <= 160;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {t('store.form.seo.title')}
        </CardTitle>
        <CardDescription>{t('store.form.seo.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="meta_title">{t('store.form.seo.metaTitle')}</Label>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${metaTitleOptimal ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                {metaTitleLength}/60
              </span>
              {metaTitleOptimal ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </div>
          </div>
          <Input
            id="meta_title"
            value={metaTitle}
            onChange={e => onChange('meta_title', e.target.value)}
            onKeyDown={handleSpaceKeyDown}
            placeholder={t('store.form.seo.metaTitlePlaceholder')}
            maxLength={60}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {!metaTitleOptimal && (
              <>
                <AlertCircle className="h-3 w-3" />
                <span>{t('store.form.seo.metaTitleRecommended')}</span>
              </>
            )}
            {metaTitleOptimal && (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-green-600">{t('store.form.seo.metaTitleOptimal')}</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t('store.form.seo.metaTitleHint')}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="meta_description">{t('store.form.seo.metaDescription')}</Label>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${metaDescriptionOptimal ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                {metaDescriptionLength}/160
              </span>
              {metaDescriptionOptimal ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </div>
          </div>
          <Textarea
            id="meta_description"
            value={metaDescription}
            onChange={e => onChange('meta_description', e.target.value)}
            onKeyDown={handleSpaceKeyDown}
            placeholder={t('store.form.seo.metaDescriptionPlaceholder')}
            rows={3}
            maxLength={160}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {!metaDescriptionOptimal && (
              <>
                <AlertCircle className="h-3 w-3" />
                <span>{t('store.form.seo.metaDescriptionRecommended')}</span>
              </>
            )}
            {metaDescriptionOptimal && (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-green-600">{t('store.form.seo.metaTitleOptimal')}</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t('store.form.seo.metaDescriptionHint')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_keywords">{t('store.form.seo.metaKeywords')}</Label>
          <Input
            id="meta_keywords"
            value={metaKeywords}
            onChange={e => onChange('meta_keywords', e.target.value)}
            onKeyDown={handleSpaceKeyDown}
            placeholder={t('store.form.seo.metaKeywordsPlaceholder')}
          />
          <p className="text-xs text-muted-foreground">{t('store.form.seo.metaKeywordsHint')}</p>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-4">{t('store.form.seo.ogTitle')}</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="og_title">{t('store.form.seo.ogTitleLabel')}</Label>
              <Input
                id="og_title"
                value={ogTitle}
                onChange={e => onChange('og_title', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder={t('store.form.seo.ogTitlePlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('store.form.seo.ogTitleHint')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_description">{t('store.form.seo.ogDescriptionLabel')}</Label>
              <Textarea
                id="og_description"
                value={ogDescription}
                onChange={e => onChange('og_description', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder={t('store.form.seo.ogDescriptionPlaceholder')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t('store.form.seo.ogDescriptionHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_image_url">{t('store.form.seo.ogImageLabel')}</Label>
              <Input
                id="og_image_url"
                type="url"
                value={ogImageUrl}
                onChange={e => onChange('og_image_url', e.target.value)}
                placeholder={t('store.form.seo.ogImagePlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('store.form.seo.ogImageHint')}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <SEOSerpPreview
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            url={storeUrl}
            faviconUrl={faviconUrl}
          />
        </div>
      </CardContent>
    </Card>
  );
};
