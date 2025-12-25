/**
 * Time Slot Picker Component
 * Date: 2 Février 2025
 *
 * Composant pour sélectionner un créneau horaire avec feedback visuel
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useQuickAvailabilityCheck } from '@/hooks/service/useServiceBookingValidation';

interface TimeSlot {
  time: string;
  availableSpots?: number;
}

interface TimeSlotPickerProps {
  serviceId?: string;
  serviceProductId?: string;
  date: Date;
  onSlotSelect: (slot: TimeSlot | null) => void;
  selectedSlot?: string;
  durationMinutes?: number;
}

export const TimeSlotPicker = ({
  serviceId,
  serviceProductId,
  date,
  onSlotSelect,
  selectedSlot,
  durationMinutes,
}: TimeSlotPickerProps) => {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const quickCheck = useQuickAvailabilityCheck();

  // Normaliser l'ID du service
  const normalizedServiceProductId = serviceProductId || serviceId;

  // Récupérer les créneaux disponibles pour ce jour
  const { data: slots, isLoading } = useQuery({
    queryKey: ['availability-slots', normalizedServiceProductId, date.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!normalizedServiceProductId) return [];

      // Récupérer le service_product_id si on a seulement serviceId
      let productId = normalizedServiceProductId;
      if (serviceId && !serviceProductId) {
        const { data: product } = await supabase
          .from('products')
          .select('id')
          .eq('id', serviceId)
          .single();

        if (product) {
          const { data: serviceProduct } = await supabase
            .from('service_products')
            .select('id')
            .eq('product_id', product.id)
            .single();

          if (serviceProduct) {
            productId = serviceProduct.id;
          }
        }
      }

      const dayOfWeek = date.getDay();

      const { data: availabilitySlots, error } = await supabase
        .from('service_availability_slots')
        .select('start_time, end_time, is_active')
        .eq('service_product_id', productId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (error) throw error;

      // Générer les créneaux disponibles
      const timeSlots: TimeSlot[] = [];
      availabilitySlots?.forEach(slot => {
        const start = new Date(`2000-01-01T${slot.start_time}`);
        const end = new Date(`2000-01-01T${slot.end_time}`);

        const current = new Date(start);
        while (current < end) {
          const timeStr = current.toTimeString().slice(0, 5);
          timeSlots.push({
            time: timeStr,
            availableSpots: 1, // À améliorer avec vraie vérification
          });

          // Incrémenter de la durée du service ou 30 minutes
          current.setMinutes(current.getMinutes() + (durationMinutes || 30));
        }
      });

      return timeSlots.sort((a, b) => a.time.localeCompare(b.time));
    },
    enabled: !!normalizedServiceProductId && !!date,
  });

  // Vérifier la disponibilité au survol
  const handleSlotHover = async (slot: TimeSlot) => {
    if (!normalizedServiceProductId) return;
    setHoveredSlot(slot.time);

    // Vérification rapide de disponibilité
    try {
      const bookingDate = new Date(date);
      const [hours, minutes] = slot.time.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(bookingDate);
      endDate.setMinutes(endDate.getMinutes() + (durationMinutes || 60));

      // Note: productId attendu est le product_id, pas service_product_id
      // Si on a serviceProductId, il faut récupérer le product_id correspondant
      let productIdForValidation = normalizedServiceProductId;

      // Si c'est un serviceProductId, récupérer le product_id
      if (serviceProductId && !serviceId) {
        const { data: serviceProduct } = await supabase
          .from('service_products')
          .select('product_id')
          .eq('id', serviceProductId)
          .single();

        if (serviceProduct) {
          productIdForValidation = serviceProduct.product_id;
        }
      }

      await quickCheck.mutateAsync({
        productId: productIdForValidation,
        scheduledDate: date.toISOString().split('T')[0],
        scheduledStartTime: bookingDate.toTimeString().slice(0, 8),
        scheduledEndTime: endDate.toTimeString().slice(0, 8),
      });
    } catch {
      // Ignorer les erreurs au survol
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucun créneau disponible pour cette date</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {slots.map(slot => {
        const isSelected = selectedSlot === slot.time;
        const isHovered = hoveredSlot === slot.time;
        const isChecking = quickCheck.isPending && isHovered;
        const isAvailable = quickCheck.data?.available !== false;

        return (
          <Button
            key={slot.time}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSlotSelect(slot)}
            onMouseEnter={() => handleSlotHover(slot)}
            onMouseLeave={() => setHoveredSlot(null)}
            disabled={isChecking}
            className={cn(
              'relative',
              isSelected && 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0',
              !isSelected && 'hover:bg-muted',
              isHovered && isChecking && 'opacity-75'
            )}
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSelected ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : isHovered && !isAvailable ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span className="ml-1">{slot.time}</span>
            {slot.availableSpots !== undefined && slot.availableSpots > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {slot.availableSpots}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};
