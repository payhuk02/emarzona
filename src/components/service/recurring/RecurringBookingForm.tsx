/**
 * Recurring Booking Form
 * Date: 27 Janvier 2025
 * 
 * Formulaire pour créer une série de réservations récurrentes
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Repeat, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCreateRecurringBooking, RecurringBookingConfig } from '@/hooks/services/useRecurringBookings';
import { useStore } from '@/hooks/useStore';

interface RecurringBookingFormProps {
  parentBookingId: string;
  initialDate: Date;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

export default function RecurringBookingForm({
  parentBookingId,
  initialDate,
  onSuccess,
  onCancel,
}: RecurringBookingFormProps) {
  const { store } = useStore();
  const createRecurring = useCreateRecurringBooking();

  const [pattern, setPattern] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [interval, setInterval] = useState(1);
  const [endType, setEndType] = useState<'date' | 'count'>('date');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [count, setCount] = useState(10);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!store?.id) {
      return;
    }

    const config: RecurringBookingConfig = {
      recurrence_pattern: pattern,
      recurrence_interval: interval,
      recurrence_end_date: endType === 'date' && endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      recurrence_count: endType === 'count' ? count : undefined,
      recurrence_days_of_week: pattern === 'weekly' && selectedDays.length > 0 ? selectedDays : undefined,
      recurrence_day_of_month: pattern === 'monthly' ? dayOfMonth : undefined,
    };

    await createRecurring.mutateAsync({
      parentBookingId,
      config,
      storeId: store.id,
    });

    onSuccess?.();
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          Créer une Réservation Récurrente
        </CardTitle>
        <CardDescription>
          Configurez la récurrence pour générer automatiquement plusieurs réservations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pattern de récurrence */}
          <div className="space-y-2">
            <Label>Type de récurrence</Label>
            <Select value={pattern} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'custom') => setPattern(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Intervalle */}
          <div className="space-y-2">
            <Label>Intervalle</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tous les</span>
              <Input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                {pattern === 'daily' && 'jour(s)'}
                {pattern === 'weekly' && 'semaine(s)'}
                {pattern === 'monthly' && 'mois'}
              </span>
            </div>
          </div>

          {/* Jours de la semaine (pour weekly) */}
          {pattern === 'weekly' && (
            <div className="space-y-2">
              <Label>Jours de la semaine</Label>
              <div className="grid grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <Label
                      htmlFor={`day-${day.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jour du mois (pour monthly) */}
          {pattern === 'monthly' && (
            <div className="space-y-2">
              <Label>Jour du mois</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                className="w-32"
              />
            </div>
          )}

          {/* Fin de récurrence */}
          <div className="space-y-2">
            <Label>Fin de la récurrence</Label>
            <Select value={endType} onValueChange={(value: 'date' | 'count' | 'never') => setEndType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date de fin</SelectItem>
                <SelectItem value="count">Nombre de réservations</SelectItem>
              </SelectContent>
            </Select>

            {endType === 'date' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    locale={fr}
                    disabled={(date) => date < initialDate}
                  />
                </PopoverContent>
              </Popover>
            )}

            {endType === 'count' && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="2"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 2)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">réservation(s)</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={createRecurring.isPending}>
              {createRecurring.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer la série
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

