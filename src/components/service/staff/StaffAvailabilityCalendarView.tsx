/**
 * Staff Availability Calendar View Component
 * Date: 28 Janvier 2025
 * 
 * Vue calendrier interactive pour visualiser et gérer les disponibilités du staff
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Edit,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StaffAvailabilityCalendarViewProps {
  storeId: string;
  serviceId?: string;
  selectedStaffId?: string;
  onStaffSelect?: (staffId: string | undefined) => void;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  is_active: boolean;
}

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  staff_member_id?: string;
  is_active: boolean;
}

interface TimeOff {
  id: string;
  staff_member_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  time_off_type: string;
}

interface CustomHours {
  id: string;
  staff_member_id: string;
  specific_date?: string;
  day_of_week?: number;
  start_time: string;
  end_time: string;
  is_unavailable: boolean;
  is_active: boolean;
}

export function StaffAvailabilityCalendarView({
  storeId,
  serviceId,
  selectedStaffId,
  onStaffSelect,
}: StaffAvailabilityCalendarViewProps) {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch staff members
  const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff-members-calendar', storeId, serviceId],
    queryFn: async () => {
      let  query= supabase
        .from('service_staff_members')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (serviceId) {
        query = query.eq('service_product_id', serviceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StaffMember[];
    },
    enabled: !!storeId,
  });

  // Fetch availability slots
  const { data: availabilitySlots = [] } = useQuery({
    queryKey: ['availability-slots-calendar', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];

      const { data, error } = await supabase
        .from('service_availability_slots')
        .select('*')
        .eq('service_product_id', serviceId)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []) as AvailabilitySlot[];
    },
    enabled: !!serviceId,
  });

  // Fetch time off
  const { data: timeOffs = [] } = useQuery({
    queryKey: ['staff-time-off-calendar', storeId, selectedStaffId],
    queryFn: async () => {
      let  query= supabase
        .from('staff_time_off')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'approved')
        .order('start_date', { ascending: true });

      if (selectedStaffId) {
        query = query.eq('staff_member_id', selectedStaffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TimeOff[];
    },
    enabled: !!storeId,
  });

  // Fetch custom hours
  const { data: customHours = [] } = useQuery({
    queryKey: ['staff-custom-hours-calendar', storeId, selectedStaffId],
    queryFn: async () => {
      let  query= supabase
        .from('staff_custom_hours')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (selectedStaffId) {
        query = query.eq('staff_member_id', selectedStaffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CustomHours[];
    },
    enabled: !!storeId,
  });

  // Fetch bookings for selected staff member
  const { data: staffBookings = [] } = useQuery({
    queryKey: ['staff-bookings-calendar', storeId, selectedStaffId, currentMonth],
    queryFn: async () => {
      if (!selectedStaffId) return [];

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('service_bookings')
        .select('id, scheduled_date, scheduled_start_time, scheduled_end_time, status, customer_name, service:service_products(product:products(name))')
        .eq('staff_member_id', selectedStaffId)
        .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed', 'in_progress', 'completed'])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_start_time', { ascending: true });

      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        scheduled_date: string;
        scheduled_start_time: string;
        scheduled_end_time: string;
        status: string;
        customer_name?: string;
        service?: { product?: { name?: string } };
      }>;
    },
    enabled: !!selectedStaffId && !!storeId,
  });

  // Calculate availability for each day
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayAvailability = (date: Date) => {
    const dayOfWeek = getDay(date);
    const dateStr = format(date, 'yyyy-MM-dd');

    // Get bookings for this date
    const dayBookings = staffBookings.filter((booking) => booking.scheduled_date === dateStr);

    // Check time off
    const timeOff = timeOffs.find((to) => {
      const start = new Date(to.start_date);
      const end = new Date(to.end_date);
      return date >= start && date <= end;
    });

    if (timeOff) {
      return {
        status: 'unavailable' as const,
        reason: 'Congé',
        type: timeOff.time_off_type,
        bookings: dayBookings,
      };
    }

    // Check custom hours
    const customHour = customHours.find((ch) => {
      if (ch.specific_date) {
        return ch.specific_date === dateStr;
      }
      if (ch.day_of_week !== null && ch.day_of_week !== undefined) {
        return ch.day_of_week === dayOfWeek;
      }
      return false;
    });

    if (customHour) {
      return {
        status: customHour.is_unavailable ? ('unavailable' as const) : ('available' as const),
        reason: customHour.is_unavailable ? 'Indisponible' : 'Disponible (heures personnalisées)',
        startTime: customHour.start_time,
        endTime: customHour.end_time,
        bookings: dayBookings,
      };
    }

    // Check regular availability slots
    const slots = availabilitySlots.filter((slot) => {
      if (selectedStaffId && slot.staff_member_id) {
        return slot.staff_member_id === selectedStaffId && slot.day_of_week === dayOfWeek;
      }
      return slot.day_of_week === dayOfWeek;
    });

    if (slots.length > 0) {
      return {
        status: 'available' as const,
        reason: 'Disponible',
        slots: slots.map((s) => ({
          start: s.start_time,
          end: s.end_time,
        })),
        bookings: dayBookings,
      };
    }

    return {
      status: 'no-schedule' as const,
      reason: 'Aucun horaire',
      bookings: dayBookings,
    };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => (direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)));
  };

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  if (isLoadingStaff) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Staff Selector */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            Sélectionner un membre du staff
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Choisissez un membre du staff pour voir ses disponibilités
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Select
              value={selectedStaffId || 'all'}
              onValueChange={(value) => onStaffSelect?.(value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-full sm:w-[300px] min-h-[44px] h-11 text-sm">
                <SelectValue placeholder="Tous les membres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les membres</SelectItem>
                {staffMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStaffId && (
              <Button
                variant="outline"
                onClick={() => onStaffSelect?.(undefined)}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
              >
                Effacer la sélection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Calendrier des Disponibilités</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
                className="h-9 w-9 sm:h-10 sm:w-10"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
                className="flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm"
                aria-label="Aujourd'hui"
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
                className="h-9 w-9 sm:h-10 sm:w-10"
                aria-label="Mois suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-xs sm:text-sm text-muted-foreground py-1 sm:py-2">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty cells for days before month start */}
            {Array.from({ length: getDay(monthDays[0]) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Month Days */}
            {monthDays.map((date) => {
              const availability = getDayAvailability(date);
              const isToday = isSameDay(date, new Date());
              const isSelected = selectedDate && isSameDay(date, selectedDate);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'aspect-square p-1 sm:p-2 rounded-lg border transition-all hover:shadow-md touch-manipulation',
                    isToday && 'ring-2 ring-primary',
                    isSelected && 'bg-primary/10 border-primary',
                    availability.status === 'available' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                    availability.status === 'unavailable' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                    availability.status === 'no-schedule' && 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                  )}
                >
                  <div className="flex flex-col h-full">
                    <div className={cn(
                      'text-xs sm:text-sm font-semibold',
                      isToday && 'text-primary'
                    )}>
                      {format(date, 'd')}
                    </div>
                    <div className="flex-1 flex items-center justify-center mt-0.5 sm:mt-1">
                      {availability.status === 'available' && (
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                      )}
                      {availability.status === 'unavailable' && (
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                      )}
                      {availability.status === 'no-schedule' && (
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                      )}
                    </div>
                    {/* Show booking count */}
                    {availability.bookings && availability.bookings.length > 0 && (
                      <div className="text-[10px] sm:text-xs font-medium text-primary mt-0.5">
                        {availability.bookings.length} réserv.
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800" />
              <span className="text-xs sm:text-sm">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800" />
              <span className="text-xs sm:text-sm">Indisponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-100 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800" />
              <span className="text-xs sm:text-sm">Aucun horaire</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Détails - {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const availability = getDayAvailability(selectedDate);
              return (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        availability.status === 'available'
                          ? 'default'
                          : availability.status === 'unavailable'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-xs sm:text-sm"
                    >
                      {availability.reason}
                    </Badge>
                  </div>

                  {availability.status === 'available' && availability.slots && (
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium">Horaires disponibles :</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availability.slots.map((slot, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                          >
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              {slot.start} - {slot.end}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {availability.status === 'available' && availability.startTime && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm">
                        {availability.startTime} - {availability.endTime}
                      </span>
                    </div>
                  )}

                  {availability.type && (
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Type : {availability.type}
                    </div>
                  )}

                  {/* Bookings for this day */}
                  {availability.bookings && availability.bookings.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs sm:text-sm font-medium">Réservations ({availability.bookings.length}) :</p>
                      <div className="space-y-1">
                        {availability.bookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-2 bg-muted rounded-lg text-xs sm:text-sm"
                          >
                            <div className="flex-1">
                              <div className="font-medium">
                                {booking.service?.product?.name || 'Service'}
                              </div>
                              <div className="text-muted-foreground">
                                {booking.scheduled_start_time} - {booking.scheduled_end_time}
                              </div>
                              {booking.customer_name && (
                                <div className="text-muted-foreground text-[10px] sm:text-xs">
                                  Client: {booking.customer_name}
                                </div>
                              )}
                            </div>
                            <Badge
                              variant={
                                booking.status === 'confirmed'
                                  ? 'default'
                                  : booking.status === 'in_progress'
                                  ? 'default'
                                  : booking.status === 'completed'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-[10px] sm:text-xs"
                            >
                              {booking.status === 'pending' && 'En attente'}
                              {booking.status === 'confirmed' && 'Confirmé'}
                              {booking.status === 'in_progress' && 'En cours'}
                              {booking.status === 'completed' && 'Terminé'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}







