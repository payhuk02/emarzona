/**
 * Bookings Management Page
 * Date: 28 octobre 2025
 * 
 * Page de gestion des réservations avec calendrier react-big-calendar
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { ServiceBookingCalendar, BookingEvent } from '@/components/service';
import { useToast } from '@/hooks/use-toast';
import { format, addHours, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BookingsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch bookings
  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['service-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          service_product:service_products(
            *,
            product:products(name, price, currency)
          ),
          customer:customers(full_name, email, phone)
        `)
        .order('booking_date', { ascending: true });

      if (error) throw error;
      return data;
    },
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

      if (error) throw error;
      return data;
    },
  });

  // Transform bookings to calendar events
  const events = useMemo((): BookingEvent[] => {
    const bookingEvents: BookingEvent[] = [];

    // Add bookings
    if (bookings) {
      bookings.forEach((booking) => {
        const start = new Date(booking.booking_date + ' ' + booking.start_time);
        const end = new Date(booking.booking_date + ' ' + booking.end_time);

        bookingEvents.push({
          id: booking.id,
          title: `${booking.service_product?.product?.name || 'Service'} - ${booking.customer?.full_name || 'Client'}`,
          start,
          end,
          type: booking.status === 'confirmed' ? 'booked' : 'unavailable',
          resource: {
            customerId: booking.customer_id,
            customerName: booking.customer?.full_name,
            participants: booking.participants,
            status: booking.status,
            price: booking.total_price,
          },
        });
      });
    }

    // Add availabilities (generate slots for next 30 days)
    if (availabilities) {
      const now = new Date();
      const daysToShow = 30;

      for (let i = 0; i < daysToShow; i++) {
        const currentDate = new Date(now);
        currentDate.setDate(now.getDate() + i);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

        availabilities.forEach((availability) => {
          if (availability.day_of_week === dayOfWeek) {
            const [startHour, startMinute] = availability.start_time.split(':');
            const [endHour, endMinute] = availability.end_time.split(':');

            const start = new Date(currentDate);
            start.setHours(parseInt(startHour), parseInt(startMinute), 0);

            const end = new Date(currentDate);
            end.setHours(parseInt(endHour), parseInt(endMinute), 0);

            // Check if not already booked
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

  // Handle event click
  const handleSelectEvent = (event: BookingEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  // Handle slot selection (create new booking)
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    toast({
      title: '📅 Créer une réservation',
      description: `${format(slotInfo.start, 'PPP à HH:mm', { locale: fr })} - ${format(slotInfo.end, 'HH:mm', { locale: fr })}`,
    });
    // TODO: Open booking creation dialog
  };

  // Stats
  const stats = useMemo(() => {
    const total = bookings?.length || 0;
    const confirmed = bookings?.filter((b) => b.status === 'confirmed').length || 0;
    const pending = bookings?.filter((b) => b.status === 'pending').length || 0;
    const cancelled = bookings?.filter((b) => b.status === 'cancelled').length || 0;

    const totalRevenue = bookings
      ?.filter((b) => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

    return { total, confirmed, pending, cancelled, totalRevenue };
  }, [bookings]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
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
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Gestion des réservations</h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos réservations de services et disponibilités
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">réservations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Confirmées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
                <p className="text-xs text-muted-foreground mt-1">réservations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">réservations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Annulées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                <p className="text-xs text-muted-foreground mt-1">réservations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">XOF</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>

          {/* Calendar */}
          <ServiceBookingCalendar
            events={events}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            defaultView="week"
            enableSelection={true}
            showLegend={true}
          />

          {/* Event Detail Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedEvent?.title}</DialogTitle>
                <DialogDescription>
                  {selectedEvent && format(selectedEvent.start, 'PPP à HH:mm', { locale: fr })}
                  {' - '}
                  {selectedEvent && format(selectedEvent.end, 'HH:mm', { locale: fr })}
                </DialogDescription>
              </DialogHeader>

              {selectedEvent && (
                <div className="space-y-4">
                  {/* Type badge */}
                  <div>
                    <Badge
                      variant={
                        selectedEvent.type === 'booked' ? 'default' :
                        selectedEvent.type === 'available' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {selectedEvent.type === 'booked' ? 'Réservé' :
                       selectedEvent.type === 'available' ? 'Disponible' :
                       'Indisponible'}
                    </Badge>
                  </div>

                  {/* Details */}
                  {selectedEvent.resource && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedEvent.resource.customerName && (
                        <div>
                          <p className="text-sm font-medium">Client</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.resource.customerName}
                          </p>
                        </div>
                      )}
                      {selectedEvent.resource.participants && (
                        <div>
                          <p className="text-sm font-medium">Participants</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.resource.participants}
                          </p>
                        </div>
                      )}
                      {selectedEvent.resource.price && (
                        <div>
                          <p className="text-sm font-medium">Prix total</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.resource.price.toLocaleString()} XOF
                          </p>
                        </div>
                      )}
                      {selectedEvent.resource.status && (
                        <div>
                          <p className="text-sm font-medium">Statut</p>
                          <Badge variant="outline">
                            {selectedEvent.resource.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {selectedEvent.type === 'booked' && (
                    <div className="flex gap-2">
                      <Button variant="outline">Modifier</Button>
                      <Button variant="destructive">Annuler</Button>
                    </div>
                  )}

                  {selectedEvent.type === 'available' && (
                    <Button>Créer une réservation</Button>
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

