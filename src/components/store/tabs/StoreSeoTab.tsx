import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { StoreSEOSettings } from '../StoreSEOSettings';
import type { ExtendedStore } from '../types/store-form';
import { generateStoreUrl } from '@/lib/store-utils';

interface StoreSeoTabProps {
  store: ExtendedStore;
  formState: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImageUrl: string;
  };
  isSubmitting: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleSeoChange: (field: string, value: string) => void;
}

export const StoreSeoTab = ({ store, formState, handleSeoChange }: StoreSeoTabProps) => {
  const { t } = useTranslation();
  const { metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription, ogImageUrl } =
    formState;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="store-card">
        <CardHeader className="store-card-header">
          <CardTitle className="text-lg sm:text-xl font-semibold">
            {t('store.tabs.seo.title')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('store.tabs.seo.description')}
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
                ? `https://${store.subdomain || store.slug}.${store.custom_domain}`
                : store.slug
                  ? generateStoreUrl(store.slug, store.subdomain || null, undefined)
                  : undefined
            }
            faviconUrl={store.favicon_url || undefined}
            onChange={handleSeoChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};
