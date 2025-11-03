/**
 * Composant RecurringBookingForm - Formulaire pour créer des réservations récurrentes
 * Date: 26 Janvier 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Repeat,
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCreateRecurringBooking } from '@/hooks/service/useRecurringBookings';

interface RecurringBookingFormProps {
  productId: string;
  userId: string;
  staffMemberId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RecurringBookingForm({
  productId,
  userId,
  staffMemberId,
  onSuccess,
  onCancel,
}: RecurringBookingFormProps) {
  const { toast } = useToast();
  const createRecurring = useCreateRecurringBooking();

  // État du formulaire
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'>('weekly');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [intervalDays, setIntervalDays] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [occurrenceLimit, setOccurrenceLimit] = useState<string>('');
  const [dateLimit, setDateLimit] = useState<Date | undefined>();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const handleDayOfWeekToggle = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async () => {
    if (!startDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une date de début',
        variant: 'destructive',
      });
      return;
    }

    if (recurrenceType === 'weekly' && daysOfWeek.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un jour de la semaine',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createRecurring.mutateAsync({
        product_id: productId,
        user_id: userId,
        staff_member_id: staffMemberId,
        recurrence_type: recurrenceType,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        date_limit: dateLimit ? format(dateLimit, 'yyyy-MM-dd') : null,
        start_time: startTime,
        duration_minutes: durationMinutes,
        interval_days: recurrenceType === 'custom' ? intervalDays : undefined,
        days_of_week: recurrenceType === 'weekly' || recurrenceType === 'monthly' ? daysOfWeek : undefined,
        day_of_month: recurrenceType === 'monthly' ? dayOfMonth : undefined,
        occurrence_limit: occurrenceLimit ? parseInt(occurrenceLimit) : null,
        title: title || undefined,
        notes: notes || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      toast({
        title: '✅ Série créée',
        description: 'La série de réservations récurrentes a été créée avec succès',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la série',
        variant: 'destructive',
      });
    }
  };

  const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          Créer une Réservation Récurrente
        </CardTitle>
        <CardDescription>
          Configurez une série de réservations qui se répètent automatiquement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type de récurrence */}
        <div className="space-y-2">
          <Label>Type de récurrence</Label>
          <Select value={recurrenceType} onValueChange={(v: any) => setRecurrenceType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Quotidien</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="biweekly">Bi-hebdomadaire (toutes les 2 semaines)</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
              <SelectItem value="custom">Personnalisé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date de début *</Label>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              disabled={(date) => date < new Date()}
              locale={fr}
              className="rounded-md border"
            />
          </div>
          <div className="space-y-2">
            <Label>Date de fin (optionnel)</Label>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              disabled={(date) => startDate ? date < startDate : date < new Date()}
              locale={fr}
              className="rounded-md border"
            />
          </div>
        </div>

        {/* Horaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Heure de début *</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Durée (minutes) *</Label>
            <Input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
              min={15}
              step={15}
            />
          </div>
        </div>

        {/* Configuration selon le type */}
        {recurrenceType === 'weekly' && (
          <div className="space-y-2">
            <Label>Jours de la semaine *</Label>
            <div className="flex flex-wrap gap-2">
              {dayLabels.map((label, index) => (
                <Badge
                  key={index}
                  variant={daysOfWeek.includes(index) ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => handleDayOfWeekToggle(index)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {recurrenceType === 'monthly' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jour du mois</Label>
              <Input
                type="number"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                min={1}
                max={31}
              />
            </div>
            <div className="space-y-2">
              <Label>OU - Jours de la semaine</Label>
              <div className="flex flex-wrap gap-2">
                {dayLabels.map((label, index) => (
                  <Badge
                    key={index}
                    variant={daysOfWeek.includes(index) ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-2"
                    onClick={() => handleDayOfWeekToggle(index)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {recurrenceType === 'custom' && (
          <div className="space-y-2">
            <Label>Intervalle (jours)</Label>
            <Input
              type="number"
              value={intervalDays}
              onChange={(e) => setIntervalDays(parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>
        )}

        {/* Limites */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre d'occurrences max (optionnel)</Label>
            <Input
              type="number"
              value={occurrenceLimit}
              onChange={(e) => setOccurrenceLimit(e.target.value)}
              placeholder="Illimité si vide"
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label>Date limite (optionnel)</Label>
            <Calendar
              mode="single"
              selected={dateLimit}
              onSelect={setDateLimit}
              disabled={(date) => startDate ? date < startDate : date < new Date()}
              locale={fr}
              className="rounded-md border"
            />
          </div>
        </div>

        <Separator />

        {/* Titre et notes */}
        <div className="space-y-2">
          <Label>Titre de la série (optionnel)</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Formation hebdomadaire"
          />
        </div>

        <div className="space-y-2">
          <Label>Notes (optionnel)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes personnelles sur cette série de réservations..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={createRecurring.isPending}
          >
            {createRecurring.isPending ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Création...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Créer la série
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

