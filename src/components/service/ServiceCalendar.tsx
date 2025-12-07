/**
 * Service Calendar Component - Enhanced Professional Version
 * Date: 28 Janvier 2025
 * 
 * Calendrier professionnel avec codes couleur pour disponibilités
 * Amélioré avec affichage visuel des disponibilités par jour
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfToday, isAfter, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ServiceCalendarProps {
  serviceId?: string;
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
}

interface DayAvailability {
  date: Date;
  hasSlots: boolean;
  availableSlots: number;
  totalSlots: number;
  status: 'available' | 'limited' | 'full' | 'unavailable';
}

export const ServiceCalendar = ({
  serviceId,
  selectedDate,
  onDateSelect,
  minDate = startOfToday(),
  maxDate,
  disabledDates = [],
}: ServiceCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch service product ID if serviceId is provided
  const { data: serviceProduct } = useQuery({
    queryKey: ['service-product', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const { data, error } = await supabase
        .from('service_products')
        .select('id')
        .eq('product_id', serviceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });

  // Fetch availability for all days in current month
  const { data: monthAvailability, isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['month-availability', serviceProduct?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      if (!serviceProduct?.id) return {};

      const availabilityMap: Record<string, DayAvailability> = {};

      // Get all availability slots for this service
      const { data: slots, error: slotsError } = await supabase
        .from('service_availability_slots')
        .select('*')
        .eq('service_product_id', serviceProduct.id)
        .eq('is_active', true);

      if (slotsError) throw slotsError;

      // Get service info
      const { data: service, error: serviceError } = await supabase
        .from('service_products')
        .select('duration_minutes, max_participants')
        .eq('id', serviceProduct.id)
        .single();

      if (serviceError) throw serviceError;

      // For each day in the month, check availability
      for (const day of days) {
        if (isBefore(day, minDate)) continue;
        if (maxDate && isAfter(day, maxDate)) continue;

        const dayOfWeek = day.getDay();
        const daySlots = slots?.filter(s => s.day_of_week === dayOfWeek) || [];

        if (daySlots.length === 0) {
          availabilityMap[format(day, 'yyyy-MM-dd')] = {
            date: day,
            hasSlots: false,
            availableSlots: 0,
            totalSlots: 0,
            status: 'unavailable',
          };
          continue;
        }

        // Get bookings for this date
        const dateStr = format(day, 'yyyy-MM-dd');
        const { data: bookings } = await supabase
          .from('service_bookings')
          .select(`
            id,
            scheduled_start_time,
            scheduled_date
          `)
          .eq('product_id', serviceId!)
          .eq('scheduled_date', dateStr)
          .in('status', ['pending', 'confirmed']);

        // Get participant counts for each booking
        const bookingIds = bookings?.map(b => b.id) || [];
        const { data: participants } = bookingIds.length > 0 ? await supabase
          .from('service_booking_participants')
          .select('booking_id')
          .in('booking_id', bookingIds) : { data: [] };
        
        const participantCounts: Record<string, number> = {};
        participants?.forEach(p => {
          participantCounts[p.booking_id] = (participantCounts[p.booking_id] || 0) + 1;
        });

        // Calculate total available slots
        let totalSlots = 0;
        let availableSlots = 0;

        daySlots.forEach((slot) => {
          const duration = service?.duration_minutes || 60;
          let currentTime = slot.start_time;
          const endTime = slot.end_time;

          while (currentTime < endTime) {
            totalSlots++;
            // Check if there's a booking at this time and count participants
            const bookingsAtThisTime = bookings?.filter((b) => {
              const bookingTime = b.scheduled_start_time?.substring(0, 5) || '';
              return bookingTime === currentTime.substring(0, 5);
            }) || [];
            
            // Count total participants for this time slot
            const participantsAtThisTime = bookingsAtThisTime.reduce((sum, b) => {
              return sum + (participantCounts[b.id] || 1); // Default to 1 if no participants found
            }, 0);

            const maxParticipants = service?.max_participants || 1;
            const spots = maxParticipants - participantsAtThisTime;
            if (spots > 0) availableSlots++;

            // Increment time
            const [hours, minutes] = currentTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + duration;
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            currentTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:00`;
          }
        });

        // Determine status
        let status: DayAvailability['status'] = 'unavailable';
        if (availableSlots === 0) {
          status = 'full';
        } else if (availableSlots <= totalSlots * 0.3) {
          status = 'limited';
        } else if (availableSlots > 0) {
          status = 'available';
        }

        availabilityMap[dateStr] = {
          date: day,
          hasSlots: totalSlots > 0,
          availableSlots,
          totalSlots,
          status,
        };
      }

      return availabilityMap;
    },
    enabled: !!serviceProduct?.id,
  });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, minDate)) return true;
    if (maxDate && isAfter(maxDate, date)) return true;
    if (disabledDates.some(d => isSameDay(d, date))) return true;
    
    // Disable if no availability
    if (monthAvailability) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayAvail = monthAvailability[dateStr];
      if (dayAvail && dayAvail.status === 'unavailable') return true;
    }
    
    return false;
  };

  const getDayStatus = (date: Date): DayAvailability['status'] | null => {
    if (!monthAvailability) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return monthAvailability[dateStr]?.status || null;
  };

  const getDayAvailability = (date: Date): DayAvailability | null => {
    if (!monthAvailability) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return monthAvailability[dateStr] || null;
  };

  // Get the starting day of week for the month (0 = Sunday, 1 = Monday, etc.)
  const startDay = monthStart.getDay();
  
  // Days of week labels starting with Monday
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  // Adjust days array to start from Monday
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: adjustedStartDay }).map((_, index) => (
            <div key={`empty-${index}`} />
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            const disabled = isDateDisabled(day);
            const dayStatus = getDayStatus(day);
            const dayAvail = getDayAvailability(day);

            // Determine color based on status
            const getStatusColor = () => {
              if (isSelected) return 'bg-primary text-primary-foreground';
              if (disabled) return 'opacity-30 cursor-not-allowed bg-muted';
              
              switch (dayStatus) {
                case 'available':
                  return 'bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900 border-green-200 dark:border-green-800';
                case 'limited':
                  return 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900 border-orange-200 dark:border-orange-800';
                case 'full':
                  return 'bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900 border-red-200 dark:border-red-800 opacity-60';
                case 'unavailable':
                  return 'bg-muted opacity-40 cursor-not-allowed';
                default:
                  return '';
              }
            };

            return (
              <div
                key={day.toISOString()}
                className="relative"
              >
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'h-14 w-full p-0 font-normal flex-col items-center justify-center gap-1 relative',
                    isCurrentDay && !isSelected && 'border-2 border-primary',
                    getStatusColor(),
                    disabled && 'cursor-not-allowed'
                  )}
                  onClick={() => !disabled && onDateSelect(day)}
                  disabled={disabled}
                >
                  <time dateTime={format(day, 'yyyy-MM-dd')} className="text-sm font-medium">
                    {format(day, 'd')}
                  </time>
                  
                  {/* Availability indicator */}
                  {dayAvail && dayAvail.hasSlots && !disabled && (
                    <div className="flex items-center gap-1 text-[10px]">
                      {dayStatus === 'available' && (
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                      )}
                      {dayStatus === 'limited' && (
                        <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                      )}
                      {dayStatus === 'full' && (
                        <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      )}
                      {dayAvail.availableSlots > 0 && (
                        <span className="text-[10px] font-semibold">
                          {dayAvail.availableSlots}
                        </span>
                      )}
                    </div>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Loading state */}
        {isLoadingAvailability && (
          <div className="mt-4">
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded border-2 border-primary" />
            <span>Aujourd'hui</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-primary" />
            <span>Sélectionné</span>
          </div>
          {serviceId && (
            <>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700" />
                <span>Limite</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 opacity-60" />
                <span>Complet</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCalendar;

