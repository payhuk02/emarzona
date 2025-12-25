/**
 * Page Admin Batch Shipping - Gestion des expéditions par lots
 * Date: 27 Janvier 2025
 *
 * Fonctionnalités:
 * - Création de lots d'expédition
 * - Traitement par lots
 * - Génération d'étiquettes multiples
 * Style inspiré de "MyTemplates" avec design responsive et gradients purple-pink
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { BatchShippingManagement } from '@/components/physical/batch-shipping';
import { Package, CheckCircle2, Clock, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/hooks/useStore';
import { useBatchShipments } from '@/hooks/physical/useBatchShipping';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function AdminBatchShipping() {
  const { t } = useTranslation();
  const { store, isLoading: storeLoading } = useStore();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  const { data: batches = [], isLoading: batchesLoading } = useBatchShipments(store?.id);

  // Calculer les stats
  const stats = useMemo(() => {
    const total = batches.length;
    const processing = batches.filter(b => b.status === 'processing').length;
    const labelGenerated = batches.filter(b => b.status === 'label_generated').length;
    const completed = batches.filter(b => b.status === 'completed').length;

    return { total, processing, labelGenerated, completed };
  }, [batches]);

  // Loading state
  if (storeLoading || batchesLoading) {
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
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {t('admin.batchShipping.noStore')}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('admin.batchShipping.noStoreDescription')}
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
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold flex flex-col sm:flex-row sm:items-center gap-2 mb-1 sm:mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500 shrink-0">
                        <Package
                          className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                          aria-hidden="true"
                        />
                      </div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                        {t('admin.batchShipping.title')}
                      </span>
                    </div>
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                    {t('admin.batchShipping.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards - Responsive & Animated */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: t('admin.batchShipping.stats.total'),
                  value: stats.total,
                  icon: Package,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  label: t('admin.batchShipping.stats.processing'),
                  value: stats.processing,
                  icon: Clock,
                  color: 'from-blue-600 to-cyan-600',
                },
                {
                  label: t('admin.batchShipping.stats.labelGenerated'),
                  value: stats.labelGenerated,
                  icon: Download,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  label: t('admin.batchShipping.stats.completed'),
                  value: stats.completed,
                  icon: CheckCircle2,
                  color: 'from-green-600 to-emerald-600',
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                      <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                        <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                      <div
                        className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent break-words`}
                      >
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <BatchShippingManagement />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
