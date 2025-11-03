/**
 * Page RecurringBookingsManagement - Gestion des séries de réservations récurrentes
 * Date: 26 Janvier 2025
 */

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import {
  useRecurringBookingPatterns,
  useUpdateRecurringBookingPattern,
  useCancelFutureRecurringBookings,
  useRescheduleRecurringBookings,
  useGenerateMoreOccurrences,
} from '@/hooks/service/useRecurringBookings';
import {
  Repeat,
  Play,
  Pause,
  Square,
  Calendar,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function RecurringBookingsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: patterns, isLoading } = useRecurringBookingPatterns(user?.id);
  const updatePattern = useUpdateRecurringBookingPattern();
  const cancelFuture = useCancelFutureRecurringBookings();
  const reschedule = useRescheduleRecurringBookings();
  const generateMore = useGenerateMoreOccurrences();

  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [newStartDate, setNewStartDate] = useState('');

  const handleTogglePause = async (patternId: string, currentStatus: string) => {
    try {
      await updatePattern.mutateAsync({
        patternId,
        updates: {
          status: currentStatus === 'active' ? 'paused' : 'active',
        },
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancel = async (patternId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler toutes les réservations futures de cette série ?')) {
      return;
    }

    try {
      await cancelFuture.mutateAsync({ patternId });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleReschedule = async () => {
    if (!selectedPattern || !newStartDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une nouvelle date',
        variant: 'destructive',
      });
      return;
    }

    try {
      await reschedule.mutateAsync({
        patternId: selectedPattern,
        newStartDate,
      });
      setRescheduleDialogOpen(false);
      setSelectedPattern(null);
      setNewStartDate('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleGenerateMore = async (patternId: string) => {
    try {
      await generateMore.mutateAsync({
        patternId,
        count: 10,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const getRecurrenceLabel = (pattern: any) => {
    switch (pattern.recurrence_type) {
      case 'daily':
        return 'Quotidien';
      case 'weekly':
        const days = pattern.days_of_week || [];
        const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return `Hebdomadaire (${days.map((d: number) => dayLabels[d]).join(', ')})`;
      case 'biweekly':
        return 'Bi-hebdomadaire';
      case 'monthly':
        return pattern.day_of_month
          ? `Mensuel (jour ${pattern.day_of_month})`
          : 'Mensuel';
      case 'custom':
        return `Personnalisé (tous les ${pattern.interval_days} jours)`;
      default:
        return pattern.recurrence_type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'paused':
        return <Badge variant="secondary">En pause</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Terminé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Repeat className="h-8 w-8" />
                Gestion des Réservations Récurrentes
              </h1>
              <p className="text-muted-foreground mt-1">
                Gérez vos séries de réservations qui se répètent automatiquement
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{patterns?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Séries totales</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {patterns?.filter((p: any) => p.status === 'active').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Séries actives</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {patterns?.reduce((sum: number, p: any) => sum + (p.created_occurrences || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Réservations créées</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {patterns?.reduce((sum: number, p: any) => sum + (p.total_occurrences || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Occurrences totales</div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Mes Séries de Réservations</CardTitle>
                <CardDescription>
                  Liste de toutes vos séries de réservations récurrentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patterns && patterns.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre / Type</TableHead>
                        <TableHead>Récurrence</TableHead>
                        <TableHead>Date début</TableHead>
                        <TableHead>Horaires</TableHead>
                        <TableHead>Occurrences</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patterns.map((pattern: any) => (
                        <TableRow key={pattern.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {pattern.title || 'Série sans titre'}
                              </div>
                              {pattern.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {pattern.notes}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getRecurrenceLabel(pattern)}</TableCell>
                          <TableCell>
                            {format(new Date(pattern.start_date), 'PPP', { locale: fr })}
                            {pattern.end_date && (
                              <div className="text-xs text-muted-foreground">
                                jusqu'au {format(new Date(pattern.end_date), 'PPP', { locale: fr })}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {pattern.start_time} ({pattern.duration_minutes} min)
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {pattern.created_occurrences} / {pattern.total_occurrences || '∞'}
                            </div>
                            {pattern.occurrence_limit && (
                              <div className="text-xs text-muted-foreground">
                                Max: {pattern.occurrence_limit}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(pattern.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {pattern.status === 'active' ? (
                                  <DropdownMenuItem
                                    onClick={() => handleTogglePause(pattern.id, pattern.status)}
                                  >
                                    <Pause className="h-4 w-4 mr-2" />
                                    Mettre en pause
                                  </DropdownMenuItem>
                                ) : pattern.status === 'paused' ? (
                                  <DropdownMenuItem
                                    onClick={() => handleTogglePause(pattern.id, pattern.status)}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Reprendre
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPattern(pattern.id);
                                    setRescheduleDialogOpen(true);
                                  }}
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Replanifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleGenerateMore(pattern.id)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Générer plus
                                </DropdownMenuItem>
                                <Separator />
                                <DropdownMenuItem
                                  onClick={() => handleCancel(pattern.id)}
                                  className="text-red-600"
                                >
                                  <Square className="h-4 w-4 mr-2" />
                                  Annuler série
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Aucune série de réservations récurrentes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Replanification Dialog */}
            <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Replanifier la série</DialogTitle>
                  <DialogDescription>
                    Choisissez une nouvelle date de début pour toutes les réservations futures
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nouvelle date de début</Label>
                    <Input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRescheduleDialogOpen(false);
                        setSelectedPattern(null);
                        setNewStartDate('');
                      }}
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleReschedule}>
                      Replanifier
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

