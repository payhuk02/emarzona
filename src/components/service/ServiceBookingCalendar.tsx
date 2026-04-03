/**
 * Service Booking Calendar Component
 * Date: 28 octobre 2025
 * Dernière mise à jour: 1 Février 2025
 *
 * Calendrier professionnel avec react-big-calendar pour :
 * - Afficher les réservations existantes avec codes couleurs par statut
 * - Afficher les disponibilités disponibles/occupées
 * - Vues multiples : semaine/mois/jour/agenda
 * - Drag & drop pour replanifier (optionnel)
 * - Localisation française complète
 * - Sélection de créneaux pour nouvelle réservation
 * - Affichage des informations staff/client au survol
 * - Responsive et optimisé pour mobile
 *
 * @component
 * @example
 * ```tsx
 * <ServiceBookingCalendar
 *   events={bookingEvents}
 *   onSelectSlot={(slot) => handleSlotSelection(slot)}
 *   onSelectEvent={(event) => handleEventClick(event)}
 *   defaultView="week"
 *   enableSelection={true}
 * />
 * ```
 *
 * @see {@link https://jquense.github.io/react-big-calendar/} Documentation react-big-calendar
 */

import React, { useState, useCallback } from 'react';
import { format, parse, startOfWeek, getDay, addHours, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LazyCalendarWrapper } from '@/components/calendar/LazyCalendarWrapper';
import './ServiceBookingCalendar.css'; // Custom styles
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types pour react-big-calendar
type View = 'month' | 'week' | 'day' | 'agenda' | 'work_week';
interface RBEvent {
  id?: string;
  title?: string;
  start?: Date;
  end?: Date;
  resource?: Record<string, unknown>;
  [key: string]: unknown;
}

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
  previous: 'Précédent',
  next: 'Suivant',
  yesterday: 'Hier',
  tomorrow: 'Demain',
  today: "Aujourd'hui",
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

/**
 * Composant calendrier de réservation pour services
 *
 * @param {ServiceBookingCalendarProps} props - Props du composant
 * @param {BookingEvent[]} props.events - Liste des événements (réservations et disponibilités)
 * @param {(slotInfo: {start: Date, end: Date}) => void} [props.onSelectSlot] - Callback appelé lors de la sélection d'un créneau vide
 * @param {(event: BookingEvent) => void} [props.onSelectEvent] - Callback appelé lors du clic sur un événement
 * @param {(event: BookingEvent, newStart: Date, newEnd: Date) => void} [props.onEventDrop] - Callback pour drag & drop (optionnel)
 * @param {(event: BookingEvent, newStart: Date, newEnd: Date) => void} [props.onEventResize] - Callback pour redimensionnement (optionnel)
 * @param {View} [props.defaultView='week'] - Vue par défaut (month, week, day, agenda)
 * @param {Date} [props.minTime] - Heure minimale affichée (défaut: 8:00)
 * @param {Date} [props.maxTime] - Heure maximale affichée (défaut: 20:00)
 * @param {number} [props.step=30] - Minutes entre chaque créneau (défaut: 30)
 * @param {number} [props.timeslots=2] - Nombre de slots par heure (défaut: 2)
 * @param {string} [props.className] - Classes CSS additionnelles
 * @param {boolean} [props.enableSelection=true] - Activer la sélection de créneaux
 * @param {boolean} [props.enableDragDrop=false] - Activer le drag & drop
 * @param {boolean} [props.showLegend=true] - Afficher la légende des couleurs
 *
 * @returns {JSX.Element} Composant calendrier React
 */
const ServiceBookingCalendar = ({
  events,
  onSelectSlot,
  onSelectEvent,
  onEventDrop,
  onEventResize,
  defaultView = 'week',
  minTime = new Date(0, 0, 0, 8, 0, 0), // 8:00 AM
  maxTime = new Date(0, 0, 0, 20, 0, 0), // 8:00 PM
  step = 30,
  timeslots = 2,
  className,
  enableSelection = true,
  enableDragDrop = false,
  showLegend = true,
}: ServiceBookingCalendarProps) => {
  const [view, setView] = useState<View>(defaultView as View);
  const [date, setDate] = useState(new Date());

  // Statistiques calculées pour affichage
  const stats = React.useMemo(() => {
    return {
      available: events.filter(e => e.type === 'available').length,
      booked: events.filter(e => e.type === 'booked').length,
      unavailable: events.filter(e => e.type === 'unavailable').length,
      selected: events.filter(e => e.type === 'selected').length,
      total: events.length,
    };
  }, [events]);

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

  // Slot style getter (customize time slots) avec améliorations
  const slotStyleGetter = useCallback((date: Date) => {
    const hour = date.getHours();

    // Highlight business hours (9h-18h)
    if (hour >= 9 && hour < 18) {
      return {
        className: 'business-hours',
      };
    }

    // Dimmer les heures en dehors des heures de travail
    if (hour < 8 || hour >= 20) {
      return {
        className: 'off-hours',
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

  // Custom Event component avec tooltip amélioré
  const EventComponent = ({ event }: { event: BookingEvent }) => {
    const icons = {
      available: <CheckCircle2 className="h-3 w-3" />,
      booked: <Clock className="h-3 w-3" />,
      unavailable: <XCircle className="h-3 w-3" />,
      selected: <AlertCircle className="h-3 w-3" />,
    };

    // Construire le tooltip avec toutes les infos
    const tooltipContent = [
      event.title,
      event.resource?.staffName && `Staff: ${event.resource.staffName}`,
      event.resource?.customerName && `Client: ${event.resource.customerName}`,
      event.resource?.participants && `${event.resource.participants} participant(s)`,
      event.resource?.status && `Statut: ${event.resource.status}`,
      event.resource?.price && `Prix: ${event.resource.price}`,
    ]
      .filter(Boolean)
      .join(' • ');

    return (
      <div className="flex items-center gap-1 text-xs group relative" title={tooltipContent}>
        {icons[event.type]}
        <span className="truncate">{event.title}</span>
        {event.resource?.participants && (
          <span className="ml-auto flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {event.resource.participants}
          </span>
        )}
        {/* Tooltip au survol */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg whitespace-nowrap max-w-xs">
            <div className="flex flex-col gap-1">
              <div className="font-semibold">{event.title}</div>
              {event.resource?.staffName && (
                <div className="text-gray-300">👤 {event.resource.staffName}</div>
              )}
              {event.resource?.customerName && (
                <div className="text-gray-300">👥 {event.resource.customerName}</div>
              )}
              {event.resource?.participants && (
                <div className="text-gray-300">👨‍👩‍👧‍👦 {event.resource.participants} participant(s)</div>
              )}
              {event.resource?.status && (
                <div className="text-gray-300">📋 {event.resource.status}</div>
              )}
              <div className="text-gray-300">
                🕐 {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
              </div>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle slot selection avec validation améliorée et feedback
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; action: string }) => {
      if (enableSelection && slotInfo.action === 'click' && onSelectSlot) {
        // Vérifier que le slot n'est pas dans le passé
        const now = new Date();
        if (slotInfo.start < now) {
          // Optionnel: Afficher un toast d'erreur
          return;
        }

        // Vérifier qu'il n'y a pas déjà une réservation à ce moment
        const conflictingBooking = events.find(
          event =>
            event.type === 'booked' && slotInfo.start >= event.start && slotInfo.start < event.end
        );

        // Vérifier aussi les créneaux indisponibles
        const unavailableSlot = events.find(
          event =>
            event.type === 'unavailable' &&
            slotInfo.start >= event.start &&
            slotInfo.start < event.end
        );

        if (conflictingBooking) {
          // Optionnel: Afficher un message avec les détails du conflit
          return;
        }

        if (unavailableSlot) {
          // Optionnel: Afficher un message d'indisponibilité
          return;
        }

        // Slot disponible, appeler le callback
        onSelectSlot(slotInfo);
      }
    },
    [enableSelection, events, onSelectSlot]
  );

  // Handle event selection
  const handleSelectEvent = useCallback(
    (event: BookingEvent) => {
      if (onSelectEvent) {
        onSelectEvent(event);
      }
    },
    [onSelectEvent]
  );

  // Handle event drop (drag & drop)
  const handleEventDrop = useCallback(
    ({ event, start, end }: { event: RBEvent | BookingEvent; start: Date; end: Date }) => {
      if (enableDragDrop && onEventDrop) {
        // Vérifier que la nouvelle position est valide
        const now = new Date();
        if (start < now) {
          return;
        }

        // Convertir en BookingEvent si nécessaire
        const bookingEvent = (event as BookingEvent).type
          ? (event as BookingEvent)
          : {
              id: (event as RBEvent).id || '',
              title: (event as RBEvent).title || '',
              start: (event as RBEvent).start || start,
              end: (event as RBEvent).end || end,
              type: 'booked' as BookingEventType,
              resource: (event as RBEvent).resource,
            };

        onEventDrop(bookingEvent, start, end);
      }
    },
    [enableDragDrop, onEventDrop]
  );

  // Handle event resize
  const handleEventResize = useCallback(
    ({ event, start, end }: { event: BookingEvent; start: Date; end: Date }) => {
      if (enableDragDrop && onEventResize) {
        const bookingEvent = event as BookingEvent;
        onEventResize(bookingEvent, start, end);
      }
    },
    [enableDragDrop, onEventResize]
  );

  // Toolbar customization
  const CustomToolbar = (toolbar: { onNavigate: (direction: string) => void }) => {
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
          <div className="text-lg font-semibold text-foreground">{label()}</div>

          {/* View switcher */}
          <div className="flex items-center gap-2">
            {(['month', 'week', 'day'] as View[]).map(v => (
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

  // Legend améliorée avec tooltips
  const Legend = () => (
    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
      <div className="flex items-center gap-2 group relative">
        <div className="h-4 w-4 rounded bg-green-500" />
        <span>Disponible</span>
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap">
            Créneaux libres pour réservation
            <div className="absolute top-full left-2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 group relative">
        <div className="h-4 w-4 rounded bg-blue-500" />
        <span>Réservé</span>
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap">
            Réservation confirmée
            <div className="absolute top-full left-2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 group relative">
        <div className="h-4 w-4 rounded bg-red-500" />
        <span>Indisponible</span>
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap">
            Créneau non disponible
            <div className="absolute top-full left-2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 group relative">
        <div className="h-4 w-4 rounded bg-violet-500" />
        <span>Sélection</span>
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap">
            Créneau sélectionné
            <div className="absolute top-full left-2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Statistiques rapides */}
      {stats.total > 0 && (
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>
            {stats.booked} réservation{stats.booked > 1 ? 's' : ''} sur {stats.total} événement
            {stats.total > 1 ? 's' : ''}
          </span>
        </div>
      )}
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
        {/* Statistiques rapides en haut */}
        {stats.total > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground font-medium">
                {stats.available} disponible{stats.available > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground font-medium">
                {stats.booked} réservé{stats.booked > 1 ? 's' : ''}
              </span>
            </div>
            {stats.unavailable > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground font-medium">
                  {stats.unavailable} indisponible{stats.unavailable > 1 ? 's' : ''}
                </span>
              </div>
            )}
            {stats.selected > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-violet-500" />
                <span className="text-muted-foreground font-medium">
                  {stats.selected} sélectionné{stats.selected > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div className="ml-auto text-xs text-muted-foreground">
              Total: {stats.total} événement{stats.total > 1 ? 's' : ''}
            </div>
          </div>
        )}

        <div className="h-[600px] min-h-[400px]">
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
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  view={view}
                  onView={newView => setView(newView as View)}
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
                  className="rbc-calendar-service"
                  popup={true}
                  popupOffset={5}
                />
              );
            }}
          </LazyCalendarWrapper>
        </div>

        {showLegend && <Legend />}

        {/* Aide contextuelle */}
        {enableSelection && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">💡 Astuce</p>
                <p className="text-xs">
                  Cliquez sur un créneau disponible pour le sélectionner.
                  {enableDragDrop && ' Vous pouvez également déplacer les réservations existantes.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
// Le composant ne se re-rendra que si les props changent
const MemoizedServiceBookingCalendar = React.memo(
  ServiceBookingCalendar,
  (prevProps, nextProps) => {
    // Comparaison personnalisée pour éviter re-renders inutiles
    return (
      prevProps.events.length === nextProps.events.length &&
      prevProps.events.every((event, index) => {
        const nextEvent = nextProps.events[index];
        return (
          event.id === nextEvent?.id &&
          event.start.getTime() === nextEvent?.start.getTime() &&
          event.end.getTime() === nextEvent?.end.getTime() &&
          event.type === nextEvent?.type
        );
      }) &&
      prevProps.defaultView === nextProps.defaultView &&
      prevProps.enableSelection === nextProps.enableSelection &&
      prevProps.enableDragDrop === nextProps.enableDragDrop &&
      prevProps.showLegend === nextProps.showLegend &&
      prevProps.onSelectSlot === nextProps.onSelectSlot &&
      prevProps.onSelectEvent === nextProps.onSelectEvent &&
      prevProps.onEventDrop === nextProps.onEventDrop &&
      prevProps.onEventResize === nextProps.onEventResize
    );
  }
);

MemoizedServiceBookingCalendar.displayName = 'ServiceBookingCalendar';

export default MemoizedServiceBookingCalendar;
export { ServiceBookingCalendar as ServiceBookingCalendarBase };






