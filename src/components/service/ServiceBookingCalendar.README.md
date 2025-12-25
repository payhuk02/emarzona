# ServiceBookingCalendar - Documentation

## Vue d'ensemble

Composant calendrier professionnel pour la gestion des réservations de services. Utilise `react-big-calendar` avec localisation française complète.

## Fonctionnalités

- ✅ Vues multiples : Mois, Semaine, Jour, Agenda
- ✅ Codes couleurs par type d'événement (disponible, réservé, indisponible, sélectionné)
- ✅ Sélection de créneaux pour nouvelle réservation
- ✅ Drag & Drop pour replanifier (optionnel)
- ✅ Localisation française complète
- ✅ Optimisé avec React.memo pour performance
- ✅ Responsive et mobile-friendly

## Utilisation

```tsx
import ServiceBookingCalendar from '@/components/service/ServiceBookingCalendar';

<ServiceBookingCalendar
  events={bookingEvents}
  onSelectSlot={slotInfo => handleSlotSelection(slotInfo)}
  onSelectEvent={event => handleEventClick(event)}
  defaultView="week"
  enableSelection={true}
  showLegend={true}
/>;
```

## Types d'événements

- `available` : Créneau disponible (vert)
- `booked` : Créneau réservé (bleu)
- `unavailable` : Créneau indisponible (rouge)
- `selected` : Créneau sélectionné (violet)

## Performance

- Optimisé avec React.memo pour éviter les re-renders inutiles
- Utilise useCallback pour les handlers
- Lazy loading du calendrier avec LazyCalendarWrapper

## Accessibilité

- Support clavier complet
- ARIA labels appropriés
- Navigation au clavier entre créneaux

