import { useTranslation } from 'react-i18next';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePixels } from "@/hooks/usePixels";
import { CreatePixelDialog } from "@/components/pixels/CreatePixelDialog";
import { PixelsTable } from "@/components/pixels/PixelsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Eye, ShoppingCart, DollarSign, Code } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Pixels = () => {
  const { t } = useTranslation();
  const { pixels, loading } = usePixels();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();
  const helpRef = useScrollAnimation<HTMLDivElement>();

  const activePixels = pixels.filter(p => p.is_active).length;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
        <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Code className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('pixels.title', 'Mes Pixels')}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            {t('pixels.subtitle', 'Gérez vos Pixels publicitaires et suivez leurs performances')}
          </p>
        </div>
              <div className="flex items-center gap-2">
        <CreatePixelDialog />
              </div>
      </div>

            {/* Stats Cards - Responsive */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {/* Total Pixels */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('pixels.stats.total', 'Total Pixels')}</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {pixels.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
              {t('pixels.stats.active', { count: activePixels, defaultValue: `${activePixels} actif${activePixels > 1 ? 's' : ''}` })}
            </p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    </div>
                  </div>
          </CardContent>
        </Card>

              {/* Événements PageView */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('pixels.stats.pageView', 'Événements PageView')}</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        -
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{t('pixels.stats.last7Days', '7 derniers jours')}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    </div>
                  </div>
          </CardContent>
        </Card>

              {/* Add to Cart */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('pixels.stats.addToCart', 'Add to Cart')}</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        -
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{t('pixels.stats.last7Days', '7 derniers jours')}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    </div>
                  </div>
          </CardContent>
        </Card>

              {/* Achats */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('pixels.stats.purchases', 'Achats')}</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        -
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{t('pixels.stats.last7Days', '7 derniers jours')}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    </div>
                  </div>
          </CardContent>
        </Card>
      </div>

            {/* Vos Pixels */}
            <Card
              ref={tableRef}
              className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
        <CardHeader>
                <CardTitle className="text-base sm:text-lg">{t('pixels.list.title', 'Vos Pixels')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
            {t('pixels.list.description', 'Liste de tous vos Pixels configurés. Activez ou désactivez-les selon vos besoins.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <PixelsTable pixels={pixels} />
          )}
        </CardContent>
      </Card>

            {/* Comment ça fonctionne ? */}
            <Card
              ref={helpRef}
              className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
        <CardHeader>
                <CardTitle className="text-base sm:text-lg">Comment ça fonctionne ?</CardTitle>
        </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-bold text-xs">
                    1
                  </div>
          <div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-1">Ajoutez vos Pixels</h3>
                    <p className="text-xs text-muted-foreground">
              Cliquez sur "Ajouter un Pixel" et renseignez les informations de votre Pixel publicitaire (Facebook, Google, TikTok, etc.).
            </p>
          </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-bold text-xs">
                    2
                  </div>
          <div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-1">Injection automatique</h3>
                    <p className="text-xs text-muted-foreground">
              Vos Pixels actifs seront automatiquement injectés sur vos pages de produits et de vente.
            </p>
          </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-bold text-xs">
                    3
                  </div>
          <div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-1">Suivi des événements</h3>
                    <p className="text-xs text-muted-foreground">
              Le système envoie automatiquement les événements importants : visites de pages, ajouts au panier, achats et leads.
            </p>
          </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-bold text-xs">
                    4
                  </div>
          <div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-1">Confidentialité</h3>
                    <p className="text-xs text-muted-foreground">
              Vos Pixels sont privés et ne s'activent que sur vos propres produits. Conformité RGPD garantie.
            </p>
                  </div>
          </div>
        </CardContent>
      </Card>
    </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Pixels;
