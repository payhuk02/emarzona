import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store as StoreIcon, ExternalLink, Plus, Settings } from "lucide-react";
import { useStores } from "@/hooks/useStores";
import StoreDetails from "@/components/store/StoreDetails";
import { useNavigate } from "react-router-dom";

const Store = () => {
  const { stores, loading, canCreateStore, getRemainingStores } = useStores();
  const navigate = useNavigate();

  const handleCreateStoreRedirect = () => {
    navigate('/dashboard/settings?tab=boutique&action=create');
  };

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
              {!loading && stores.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/stores/${stores[0].slug}`, '_blank')}
                  className="touch-manipulation min-h-[44px] whitespace-nowrap text-xs sm:text-sm"
                  aria-label={`Ouvrir la boutique ${stores[0].name} dans un nouvel onglet`}
                >
                  <ExternalLink className="h-3 w-3 mr-1 sm:mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Voir ma boutique</span>
                  <span className="sm:hidden">Voir</span>
                </Button>
              )}
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
                      <p className="text-sm sm:text-base text-muted-foreground">Chargement de vos boutiques...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : stores.length > 0 ? (
                <Tabs defaultValue="manage" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-2 mb-6" role="tablist" aria-label="Navigation des boutiques">
                    <TabsTrigger value="manage" className="flex items-center gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]" role="tab" aria-label="Gérer mes boutiques">
                      <StoreIcon className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Gérer mes boutiques</span>
                      <span className="sm:hidden">Gérer</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="create" 
                      className="flex items-center gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
                      onClick={handleCreateStoreRedirect}
                      role="tab"
                      aria-label="Créer une nouvelle boutique"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Créer ma boutique</span>
                      <span className="sm:hidden">Créer</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manage" className="space-y-4 sm:space-y-6">
                    {stores.map((store) => (
                      <StoreDetails key={store.id} store={store} />
                    ))}
                  </TabsContent>

                  <TabsContent value="create" className="space-y-4 sm:space-y-6">
                    <Card className="shadow-sm border">
                      <CardHeader className="text-center py-8 sm:py-12 lg:py-16 px-4 sm:px-6">
                        <div className="flex justify-center mb-6 sm:mb-8">
                          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/20 flex items-center justify-center">
                            <Plus className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                          </div>
                        </div>
                        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Créer une nouvelle boutique</CardTitle>
                        <CardDescription className="mt-4 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-muted-foreground">
                          {canCreateStore() 
                            ? `Vous pouvez créer ${getRemainingStores()} boutique(s) supplémentaire(s). Configurez votre nouvelle boutique dans les paramètres.`
                            : `Vous avez atteint la limite de 3 boutiques. Supprimez une boutique existante pour en créer une nouvelle.`
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6">
                        <div className="space-y-6 sm:space-y-8">
                          {canCreateStore() ? (
                            <Button
                              onClick={handleCreateStoreRedirect}
                              className="gradient-primary touch-manipulation text-sm sm:text-base px-8 py-3"
                            >
                              <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              Aller aux paramètres
                            </Button>
                          ) : (
                            <div className="p-6 sm:p-8 bg-muted/30 rounded-xl text-left max-w-2xl mx-auto border">
                              <p className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-destructive">Limite atteinte</p>
                              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                                Vous avez atteint la limite de 3 boutiques par utilisateur. 
                                Pour créer une nouvelle boutique, vous devez d'abord supprimer une boutique existante.
                              </p>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                <p className="font-medium mb-2">Vos boutiques actuelles :</p>
                                <ul className="space-y-1">
                                  {stores.map((store) => (
                                    <li key={store.id} className="flex items-center gap-2">
                                      <span className="text-primary">•</span>
                                      <span>{store.name}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <Card className="shadow-sm border">
                  <CardHeader className="text-center py-8 sm:py-12 lg:py-16 px-4 sm:px-6">
                    <div className="flex justify-center mb-6 sm:mb-8">
                      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/20 flex items-center justify-center">
                        <StoreIcon className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Créez votre première boutique</CardTitle>
                    <CardDescription className="mt-4 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-muted-foreground">
                      Configurez votre boutique pour commencer à vendre vos produits digitaux et services en Afrique
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6">
                    <div className="space-y-6 sm:space-y-8">
                      <Button
                        onClick={handleCreateStoreRedirect}
                        className="gradient-primary touch-manipulation text-sm sm:text-base px-8 py-3"
                      >
                        <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Aller aux paramètres
                      </Button>
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
