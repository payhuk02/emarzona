import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store as StoreIcon, ExternalLink } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { CreateStoreDialog } from "@/components/store/CreateStoreDialog";
import StoreDetails from "@/components/store/StoreDetails";

const Store = () => {
  const { store, loading } = useStore();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header - Simple et fonctionnel */}
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
              <SidebarTrigger className="touch-manipulation min-h-[44px] min-w-[44px]" />
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate">Boutique</h1>
              </div>
              {!loading && store && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/stores/${store.slug}`, '_blank')}
                  className="touch-manipulation min-h-[44px] whitespace-nowrap text-xs sm:text-sm"
                  aria-label="Ouvrir ma boutique dans un nouvel onglet"
                >
                  <ExternalLink className="h-3 w-3 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Voir ma boutique</span>
                  <span className="sm:hidden">Voir</span>
                </Button>
              )}
              {!loading && !store && <CreateStoreDialog />}
            </div>
          </header>

          {/* Main Content - Simple et fonctionnel */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-background overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full">
              {loading ? (
                <Card className="shadow-sm border">
                  <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <p className="text-sm sm:text-base text-muted-foreground">Chargement de votre boutique...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : store ? (
                <StoreDetails store={store} />
              ) : (
                <Card className="shadow-sm border">
                  <CardHeader className="text-center py-8 sm:py-12 lg:py-16 px-4 sm:px-6">
                    <div className="flex justify-center mb-6 sm:mb-8">
                      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/20 flex items-center justify-center">
                        <StoreIcon className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Créez votre boutique en ligne</CardTitle>
                    <CardDescription className="mt-4 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-muted-foreground">
                      Configurez votre boutique pour commencer à vendre vos produits digitaux et services en Afrique
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6">
                    <div className="space-y-6 sm:space-y-8">
                      <CreateStoreDialog />
                      <div className="mt-6 sm:mt-8 p-6 sm:p-8 lg:p-10 bg-muted/30 rounded-xl text-left max-w-2xl mx-auto border">
                        <p className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Qu'est-ce qu'une boutique Payhula ?</p>
                        <ul className="text-sm sm:text-base text-muted-foreground space-y-3 sm:space-y-4">
                          <li className="flex items-start gap-3">
                            <span className="text-primary font-bold text-lg">✓</span>
                            <span>Un lien unique et personnalisable pour votre activité</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-primary font-bold text-lg">✓</span>
                            <span>Vendez plusieurs produits et services</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-primary font-bold text-lg">✓</span>
                            <span>Acceptez les paiements en FCFA et autres devises</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-primary font-bold text-lg">✓</span>
                            <span>Gérez tout depuis votre tableau de bord</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Store;
