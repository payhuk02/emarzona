/**
 * Mes réservations (portail client) — /account/bookings
 */

import { useMemo, useState } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Clock, Loader2, MapPin, RefreshCw, Video } from 'lucide-react';
import { useMyBookings, useCancelBooking, type ServiceBooking } from '@/hooks/service/useBookings';

type BookingWithRelations = ServiceBooking & {
  scheduled_date?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  product?: { id: string; name: string; image_url?: string | null };
  service?: { location_type?: string; location_address?: string; meeting_url?: string };
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  completed: 'Terminée',
  cancelled: 'Annulée',
  no_show: 'Absent',
  rescheduled: 'Replanifiée',
};

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'confirmed') return 'default';
  if (status === 'pending') return 'secondary';
  if (status === 'cancelled' || status === 'no_show') return 'destructive';
  return 'outline';
}

function formatBookingWhen(booking: BookingWithRelations): string {
  const dateStr = booking.scheduled_date ?? booking.booking_date;
  const timeStr = booking.scheduled_start_time ?? booking.booking_time;
  if (!dateStr) return 'Date à confirmer';
  try {
    const datePart = format(
      parseISO(dateStr.length > 10 ? dateStr : `${dateStr}T12:00:00`),
      'PPP',
      {
        locale: fr,
      }
    );
    return timeStr ? `${datePart} — ${String(timeStr).slice(0, 5)}` : datePart;
  } catch {
    return `${dateStr}${timeStr ? ` ${timeStr}` : ''}`;
  }
}

export default function CustomerMyBookings() {
  const { data: bookings = [], isLoading, error, refetch, isFetching } = useMyBookings();
  const cancelBooking = useCancelBooking();
  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [cancelId, setCancelId] = useState<string | null>(null);

  const typedBookings = bookings as BookingWithRelations[];

  const { upcoming, past, cancelled } = useMemo(() => {
    const now = new Date();
    const upcomingList: BookingWithRelations[] = [];
    const pastList: BookingWithRelations[] = [];
    const cancelledList: BookingWithRelations[] = [];

    for (const b of typedBookings) {
      if (b.status === 'cancelled') {
        cancelledList.push(b);
        continue;
      }
      const dateStr = b.scheduled_date ?? b.booking_date;
      const isPast =
        b.status === 'completed' ||
        (dateStr ? parseISO(dateStr.length > 10 ? dateStr : `${dateStr}T23:59:59`) < now : false);
      if (isPast) pastList.push(b);
      else upcomingList.push(b);
    }

    return { upcoming: upcomingList, past: pastList, cancelled: cancelledList };
  }, [typedBookings]);

  const list = tab === 'upcoming' ? upcoming : tab === 'past' ? past : cancelled;

  const handleCancel = async () => {
    if (!cancelId) return;
    await cancelBooking.mutateAsync({ id: cancelId, reason: 'Annulée par le client' });
    setCancelId(null);
  };

  return (
    <AppPageShell>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mes réservations</h1>
            <p className="text-muted-foreground mt-1">
              Consultez et gérez vos rendez-vous de services
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">À venir ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Passées ({past.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Annulées ({cancelled.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-8 text-center text-destructive">
                  Impossible de charger vos réservations. Réessayez plus tard.
                </CardContent>
              </Card>
            ) : list.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>Aucune réservation dans cette catégorie.</p>
                  <Button asChild className="mt-4" variant="secondary">
                    <Link to="/marketplace">Découvrir des services</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {list.map(booking => (
                  <Card key={booking.id}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <CardTitle className="text-lg">
                          {booking.product?.name ?? 'Service'}
                        </CardTitle>
                        <Badge variant={statusVariant(booking.status)}>
                          {STATUS_LABELS[booking.status] ?? booking.status}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 shrink-0" />
                        {formatBookingWhen(booking)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {booking.service?.location_address && (
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                          {booking.service.location_address}
                        </p>
                      )}
                      {(booking.meeting_url || booking.service?.meeting_url) && (
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={booking.meeting_url || booking.service?.meeting_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Rejoindre la visio
                          </a>
                        </Button>
                      )}
                      {booking.product?.id && (
                        <Button asChild variant="link" className="px-0 h-auto">
                          <Link to={`/service/${booking.product.id}`}>Voir le service</Link>
                        </Button>
                      )}
                      {['pending', 'confirmed'].includes(booking.status) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancelId(booking.id)}
                        >
                          Annuler la réservation
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog open={!!cancelId} onOpenChange={open => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette réservation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Un remboursement peut s&apos;appliquer selon la
              politique d&apos;annulation du prestataire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelBooking.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelBooking.isPending ? 'Annulation…' : "Confirmer l'annulation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppPageShell>
  );
}
