import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import type { Store } from '@/hooks/useStores';
import {
  resolveStorefrontCommerceType,
  resolveStoreHeaderTabs,
} from '@/lib/commerce/store-header-config';

interface StoreTabsProps {
  productsContent: React.ReactNode;
  aboutContent?: React.ReactNode;
  reviewsContent?: React.ReactNode;
  contactContent?: React.ReactNode;
  store?: Store | null;
  /** Décale la barre d’onglets sous la bannière de prévisualisation vendeur. */
  previewMode?: boolean;
}

const StoreTabs = ({
  productsContent,
  aboutContent,
  reviewsContent,
  contactContent,
  store,
  previewMode = false,
}: StoreTabsProps) => {
  const { t } = useTranslation();
  const theme = useStoreTheme(store);

  const tabConfig = useMemo(() => {
    const commerceType = resolveStorefrontCommerceType(store, undefined);
    return resolveStoreHeaderTabs(commerceType, store ?? null);
  }, [store]);

  const navigationStyleClass = `store-navigation-${theme.navigationStyle}`;

  return (
    <Tabs defaultValue="products" className="w-full">
      <div
        className={cn(
          'sticky z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b',
          previewMode ? 'top-9' : 'top-0',
          navigationStyleClass
        )}
        style={{
          backgroundColor: theme.backgroundColor + 'F5',
          borderColor: theme.textSecondaryColor + '40',
        }}
      >
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent inline-flex min-w-full">
            <TabsTrigger
              value="products"
              className="rounded-none border-b-2 border-transparent px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap transition-colors store-tab-trigger"
              style={{
                color: theme.textColor,
                borderBottomColor: 'transparent',
              }}
            >
              {t(tabConfig.productsLabelKey)}
            </TabsTrigger>
            {tabConfig.showAbout && (
              <TabsTrigger
                value="about"
                className="rounded-none border-b-2 border-transparent px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap transition-colors store-tab-trigger"
                style={{
                  color: theme.textColor,
                  borderBottomColor: 'transparent',
                }}
              >
                {t('storefront.tabs.about')}
              </TabsTrigger>
            )}
            {tabConfig.showReviews && (
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap transition-colors store-tab-trigger"
                style={{
                  color: theme.textColor,
                  borderBottomColor: 'transparent',
                }}
              >
                {t('storefront.tabs.reviews')}
              </TabsTrigger>
            )}
            {tabConfig.showContact && (
              <TabsTrigger
                value="contact"
                className="rounded-none border-b-2 border-transparent px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap transition-colors store-tab-trigger"
                style={{
                  color: theme.textColor,
                  borderBottomColor: 'transparent',
                }}
              >
                {t('storefront.tabs.contact')}
              </TabsTrigger>
            )}
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      <TabsContent value="products" className="mt-4 sm:mt-6">
        {productsContent}
      </TabsContent>

      {tabConfig.showAbout && (
        <TabsContent value="about" className="mt-4 sm:mt-6">
          {aboutContent || (
            <div className="text-center py-12 px-4 text-muted-foreground">
              {t('storefront.tabs.noAbout')}
            </div>
          )}
        </TabsContent>
      )}

      {tabConfig.showReviews && (
        <TabsContent value="reviews" className="mt-4 sm:mt-6">
          {reviewsContent || (
            <div className="text-center py-12 px-4 text-muted-foreground">
              {t('storefront.tabs.noReviews')}
            </div>
          )}
        </TabsContent>
      )}

      {tabConfig.showContact && (
        <TabsContent value="contact" className="mt-4 sm:mt-6">
          {contactContent || (
            <div className="text-center py-12 px-4 text-muted-foreground">
              {t('storefront.tabs.noContact')}
            </div>
          )}
        </TabsContent>
      )}
    </Tabs>
  );
};

export default StoreTabs;
