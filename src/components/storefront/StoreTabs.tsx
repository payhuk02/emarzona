import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import type { Store } from '@/hooks/useStores';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { resolveStoreHeaderTabs } from '@/lib/commerce/store-header-config';

interface StoreTabsProps {
  productsContent: React.ReactNode;
  aboutContent?: React.ReactNode;
  reviewsContent?: React.ReactNode;
  contactContent?: React.ReactNode;
  store?: Store | null;
  commerceType?: StoreCommerceType | null;
}

const StoreTabs = ({
  productsContent,
  aboutContent,
  reviewsContent,
  contactContent,
  store,
  commerceType,
}: StoreTabsProps) => {
  const { t } = useTranslation();
  const theme = useStoreTheme(store);
  const tabConfig = resolveStoreHeaderTabs(commerceType, store ?? null);

  // Déterminer la classe CSS selon le style de navigation
  const navigationStyleClass = `store-navigation-${theme.navigationStyle}`;

  const tabItems = [
    {
      value: 'products',
      label: t(tabConfig.productsLabelKey, t('storefront.tabs.products')),
      visible: true,
    },
    {
      value: 'about',
      label: t('storefront.tabs.about'),
      visible: tabConfig.showAbout,
    },
    {
      value: 'reviews',
      label: t('storefront.tabs.reviews'),
      visible: tabConfig.showReviews,
    },
    {
      value: 'contact',
      label: t('storefront.tabs.contact'),
      visible: tabConfig.showContact,
    },
  ].filter(tab => tab.visible);
  return (
    <Tabs defaultValue="products" className="w-full">
      {/* Sticky tabs for mobile */}
      <div
        className={`sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b ${navigationStyleClass}`}
        style={{
          backgroundColor: theme.backgroundColor + 'F5',
          borderColor: theme.textSecondaryColor + '40',
        }}
      >
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent inline-flex min-w-full">
            {tabItems.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap transition-colors store-tab-trigger"
                style={{
                  color: theme.textColor,
                  borderBottomColor: 'transparent',
                }}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      <TabsContent value="products" className="mt-4 sm:mt-6">
        {productsContent}
      </TabsContent>

      <TabsContent value="about" className="mt-4 sm:mt-6">
        {aboutContent || (
          <div className="text-center py-12 px-4 text-muted-foreground">
            {t('storefront.tabs.noAbout')}
          </div>
        )}
      </TabsContent>

      <TabsContent value="reviews" className="mt-4 sm:mt-6">
        {reviewsContent || (
          <div className="text-center py-12 px-4 text-muted-foreground">
            {t('storefront.tabs.noReviews')}
          </div>
        )}
      </TabsContent>

      <TabsContent value="contact" className="mt-4 sm:mt-6">
        {tabConfig.showContact
          ? contactContent || (
              <div className="text-center py-12 px-4 text-muted-foreground">
                {t('storefront.tabs.noContact')}
              </div>
            )
          : null}
      </TabsContent>
    </Tabs>
  );
};

export default StoreTabs;
