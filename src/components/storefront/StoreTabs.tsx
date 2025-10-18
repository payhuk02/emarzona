import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
              Produits
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
            >
              À propos
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
            >
              Avis
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
            >
              Contact
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
            Aucune information à propos de cette boutique
          </div>
        )}
      </TabsContent>

      <TabsContent value="reviews" className="mt-4 sm:mt-6">
        {reviewsContent || (
          <div className="text-center py-12 px-4 text-muted-foreground">
            Aucun avis pour le moment
          </div>
        )}
      </TabsContent>

      <TabsContent value="contact" className="mt-4 sm:mt-6">
        {contactContent || (
          <div className="text-center py-12 px-4 text-muted-foreground">
            Aucune information de contact disponible
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default StoreTabs;
