/**
 * Recurring Bookings Manager
 * Date: 27 Janvier 2025
 * 
 * Gestionnaire pour les séries de réservations récurrentes
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Repeat,
  Calendar,
  Users,
  XCircle,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Eye,
} from 'lucide-react';
import { useRecurringSeries, useCancelRecurringSeries, useRecurringBookingsBySeries } from '@/hooks/services/useRecurringBookings';
import { useStore } from '@/hooks/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function RecurringBookingsManager() {
  const { store } = useStore();
  const { data: series = [], isLoading } = useRecurringSeries(store?.id);
  const cancelSeries = useCancelRecurringSeries();

  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [seriesToCancel, setSeriesToCancel] = useState<string | null>(null);

  const { data: bookings = [] } = useRecurringBookingsBySeries(selectedSeriesId || undefined);

  const handleViewDetails = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setIsDetailsDialogOpen(true);
  };

  const handleCancelSeries = (seriesId: string) => {
    setSeriesToCancel(seriesId);
    setIsCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (seriesToCancel) {
      await cancelSeries.mutateAsync(seriesToCancel);
      setIsCancelDialogOpen(false);
      setSeriesToCancel(null);
    }
  };

  const getPatternLabel = (pattern: string, interval: number) => {
    switch (pattern) {
      case 'daily':
        return `Tous les ${interval} jour(s)`;
      case 'weekly':
        return `Toutes les ${interval} semaine(s)`;
      case 'monthly':
        return `Tous les ${interval} mois`;
      default:
        return pattern;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Séries de Réservations Récurrentes
          </CardTitle>
          <CardDescription>
            Gérez vos séries de réservations récurrentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Repeat className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune série récurrente pour le moment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Complétées</TableHead>
                  <TableHead>Annulées</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">
                        {s.service?.product?.name || 'Service'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {s.parent_booking?.scheduled_date &&
                          format(new Date(s.parent_booking.scheduled_date), 'PPP', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getPatternLabel(s.recurrence_pattern, s.recurrence_interval)}
                      </div>
                      {s.recurrence_end_date && (
                        <div className="text-xs text-muted-foreground">
                          Jusqu'au {format(new Date(s.recurrence_end_date), 'PPP', { locale: fr })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{s.total_bookings}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.completed_bookings}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{s.cancelled_bookings}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? 'default' : 'secondary'}>
                        {s.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(s.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCancelSeries(s.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Annuler la série
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la Série Récurrente</DialogTitle>
            <DialogDescription>
              Liste de toutes les réservations de cette série
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <p className="text-muted-foreground">Aucune réservation trouvée</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Heure</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {format(new Date(booking.scheduled_date), 'PPP', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {booking.scheduled_start_time} - {booking.scheduled_end_time}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === 'completed'
                              ? 'secondary'
                              : booking.status === 'cancelled'
                              ? 'destructive'
                              : booking.status === 'confirmed'
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation Annulation */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la série récurrente</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler toutes les réservations de cette série ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

