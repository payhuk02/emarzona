/**
 * Advanced Calendar Page
 * Date: 27 Janvier 2025
 * 
 * Page complète pour le calendrier avancé des services
 * Style inspiré de "Mes Templates" avec design responsive et gradients purple-pink
 */

import { useMemo } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AdvancedServiceCalendar } from '@/components/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle2, Clock, XCircle, DollarSign } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useCalendarBookings } from '@/hooks/services/useAdvancedCalendar';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function AdvancedCalendarPage() {
  const { store } = useStore();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les bookings du mois en cours pour les stats
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: bookings = [] } = useCalendarBookings(store?.id, {
    dateRange: {
      start: monthStart,
      end: monthEnd,
    },
  });

  // Calculer les stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const revenue = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.price || 0), 0);

    return { total, confirmed, pending, cancelled, revenue };
  }, [bookings]);

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
                  <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500 shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                      Calendrier Avancé des Réservations
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                    Gérez vos réservations avec vues multiples, drag & drop et filtres avancés
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards - Responsive */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: 'Total',
                  value: stats.total,
                  icon: Calendar,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  label: 'Confirmées',
                  value: stats.confirmed,
                  icon: CheckCircle2,
                  color: 'from-green-600 to-emerald-600',
                },
                {
                  label: 'En attente',
                  value: stats.pending,
                  icon: Clock,
                  color: 'from-yellow-600 to-orange-600',
                },
                {
                  label: 'Annulées',
                  value: stats.cancelled,
                  icon: XCircle,
                  color: 'from-red-600 to-rose-600',
                },
                {
                  label: 'Revenu',
                  value: new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(stats.revenue),
                  icon: DollarSign,
                  color: 'from-blue-600 to-cyan-600',
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
                      <div className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent break-words`}>
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Calendar Component */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <AdvancedServiceCalendar
                enableDragDrop={true}
                enableFilters={true}
                defaultView="week"
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

