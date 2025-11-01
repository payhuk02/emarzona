/**
 * 📅 Gestion des Réservations - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète des réservations avec calendrier, recherche, filtres, tri, export et actions
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Users,
  Filter,
  Download,
  RefreshCw,
  Search,
  X,
  Grid3x3,
  List,
  Keyboard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  DollarSign,
  CalendarDays,
  User,
  Phone,
  Mail,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { ServiceBookingCalendar, BookingEvent } from '@/components/service';
import { useToast } from '@/hooks/use-toast';
import { format, addHours, startOfDay, endOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useConfirmBooking,
  useCancelBooking,
  useCompleteBooking,
  useMarkNoShow,
} from '@/hooks/service/useBookings';

type ViewMode = 'grid' | 'list';
type CalendarView = 'month' | 'week' | 'day';

export default function BookingsManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const calendarRef = useScrollAnimation<HTMLDivElement>();

  // Mutations
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();
  const completeBooking = useCompleteBooking();
  const markNoShow = useMarkNoShow();

  // Fetch bookings with store filter
  const { data: bookings, isLoading, error: bookingsError, refetch } = useQuery({
    queryKey: ['service-bookings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Récupérer le store de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.store_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          service_product:service_products(
            *,
            product:products(id, name, price, currency)
          ),
          customer:customers(full_name, email, phone)
        `)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: true });

      if (error) {
        logger.error('Error fetching bookings', { error: error.message });
        throw error;
      }

      // Filtrer par store_id via service_products
      const filtered = data?.filter((booking: any) => {
        return booking.service_product?.some((sp: any) => sp.store_id === profile.store_id);
      }) || [];

      return filtered;
    },
    staleTime: 30000, // 30 secondes
    gcTime: 300000, // 5 minutes
  });

  // Fetch availabilities
  const { data: availabilities } = useQuery({
    queryKey: ['service-availabilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_availability')
        .select(`
          *,
          service_product:service_products(
            *,
            product:products(name)
          )
        `)
        .eq('is_available', true);

      if (error) {
        logger.error('Error fetching availabilities', { error: error.message });
        throw error;
      }
      return data;
    },
  });

  // Transform bookings to calendar events
  const events = useMemo((): BookingEvent[] => {
    const bookingEvents: BookingEvent[] = [];

    if (bookings) {
      bookings.forEach((booking: any) => {
        try {
          const start = parseISO(`${booking.booking_date}T${booking.start_time || booking.booking_time || '00:00:00'}`);
          const end = parseISO(`${booking.booking_date}T${booking.end_time || booking.booking_time || '00:00:00'}`);

          bookingEvents.push({
            id: booking.id,
            title: `${booking.service_product?.[0]?.product?.name || 'Service'} - ${booking.customer?.full_name || 'Client'}`,
            start,
            end,
            type: booking.status === 'confirmed' || booking.status === 'completed' ? 'booked' : 
                  booking.status === 'cancelled' ? 'unavailable' : 'available',
            resource: {
              customerId: booking.customer_id,
              customerName: booking.customer?.full_name,
              customerEmail: booking.customer?.email,
              customerPhone: booking.customer?.phone,
              participants: booking.participants_count || booking.participants || 1,
              status: booking.status,
              price: booking.total_price,
              bookingDate: booking.booking_date,
              bookingTime: booking.start_time || booking.booking_time,
            },
          });
        } catch (err) {
          logger.error('Error parsing booking date', { booking, error: err });
        }
      });
    }

    // Add availabilities
    if (availabilities) {
      const now = new Date();
      const daysToShow = 30;

      for (let i = 0; i < daysToShow; i++) {
        const currentDate = new Date(now);
        currentDate.setDate(now.getDate() + i);
        const dayOfWeek = currentDate.getDay();

        availabilities.forEach((availability: any) => {
          if (availability.day_of_week === dayOfWeek) {
            const [startHour, startMinute] = availability.start_time.split(':');
            const [endHour, endMinute] = availability.end_time.split(':');

            const start = new Date(currentDate);
            start.setHours(parseInt(startHour), parseInt(startMinute), 0);

            const end = new Date(currentDate);
            end.setHours(parseInt(endHour), parseInt(endMinute), 0);

            const isBooked = bookingEvents.some(
              (event) =>
                event.type === 'booked' &&
                event.start >= start &&
                event.start < end
            );

            if (!isBooked && start > now) {
              bookingEvents.push({
                id: `availability-${availability.id}-${format(currentDate, 'yyyy-MM-dd')}`,
                title: `Disponible - ${availability.service_product?.product?.name || 'Service'}`,
                start,
                end,
                type: 'available',
                resource: {},
              });
            }
          }
        });
      }
    }

    return bookingEvents;
  }, [bookings, availabilities]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.filter((booking: any) => {
      // Search filter
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = 
        booking.customer?.full_name?.toLowerCase().includes(searchLower) ||
        booking.customer?.email?.toLowerCase().includes(searchLower) ||
        booking.customer?.phone?.includes(searchLower) ||
        booking.service_product?.[0]?.product?.name?.toLowerCase().includes(searchLower) ||
        booking.id.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter === 'today') {
        const today = format(new Date(), 'yyyy-MM-dd');
        matchesDate = booking.booking_date === today;
      } else if (dateFilter === 'week') {
        const weekStart = format(startOfDay(new Date()), 'yyyy-MM-dd');
        const weekEnd = format(endOfDay(addHours(new Date(), 7 * 24)), 'yyyy-MM-dd');
        matchesDate = booking.booking_date >= weekStart && booking.booking_date <= weekEnd;
      } else if (dateFilter === 'month') {
        const monthStart = format(startOfDay(new Date()), 'yyyy-MM-01');
        const monthEnd = format(endOfDay(addHours(new Date(), 30 * 24)), 'yyyy-MM-dd');
        matchesDate = booking.booking_date >= monthStart && booking.booking_date <= monthEnd;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, debouncedSearch, statusFilter, dateFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!bookings) return { total: 0, confirmed: 0, pending: 0, cancelled: 0, totalRevenue: 0 };

    const total = bookings.length;
    const confirmed = bookings.filter((b: any) => b.status === 'confirmed').length;
    const pending = bookings.filter((b: any) => b.status === 'pending').length;
    const cancelled = bookings.filter((b: any) => b.status === 'cancelled').length;
    const totalRevenue = bookings
      .filter((b: any) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum: number, b: any) => sum + (b.total_price || 0), 0);

    return { total, confirmed, pending, cancelled, totalRevenue };
  }, [bookings]);

  // Handle event click
  const handleSelectEvent = useCallback((event: BookingEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
    logger.info('Booking selected', { bookingId: event.id });
  }, []);

  // Handle slot selection
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    logger.info('Slot selected for new booking', { 
      start: format(slotInfo.start, 'PPP à HH:mm', { locale: fr }),
      end: format(slotInfo.end, 'HH:mm', { locale: fr })
    });
    toast({
      title: '📅 Créer une réservation',
      description: `${format(slotInfo.start, 'PPP à HH:mm', { locale: fr })} - ${format(slotInfo.end, 'HH:mm', { locale: fr })}`,
    });
  }, [toast]);

  // Handle confirm booking
  const handleConfirmBooking = useCallback(async (bookingId: string) => {
    try {
      await confirmBooking.mutateAsync(bookingId);
      toast({
        title: '✅ Réservation confirmée',
        description: 'La réservation a été confirmée avec succès.',
      });
      setIsDialogOpen(false);
      logger.info('Booking confirmed', { bookingId });
    } catch (error: any) {
      logger.error('Error confirming booking', { bookingId, error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de confirmer la réservation',
        variant: 'destructive',
      });
    }
  }, [confirmBooking, toast]);

  // Handle cancel booking
  const handleCancelBooking = useCallback(async (bookingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    try {
      await cancelBooking.mutateAsync({ id: bookingId, reason: 'Annulé par l\'administrateur' });
      toast({
        title: '✅ Réservation annulée',
        description: 'La réservation a été annulée avec succès.',
      });
      setIsDialogOpen(false);
      logger.info('Booking cancelled', { bookingId });
    } catch (error: any) {
      logger.error('Error cancelling booking', { bookingId, error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'annuler la réservation',
        variant: 'destructive',
      });
    }
  }, [cancelBooking, toast]);

  // Handle complete booking
  const handleCompleteBooking = useCallback(async (bookingId: string) => {
    try {
      await completeBooking.mutateAsync(bookingId);
      toast({
        title: '✅ Réservation terminée',
        description: 'La réservation a été marquée comme terminée.',
      });
      setIsDialogOpen(false);
      logger.info('Booking completed', { bookingId });
    } catch (error: any) {
      logger.error('Error completing booking', { bookingId, error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de terminer la réservation',
        variant: 'destructive',
      });
    }
  }, [completeBooking, toast]);

  // Handle mark no-show
  const handleMarkNoShow = useCallback(async (bookingId: string) => {
    try {
      await markNoShow.mutateAsync(bookingId);
      toast({
        title: '⚠️ Client absent',
        description: 'La réservation a été marquée comme "client absent".',
      });
      setIsDialogOpen(false);
      logger.warn('Booking marked as no-show', { bookingId });
    } catch (error: any) {
      logger.error('Error marking no-show', { bookingId, error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de marquer comme absent',
        variant: 'destructive',
      });
    }
  }, [markNoShow, toast]);

  // Export to CSV
  const handleExportCSV = useCallback(async () => {
    if (!filteredBookings || filteredBookings.length === 0) {
      toast({
        title: '⚠️ Aucune donnée',
        description: 'Aucune réservation à exporter.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const headers = ['ID', 'Date', 'Heure', 'Client', 'Email', 'Téléphone', 'Service', 'Statut', 'Prix', 'Participants'];
      const rows = filteredBookings.map((booking: any) => [
        booking.id,
        booking.booking_date,
        booking.start_time || booking.booking_time || '',
        booking.customer?.full_name || '',
        booking.customer?.email || '',
        booking.customer?.phone || '',
        booking.service_product?.[0]?.product?.name || '',
        booking.status,
        booking.total_price || 0,
        booking.participants_count || booking.participants || 1,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reservations-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '✅ Export réussi',
        description: `${filteredBookings.length} réservation(s) exportée(s) en CSV.`,
      });
      logger.info('Bookings exported to CSV', { count: filteredBookings.length });
    } catch (error: any) {
      logger.error('Error exporting bookings', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'exporter les réservations.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredBookings, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K pour recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      // Ctrl/Cmd + G pour basculer vue calendrier/liste
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setViewMode(prev => prev === 'list' ? 'grid' : 'list');
      }
      // Esc pour effacer recherche
      if (e.key === 'Escape' && document.activeElement?.id === 'search-input') {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Error handling
  useEffect(() => {
    if (bookingsError) {
      setError('Erreur lors du chargement des réservations');
      logger.error('Bookings fetch error', { error: bookingsError });
    } else {
      setError(null);
    }
  }, [bookingsError]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement des réservations...</p>
              </div>
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
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          {/* Header avec animation */}
          <div ref={headerRef} className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Gestion des réservations
                </h1>
                <p className="text-muted-foreground mt-2 text-sm md:text-base">
                  Gérez vos réservations de services et disponibilités
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  size="sm"
                  className="transition-all hover:scale-105"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards avec animations */}
          <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-br from-background to-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">réservations</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-500/50 transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Confirmées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.confirmed}</div>
                <p className="text-xs text-muted-foreground mt-1">réservations</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-br from-yellow-50/50 to-background dark:from-yellow-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  En attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">réservations</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-red-500/50 transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-br from-red-50/50 to-background dark:from-red-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Annulées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-red-600">{stats.cancelled}</div>
                <p className="text-xs text-muted-foreground mt-1">réservations</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-500/50 transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-br from-blue-50/50 to-background dark:from-blue-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Revenu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-blue-600">
                  {stats.totalRevenue.toLocaleString('fr-FR')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">XOF</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters et Actions avec animation */}
          <div ref={filtersRef} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
            {/* Recherche */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                placeholder="Rechercher (client, service, email...) ⌘K"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-10 w-full"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchInput('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmées</SelectItem>
                  <SelectItem value="completed">Terminées</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                  <SelectItem value="no_show">Absents</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>

              {/* Mode vue */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none border-l"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                disabled={isExporting || filteredBookings.length === 0}
                className="transition-all hover:scale-105"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">Exporter</span>
              </Button>
            </div>
          </div>

          {/* Raccourcis clavier */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in duration-500 delay-300">
            <Keyboard className="h-3 w-3" />
            <span className="hidden sm:inline">Raccourcis: ⌘K (recherche), ⌘G (vue)</span>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Calendar/List View */}
          <div ref={calendarRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            {viewMode === 'grid' ? (
              <ServiceBookingCalendar
                events={events}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                defaultView={calendarView}
                enableSelection={true}
                showLegend={true}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Liste des réservations</CardTitle>
                  <CardDescription>
                    {filteredBookings.length} réservation(s) trouvée(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Aucune réservation</h3>
                      <p className="text-muted-foreground">
                        {searchInput || statusFilter !== 'all' || dateFilter !== 'all'
                          ? 'Aucune réservation ne correspond aux filtres sélectionnés.'
                          : 'Les réservations apparaîtront ici.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBookings.map((booking: any) => {
                        const bookingEvent = events.find(e => e.id === booking.id);
                        return (
                          <Card
                            key={booking.id}
                            className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                            onClick={() => bookingEvent && handleSelectEvent(bookingEvent)}
                          >
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold">
                                      {booking.customer?.full_name || 'Client anonyme'}
                                    </h3>
                                    <Badge
                                      variant={
                                        booking.status === 'confirmed'
                                          ? 'default'
                                          : booking.status === 'pending'
                                          ? 'secondary'
                                          : booking.status === 'cancelled'
                                          ? 'destructive'
                                          : 'outline'
                                      }
                                    >
                                      {booking.status === 'confirmed'
                                        ? 'Confirmé'
                                        : booking.status === 'pending'
                                        ? 'En attente'
                                        : booking.status === 'cancelled'
                                        ? 'Annulé'
                                        : booking.status === 'completed'
                                        ? 'Terminé'
                                        : booking.status === 'no_show'
                                        ? 'Absent'
                                        : booking.status}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      {format(parseISO(`${booking.booking_date}T00:00:00`), 'PPP', { locale: fr })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      {booking.start_time || booking.booking_time || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      {booking.participants_count || booking.participants || 1} participant(s)
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-4 w-4" />
                                      {booking.total_price?.toLocaleString('fr-FR') || 0} XOF
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {booking.service_product?.[0]?.product?.name || 'Service'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {booking.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmBooking(booking.id);
                                      }}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Confirmer
                                    </Button>
                                  )}
                                  {booking.status === 'confirmed' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCompleteBooking(booking.id);
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Terminer
                                    </Button>
                                  )}
                                  {booking.status !== 'cancelled' && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelBooking(booking.id);
                                      }}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Annuler
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Event Detail Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedEvent?.title}</DialogTitle>
                <DialogDescription>
                  {selectedEvent && (
                    <>
                      {format(selectedEvent.start, 'PPP à HH:mm', { locale: fr })} -{' '}
                      {format(selectedEvent.end, 'HH:mm', { locale: fr })}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              {selectedEvent && (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div>
                    <Badge
                      variant={
                        selectedEvent.type === 'booked'
                          ? 'default'
                          : selectedEvent.type === 'available'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className="text-base px-3 py-1"
                    >
                      {selectedEvent.type === 'booked'
                        ? 'Réservé'
                        : selectedEvent.type === 'available'
                        ? 'Disponible'
                        : 'Indisponible'}
                    </Badge>
                  </div>

                  {/* Details */}
                  {selectedEvent.resource && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedEvent.resource.customerName && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Client
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.resource.customerName}
                          </p>
                        </div>
                      )}
                      {selectedEvent.resource.customerEmail && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.resource.customerEmail}
                          </p>
                        </div>
                      )}
                      {selectedEvent.resource.customerPhone && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Téléphone
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.resource.customerPhone}
                          </p>
                        </div>
                      )}
                      {selectedEvent.resource.participants && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Participants
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.resource.participants}
                          </p>
                        </div>
                      )}
                      {selectedEvent.resource.price && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Prix total
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.resource.price.toLocaleString('fr-FR')} XOF
                          </p>
                        </div>
                      )}
                      {selectedEvent.resource.status && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Statut</p>
                          <Badge variant="outline">{selectedEvent.resource.status}</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {selectedEvent.type === 'booked' && selectedEvent.resource?.status && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {selectedEvent.resource.status === 'pending' && (
                        <Button
                          onClick={() => selectedEvent.id && handleConfirmBooking(selectedEvent.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirmer
                        </Button>
                      )}
                      {selectedEvent.resource.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          onClick={() => selectedEvent.id && handleCompleteBooking(selectedEvent.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Terminer
                        </Button>
                      )}
                      {selectedEvent.resource.status !== 'cancelled' && (
                        <>
                          <Button
                            variant="destructive"
                            onClick={() => selectedEvent.id && handleCancelBooking(selectedEvent.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Annuler
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => selectedEvent.id && handleMarkNoShow(selectedEvent.id)}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Marquer absent
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {selectedEvent.type === 'available' && (
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une réservation
                    </Button>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
