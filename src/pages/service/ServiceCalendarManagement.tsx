/**
 * Page de Gestion Améliorée du Calendrier des Services
 * Date: 31 Janvier 2025
 * 
 * Interface complète pour gérer le calendrier des services avec :
 * - Vue calendrier améliorée avec drag & drop
 * - Statistiques et analytics
 * - Filtres avancés (staff, statut, date)
 * - Gestion des disponibilités
 * - Export et partage
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Filter,
  Download,
  Share2,
  Settings,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import AdvancedServiceCalendar from '@/components/service/AdvancedServiceCalendar';
import { useCalendarBookings, useCalendarStaff } from '@/hooks/services/useAdvancedCalendar';
import type { CalendarBooking, CalendarStaff } from '@/hooks/services/useAdvancedCalendar';

export default function ServiceCalendarManagement() {
  const { serviceId } = useParams<{ serviceId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();

  // State
  const [selectedView, setSelectedView] = useState<'calendar' | 'list' | 'stats'>('calendar');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfWeek(new Date(), { locale: fr }),
    end: endOfWeek(new Date(), { locale: fr }),
  });
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useCalendarBookings(store?.id, {
    dateRange: {
      start: dateRange.start,
      end: dateRange.end,
    },
    staffIds: selectedStaff.length > 0 ? selectedStaff : undefined,
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    serviceId: serviceId,
  });

  // Fetch staff
  const { data: staff = [] } = useCalendarStaff(store?.id, serviceId);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: bookings.length,
      confirmed: bookings.filter((b: CalendarBooking) => b.status === 'confirmed').length,
      pending: bookings.filter((b: CalendarBooking) => b.status === 'pending').length,
      cancelled: bookings.filter((b: CalendarBooking) => b.status === 'cancelled').length,
      today: bookings.filter((b: CalendarBooking) => isSameDay(b.start, now)).length,
      totalRevenue: bookings
        .filter((b: CalendarBooking) => b.status === 'confirmed')
        .reduce((sum: number, b: CalendarBooking) => sum + (b.price || 0), 0),
      upcoming: bookings.filter((b: CalendarBooking) => b.start > now).length,
    };
  }, [bookings]);

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  if (storeLoading || bookingsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Calendrier des Services
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gérez vos réservations et disponibilités avec un calendrier visuel avancé
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/dashboard/services/bookings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Gérer
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Confirmées</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.confirmed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">En attente</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Aujourd'hui</CardTitle>
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.today}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">À venir</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">{stats.upcoming}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Annulées</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.cancelled}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Revenus</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalRevenue.toLocaleString('fr-FR')} XOF</div>
                </CardContent>
              </Card>
            </div>

            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    value={selectedStaff.length === 0 ? 'all' : selectedStaff[0]}
                    onValueChange={(value) => setSelectedStaff(value === 'all' ? [] : [value])}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Tous les staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les staff</SelectItem>
                      {staff.map((s: CalendarStaff) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedStatuses.length === 0 ? 'all' : selectedStatuses[0]}
                    onValueChange={(value) => setSelectedStatuses(value === 'all' ? [] : [value])}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmées</SelectItem>
                      <SelectItem value="completed">Terminées</SelectItem>
                      <SelectItem value="cancelled">Annulées</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 flex-1">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const start = startOfWeek(new Date(), { locale: fr });
                        const end = endOfWeek(new Date(), { locale: fr });
                        setDateRange({ start, end });
                      }}
                    >
                      Cette semaine
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const start = startOfMonth(new Date());
                        const end = endOfMonth(new Date());
                        setDateRange({ start, end });
                      }}
                    >
                      Ce mois
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendrier */}
            <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
              <TabsList>
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendrier
                </TabsTrigger>
                <TabsTrigger value="stats">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Statistiques
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Vue Calendrier</CardTitle>
                    <CardDescription>
                      {format(dateRange.start, 'dd MMM yyyy', { locale: fr })} - {format(dateRange.end, 'dd MMM yyyy', { locale: fr })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {serviceId ? (
                      <AdvancedServiceCalendar
                        serviceId={serviceId}
                        enableDragDrop={true}
                        enableFilters={true}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                          Sélectionnez un service pour voir son calendrier
                        </p>
                        <Button onClick={() => navigate('/dashboard/services')}>
                          Voir les services
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition par Statut</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Confirmées</span>
                          </div>
                          <Badge variant="default" className="bg-green-600">
                            {stats.confirmed} ({stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%)
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span>En attente</span>
                          </div>
                          <Badge variant="secondary">
                            {stats.pending} ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Annulées</span>
                          </div>
                          <Badge variant="destructive">
                            {stats.cancelled} ({stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0}%)
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total confirmées</span>
                          <span className="text-2xl font-bold text-green-600">
                            {stats.totalRevenue.toLocaleString('fr-FR')} XOF
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Moyenne par réservation</span>
                          <span className="text-lg font-semibold">
                            {stats.confirmed > 0
                              ? (stats.totalRevenue / stats.confirmed).toLocaleString('fr-FR')
                              : 0}{' '}
                            XOF
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







