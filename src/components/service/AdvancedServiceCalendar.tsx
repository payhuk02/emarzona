/**
 * Advanced Service Calendar Component
 * Date: 27 Janvier 2025
 * 
 * Calendrier avancé avec vues multiples (mois, semaine, jour, timeline)
 * Support drag & drop, multi-staff, filtres avancés
 */

import { useState, useCallback, useMemo } from 'react';
import { format, parse, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getDay, startOfDay, endOfDay, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LazyCalendarWrapper } from '@/components/calendar/LazyCalendarWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar as CalendarIcon,
  Users,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  LayoutGrid,
  GanttChart,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarBookings, useCalendarStaff, useUpdateBookingTime, CalendarBooking } from '@/hooks/services/useAdvancedCalendar';
import { useStore } from '@/hooks/useStore';
import { format as formatDate } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';

// Localizer will be created inside the component with lazy-loaded calendar

// Messages en français
const messages = {
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  allDay: 'Journée',
  week: 'Semaine',
  work_week: 'Sem. travail',
  day: 'Jour',
  month: 'Mois',
  agenda: 'Agenda',
  previous: 'Précédent',
  next: 'Suivant',
  yesterday: 'Hier',
  tomorrow: 'Demain',
  today: "Aujourd'hui",
  noEventsInRange: 'Aucun événement dans cette période.',
  showMore: (total: number) => `+ ${total} de plus`,
};

// Types de vues
export type CalendarViewType = 'month' | 'week' | 'day' | 'timeline';

interface AdvancedServiceCalendarProps {
  serviceId?: string;
  enableDragDrop?: boolean;
  enableFilters?: boolean;
  onBookingSelect?: (booking: CalendarBooking) => void;
  className?: string;
}

export default function AdvancedServiceCalendar({
  serviceId,
  enableDragDrop = true,
  enableFilters = true,
  onBookingSelect,
  className,
}: AdvancedServiceCalendarProps) {
  const { store } = useStore();

  const [view, setView] = useState<string>('week');
  const [date, setDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [timelineView, setTimelineView] = useState(false);

  // Récupérer les données
  const { data: bookings = [], isLoading: bookingsLoading } = useCalendarBookings(store?.id, {
    dateRange: useMemo(() => {
      if (view === 'month') {
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
        };
      } else if (view === 'week') {
        return {
          start: startOfWeek(date, { locale: fr }),
          end: endOfWeek(date, { locale: fr }),
        };
      } else {
        return {
          start: startOfDay(date),
          end: endOfDay(date),
        };
      }
    }, [view, date]),
    staffIds: selectedStaff.length > 0 ? selectedStaff : undefined,
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
  });

  const { data: staff = [] } = useCalendarStaff(store?.id, serviceId);
  const updateBookingTime = useUpdateBookingTime();

  // Filtrer les bookings selon les sélections
  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    if (selectedStaff.length > 0) {
      filtered = filtered.filter(b => b.staffId && selectedStaff.includes(b.staffId));
    }

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(b => selectedStatuses.includes(b.status));
    }

    return filtered;
  }, [bookings, selectedStaff, selectedStatuses]);

  // Event style getter avec code couleur par statut
  const eventStyleGetter = useCallback((event: CalendarBooking) => {
    const baseStyle: React.CSSProperties = {
      borderRadius: '6px',
      border: 'none',
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '500',
      padding: '4px 8px',
      cursor: enableDragDrop ? 'move' : 'pointer',
    };

    // Couleurs par statut
    const statusColors: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#f59e0b', text: '#ffffff' }, // amber
      confirmed: { bg: '#10b981', text: '#ffffff' }, // green
      in_progress: { bg: '#3b82f6', text: '#ffffff' }, // blue
      completed: { bg: '#6b7280', text: '#ffffff' }, // gray
      cancelled: { bg: '#ef4444', text: '#ffffff' }, // red
      no_show: { bg: '#dc2626', text: '#ffffff' }, // red-600
    };

    const color = statusColors[event.status] || statusColors.pending;

    return {
      style: {
        ...baseStyle,
        backgroundColor: event.resourceId && staff.find(s => s.id === event.resourceId)?.color || color.bg,
        color: color.text,
        borderLeft: `4px solid ${color.bg}`,
      },
    };
  }, [enableDragDrop, staff]);

  // Gérer drag & drop
  const handleEventDrop = useCallback(
    async ({ event, start, end }: { event: CalendarBooking; start: Date; end: Date }) => {
      if (!enableDragDrop) return;

      try {
        await updateBookingTime.mutateAsync({
          bookingId: event.id,
          newStart: start,
          newEnd: end,
        });
      } catch (error) {
        // Erreur gérée par le hook
      }
    },
    [enableDragDrop, updateBookingTime]
  );

  // Gérer sélection d'événement
  const handleSelectEvent = useCallback((event: CalendarBooking) => {
    setSelectedBooking(event);
    setIsBookingDialogOpen(true);
    onBookingSelect?.(event);
  }, [onBookingSelect]);


  // Navigation
  const navigate = useCallback((action: 'prev' | 'next' | 'today') => {
    if (action === 'prev') {
      if (view === 'month') {
        setDate(addDays(date, -30));
      } else if (view === 'week') {
        setDate(addDays(date, -7));
      } else {
        setDate(addDays(date, -1));
      }
    } else if (action === 'next') {
      if (view === 'month') {
        setDate(addDays(date, 30));
      } else if (view === 'week') {
        setDate(addDays(date, 7));
      } else {
        setDate(addDays(date, 1));
      }
    } else {
      setDate(new Date());
    }
  }, [view, date]);

  // Vue timeline personnalisée (multi-staff) - Responsive
  const TimelineView = useMemo(() => {
    if (!timelineView) return null;

    const timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    if (staff.length === 0) {
      return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
          <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Aucun staff disponible
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Ajoutez des membres du staff pour voir la vue timeline
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
        <div className="min-w-full">
          {/* Header avec staff - Responsive */}
          <div className="flex border-b border-border/50">
            <div className="w-16 sm:w-24 p-2 sm:p-3 text-xs sm:text-sm font-medium border-r border-border/50 shrink-0">
              Heure
            </div>
            {staff.map((s) => (
              <div
                key={s.id}
                className="flex-1 min-w-[120px] p-2 sm:p-3 text-xs sm:text-sm font-medium border-r border-border/50 text-center shrink-0"
                style={{ backgroundColor: `${s.color}20` }}
              >
                {s.name}
              </div>
            ))}
          </div>

          {/* Lignes de temps - Responsive */}
          {timeSlots.map((time) => (
            <div key={time} className="flex border-b border-border/50">
              <div className="w-16 sm:w-24 p-2 sm:p-3 text-xs sm:text-sm border-r border-border/50 shrink-0">
                {time}
              </div>
              {staff.map((s) => {
                const staffBookings = filteredBookings.filter(
                  (b) =>
                    b.staffId === s.id &&
                    formatDate(new Date(b.start), 'HH:mm') === time
                );
                return (
                  <div
                    key={s.id}
                    className="flex-1 min-w-[120px] p-1 sm:p-2 border-r border-border/50 min-h-[50px] sm:min-h-[60px] shrink-0"
                    style={{ backgroundColor: `${s.color}10` }}
                  >
                    {staffBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="text-[10px] sm:text-xs p-1 sm:p-1.5 rounded mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{
                          backgroundColor: s.color,
                          color: '#ffffff',
                        }}
                        onClick={() => handleSelectEvent(booking)}
                      >
                        <div className="font-medium truncate">{booking.serviceName}</div>
                        <div className="text-[9px] sm:text-xs opacity-90 truncate">
                          {booking.customerName}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }, [timelineView, staff, filteredBookings, handleSelectEvent]);

  // Déterminer la vue active pour les Tabs
  const activeView = timelineView ? 'timeline' : view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';

  if (bookingsLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 sm:py-16">
          <div className="text-center text-sm sm:text-base text-muted-foreground">
            Chargement du calendrier...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Toolbar - Responsive */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg md:text-xl">Calendrier des Réservations</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                {filteredBookings.length} réservation{filteredBookings.length > 1 ? 's' : ''} affichée{filteredBookings.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Filtres - Responsive */}
              {enableFilters && (
                <>
                  <Select
                    value={selectedStaff.length > 0 ? selectedStaff[0] : 'all'}
                    onValueChange={(value) => setSelectedStaff(value === 'all' ? [] : [value])}
                  >
                    <SelectTrigger className="w-full sm:w-[160px] h-9 sm:h-10 text-xs sm:text-sm">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                      <SelectValue placeholder="Tous les staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les staff</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedStatuses.length > 0 ? selectedStatuses[0] : 'all'}
                    onValueChange={(value) => setSelectedStatuses(value === 'all' ? [] : [value])}
                  >
                    <SelectTrigger className="w-full sm:w-[160px] h-9 sm:h-10 text-xs sm:text-sm">
                      <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmé</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              {/* Actions - Responsive */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('today')}
                  className="h-9 sm:h-10 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Aujourd'hui</span>
                  <span className="sm:hidden">Auj.</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('prev')}
                  className="h-9 sm:h-10 w-9 sm:w-10 p-0"
                  aria-label="Précédent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('next')}
                  className="h-9 sm:h-10 w-9 sm:w-10 p-0"
                  aria-label="Suivant"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0">
          {/* Vue sélection avec Tabs - Responsive */}
          <Tabs
            value={activeView}
            onValueChange={(value) => {
              if (value === 'timeline') {
                setTimelineView(true);
                setView('week');
              } else {
                setTimelineView(false);
                if (value === 'month') {
                  setView('month');
                } else if (value === 'week') {
                  setView('week');
                } else if (value === 'day') {
                  setView('day');
                }
              }
            }}
          >
            <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto grid grid-cols-4 sm:flex mb-4">
              <TabsTrigger
                value="month"
                className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Mois</span>
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Semaine</span>
              </TabsTrigger>
              <TabsTrigger
                value="day"
                className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Jour</span>
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                <GanttChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
            </TabsList>

            {/* Légende - Responsive */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded shrink-0" style={{ backgroundColor: '#f59e0b' }} />
                <span>En attente</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded shrink-0" style={{ backgroundColor: '#10b981' }} />
                <span>Confirmé</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded shrink-0" style={{ backgroundColor: '#3b82f6' }} />
                <span>En cours</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded shrink-0" style={{ backgroundColor: '#ef4444' }} />
                <span>Annulé</span>
              </div>
            </div>

            {/* TabsContent pour chaque vue */}
            <TabsContent value="month" className="mt-0">
              {filteredBookings.length === 0 ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                  <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                    <CalendarIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Aucune réservation affichée pour cette période
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Utilisez les filtres pour ajuster votre recherche
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-auto">
                  <LazyCalendarWrapper>
                    {(calendar) => {
                      const localizer = calendar.dateFnsLocalizer({
                        format,
                        parse,
                        startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
                        getDay,
                        locales: { 'fr': fr },
                      });

                      return (
                        <calendar.Calendar
                          localizer={localizer}
                          events={filteredBookings}
                          startAccessor="start"
                          endAccessor="end"
                          view={calendar.Views.MONTH}
                          onView={(newView: any) => {
                            setView(newView);
                            setTimelineView(false);
                          }}
                          date={date}
                          onNavigate={setDate}
                          onSelectEvent={handleSelectEvent}
                          onEventDrop={enableDragDrop ? handleEventDrop : undefined}
                          eventPropGetter={eventStyleGetter}
                          messages={messages}
                          step={30}
                          timeslots={2}
                          min={new Date(0, 0, 0, 8, 0, 0)}
                          max={new Date(0, 0, 0, 20, 0, 0)}
                          defaultDate={new Date()}
                          draggableAccessor={() => enableDragDrop}
                          resizable={false}
                          popup
                        />
                      );
                    }}
                  </LazyCalendarWrapper>
                </div>
              )}
            </TabsContent>

            <TabsContent value="week" className="mt-0">
              {filteredBookings.length === 0 ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                  <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                    <CalendarIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Aucune réservation affichée pour cette période
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Utilisez les filtres pour ajuster votre recherche
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-auto">
                  <LazyCalendarWrapper>
                    {(calendar) => {
                      const localizer = calendar.dateFnsLocalizer({
                        format,
                        parse,
                        startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
                        getDay,
                        locales: { 'fr': fr },
                      });

                      return (
                        <calendar.Calendar
                          localizer={localizer}
                          events={filteredBookings}
                          startAccessor="start"
                          endAccessor="end"
                          view={calendar.Views.WEEK}
                          onView={(newView: any) => {
                            setView(newView);
                            setTimelineView(false);
                          }}
                          date={date}
                          onNavigate={setDate}
                          onSelectEvent={handleSelectEvent}
                          onEventDrop={enableDragDrop ? handleEventDrop : undefined}
                          eventPropGetter={eventStyleGetter}
                          messages={messages}
                          step={30}
                          timeslots={2}
                          min={new Date(0, 0, 0, 8, 0, 0)}
                          max={new Date(0, 0, 0, 20, 0, 0)}
                          defaultDate={new Date()}
                          draggableAccessor={() => enableDragDrop}
                          resizable={false}
                          popup
                        />
                      );
                    }}
                  </LazyCalendarWrapper>
                </div>
              )}
            </TabsContent>

            <TabsContent value="day" className="mt-0">
              {filteredBookings.length === 0 ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                  <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                    <CalendarIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Aucune réservation affichée pour cette période
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Utilisez les filtres pour ajuster votre recherche
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-auto">
                  <LazyCalendarWrapper>
                    {(calendar) => {
                      const localizer = calendar.dateFnsLocalizer({
                        format,
                        parse,
                        startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
                        getDay,
                        locales: { 'fr': fr },
                      });

                      return (
                        <calendar.Calendar
                          localizer={localizer}
                          events={filteredBookings}
                          startAccessor="start"
                          endAccessor="end"
                          view={calendar.Views.DAY}
                          onView={(newView: any) => {
                            setView(newView);
                            setTimelineView(false);
                          }}
                          date={date}
                          onNavigate={setDate}
                          onSelectEvent={handleSelectEvent}
                          onEventDrop={enableDragDrop ? handleEventDrop : undefined}
                          eventPropGetter={eventStyleGetter}
                          messages={messages}
                          step={30}
                          timeslots={2}
                          min={new Date(0, 0, 0, 8, 0, 0)}
                          max={new Date(0, 0, 0, 20, 0, 0)}
                          defaultDate={new Date()}
                          draggableAccessor={() => enableDragDrop}
                          resizable={false}
                          popup
                        />
                      );
                    }}
                  </LazyCalendarWrapper>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <div className="overflow-x-auto">
                {TimelineView || (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                    <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                      <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        Aucun staff disponible
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Ajoutez des membres du staff pour voir la vue timeline
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog Détails Réservation - Responsive */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Détails de la Réservation</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Informations complètes sur la réservation
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Service</Label>
                  <p className="text-xs sm:text-sm mt-1">{selectedBooking.serviceName}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Statut</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedBooking.status === 'confirmed'
                          ? 'default'
                          : selectedBooking.status === 'completed'
                          ? 'secondary'
                          : selectedBooking.status === 'cancelled'
                          ? 'destructive'
                          : 'outline'
                      }
                      className="text-xs"
                    >
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Client</Label>
                  <p className="text-xs sm:text-sm mt-1">{selectedBooking.customerName}</p>
                  {selectedBooking.customerEmail && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedBooking.customerEmail}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Staff</Label>
                  <p className="text-xs sm:text-sm mt-1">{selectedBooking.staffName || 'Non assigné'}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Date</Label>
                  <p className="text-xs sm:text-sm mt-1">
                    {formatDate(selectedBooking.start, 'dd MMMM yyyy', { locale: frLocale })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Heure</Label>
                  <p className="text-xs sm:text-sm mt-1">
                    {formatDate(selectedBooking.start, 'HH:mm')} -{' '}
                    {formatDate(selectedBooking.end, 'HH:mm')}
                  </p>
                </div>
                {selectedBooking.price && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Prix</Label>
                    <p className="text-xs sm:text-sm font-medium mt-1">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                      }).format(selectedBooking.price)}
                    </p>
                  </div>
                )}
                {selectedBooking.participants && selectedBooking.participants > 1 && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Participants</Label>
                    <p className="text-xs sm:text-sm mt-1">
                      {selectedBooking.participants} personnes
                    </p>
                  </div>
                )}
              </div>
              {selectedBooking.notes && (
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Notes</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsBookingDialogOpen(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

