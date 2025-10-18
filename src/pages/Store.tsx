import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store as StoreIcon } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { CreateStoreDialog } from "@/components/store/CreateStoreDialog";
import StoreDetails from "@/components/store/StoreDetails";

const Store = () => {
  const { store, loading } = useStore();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-card shadow-soft backdrop-blur supports-[backdrop-filter]:bg-card/95">
            <div className="flex h-14 sm:h-16 items-center gap-3 sm:gap-4 px-4 sm:px-6">
              <SidebarTrigger className="touch-manipulation" />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Boutique</h1>
              </div>
              {!loading && store && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/stores/${store.slug}`, '_blank')}
                  className="touch-manipulation whitespace-nowrap text-xs sm:text-sm"
                >
                  Voir ma boutique
                </Button>
              )}
              {!loading && !store && <CreateStoreDialog />}
            </div>
          </header>

          <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 bg-gradient-hero overflow-x-hidden">
            <div className="max-w-4xl mx-auto w-full animate-fade-in">
              {loading ? (
                <Card className="shadow-medium border-border">
                  <CardContent className="py-8 sm:py-10 lg:py-12 text-center">
                    <p className="text-sm sm:text-base text-muted-foreground">Chargement...</p>
                  </CardContent>
                </Card>
              ) : store ? (
                <StoreDetails store={store} />
              ) : (
                <Card className="shadow-medium border-border">
                  <CardHeader className="text-center py-8 sm:py-10 lg:py-12 px-4 sm:px-6">
                    <div className="flex justify-center mb-4 sm:mb-6">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center shadow-soft">
                        <StoreIcon className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                      </div>
                    </div>
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl">Créez votre boutique en ligne</CardTitle>
                    <CardDescription className="mt-2 sm:mt-3 max-w-md mx-auto text-sm sm:text-base leading-relaxed px-2">
                      Configurez votre boutique pour commencer à vendre vos produits digitaux et services en Afrique
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-8 sm:pb-10 lg:pb-12 px-4 sm:px-6">
                    <div className="space-y-4 sm:space-y-6">
                      <CreateStoreDialog />
                      <div className="mt-4 sm:mt-6 p-4 sm:p-5 lg:p-6 bg-muted/50 rounded-lg sm:rounded-xl text-left max-w-md mx-auto border border-border/50 shadow-soft">
                        <p className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-foreground">Qu'est-ce qu'une boutique ?</p>
                        <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5 sm:space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">✓</span>
                            <span>Un lien unique pour votre activité</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">✓</span>
                            <span>Vendez plusieurs produits et services</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">✓</span>
                            <span>Acceptez les paiements en FCFA et autres devises</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">✓</span>
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
