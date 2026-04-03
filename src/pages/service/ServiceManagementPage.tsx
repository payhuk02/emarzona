/**
 * Service Management Page
 * Date: 30 Janvier 2025
 * 
 * Page complète pour la gestion des services (calendrier, disponibilité, conflits)
 * Style inspiré de "Mes Templates" avec design responsive et gradients purple-pink
 */

import { useMemo } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AdvancedServiceCalendar,
  StaffAvailabilityManager,
  ResourceConflictDetector,
} from '@/components/service';
import { useStore } from '@/hooks/useStore';
import { Calendar, Users, AlertTriangle, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalendarBookings } from '@/hooks/services/useAdvancedCalendar';
import { useCalendarStaff } from '@/hooks/services/useAdvancedCalendar';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ServiceManagementPage() {
  const { store, isLoading: storeLoading } = useStore();
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

  // Récupérer le staff
  const { data: staff = [] } = useCalendarStaff(store?.id);

  // Récupérer les conflits
  const { data: conflicts = [] } = useQuery({
    queryKey: ['resource-conflicts-count', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('resource_conflicts')
        .select('id')
        .eq('store_id', store.id)
        .eq('status', 'detected');
      if (error) throw error;
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Calculer les stats
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const activeStaff = staff.length;
    const totalConflicts = conflicts.length;

    return { totalBookings, activeStaff, totalConflicts };
  }, [bookings, staff, conflicts]);

  // Loading state
  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
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
                  <Briefcase className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4">
                    Aucune boutique trouvée
                  </p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                    Veuillez créer une boutique pour gérer vos services
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
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="p-1 sm:p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500 shrink-0">
                        <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-5 lg:w-5 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                        Gestion des Services
                      </span>
                    </div>
                  </h1>
                  <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
                    Gérez vos réservations, la disponibilité du staff et détectez les conflits
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards - Responsive */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: 'Réservations',
                  value: stats.totalBookings,
                  icon: Calendar,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  label: 'Staff Actifs',
                  value: stats.activeStaff,
                  icon: Users,
                  color: 'from-blue-600 to-cyan-600',
                },
                {
                  label: 'Conflits',
                  value: stats.totalConflicts,
                  icon: AlertTriangle,
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
                    <CardHeader className="pb-2 sm:pb-3 p-2.5 sm:p-3 md:p-4">
                      <CardTitle className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                      <div className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Tabs - Responsive avec gradient purple-pink */}
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto grid grid-cols-3 sm:flex">
                <TabsTrigger
                  value="calendar"
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Calendrier</span>
                  <span className="sm:hidden">Cal.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="availability"
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Disponibilité</span>
                  <span className="sm:hidden">Disp.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="conflicts"
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Conflits</span>
                  <span className="sm:hidden">Conf.</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AdvancedServiceCalendar
                  enableDragDrop={true}
                  enableFilters={true}
                />
              </TabsContent>

              <TabsContent value="availability" className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <StaffAvailabilityManager storeId={store.id} />
              </TabsContent>

              <TabsContent value="conflicts" className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ResourceConflictDetector
                  storeId={store.id}
                  autoDetect={true}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







