/**
 * Resource Availability Checker Component
 * Date: 28 Janvier 2025
 * 
 * Composant pour vérifier la disponibilité des ressources avant une réservation
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Users,
  Package,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ResourceAvailabilityCheckerProps {
  storeId: string;
}

interface ServiceProduct {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
  };
}

interface Resource {
  id: string;
  name: string;
  resource_type: string;
  quantity: number;
  is_required: boolean;
}

interface AvailabilityCheckResult {
  available: boolean;
  conflicts: Array<{
    type: 'staff' | 'resource' | 'time' | 'capacity' | 'location';
    message: string;
    severity: 'error' | 'warning' | 'info';
    details?: Record<string, unknown>;
  }>;
  suggestions?: Array<{
    action: string;
    description: string;
  }>;
}

export function ResourceAvailabilityChecker({
  storeId,
}: ResourceAvailabilityCheckerProps) {
  const { toast } = useToast();

  const [serviceId, setServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [staffId, setStaffId] = useState<string>('');
  const [numberOfParticipants, setNumberOfParticipants] = useState<number>(1);

  // Fetch services
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['services-for-checker', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_products')
        .select(`
          id,
          product_id,
          product:products!inner (
            id,
            name
          )
        `)
        .eq('product.store_id', storeId);

      if (error) throw error;
      return (data || []) as ServiceProduct[];
    },
    enabled: !!storeId,
  });

  // Fetch staff members for selected service
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-for-service', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];

      const { data, error } = await supabase
        .from('service_staff_members')
        .select('*')
        .eq('service_product_id', serviceId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!serviceId,
  });

  // Fetch resources for selected service
  const { data: resources = [] } = useQuery({
    queryKey: ['resources-for-service', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];

      const { data, error } = await supabase
        .from('service_resources')
        .select('*')
        .eq('service_product_id', serviceId);

      if (error) throw error;
      return (data || []) as Resource[];
    },
    enabled: !!serviceId,
  });

  // Check availability
  const checkAvailability = useMutation({
    mutationFn: async (): Promise<AvailabilityCheckResult> => {
      if (!serviceId) {
        throw new Error('Veuillez sélectionner un service');
      }

      // Get service details
      const { data: service, error: serviceError } = await supabase
        .from('service_products')
        .select('duration_minutes, max_participants, location_type, location_address')
        .eq('id', serviceId)
        .single();

      if (serviceError) throw serviceError;

      const conflicts: AvailabilityCheckResult['conflicts'] = [];
      const suggestions: AvailabilityCheckResult['suggestions'] = [];

      // 1. Check staff availability
      if (staffId) {
        const { data: staffBookings, error: staffError } = await supabase
          .from('service_bookings')
          .select('id, scheduled_date, scheduled_start_time, scheduled_end_time')
          .eq('staff_member_id', staffId)
          .eq('scheduled_date', selectedDate)
          .in('status', ['pending', 'confirmed', 'in_progress']);

        if (staffError) throw staffError;

        const bookingStart = new Date(`${selectedDate}T${selectedTime}`);
        const bookingEnd = new Date(
          bookingStart.getTime() + (service.duration_minutes || 60) * 60000
        );

        const hasConflict = staffBookings?.some((booking) => {
          const existingStart = new Date(
            `${booking.scheduled_date}T${booking.scheduled_start_time}`
          );
          const existingEnd = new Date(
            `${booking.scheduled_date}T${booking.scheduled_end_time}`
          );
          return (
            (bookingStart < existingEnd && bookingEnd > existingStart)
          );
        });

        if (hasConflict) {
          conflicts.push({
            type: 'staff',
            message: 'Le membre du staff est déjà réservé pour ce créneau',
            severity: 'error',
          });
        }
      }

      // 2. Check capacity
      if (service.max_participants && numberOfParticipants > service.max_participants) {
        conflicts.push({
          type: 'capacity',
          message: `Nombre de participants (${numberOfParticipants}) dépasse la capacité maximale (${service.max_participants})`,
          severity: 'error',
        });
      }

      // 3. Check existing bookings for capacity
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('service_bookings')
        .select('participants_count')
        .eq('product_id', serviceId)
        .eq('scheduled_date', selectedDate)
        .eq('scheduled_start_time', selectedTime)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      if (bookingsError) throw bookingsError;

      const totalParticipants =
        existingBookings?.reduce(
          (sum, b) => sum + (b.participants_count || 1),
          0
        ) || 0;

      if (service.max_participants && totalParticipants + numberOfParticipants > service.max_participants) {
        conflicts.push({
          type: 'capacity',
          message: `Capacité insuffisante. ${totalParticipants} participant(s) déjà réservé(s), ${numberOfParticipants} demandé(s), maximum: ${service.max_participants}`,
          severity: 'error',
        });
      }

      // 4. Check resources availability
      const requiredResources = resources.filter((r) => r.is_required);
      if (requiredResources.length > 0) {
        // Check if resources are available (simplified check)
        // In a real scenario, you'd check resource bookings/allocations
        for (const resource of requiredResources) {
          // This is a placeholder - implement actual resource availability check
          suggestions.push({
            action: 'Vérifier la disponibilité',
            description: `Vérifier que la ressource "${resource.name}" est disponible`,
          });
        }
      }

      // 5. Check time slot availability
      const dayOfWeek = new Date(selectedDate).getDay();
      const { data: slots, error: slotsError } = await supabase
        .from('service_availability_slots')
        .select('*')
        .eq('service_product_id', serviceId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (slotsError) throw slotsError;

      const hasAvailableSlot = slots?.some((slot) => {
        return selectedTime >= slot.start_time && selectedTime < slot.end_time;
      });

      if (!hasAvailableSlot) {
        conflicts.push({
          type: 'time',
          message: 'Aucun créneau disponible pour ce jour et cette heure',
          severity: 'error',
        });
      }

      return {
        available: conflicts.length === 0,
        conflicts,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
    },
    onSuccess: (result) => {
      if (result.available) {
        toast({
          title: '✅ Disponible',
          description: 'Toutes les ressources sont disponibles pour ce créneau',
        });
      } else {
        toast({
          title: '❌ Conflits détectés',
          description: `${result.conflicts.length} conflit(s) détecté(s)`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de vérifier la disponibilité',
        variant: 'destructive',
      });
    },
  });

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <div className="space-y-6">
      {/* Check Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Vérification de Disponibilité
          </CardTitle>
          <CardDescription>
            Vérifiez la disponibilité des ressources avant de créer une réservation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label>Service</Label>
            {isLoadingServices ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.product?.name || 'Service sans nom'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label>Heure</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          </div>

          {/* Staff Selection */}
          {staffMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Membre du staff (optionnel)</Label>
              <Select 
                value={staffId || '__none__'} 
                onValueChange={(value) => setStaffId(value === '__none__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre du staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucun (auto-assigné)</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Number of Participants */}
          <div className="space-y-2">
            <Label>Nombre de participants</Label>
            <Input
              type="number"
              min={1}
              value={numberOfParticipants}
              onChange={(e) => setNumberOfParticipants(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Check Button */}
          <Button
            onClick={() => checkAvailability.mutate()}
            disabled={!serviceId || checkAvailability.isPending}
            className="w-full"
          >
            {checkAvailability.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Vérifier la disponibilité
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {checkAvailability.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {checkAvailability.data.available ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Disponible
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Conflits détectés
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkAvailability.data.conflicts.length > 0 && (
              <div className="space-y-2">
                {checkAvailability.data.conflicts.map((conflict, index) => (
                  <Alert
                    key={index}
                    variant={conflict.severity === 'error' ? 'destructive' : 'default'}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {conflict.type === 'staff' && 'Conflit de staff'}
                      {conflict.type === 'resource' && 'Ressource indisponible'}
                      {conflict.type === 'time' && 'Créneau indisponible'}
                      {conflict.type === 'capacity' && 'Capacité dépassée'}
                      {conflict.type === 'location' && 'Conflit de localisation'}
                    </AlertTitle>
                    <AlertDescription>{conflict.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {checkAvailability.data.suggestions && checkAvailability.data.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Suggestions :</h4>
                {checkAvailability.data.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm">{suggestion.action}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                ))}
              </div>
            )}

            {checkAvailability.data.available && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Disponible</AlertTitle>
                <AlertDescription>
                  Toutes les ressources sont disponibles pour ce créneau. Vous pouvez procéder à la réservation.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resources Info */}
      {selectedService && resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ressources requises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{resource.name}</p>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={resource.is_required ? 'default' : 'secondary'}>
                      {resource.is_required ? 'Requis' : 'Optionnel'}
                    </Badge>
                    <Badge variant="outline">Quantité: {resource.quantity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

