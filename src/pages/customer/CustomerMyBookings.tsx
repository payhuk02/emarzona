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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Loader2, MapPin, RefreshCw } from 'lucide-react';
import {
  useMyBookings,
  useCancelBooking,
  useUpdateBooking,
  type ServiceBooking,
} from '@/hooks/service/useBookings';
import { JoinServiceMeetingButton } from '@/components/service/JoinServiceMeetingButton';
import {
  canCancelServiceBooking,
  canRescheduleServiceBooking,
} from '@/lib/service/service-booking-cancellation';
import { useToast } from '@/hooks/use-toast';

type BookingWithRelations = ServiceBooking & {
  scheduled_date?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  product?: { id: string; name: string; image_url?: string | null };
  service?: {
    location_type?: string;
    location_address?: string;
    meeting_url?: string;
    allow_booking_cancellation?: boolean;
    cancellation_deadline_hours?: number;
    duration_minutes?: number;
  };
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

function addMinutesToTime(timeHHMM: string, minutes: number): string {
  const [h, m] = timeHHMM.split(':').map(Number);
  const total = (h || 0) * 60 + (m || 0) + minutes;
  const nh = Math.floor((((total % (24 * 60)) + 24 * 60) % (24 * 60)) / 60);
  const nm = ((total % 60) + 60) % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}:00`;
}

export default function CustomerMyBookings() {
  const { toast } = useToast();
  const { data: bookings = [], isLoading, error, refetch, isFetching } = useMyBookings();
  const cancelBooking = useCancelBooking();
  const updateBooking = useUpdateBooking();
  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingWithRelations | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');

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

  const cancelTarget = cancelId ? typedBookings.find(b => b.id === cancelId) : null;
  const cancelEligibility = cancelTarget
    ? canCancelServiceBooking(cancelTarget, cancelTarget.service)
    : { allowed: false };

  const handleCancel = async () => {
    if (!cancelId || !cancelTarget) return;
    const eligibility = canCancelServiceBooking(cancelTarget, cancelTarget.service);
    if (!eligibility.allowed) {
      toast({
        title: 'Annulation impossible',
        description: eligibility.reason,
        variant: 'destructive',
      });
      setCancelId(null);
      return;
    }
    await cancelBooking.mutateAsync({ id: cancelId, reason: 'Annulée par le client' });
    setCancelId(null);
  };

  const openReschedule = (booking: BookingWithRelations) => {
    const eligibility = canRescheduleServiceBooking(booking, booking.service);
    if (!eligibility.allowed) {
      toast({
        title: 'Replanification impossible',
        description: eligibility.reason,
        variant: 'destructive',
      });
      return;
    }
    setRescheduleBooking(booking);
    setRescheduleDate(
      (booking.scheduled_date ?? booking.booking_date ?? '').toString().slice(0, 10)
    );
    setRescheduleTime(
      String(booking.scheduled_start_time ?? booking.booking_time ?? '10:00').slice(0, 5)
    );
  };

  const handleReschedule = async () => {
    if (!rescheduleBooking || !rescheduleDate || !rescheduleTime) return;
    const duration = Number(rescheduleBooking.service?.duration_minutes) || 60;
    const start = `${rescheduleTime}:00`.slice(0, 8);
    const end = addMinutesToTime(rescheduleTime, duration);
    try {
      await updateBooking.mutateAsync({
        id: rescheduleBooking.id,
        data: {
          scheduled_date: rescheduleDate,
          scheduled_start_time: start.length === 5 ? `${start}:00` : start,
          scheduled_end_time: end,
          booking_date: rescheduleDate,
          booking_time: rescheduleTime.slice(0, 5),
        },
      });
      toast({
        title: 'Réservation replanifiée',
        description: 'La nouvelle date a été enregistrée.',
      });
      setRescheduleBooking(null);
      void refetch();
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de replanifier cette réservation.',
        variant: 'destructive',
      });
    }
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
                {list.map(booking => {
                  const cancelOk = canCancelServiceBooking(booking, booking.service);
                  const rescheduleOk = canRescheduleServiceBooking(booking, booking.service);
                  return (
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
                        <JoinServiceMeetingButton
                          bookingId={booking.id}
                          role="guest"
                          meetingUrl={booking.meeting_url || booking.service?.meeting_url}
                          meetingPlatform={booking.meeting_platform}
                          locationType={booking.service?.location_type}
                          status={booking.status}
                          label="Rejoindre la visio"
                        />
                        {booking.product?.id && (
                          <Button asChild variant="link" className="px-0 h-auto">
                            <Link to={`/service/${booking.product.id}`}>Voir le service</Link>
                          </Button>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {rescheduleOk.allowed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReschedule(booking)}
                            >
                              Replanifier
                            </Button>
                          )}
                          {cancelOk.allowed ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setCancelId(booking.id)}
                            >
                              Annuler la réservation
                            </Button>
                          ) : (
                            ['pending', 'confirmed'].includes(booking.status) &&
                            cancelOk.reason && (
                              <p className="text-xs text-muted-foreground w-full">
                                {cancelOk.reason}
                              </p>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
              {cancelEligibility.allowed
                ? "Cette action est irréversible. Un remboursement peut s'appliquer selon la politique d'annulation du prestataire."
                : cancelEligibility.reason}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            {cancelEligibility.allowed && (
              <AlertDialogAction
                onClick={handleCancel}
                disabled={cancelBooking.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelBooking.isPending ? 'Annulation…' : "Confirmer l'annulation"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rescheduleBooking} onOpenChange={open => !open && setRescheduleBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replanifier le rendez-vous</DialogTitle>
            <DialogDescription>
              Choisissez une nouvelle date et heure. Le prestataire sera notifié.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-time">Heure</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleTime}
                onChange={e => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleBooking(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleReschedule()}
              disabled={updateBooking.isPending || !rescheduleDate || !rescheduleTime}
            >
              {updateBooking.isPending ? 'Enregistrement…' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPageShell>
  );
}
