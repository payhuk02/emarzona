/**
 * Service Calendar Component - Enhanced with react-big-calendar
 * Date: 28 Janvier 2025
 *
 * Version améliorée du calendrier utilisant react-big-calendar pour une meilleure UX
 * Alternative moderne au calendrier de base
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LazyCalendarWrapper } from '@/components/calendar/LazyCalendarWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import './ServiceBookingCalendar.css';

const SERVICE_AVAILABILITY_SLOT_FIELDS =
  'id, service_product_id, day_of_week, start_time, end_time, is_active';

type CalendarView = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

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
  noEventsInRange: 'Aucun créneau disponible dans cette période.',
  showMore: (total: number) => `+ ${total} de plus`,
};

interface ServiceCalendarEnhancedProps {
  serviceId?: string;
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  /** embedded = panneau réservation (sidebar), sans carte ni titres redondants */
  variant?: 'standalone' | 'embedded';
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    availableSlots: number;
    totalSlots: number;
    status: 'available' | 'limited' | 'full' | 'unavailable';
  };
}

interface CalendarToolbarProps {
  label: string;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', date?: Date) => void;
  onView: (view: CalendarView) => void;
  view: CalendarView;
  views: CalendarView[] | Record<string, boolean | undefined>;
}

function ServiceBookingToolbar({
  label,
  onNavigate,
  onView,
  view,
  views,
  embedded,
}: CalendarToolbarProps & { embedded: boolean }) {
  const viewLabels: Partial<Record<CalendarView, string>> = {
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    agenda: 'Agenda',
  };

  const viewList: CalendarView[] = Array.isArray(views)
    ? views
    : (Object.entries(views)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key) as CalendarView[]);

  return (
    <div className="service-cal-toolbar mb-3 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => onNavigate('PREV')}
            aria-label="Période précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 whitespace-nowrap px-3"
            onClick={() => onNavigate('TODAY')}
          >
            Aujourd&apos;hui
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => onNavigate('NEXT')}
            aria-label="Période suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm font-semibold capitalize text-foreground">{label}</p>
      </div>
      {!embedded && viewList.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {viewList.map(v => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={view === v ? 'default' : 'outline'}
              className="h-8 px-3 text-xs"
              onClick={() => onView(v)}
            >
              {viewLabels[v] ?? v}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export const ServiceCalendarEnhanced = ({
  serviceId,
  selectedDate,
  onDateSelect,
  variant = 'standalone',
  minDate: _minDate,
  maxDate: _maxDate,
  disabledDates: _disabledDates = [],
}: ServiceCalendarEnhancedProps) => {
  const embedded = variant === 'embedded';
  const isCompact = useIsMobile(1024);
  const [view, setView] = useState<CalendarView>(() => {
    if (embedded) return 'month';
    return typeof window !== 'undefined' && window.innerWidth < 1024 ? 'day' : 'week';
  });
  const [date, setDate] = useState(selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (embedded) {
      setView('month');
      return;
    }
    if (isCompact && (view === 'week' || view === 'work_week' || view === 'month')) {
      setView('day');
    }
  }, [embedded, isCompact, view]);

  const { data: serviceProduct } = useQuery({
    queryKey: ['service-product', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const { data, error } = await supabase
        .from('service_products')
        .select('id, duration_minutes, max_participants')
        .eq('product_id', serviceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });

  const { data: calendarEvents, isLoading } = useQuery({
    queryKey: ['calendar-events', serviceProduct?.id, format(date, 'yyyy-MM')],
    queryFn: async () => {
      if (!serviceProduct?.id) return [];

      const events: CalendarEvent[] = [];

      const { data: slots } = await supabase
        .from('service_availability_slots')
        .select(SERVICE_AVAILABILITY_SLOT_FIELDS)
        .eq('service_product_id', serviceProduct.id)
        .eq('is_active', true);

      if (!slots || slots.length === 0) return [];

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const { data: bookings, error: bookingsError } = await supabase
        .from('service_bookings')
        .select(
          `
          id,
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          status
        `
        )
        .eq('product_id', serviceId!)
        .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed']);

      const bookingRows = bookingsError ? [] : (bookings ?? []);

      const daysInMonth = monthEnd.getDate();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      slots.forEach(slot => {
        if (!slot.start_time) return;
        for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth++) {
          const slotDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), dayOfMonth);
          if (slotDate.getDay() !== slot.day_of_week) continue;
          if (slotDate < todayStart) continue;

          const bookingsAtThisTime =
            bookingRows.filter(b => {
              const bookingDate = new Date(b.scheduled_date);
              return (
                bookingDate.getDate() === slotDate.getDate() &&
                bookingDate.getMonth() === slotDate.getMonth() &&
                b.scheduled_start_time?.substring(0, 5) === slot.start_time?.substring(0, 5)
              );
            }) || [];

          const availableSpots =
            (serviceProduct?.max_participants || 1) - bookingsAtThisTime.length;
          const totalSlots = serviceProduct?.max_participants || 1;

          let status: 'available' | 'limited' | 'full' | 'unavailable' = 'unavailable';
          if (availableSpots > 0) {
            status = availableSpots <= totalSlots * 0.3 ? 'limited' : 'available';
          } else {
            status = 'full';
          }

          const [hours, minutes] = slot.start_time.split(':').map(Number);
          const startDateTime = new Date(slotDate);
          startDateTime.setHours(hours, minutes, 0, 0);

          const endDateTime = new Date(startDateTime);
          endDateTime.setMinutes(
            endDateTime.getMinutes() + (serviceProduct?.duration_minutes || 60)
          );

          events.push({
            id: `slot-${slot.id}-${slotDate.toISOString()}`,
            title:
              status === 'available'
                ? `Disponible (${availableSpots} place${availableSpots > 1 ? 's' : ''})`
                : status === 'limited'
                  ? `Limité (${availableSpots} place${availableSpots > 1 ? 's' : ''})`
                  : 'Complet',
            start: startDateTime,
            end: endDateTime,
            resource: {
              availableSlots: availableSpots,
              totalSlots,
              status,
            },
          });
        }
      });

      return events;
    },
    enabled: !!serviceProduct?.id,
  });

  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      const status = event.resource?.status || 'unavailable';

      const statusColors: Record<string, { bg: string; text: string; border: string }> = {
        available: { bg: '#10b981', text: '#ffffff', border: '#059669' },
        limited: { bg: '#f59e0b', text: '#ffffff', border: '#d97706' },
        full: { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
        unavailable: { bg: '#6b7280', text: '#ffffff', border: '#4b5563' },
      };

      const color = statusColors[status] || statusColors.unavailable;
      const dayKey = format(event.start, 'yyyy-MM-dd');

      return {
        className: `service-cal-event service-cal-event--${status} service-cal-event--${dayKey}`,
        style: {
          backgroundColor: color.bg,
          color: color.text,
          border: `2px solid ${color.border}`,
          borderRadius: '6px',
          padding: embedded ? '2px 4px' : '4px 8px',
          fontSize: embedded ? '0.7rem' : '0.875rem',
          fontWeight: '500',
        },
      };
    },
    [embedded]
  );

  const upcomingAvailableDays = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const byDay = new Map<string, Date>();

    for (const event of calendarEvents ?? []) {
      const status = event.resource?.status;
      if (status !== 'available' && status !== 'limited') continue;
      const day = new Date(event.start);
      day.setHours(0, 0, 0, 0);
      if (day < todayStart) continue;
      const key = format(day, 'yyyy-MM-dd');
      if (!byDay.has(key)) byDay.set(key, day);
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 8)
      .map(([, day]) => day);
  }, [calendarEvents]);

  const { data: availabilityQuickDays = [] } = useQuery({
    queryKey: ['service-availability-quick-days', serviceProduct?.id],
    queryFn: async () => {
      if (!serviceProduct?.id) return [] as Date[];
      const { data: slots, error } = await supabase
        .from('service_availability_slots')
        .select('day_of_week, is_active')
        .eq('service_product_id', serviceProduct.id)
        .eq('is_active', true);
      if (error) throw error;
      const activeDow = new Set((slots ?? []).map(s => s.day_of_week));
      const days: Date[] = [];
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      for (let i = 0; i < 21 && days.length < 8; i += 1) {
        const day = new Date(cursor);
        day.setDate(cursor.getDate() + i);
        if (activeDow.has(day.getDay())) days.push(day);
      }
      return days;
    },
    enabled: !!serviceProduct?.id,
    staleTime: 60_000,
  });

  const quickDays =
    upcomingAvailableDays.length > 0 ? upcomingAvailableDays : availabilityQuickDays;

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      if (event.resource?.status === 'available' || event.resource?.status === 'limited') {
        onDateSelect(event.start);
      }
    },
    [onDateSelect]
  );

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      onDateSelect(slotInfo.start);
    },
    [onDateSelect]
  );

  const calendarViews = embedded
    ? { month: true as const }
    : isCompact
      ? { day: true as const, agenda: true as const }
      : { month: true as const, week: true as const, day: true as const, agenda: true as const };

  const toolbarComponent = useCallback(
    (props: CalendarToolbarProps) => <ServiceBookingToolbar {...props} embedded={embedded} />,
    [embedded]
  );

  const calendarHeightClass = embedded
    ? 'h-[300px] sm:h-[340px]'
    : 'h-[380px] sm:h-[480px] lg:h-[560px]';

  const calendarBody = (
    <div className={cn('space-y-4', embedded && 'space-y-3')}>
      {quickDays.length > 0 && (
        <div className="space-y-2" data-testid="service-quick-days">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm font-medium">Prochains jours disponibles</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickDays.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const isSelected =
                selectedDate != null && format(selectedDate, 'yyyy-MM-dd') === dayKey;
              return (
                <Button
                  key={dayKey}
                  type="button"
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  className="min-h-9 rounded-full px-3 text-xs sm:text-sm"
                  data-testid={`service-quick-day-${dayKey}`}
                  onClick={() => {
                    setDate(day);
                    onDateSelect(day);
                  }}
                >
                  {format(day, 'EEE d MMM', { locale: fr })}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className={cn(
          'min-w-0 overflow-hidden rounded-xl border bg-background',
          calendarHeightClass
        )}
      >
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : (
          <div className="h-full overflow-x-auto p-2 sm:p-3">
            <LazyCalendarWrapper>
              {calendar => {
                const localizer = calendar.dateFnsLocalizer({
                  format,
                  parse,
                  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
                  getDay,
                  locales: { fr: fr },
                });

                return (
                  <calendar.Calendar
                    localizer={localizer}
                    events={calendarEvents || []}
                    startAccessor="start"
                    endAccessor="end"
                    view={view}
                    views={calendarViews}
                    onView={nextView => setView(nextView as CalendarView)}
                    date={date}
                    onNavigate={setDate}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    eventPropGetter={eventStyleGetter}
                    messages={messages}
                    components={{ toolbar: toolbarComponent }}
                    step={30}
                    timeslots={2}
                    min={new Date(0, 0, 0, 8, 0, 0)}
                    max={new Date(0, 0, 0, 20, 0, 0)}
                    defaultDate={new Date()}
                    popup
                    className={cn(
                      'rbc-calendar rbc-calendar-service',
                      embedded && 'rbc-calendar-service--embedded'
                    )}
                  />
                );
              }}
            </LazyCalendarWrapper>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-green-600" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>Places limitées</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span>Complet</span>
        </div>
      </div>
    </div>
  );

  if (!serviceProduct && isLoading) {
    if (embedded) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (embedded) {
    return calendarBody;
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CalendarIcon className="h-5 w-5 shrink-0" />
          Disponibilités
        </CardTitle>
      </CardHeader>
      <CardContent>{calendarBody}</CardContent>
    </Card>
  );
};
