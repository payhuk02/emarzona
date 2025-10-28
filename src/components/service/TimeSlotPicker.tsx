/**
 * Time Slot Picker Component
 * Date: 28 octobre 2025
 * 
 * Interactive time slot selector for service bookings
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { useAvailableTimeSlots } from '@/hooks/service';

interface TimeSlotPickerProps {
  serviceProductId: string;
  selectedDate: string;
  selectedTime?: string;
  onSelectTime: (time: string) => void;
}

export const TimeSlotPicker = ({
  serviceProductId,
  selectedDate,
  selectedTime,
  onSelectTime,
}: TimeSlotPickerProps) => {
  const { data: slots, isLoading } = useAvailableTimeSlots(serviceProductId, selectedDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Créneaux disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Créneaux disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Aucun créneau disponible pour cette date. Veuillez sélectionner une autre date.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Créneaux disponibles
        </CardTitle>
        <CardDescription>
          {slots.length} créneau{slots.length > 1 ? 'x' : ''} disponible{slots.length > 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {slots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            const isFullyBooked = slot.availableSpots === 0;

            return (
              <Button
                key={slot.time}
                variant={isSelected ? 'default' : 'outline'}
                className={`
                  h-auto flex-col items-start p-3 relative
                  ${isFullyBooked ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !isFullyBooked && onSelectTime(slot.time)}
                disabled={isFullyBooked}
              >
                <div className="flex items-center gap-2 w-full">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">{formatTime(slot.time)}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                </div>
                
                <div className="flex items-center gap-1 text-xs mt-1 w-full">
                  <Users className="h-3 w-3" />
                  <span className="text-muted-foreground">
                    {slot.availableSpots}/{slot.maxParticipants} places
                  </span>
                </div>

                {isFullyBooked && (
                  <Badge
                    variant="destructive"
                    className="absolute top-1 right-1 text-xs px-1 py-0"
                  >
                    Complet
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

