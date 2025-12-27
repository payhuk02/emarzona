/**
 * Service Calendar Component - Enhanced with react-big-calendar
 * Date: 28 Janvier 2025
 * 
 * Version améliorée du calendrier utilisant react-big-calendar pour une meilleure UX
 * Alternative moderne au calendrier de base
 */

import { useState, useMemo, useCallback } from 'react';
import { format, parse, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LazyCalendarWrapper } from '@/components/calendar/LazyCalendarWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

export const ServiceCalendarEnhanced = ({
  serviceId,
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
}: ServiceCalendarEnhancedProps) => {
  const [view, setView] = useState<string>('month');
  const [date, setDate] = useState(selectedDate || new Date());

  // Fetch service product ID
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

  // Fetch availability slots and bookings
  const { data: calendarEvents, isLoading } = useQuery({
    queryKey: ['calendar-events', serviceProduct?.id, format(date, 'yyyy-MM')],
    queryFn: async () => {
      if (!serviceProduct?.id) return [];

      const  events: CalendarEvent[] = [];

      // Get availability slots
      const { data: slots } = await supabase
        .from('service_availability_slots')
        .select('*')
        .eq('service_product_id', serviceProduct.id)
        .eq('is_active', true);

      if (!slots || slots.length === 0) return [];

      // Get bookings for the current month
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const { data: bookings } = await supabase
        .from('service_bookings')
        .select(`
          id,
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          status
        `)
        .eq('product_id', serviceId!)
        .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed']);

      // Create events for available slots
      slots.forEach((slot) => {
        // For each day of the week that matches this slot
        for (let  dayOffset= 0; dayOffset < 7; dayOffset++) {
          const slotDate = new Date(monthStart);
          slotDate.setDate(monthStart.getDate() + dayOffset);

          if (slotDate.getDay() === slot.day_of_week) {
            // Check if there are bookings for this time slot
            const bookingsAtThisTime = bookings?.filter((b) => {
              const bookingDate = new Date(b.scheduled_date);
              return (
                bookingDate.getDate() === slotDate.getDate() &&
                bookingDate.getMonth() === slotDate.getMonth() &&
                b.scheduled_start_time?.substring(0, 5) === slot.start_time?.substring(0, 5)
              );
            }) || [];

            const availableSpots = (serviceProduct?.max_participants || 1) - bookingsAtThisTime.length;
            const totalSlots = serviceProduct?.max_participants || 1;

            let  status: 'available' | 'limited' | 'full' | 'unavailable' = 'unavailable';
            if (availableSpots > 0) {
              if (availableSpots <= totalSlots * 0.3) {
                status = 'limited';
              } else {
                status = 'available';
              }
            } else {
              status = 'full';
            }

            // Create event for this time slot
            const [hours, minutes] = slot.start_time.split(':').map(Number);
            const startDateTime = new Date(slotDate);
            startDateTime.setHours(hours, minutes, 0, 0);

            const endDateTime = new Date(startDateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + (serviceProduct?.duration_minutes || 60));

            events.push({
              id: `slot-${slot.id}-${slotDate.toISOString()}`,
              title: status === 'available' 
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
        }
      });

      return events;
    },
    enabled: !!serviceProduct?.id,
  });

  // Event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource?.status || 'unavailable';
    
    const  statusColors: Record<string, { bg: string; text: string; border: string }> = {
      available: { bg: '#10b981', text: '#ffffff', border: '#059669' },
      limited: { bg: '#f59e0b', text: '#ffffff', border: '#d97706' },
      full: { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
      unavailable: { bg: '#6b7280', text: '#ffffff', border: '#4b5563' },
    };

    const color = statusColors[status] || statusColors.unavailable;

    return {
      style: {
        backgroundColor: color.bg,
        color: color.text,
        border: `2px solid ${color.border}`,
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '0.875rem',
        fontWeight: '500',
      },
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.resource?.status === 'available' || event.resource?.status === 'limited') {
      onDateSelect(event.start);
    }
  }, [onDateSelect]);

  // Handle date selection (for month view)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    onDateSelect(slotInfo.start);
  }, [onDateSelect]);

  if (isLoading) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Disponibilités
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(date);
                newDate.setMonth(newDate.getMonth() - 1);
                setDate(newDate);
              }}
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDate(new Date())}
              aria-label="Aujourd'hui"
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(date);
                newDate.setMonth(newDate.getMonth() + 1);
                setDate(newDate);
              }}
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[600px]">
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
                  events={calendarEvents || []}
                  startAccessor="start"
                  endAccessor="end"
                  view={view as any}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  selectable
                  eventPropGetter={eventStyleGetter}
                  messages={messages}
                  step={30}
                  timeslots={2}
                  min={new Date(0, 0, 0, 8, 0, 0)}
                  max={new Date(0, 0, 0, 20, 0, 0)}
                  defaultDate={new Date()}
                  popup
                  className="rbc-calendar"
                />
              );
            }}
          </LazyCalendarWrapper>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-600" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-amber-500" />
            <span>Limite</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span>Complet</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};







