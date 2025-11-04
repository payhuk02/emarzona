/**
 * Advanced Service Calendar Component
 * Date: 27 Janvier 2025
 * 
 * Calendrier avancé avec vues multiples (mois, semaine, jour, timeline)
 * Support drag & drop, multi-staff, filtres avancés
 */

import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View, Views, ViewProps } from 'react-big-calendar';
import { format, parse, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getDay, addHours, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  LayoutGrid,
  GanttChart,
  Filter,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdvancedCalendar, useCalendarBookings, useCalendarStaff, useUpdateBookingTime, useUpdateBookingStaff, CalendarBooking, CalendarStaff } from '@/hooks/services/useAdvancedCalendar';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import { format as formatDate } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';

// Setup localizer
const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
  getDay,
  locales,
});

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
  defaultView?: CalendarViewType;
  enableDragDrop?: boolean;
  enableFilters?: boolean;
  onBookingSelect?: (booking: CalendarBooking) => void;
  className?: string;
}

export default function AdvancedServiceCalendar({
  serviceId,
  defaultView = 'week',
  enableDragDrop = true,
  enableFilters = true,
  onBookingSelect,
  className,
}: AdvancedServiceCalendarProps) {
  const { store } = useStore();
  const { toast } = useToast();

  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [timelineView, setTimelineView] = useState(false);

  // Récupérer les données
  const { data: bookings = [], isLoading: bookingsLoading } = useCalendarBookings(store?.id, {
    dateRange: useMemo(() => {
      if (view === Views.MONTH) {
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
        };
      } else if (view === Views.WEEK) {
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
  const updateBookingStaff = useUpdateBookingStaff();

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

  // Gérer changement de vue
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
    if (newView === Views.MONTH) {
      setTimelineView(false);
    }
  }, []);

  // Navigation
  const navigate = useCallback((action: 'prev' | 'next' | 'today') => {
    if (action === 'prev') {
      if (view === Views.MONTH) {
        setDate(addDays(date, -30));
      } else if (view === Views.WEEK) {
        setDate(addDays(date, -7));
      } else {
        setDate(addDays(date, -1));
      }
    } else if (action === 'next') {
      if (view === Views.MONTH) {
        setDate(addDays(date, 30));
      } else if (view === Views.WEEK) {
        setDate(addDays(date, 7));
      } else {
        setDate(addDays(date, 1));
      }
    } else {
      setDate(new Date());
    }
  }, [view, date]);

  // Vue timeline personnalisée (multi-staff)
  const TimelineView = useMemo(() => {
    if (!timelineView) return null;

    const timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    return (
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header avec staff */}
          <div className="flex border-b">
            <div className="w-24 p-2 font-medium border-r">Heure</div>
            {staff.map((s) => (
              <div key={s.id} className="flex-1 p-2 font-medium border-r text-center" style={{ backgroundColor: `${s.color}20` }}>
                {s.name}
              </div>
            ))}
          </div>

          {/* Lignes de temps */}
          {timeSlots.map((time) => (
            <div key={time} className="flex border-b">
              <div className="w-24 p-2 text-sm border-r">{time}</div>
              {staff.map((s) => {
                const staffBookings = filteredBookings.filter(
                  b => b.staffId === s.id &&
                  formatDate(new Date(b.start), 'HH:mm') === time
                );
                return (
                  <div key={s.id} className="flex-1 p-1 border-r min-h-[60px]" style={{ backgroundColor: `${s.color}10` }}>
                    {staffBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="text-xs p-1 rounded mb-1 cursor-pointer"
                        style={{
                          backgroundColor: s.color,
                          color: '#ffffff',
                        }}
                        onClick={() => handleSelectEvent(booking)}
                      >
                        <div className="font-medium truncate">{booking.serviceName}</div>
                        <div className="text-xs opacity-90">{booking.customerName}</div>
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

  if (bookingsLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Chargement du calendrier...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendrier des Réservations</CardTitle>
              <CardDescription>
                {filteredBookings.length} réservation{filteredBookings.length > 1 ? 's' : ''} affichée{filteredBookings.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Filtres */}
              {enableFilters && (
                <>
                  <Select
                    value={selectedStaff.length > 0 ? selectedStaff[0] : 'all'}
                    onValueChange={(value) => setSelectedStaff(value === 'all' ? [] : [value])}
                  >
                    <SelectTrigger className="w-48">
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
                    <SelectTrigger className="w-48">
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

              {/* Actions */}
              <Button variant="outline" size="sm" onClick={() => navigate('today')}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Vue sélection */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={view === Views.MONTH ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange(Views.MONTH)}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Mois
            </Button>
            <Button
              variant={view === Views.WEEK ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange(Views.WEEK)}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Semaine
            </Button>
            <Button
              variant={view === Views.DAY ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange(Views.DAY)}
            >
              <List className="h-4 w-4 mr-2" />
              Jour
            </Button>
            <Button
              variant={timelineView ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTimelineView(!timelineView);
                if (!timelineView) setView(Views.WEEK);
              }}
            >
              <GanttChart className="h-4 w-4 mr-2" />
              Timeline
            </Button>
          </div>

          {/* Légende */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
              <span>En attente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
              <span>Confirmé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }} />
              <span>En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
              <span>Annulé</span>
            </div>
          </div>

          {/* Calendrier ou Timeline */}
          {timelineView ? (
            TimelineView
          ) : (
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={filteredBookings}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={handleViewChange}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails Réservation */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la Réservation</DialogTitle>
            <DialogDescription>
              Informations complètes sur la réservation
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Service</Label>
                  <p className="text-sm">{selectedBooking.serviceName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Statut</Label>
                  <Badge variant={
                    selectedBooking.status === 'confirmed' ? 'default' :
                    selectedBooking.status === 'completed' ? 'secondary' :
                    selectedBooking.status === 'cancelled' ? 'destructive' :
                    'outline'
                  }>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Client</Label>
                  <p className="text-sm">{selectedBooking.customerName}</p>
                  <p className="text-xs text-muted-foreground">{selectedBooking.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Staff</Label>
                  <p className="text-sm">{selectedBooking.staffName || 'Non assigné'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{formatDate(selectedBooking.start, 'dd MMMM yyyy', { locale: frLocale })}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Heure</Label>
                  <p className="text-sm">
                    {formatDate(selectedBooking.start, 'HH:mm')} - {formatDate(selectedBooking.end, 'HH:mm')}
                  </p>
                </div>
                {selectedBooking.price && (
                  <div>
                    <Label className="text-sm font-medium">Prix</Label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                      }).format(selectedBooking.price)}
                    </p>
                  </div>
                )}
                {selectedBooking.participants && selectedBooking.participants > 1 && (
                  <div>
                    <Label className="text-sm font-medium">Participants</Label>
                    <p className="text-sm">{selectedBooking.participants} personnes</p>
                  </div>
                )}
              </div>
              {selectedBooking.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

