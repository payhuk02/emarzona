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
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import type { RecurringBookingPattern } from '@/hooks/service/useRecurringBookings';

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
    if (
      !confirm('Êtes-vous sûr de vouloir annuler toutes les réservations futures de cette série ?')
    ) {
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

  const getRecurrenceLabel = (pattern: RecurringBookingPattern) => {
    switch (pattern.recurrence_type) {
      case 'daily':
        return 'Quotidien';
      case 'weekly': {
        const days = pattern.days_of_week || [];
        const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return `Hebdomadaire (${days.map((d: number) => dayLabels[d]).join(', ')})`;
      }
      case 'biweekly':
        return 'Bi-hebdomadaire';
      case 'monthly':
        return pattern.day_of_month ? `Mensuel (jour ${pattern.day_of_month})` : 'Mensuel';
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <Repeat className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gestion des Réservations Récurrentes
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Gérez vos séries de réservations qui se répètent automatiquement
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="pt-4 sm:pt-6 p-3 sm:p-4">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">
                    {patterns?.length || 0}
                  </div>
                  <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-1">
                    Séries totales
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="pt-4 sm:pt-6 p-3 sm:p-4">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">
                    {patterns?.filter(p => p.status === 'active').length || 0}
                  </div>
                  <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-1">
                    Séries actives
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="pt-4 sm:pt-6 p-3 sm:p-4">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">
                    {patterns?.reduce((sum: number, p) => sum + (p.created_occurrences || 0), 0) ||
                      0}
                  </div>
                  <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-1">
                    Réservations créées
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="pt-4 sm:pt-6 p-3 sm:p-4">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">
                    {patterns?.reduce((sum: number, p) => sum + (p.total_occurrences || 0), 0) || 0}
                  </div>
                  <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-1">
                    Occurrences totales
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-sm sm:text-base md:text-lg">
                  Mes Séries de Réservations
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Liste de toutes vos séries de réservations récurrentes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                {patterns && patterns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm">
                            Titre / Type
                          </TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm hidden sm:table-cell">
                            Récurrence
                          </TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm hidden md:table-cell">
                            Date début
                          </TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm hidden lg:table-cell">
                            Horaires
                          </TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm">
                            Occurrences
                          </TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm">
                            Statut
                          </TableHead>
                          <TableHead className="text-[10px] sm:text-xs md:text-sm">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patterns.map(pattern => (
                          <TableRow key={pattern.id}>
                            <TableCell className="text-xs sm:text-sm">
                              <div>
                                <div className="font-medium">
                                  {pattern.title || 'Série sans titre'}
                                </div>
                                {pattern.notes && (
                                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                    {pattern.notes}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                              {getRecurrenceLabel(pattern)}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                              {format(new Date(pattern.start_date), 'PPP', { locale: fr })}
                              {pattern.end_date && (
                                <div className="text-[10px] sm:text-xs text-muted-foreground">
                                  jusqu'au{' '}
                                  {format(new Date(pattern.end_date), 'PPP', { locale: fr })}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                              <div>
                                {pattern.start_time} ({pattern.duration_minutes} min)
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <div>
                                {pattern.created_occurrences} / {pattern.total_occurrences || '∞'}
                              </div>
                              {pattern.occurrence_limit && (
                                <div className="text-[10px] sm:text-xs text-muted-foreground">
                                  Max: {pattern.occurrence_limit}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {getStatusBadge(pattern.status)}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <StableDropdownMenu
                                triggerContent={<MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                                triggerProps={{
                                  variant: "ghost" as const,
                                  size: "icon" as const,
                                  className: "min-h-[44px] min-w-[44px]",
                                  "aria-label": `Actions pour le réservation récurrente ${pattern.id}`
                                }}
                              >
                                {pattern.status === 'active' ? (
                                  <SelectItem value="edit" onSelect
                                    onSelect={() => handleTogglePause(pattern.id, pattern.status)}
                                  >
                                    <Pause className="h-4 w-4 mr-2" />
                                    Mettre en pause
                                  </SelectItem>
                                ) : pattern.status === 'paused' ? (
                                  <SelectItem value="delete" onSelect
                                    onSelect={() => handleTogglePause(pattern.id, pattern.status)}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Reprendre
                                  </SelectItem>
                                ) : null}
                                <SelectItem value="copy" onSelect
                                  onSelect={() => {
                                    setSelectedPattern(pattern.id);
                                    setRescheduleDialogOpen(true);
                                  }}
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Replanifier
                                </SelectItem>
                                <SelectItem value="view" onSelect onSelect={() => handleGenerateMore(pattern.id)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Générer plus
                                </SelectItem>
                                <StableDropdownMenuSeparator />
                                <SelectItem value="export" onSelect
                                  onSelect={() => handleCancel(pattern.id)}
                                  className="text-red-600"
                                >
                                  <Square className="h-4 w-4 mr-2" />
                                  Annuler série
                                </SelectItem>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <Repeat className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <p className="text-xs sm:text-sm text-muted-foreground">
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
                    <Label className="text-xs sm:text-sm">Nouvelle date de début</Label>
                    <Input
                      type="date"
                      value={newStartDate}
                      onChange={e => setNewStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="min-h-[44px] text-xs sm:text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onSelect={() => {
                        setRescheduleDialogOpen(false);
                        setSelectedPattern(null);
                        setNewStartDate('');
                      }}
                      className="min-h-[44px] text-xs sm:text-sm"
                    >
                      Annuler
                    </Button>
                    <Button onSelect={handleReschedule} className="min-h-[44px] text-xs sm:text-sm">
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
