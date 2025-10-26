import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

interface StoreTabsProps {
  productsContent: React.ReactNode;
  aboutContent?: React.ReactNode;
  reviewsContent?: React.ReactNode;
  contactContent?: React.ReactNode;
}

const StoreTabs = ({
  productsContent,
  aboutContent,
  reviewsContent,
  contactContent,
}: StoreTabsProps) => {
  const { t } = useTranslation();
  return (
    <Tabs defaultValue="products" className="w-full">
      {/* Sticky tabs for mobile */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent inline-flex min-w-full">
            <TabsTrigger
              value="products"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
            >
              {t('storefront.tabs.products')}
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
            >
              {t('storefront.tabs.about')}
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
            >
              {t('storefront.tabs.reviews')}
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
            >
              {t('storefront.tabs.contact')}
            </TabsTrigger>
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
        {contactContent || (
          <div className="text-center py-12 px-4 text-muted-foreground">
            {t('storefront.tabs.noContact')}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default StoreTabs;
