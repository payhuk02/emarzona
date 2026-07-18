import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateStoreUrl } from '@/lib/store-utils';
import { useNavigate } from 'react-router-dom';
import StoreSlugEditor from '../StoreSlugEditor';
import type { Store } from '@/hooks/useStores';
import type { ExtendedStore } from '../types/store-form';

interface StoreUrlTabProps {
  store: ExtendedStore;
  storeUrl: string;
  isSubmitting: boolean;
  handleSlugUpdate: (newSlug: string) => Promise<boolean>;
  checkSlugAvailability: (slug: string) => Promise<boolean>;
  handleCopyUrl: () => void;
  updateStore: (updates: Partial<Store>) => Promise<boolean>;
}

export const StoreUrlTab = ({
  store,
  storeUrl,
  handleSlugUpdate,
  checkSlugAvailability,
  handleCopyUrl,
}: StoreUrlTabProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
          <CardTitle className="text-lg sm:text-xl">{t('store.tabs.url.linkTitle')}</CardTitle>
          <CardDescription className="text-sm">
            {t('store.tabs.url.linkDescription')}
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
                title={t('store.tabs.url.copyLink')}
                className="touch-manipulation flex-1 sm:flex-none"
                aria-label={t('store.tabs.url.copyLinkAria')}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(storeUrl, '_blank')}
                title={t('store.tabs.url.openNewTab')}
                className="touch-manipulation flex-1 sm:flex-none"
                aria-label={t('store.tabs.url.openStoreAria')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm">
              <strong>{t('store.tabs.url.linkFormat')}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {store.custom_domain
                ? `https://${store.custom_domain}`
                : generateStoreUrl(store.slug, store.subdomain)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('store.tabs.url.customDomainTitle')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('store.tabs.url.customDomainDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate('/dashboard/domain')}
            variant="outline"
            className="w-full"
          >
            <Globe className="h-4 w-4 mr-2" />
            {t('store.tabs.url.manageDomains')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
