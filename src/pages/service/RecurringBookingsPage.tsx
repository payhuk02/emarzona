/**
 * Recurring Bookings Page
 * Date: 27 Janvier 2025
 * 
 * Page complète pour gérer les réservations récurrentes
 * Style inspiré de "Mes Templates" avec design responsive et gradients purple-pink
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { RecurringBookingsManager } from '@/components/service/recurring';
import { Repeat, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/hooks/useStore';
import { useRecurringSeries } from '@/hooks/services/useRecurringBookings';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function RecurringBookingsPage() {
  const { t } = useTranslation();
  const { store, isLoading: storeLoading } = useStore();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  const { data: series = [], isLoading: seriesLoading } = useRecurringSeries(store?.id);

  // Calculer les stats
  const stats = useMemo(() => {
    const total = series.length;
    const active = series.filter((s) => s.is_active).length;
    const totalBookings = series.reduce((sum, s) => sum + (s.total_bookings || 0), 0);
    const completed = series.reduce((sum, s) => sum + (s.completed_bookings || 0), 0);
    const cancelled = series.reduce((sum, s) => sum + (s.cancelled_bookings || 0), 0);

    return { total, active, totalBookings, completed, cancelled };
  }, [series]);

  // Loading state
  if (storeLoading || seriesLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
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
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                  <Repeat className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {t('recurringBookings.noStore')}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('recurringBookings.noStoreDesc')}
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
        <main className="flex-1 overflow-auto">
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
                        <Repeat className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                        {t('recurringBookings.title')}
                      </span>
                    </div>
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                    {t('recurringBookings.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards - Responsive & Animated */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: t('recurringBookings.stats.total'),
                  value: stats.total,
                  icon: Repeat,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  label: t('recurringBookings.stats.active'),
                  value: stats.active,
                  icon: CheckCircle2,
                  color: 'from-green-600 to-emerald-600',
                },
                {
                  label: t('recurringBookings.stats.bookings'),
                  value: stats.totalBookings,
                  icon: Calendar,
                  color: 'from-blue-600 to-cyan-600',
                },
                {
                  label: t('recurringBookings.stats.completed'),
                  value: stats.completed,
                  icon: CheckCircle2,
                  color: 'from-green-600 to-emerald-600',
                },
                {
                  label: t('recurringBookings.stats.cancelled'),
                  value: stats.cancelled,
                  icon: XCircle,
                  color: 'from-red-600 to-rose-600',
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <RecurringBookingsManager />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







