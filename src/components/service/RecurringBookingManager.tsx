import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logger } from '@/lib/logger';
import {
  Calendar,
  Clock,
  Repeat,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Récurrence types
 */
export type RecurrencePattern = 
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'custom';

/**
 * Days of the week
 */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Recurring booking configuration
 */
export interface RecurringBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  pattern: RecurrencePattern;
  startDate: Date | string;
  endDate?: Date | string;
  time: string; // HH:MM format
  duration: number; // minutes
  daysOfWeek?: DayOfWeek[]; // For weekly/biweekly
  dayOfMonth?: number; // For monthly
  interval?: number; // For custom (every N days)
  isActive: boolean;
  createdBookingsCount: number;
  nextOccurrence?: Date | string;
}

/**
 * Props pour RecurringBookingManager
 */
export interface RecurringBookingManagerProps {
  /** Réservations récurrentes existantes */
  recurringBookings: RecurringBooking[];
  
  /** Callback pour créer/modifier une récurrence */
  onSave?: (booking: Partial<RecurringBooking>) => Promise<void>;
  
  /** Callback pour supprimer une récurrence */
  onDelete?: (id: string) => Promise<void>;
  
  /** Callback pour activer/désactiver */
  onToggleActive?: (id: string, isActive: boolean) => Promise<void>;
  
  /** Services disponibles pour sélection */
  availableServices?: { id: string; name: string }[];
  
  /** Clients disponibles */
  availableCustomers?: { id: string; name: string }[];
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Configuration des patterns avec labels
 */
const PATTERN_CONFIG: Record<RecurrencePattern, { label: string; description: string }> = {
  daily: {
    label: 'Quotidien',
    description: 'Tous les jours',
  },
  weekly: {
    label: 'Hebdomadaire',
    description: 'Chaque semaine',
  },
  biweekly: {
    label: 'Bihebdomadaire',
    description: 'Toutes les 2 semaines',
  },
  monthly: {
    label: 'Mensuel',
    description: 'Chaque mois',
  },
  custom: {
    label: 'Personnalisé',
    description: 'Intervalle personnalisé',
  },
};

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' },
];

/**
 * RecurringBookingManager - Gestion des réservations récurrentes
 */
export const RecurringBookingManager: React.FC<RecurringBookingManagerProps> = ({
  recurringBookings,
  onSave,
  onDelete,
  onToggleActive,
  availableServices = [],
  availableCustomers = [],
  className,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Partial<RecurringBooking> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Ouvrir dialog pour nouveau
  const handleNew = () => {
    setEditingBooking({
      pattern: 'weekly',
      daysOfWeek: ['monday'],
      time: '09:00',
      duration: 60,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  // Ouvrir dialog pour éditer
  const handleEdit = (booking: RecurringBooking) => {
    setEditingBooking({ ...booking });
    setIsDialogOpen(true);
  };

  // Sauvegarder
  const handleSave = async () => {
    if (!editingBooking || !onSave) return;

    setIsSaving(true);
    try {
      await onSave(editingBooking);
      setIsDialogOpen(false);
      setEditingBooking(null);
    } catch (error) {
      logger.error('Error saving recurring booking', { error, bookingId: editingBooking?.id });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle jour de la semaine
  const toggleDayOfWeek = (day: DayOfWeek) => {
    if (!editingBooking) return;

    const days = editingBooking.daysOfWeek || [];
    const newDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];

    setEditingBooking({ ...editingBooking, daysOfWeek: newDays });
  };

  // Formater la date de prochaine occurrence
  const formatNextOccurrence = (date?: Date | string) => {
    if (!date) return 'Non définie';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render récurrence card
  const renderRecurringCard = (booking: RecurringBooking) => {
    const config = PATTERN_CONFIG[booking.pattern];

    return (
      <Card key={booking.id} className={cn(!booking.isActive && 'opacity-60')}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{booking.serviceName}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {booking.customerName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={booking.isActive ? 'default' : 'secondary'}>
                {booking.isActive ? 'Actif' : 'Inactif'}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(booking)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(booking.id)}
                  className="h-8 w-8 p-0 text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Pattern info */}
          <div className="flex items-center gap-2 text-sm">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{config.label}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {booking.daysOfWeek && booking.daysOfWeek.length > 0
                ? booking.daysOfWeek.map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label.slice(0, 3)).join(', ')
                : config.description}
            </span>
          </div>

          {/* Time & duration */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{booking.time} • {booking.duration} min</span>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Réservations créées</p>
              <p className="text-base font-semibold">{booking.createdBookingsCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prochaine occurrence</p>
              <p className="text-xs font-medium">
                {formatNextOccurrence(booking.nextOccurrence)}
              </p>
            </div>
          </div>

          {/* Toggle active */}
          {onToggleActive && (
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor={`active-${booking.id}`} className="text-xs">
                Activer les réservations automatiques
              </Label>
              <Switch
                id={`active-${booking.id}`}
                checked={booking.isActive}
                onCheckedChange={(checked) => onToggleActive(booking.id, checked)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Réservations récurrentes
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Créez des réservations automatiques périodiques
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle récurrence
        </Button>
      </div>

      {/* Liste */}
      {recurringBookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune réservation récurrente</p>
          <Button variant="outline" className="mt-4" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Créer la première
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurringBookings.map((booking) => renderRecurringCard(booking))}
        </div>
      )}

      {/* Dialog d'édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBooking?.id ? 'Modifier' : 'Nouvelle'} réservation récurrente
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres de récurrence
            </DialogDescription>
          </DialogHeader>

          {editingBooking && (
            <div className="space-y-4">
              {/* Service & Customer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service *</Label>
                  <Select
                    value={editingBooking.serviceId}
                    onValueChange={(value) => {
                      const service = availableServices.find((s) => s.id === value);
                      setEditingBooking({
                        ...editingBooking,
                        serviceId: value,
                        serviceName: service?.name,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select
                    value={editingBooking.customerId}
                    onValueChange={(value) => {
                      const customer = availableCustomers.find((c) => c.id === value);
                      setEditingBooking({
                        ...editingBooking,
                        customerId: value,
                        customerName: customer?.name,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pattern */}
              <div className="space-y-2">
                <Label>Récurrence *</Label>
                <Select
                  value={editingBooking.pattern}
                  onValueChange={(value: RecurrencePattern) =>
                    setEditingBooking({ ...editingBooking, pattern: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PATTERN_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label} - {config.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Days of week (si weekly ou biweekly) */}
              {(editingBooking.pattern === 'weekly' || editingBooking.pattern === 'biweekly') && (
                <div className="space-y-2">
                  <Label>Jours de la semaine *</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        variant={
                          editingBooking.daysOfWeek?.includes(day.value)
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => toggleDayOfWeek(day.value)}
                        type="button"
                      >
                        {day.label.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of month (si monthly) */}
              {editingBooking.pattern === 'monthly' && (
                <div className="space-y-2">
                  <Label>Jour du mois (1-31)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={editingBooking.dayOfMonth || ''}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        dayOfMonth: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              )}

              {/* Interval (si custom) */}
              {editingBooking.pattern === 'custom' && (
                <div className="space-y-2">
                  <Label>Intervalle (jours)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingBooking.interval || ''}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        interval: parseInt(e.target.value),
                      })
                    }
                    placeholder="Ex: 3 (tous les 3 jours)"
                  />
                </div>
              )}

              <Separator />

              {/* Time & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heure *</Label>
                  <Input
                    type="time"
                    value={editingBooking.time}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, time: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Durée (min) *</Label>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    value={editingBooking.duration}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, duration: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              {/* Start & End dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début *</Label>
                  <Input
                    type="date"
                    value={
                      editingBooking.startDate
                        ? typeof editingBooking.startDate === 'string'
                          ? editingBooking.startDate.split('T')[0]
                          : editingBooking.startDate.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin (optionnel)</Label>
                  <Input
                    type="date"
                    value={
                      editingBooking.endDate
                        ? typeof editingBooking.endDate === 'string'
                          ? editingBooking.endDate.split('T')[0]
                          : editingBooking.endDate.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        endDate: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label htmlFor="active-new">Activer immédiatement</Label>
                <Switch
                  id="active-new"
                  checked={editingBooking.isActive}
                  onCheckedChange={(checked) =>
                    setEditingBooking({ ...editingBooking, isActive: checked })
                  }
                />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">À propos des réservations automatiques</p>
                  <p className="text-xs mt-1">
                    Les réservations seront créées automatiquement 24h à l'avance. Elles peuvent être
                    modifiées ou annulées individuellement.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

RecurringBookingManager.displayName = 'RecurringBookingManager';

export default RecurringBookingManager;

