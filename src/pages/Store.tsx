import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store as StoreIcon, ExternalLink } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { CreateStoreDialog } from "@/components/store/CreateStoreDialog";
import StoreDetails from "@/components/store/StoreDetails";
import "@/styles/store-responsive.css";

const Store = () => {
  const { store, loading } = useStore();

  return (
    <SidebarProvider>
      <div className="store-page">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header - Responsive et Professionnel */}
          <header className="store-header">
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
                  className="store-button whitespace-nowrap text-xs sm:text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
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

          {/* Main Content - Responsive et Professionnel */}
          <main className="store-main">
            <div className="store-container">
              {loading ? (
                <Card className="store-card">
                  <CardContent className="store-loading">
                    <div className="store-loading-spinner"></div>
                    <p className="text-sm sm:text-base text-muted-foreground">Chargement de votre boutique...</p>
                  </CardContent>
                </Card>
              ) : store ? (
                <StoreDetails store={store} />
              ) : (
                <Card className="store-card">
                  <CardHeader className="store-empty-state">
                    <div className="store-empty-icon">
                      <StoreIcon className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                    </div>
                    <CardTitle className="store-empty-title">Créez votre boutique en ligne</CardTitle>
                    <CardDescription className="store-empty-description">
                      Configurez votre boutique pour commencer à vendre vos produits digitaux et services en Afrique avec des fonctionnalités avancées
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6">
                    <div className="space-y-6 sm:space-y-8">
                      <CreateStoreDialog />
                      <div className="mt-6 sm:mt-8 p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl sm:rounded-2xl text-left max-w-2xl mx-auto border border-border/50 shadow-soft">
                        <p className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-foreground">Qu'est-ce qu'une boutique Payhula ?</p>
                        <ul className="store-features-list">
                          <li className="store-feature-item">
                            <span className="store-feature-icon">✓</span>
                            <span className="store-feature-text">Un lien unique et personnalisable pour votre activité</span>
                          </li>
                          <li className="store-feature-item">
                            <span className="store-feature-icon">✓</span>
                            <span className="store-feature-text">Vendez plusieurs produits et services avec des fonctionnalités avancées</span>
                          </li>
                          <li className="store-feature-item">
                            <span className="store-feature-icon">✓</span>
                            <span className="store-feature-text">Acceptez les paiements en FCFA et autres devises africaines</span>
                          </li>
                          <li className="store-feature-item">
                            <span className="store-feature-icon">✓</span>
                            <span className="store-feature-text">Gérez tout depuis votre tableau de bord professionnel</span>
                          </li>
                          <li className="store-feature-item">
                            <span className="store-feature-icon">✓</span>
                            <span className="store-feature-text">Analytics avancées et statistiques détaillées</span>
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
