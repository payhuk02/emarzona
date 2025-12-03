import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store as StoreIcon, ExternalLink, Plus, Settings } from "lucide-react";
import { useStores } from "@/hooks/useStores";
import StoreDetails from "@/components/store/StoreDetails";
import { useNavigate, Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Store = () => {
  const { t } = useTranslation();
  const { stores, loading } = useStores();
  const navigate = useNavigate();
  const headerRef = useScrollAnimation<HTMLDivElement>();

  const handleCreateStoreRedirect = useCallback(() => {
    navigate('/dashboard/settings?tab=store&action=create');
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header - Simple et fonctionnel */}
          <header ref={headerRef} className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
              <SidebarTrigger className="touch-manipulation min-h-[44px] min-w-[44px]" />
              <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex items-center justify-center animate-in fade-in slide-in-from-top-4">
                  <StoreIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('store.title')}
                </h1>
              </div>
              {!loading && stores.length > 0 && (
                <Link
                  to={`/stores/${stores[0].slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-manipulation min-h-[44px] whitespace-nowrap text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border-0 inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label={t('store.viewStoreAriaLabel', { name: stores[0].name })}
                >
                  <ExternalLink className="h-3 w-3 mr-1 sm:mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">{t('store.viewStore')}</span>
                  <span className="sm:hidden">{t('store.viewStoreShort')}</span>
                </Link>
              )}
            </div>
          </header>

          {/* Main Content - Simple et fonctionnel */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-background overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full">
              {loading ? (
                <Card className="shadow-sm border border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
                  <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <p className="text-sm sm:text-base text-muted-foreground">{t('store.loading')}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : stores.length > 0 ? (
                <Tabs defaultValue="manage" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto" role="tablist" aria-label={t('store.tabs.ariaLabel')}>
                    <TabsTrigger value="manage" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]" role="tab" aria-label={t('store.tabs.manage')}>
                      <StoreIcon className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{t('store.tabs.manage')}</span>
                      <span className="sm:hidden">{t('store.tabs.manageShort')}</span>
                    </TabsTrigger>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm px-3 py-1.5 font-medium"
                      onClick={handleCreateStoreRedirect}
                      role="tab"
                      aria-label={t('store.tabs.create')}
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{t('store.tabs.create')}</span>
                      <span className="sm:hidden">{t('store.tabs.createShort')}</span>
                    </Button>
                  </TabsList>

                  <TabsContent value="manage" className="space-y-4 sm:space-y-6">
                    {stores.map((store) => (
                      <StoreDetails key={store.id} store={store} />
                    ))}
                  </TabsContent>
                </Tabs>
              ) : (
                <Card className="shadow-sm border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                  <CardHeader className="text-center py-6 sm:py-8 md:py-12 lg:py-16 px-3 sm:px-4 md:px-6">
                    <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 flex items-center justify-center">
                        <StoreIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-3 sm:mb-4">{t('store.empty.title')}</CardTitle>
                    <CardDescription className="mt-3 sm:mt-4 max-w-2xl mx-auto text-[10px] sm:text-xs md:text-sm lg:text-base leading-relaxed text-muted-foreground">
                      {t('store.empty.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-6 sm:pb-8 md:pb-12 lg:pb-16 px-3 sm:px-4 md:px-6">
                    <div className="space-y-4 sm:space-y-6 md:space-y-8">
                      <Button
                        onClick={handleCreateStoreRedirect}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 touch-manipulation text-[10px] sm:text-xs md:text-sm px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-3 transition-all duration-300 hover:scale-105"
                      >
                        <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2" />
                        {t('store.goToSettings')}
                      </Button>
                      <div className="mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 md:p-6 lg:p-8 bg-muted/30 rounded-xl text-left max-w-2xl mx-auto border border-border/50">
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold mb-2 sm:mb-3 md:mb-4 lg:mb-6">{t('store.whatIs.title')}</p>
                        <ul className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground space-y-1.5 sm:space-y-2 md:space-y-3 lg:space-y-4">
                          <li className="flex items-start gap-1.5 sm:gap-2 md:gap-3">
                            <span className="text-primary font-bold text-sm sm:text-base md:text-lg">✓</span>
                            <span>{t('store.whatIs.feature1')}</span>
                          </li>
                          <li className="flex items-start gap-1.5 sm:gap-2 md:gap-3">
                            <span className="text-primary font-bold text-sm sm:text-base md:text-lg">✓</span>
                            <span>{t('store.whatIs.feature2')}</span>
                          </li>
                          <li className="flex items-start gap-1.5 sm:gap-2 md:gap-3">
                            <span className="text-primary font-bold text-sm sm:text-base md:text-lg">✓</span>
                            <span>{t('store.whatIs.feature3')}</span>
                          </li>
                          <li className="flex items-start gap-1.5 sm:gap-2 md:gap-3">
                            <span className="text-primary font-bold text-sm sm:text-base md:text-lg">✓</span>
                            <span>{t('store.whatIs.feature4')}</span>
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
