/**
 * Service Booking Calendar Component
 * Date: 28 octobre 2025
 * 
 * Calendrier professionnel avec react-big-calendar pour :
 * - Afficher les réservations existantes
 * - Afficher les disponibilités
 * - Vue semaine/mois/jour
 * - Drag & drop (optionnel)
 * - Localisation française
 */

import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View, Views, ToolbarProps, Event as RBEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './ServiceBookingCalendar.css'; // Custom styles
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  previous: 'Précédent',
  next: 'Suivant',
  yesterday: 'Hier',
  tomorrow: 'Demain',
  today: 'Aujourd\'hui',
  agenda: 'Agenda',
  noEventsInRange: 'Aucun événement dans cette période.',
  showMore: (total: number) => `+ ${total} de plus`,
};

// Types d'événements
export type BookingEventType = 'available' | 'booked' | 'unavailable' | 'selected';

export interface BookingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: BookingEventType;
  resource?: {
    customerId?: string;
    customerName?: string;
    staffId?: string;
    staffName?: string;
    participants?: number;
    status?: string;
    price?: number;
  };
}

interface ServiceBookingCalendarProps {
  events: BookingEvent[];
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: BookingEvent) => void;
  onEventDrop?: (event: BookingEvent, newStart: Date, newEnd: Date) => void;
  onEventResize?: (event: BookingEvent, newStart: Date, newEnd: Date) => void;
  defaultView?: View;
  minTime?: Date;
  maxTime?: Date;
  step?: number; // Minutes entre chaque créneau (default: 30)
  timeslots?: number; // Nombre de slots par heure (default: 2)
  className?: string;
  enableSelection?: boolean;
  enableDragDrop?: boolean;
  showLegend?: boolean;
}

const ServiceBookingCalendar = ({
  events,
  onSelectSlot,
  onSelectEvent,
  onEventDrop,
  onEventResize,
  defaultView = Views.WEEK,
  minTime = new Date(0, 0, 0, 8, 0, 0), // 8:00 AM
  maxTime = new Date(0, 0, 0, 20, 0, 0), // 8:00 PM
  step = 30,
  timeslots = 2,
  className,
  enableSelection = true,
  enableDragDrop = false,
  showLegend = true,
}: ServiceBookingCalendarProps) => {
  const [view, setView] = useState<View>(defaultView);
  const [date, setDate] = useState(new Date());

  // Event style getter
  const eventStyleGetter = useCallback((event: BookingEvent) => {
    const baseStyle = {
      borderRadius: '6px',
      border: 'none',
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '500',
      padding: '4px 8px',
    };

    switch (event.type) {
      case 'available':
        return {
          style: {
            ...baseStyle,
            backgroundColor: '#10b981', // green-500
            color: '#ffffff',
          },
        };
      case 'booked':
        return {
          style: {
            ...baseStyle,
            backgroundColor: '#3b82f6', // blue-500
            color: '#ffffff',
          },
        };
      case 'unavailable':
        return {
          style: {
            ...baseStyle,
            backgroundColor: '#ef4444', // red-500
            color: '#ffffff',
            opacity: 0.7,
          },
        };
      case 'selected':
        return {
          style: {
            ...baseStyle,
            backgroundColor: '#8b5cf6', // violet-500
            color: '#ffffff',
            border: '2px solid #6d28d9',
          },
        };
      default:
        return { style: baseStyle };
    }
  }, []);

  // Slot style getter (customize time slots)
  const slotStyleGetter = useCallback((date: Date) => {
    const hour = date.getHours();
    
    // Highlight business hours slightly
    if (hour >= 9 && hour < 18) {
      return {
        className: 'business-hours',
      };
    }

    return {};
  }, []);

  // Day prop getter (customize day columns)
  const dayPropGetter = useCallback((date: Date) => {
    const today = startOfDay(new Date());
    const currentDate = startOfDay(date);

    // Highlight today
    if (currentDate.getTime() === today.getTime()) {
      return {
        className: 'rbc-today-column',
      };
    }

    // Dim past days
    if (currentDate < today) {
      return {
        className: 'rbc-past-day',
      };
    }

    return {};
  }, []);

  // Custom Event component
  const EventComponent = ({ event }: { event: BookingEvent }) => {
    const icons = {
      available: <CheckCircle2 className="h-3 w-3" />,
      booked: <Clock className="h-3 w-3" />,
      unavailable: <XCircle className="h-3 w-3" />,
      selected: <AlertCircle className="h-3 w-3" />,
    };

    return (
      <div className="flex items-center gap-1 text-xs">
        {icons[event.type]}
        <span className="truncate">{event.title}</span>
        {event.resource?.participants && (
          <span className="ml-auto flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {event.resource.participants}
          </span>
        )}
      </div>
    );
  };

  // Handle slot selection
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date; action: string }) => {
    if (enableSelection && slotInfo.action === 'click' && onSelectSlot) {
      // Vérifier que le slot n'est pas dans le passé
      const now = new Date();
      if (slotInfo.start < now) {
        return;
      }

      // Vérifier qu'il n'y a pas déjà une réservation à ce moment
      const hasBooking = events.some(event => 
        event.type === 'booked' &&
        slotInfo.start >= event.start &&
        slotInfo.start < event.end
      );

      if (!hasBooking) {
        onSelectSlot(slotInfo);
      }
    }
  }, [enableSelection, events, onSelectSlot]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: BookingEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    }
  }, [onSelectEvent]);

  // Handle event drop (drag & drop)
  const handleEventDrop = useCallback(({ event, start, end }: { event: RBEvent; start: Date; end: Date }) => {
    if (enableDragDrop && onEventDrop) {
      // Vérifier que la nouvelle position est valide
      const now = new Date();
      if (start < now) {
        return;
      }

      // Convertir en BookingEvent
      const bookingEvent = event as BookingEvent;
      onEventDrop(bookingEvent, start, end);
    }
  }, [enableDragDrop, onEventDrop]);

  // Handle event resize
  const handleEventResize = useCallback(({ event, start, end }: { event: RBEvent; start: Date; end: Date }) => {
    if (enableDragDrop && onEventResize) {
      const bookingEvent = event as BookingEvent;
      onEventResize(bookingEvent, start, end);
    }
  }, [enableDragDrop, onEventResize]);

  // Toolbar customization
  const CustomToolbar = (toolbar: ToolbarProps) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = () => {
      const date = toolbar.date;
      if (toolbar.view === 'month') {
        return format(date, 'MMMM yyyy', { locale: fr });
      } else if (toolbar.view === 'week') {
        const start = startOfWeek(date, { locale: fr });
        const end = addHours(start, 24 * 6);
        return `${format(start, 'd MMM', { locale: fr })} - ${format(end, 'd MMM yyyy', { locale: fr })}`;
      } else if (toolbar.view === 'day') {
        return format(date, 'dd MMMM yyyy', { locale: fr });
      }
      return toolbar.label;
    };

    return (
      <div className="rbc-toolbar mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={goToBack}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white font-medium"
            >
              ← Préc.
            </Button>
            <Button 
              size="sm" 
              onClick={goToToday}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white font-medium"
            >
              Aujourd'hui
            </Button>
            <Button 
              size="sm" 
              onClick={goToNext}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white font-medium"
            >
              Suiv. →
            </Button>
          </div>

          {/* Label */}
          <div className="text-lg font-semibold text-foreground">
            {label()}
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-2">
            {(['month', 'week', 'day'] as View[]).map((v) => (
              <Button
                key={v}
                size="sm"
                onClick={() => toolbar.onView(v)}
                className={
                  toolbar.view === v
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white font-medium'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white font-medium opacity-80 hover:opacity-100'
                }
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Legend
  const Legend = () => (
    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-green-500" />
        <span>Disponible</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-blue-500" />
        <span>Réservé</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-red-500" />
        <span>Indisponible</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-violet-500" />
        <span>Sélection</span>
      </div>
    </div>
  );

  return (
    <Card className={cn('service-booking-calendar', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendrier de réservation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            messages={messages}
            culture="fr"
            eventPropGetter={eventStyleGetter}
            slotPropGetter={slotStyleGetter}
            dayPropGetter={dayPropGetter}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            selectable={enableSelection}
            resizable={enableDragDrop}
            draggableAccessor={() => enableDragDrop}
            min={minTime}
            max={maxTime}
            step={step}
            timeslots={timeslots}
            components={{
              toolbar: CustomToolbar,
              event: EventComponent,
            }}
            formats={{
              timeGutterFormat: 'HH:mm',
              eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
                `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
              agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
                `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
            }}
          />
        </div>
        
        {showLegend && <Legend />}
      </CardContent>
    </Card>
  );
};

export default ServiceBookingCalendar;
