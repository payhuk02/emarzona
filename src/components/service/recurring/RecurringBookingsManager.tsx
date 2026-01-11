/**
 * Recurring Bookings Manager
 * Date: 27 Janvier 2025
 * 
 * Gestionnaire pour les séries de réservations récurrentes
 * Design responsive avec cards sur mobile et table sur desktop
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Repeat,
  Calendar,
  MoreVertical,
  Trash2,
  Eye,
} from '@/components/icons';
import { useRecurringSeries, useCancelRecurringSeries, useRecurringBookingsBySeries, type RecurringBookingSeries } from '@/hooks/services/useRecurringBookings';
import { useStore } from '@/hooks/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const RecurringBookingsManager = React.memo(() => {
  const { store } = useStore();
  const { data: series = [], isLoading } = useRecurringSeries(store?.id);
  const cancelSeries = useCancelRecurringSeries();

  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [seriesToCancel, setSeriesToCancel] = useState<string | null>(null);

  const { data: bookings = [] } = useRecurringBookingsBySeries(selectedSeriesId || undefined);

  // Optimiser les calculs avec useMemo (utilisés implicitement dans le rendu)

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
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          {series.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Repeat className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                Aucune série récurrente pour le moment
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Créez une série de réservations récurrentes pour commencer
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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
                    {series.map((s: RecurringBookingSeries) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-medium">
                            {s.service?.product?.name || 'Service'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {s.parent_booking?.scheduled_date ? (
                              format(new Date(s.parent_booking.scheduled_date), 'PPP', { locale: fr })
                            ) : (
                              'Date non définie'
                            )}
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
                              <Button variant="ghost" size="sm" aria-label={`Actions pour la série de réservations ${s.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(s.id)}
                                aria-label={`Voir les détails de la série ${s.service?.product?.name || 'Service'}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancelSeries(s.id)}
                                className="text-destructive"
                                aria-label={`Annuler la série de réservations ${s.service?.product?.name || 'Service'}`}
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
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {series.map((s: RecurringBookingSeries) => (
                  <Card
                    key={s.id}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm sm:text-base truncate">
                              {s.service?.product?.name || 'Service'}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {s.parent_booking?.scheduled_date ? (
                                format(new Date(s.parent_booking.scheduled_date), 'PPP', { locale: fr })
                              ) : (
                                'Date non définie'
                              )}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions pour la série de réservations ${s.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(s.id)}
                                aria-label={`Voir les détails de la série ${s.service?.product?.name || 'Service'}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancelSeries(s.id)}
                                className="text-destructive"
                                aria-label={`Annuler la série de réservations ${s.service?.product?.name || 'Service'}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Annuler la série
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {getPatternLabel(s.recurrence_pattern, s.recurrence_interval)}
                          </span>
                        </div>

                        {s.recurrence_end_date && (
                          <div className="text-xs text-muted-foreground">
                            Jusqu'au {format(new Date(s.recurrence_end_date), 'PPP', { locale: fr })}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Total:</span>
                            <span className="text-xs font-medium">{s.total_bookings}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {s.completed_bookings} complétées
                          </Badge>
                          <Badge variant="destructive" className="text-xs">
                            {s.cancelled_bookings} annulées
                          </Badge>
                          <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-xs ml-auto">
                            {s.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Détails de la Série Récurrente</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Liste de toutes les réservations de cette série
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">Aucune réservation trouvée</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Heure</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
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
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              {format(new Date(booking.scheduled_date), 'PPP', { locale: fr })}
                            </div>
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
                              className="text-xs"
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {booking.scheduled_start_time} - {booking.scheduled_end_time}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation Annulation */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Annuler la série récurrente</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Êtes-vous sûr de vouloir annuler toutes les réservations de cette série ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

RecurringBookingsManager.displayName = 'RecurringBookingsManager';

export default RecurringBookingsManager;







