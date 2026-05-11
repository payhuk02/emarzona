/**
 * Page Admin Demand Forecasting - Prévisions de demande
 * Date: 27 Janvier 2025
 *
 * Fonctionnalités:
 * - Dashboard analytics des prévisions
 * - Recommandations de réapprovisionnement
 * - Calcul de prévisions
 */

import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DemandForecastingDashboard } from '@/components/physical/forecasting';
import { TrendingUp } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useStore } from '@/hooks/useStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminDemandForecasting() {
  const { t } = useTranslation();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const { store, loading: storeLoading } = useStore();

  // Loading state
  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // No store state
  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                  <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {t('admin.demandForecasting.noStore')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                <SidebarTrigger className="mt-1 sm:mt-0 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500 shrink-0">
                      <TrendingUp
                        className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                      {t('admin.demandForecasting.title')}
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                    {t('admin.demandForecasting.description')}
                  </p>
                </div>
              </div>
            </div>

            <DemandForecastingDashboard />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






