/**
 * Resource Conflict Detector Component
 * Date: 30 Janvier 2025
 * 
 * Composant pour détecter automatiquement les conflits de ressources
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ResourceConflictDetectorProps {
  storeId: string;
  autoDetect?: boolean;
  onConflictResolved?: (conflictId: string) => void;
}

interface ResourceConflict {
  id: string;
  store_id: string;
  conflict_type: 'staff_double_booking' | 'resource_unavailable' | 'time_overlap' | 'capacity_exceeded' | 'location_conflict';
  booking_ids: string[];
  conflict_date: string;
  conflict_start_time: string;
  conflict_end_time: string;
  staff_member_ids?: string[];
  resource_ids?: string[];
  status: 'detected' | 'resolved' | 'ignored';
  resolution_method?: string;
  resolved_by?: string;
  resolved_at?: string;
  suggested_resolutions?: Array<{
    action: string;
    booking_id?: string;
    staff_id?: string;
    new_time?: string;
    new_date?: string;
  }>;
  metadata?: Record<string, unknown>;
}

interface Booking {
  id: string;
  product_id: string;
  user_id: string;
  staff_member_id?: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  status: string;
  customer_notes?: string;
}

export const ResourceConflictDetector = ({
  storeId,
  autoDetect = true,
  onConflictResolved,
}: ResourceConflictDetectorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConflict, setSelectedConflict] = useState<ResourceConflict | null>(null);
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Fetch conflicts
  const { data: conflicts = [], isLoading, refetch } = useQuery({
    queryKey: ['resource-conflicts', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resource_conflicts')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'detected')
        .order('conflict_date', { ascending: true })
        .order('conflict_start_time', { ascending: true });

      if (error) throw error;
      return (data || []) as ResourceConflict[];
    },
    enabled: !!storeId,
    refetchInterval: autoDetect ? 30000 : false, // Auto-refresh every 30 seconds if autoDetect is enabled
  });

  // Fetch bookings for conflicts
  const { data: bookings = [] } = useQuery({
    queryKey: ['conflict-bookings', conflicts.map(c => c.booking_ids).flat()],
    queryFn: async () => {
      if (conflicts.length === 0) return [];

      const allBookingIds = [...new Set(conflicts.flatMap(c => c.booking_ids))];
      
      const { data, error } = await supabase
        .from('service_bookings')
        .select('*')
        .in('id', allBookingIds);

      if (error) throw error;
      return (data || []) as Booking[];
    },
    enabled: conflicts.length > 0,
  });

  // Fetch staff members
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-members', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_staff_members')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId,
  });

  // Detect conflicts
  const detectConflicts = useMutation({
    mutationFn: async () => {
      setIsDetecting(true);
      const { data, error } = await supabase.rpc('detect_resource_conflicts', {
        p_store_id: storeId,
        p_start_date: new Date().toISOString().split('T')[0],
        p_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['resource-conflicts'] });
      toast({
        title: '✅ Détection terminée',
        description: `${count} conflit(s) détecté(s)`,
      });
      setIsDetecting(false);
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de détecter les conflits',
        variant: 'destructive',
      });
      setIsDetecting(false);
    },
  });

  // Resolve conflict
  const resolveConflict = useMutation({
    mutationFn: async ({
      conflictId,
      resolutionMethod,
    }: {
      conflictId: string;
      resolutionMethod: string;
    }) => {
      const { data, error } = await supabase
        .from('resource_conflicts')
        .update({
          status: 'resolved',
          resolution_method: resolutionMethod,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conflictId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resource-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsResolutionDialogOpen(false);
      setSelectedConflict(null);
      onConflictResolved?.(data.id);
      toast({
        title: '✅ Conflit résolu',
        description: 'Le conflit a été marqué comme résolu',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de résoudre le conflit',
        variant: 'destructive',
      });
    },
  });

  // Ignore conflict
  const ignoreConflict = useMutation({
    mutationFn: async (conflictId: string) => {
      const { data, error } = await supabase
        .from('resource_conflicts')
        .update({
          status: 'ignored',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conflictId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-conflicts'] });
      toast({
        title: '✅ Conflit ignoré',
        description: 'Le conflit a été ignoré',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible d\'ignorer le conflit',
        variant: 'destructive',
      });
    },
  });

  // Auto-detect on mount if enabled
  useEffect(() => {
    if (autoDetect && storeId && !isDetecting) {
      detectConflicts.mutate();
    }
  }, [autoDetect, storeId]);

  const conflictTypeLabels: Record<ResourceConflict['conflict_type'], string> = {
    staff_double_booking: 'Double réservation staff',
    resource_unavailable: 'Ressource indisponible',
    time_overlap: 'Chevauchement temporel',
    capacity_exceeded: 'Capacité dépassée',
    location_conflict: 'Conflit de localisation',
  };

  const conflictTypeColors: Record<ResourceConflict['conflict_type'], string> = {
    staff_double_booking: 'bg-red-100 text-red-800',
    resource_unavailable: 'bg-orange-100 text-orange-800',
    time_overlap: 'bg-yellow-100 text-yellow-800',
    capacity_exceeded: 'bg-purple-100 text-purple-800',
    location_conflict: 'bg-blue-100 text-blue-800',
  };

  const getConflictBookings = (conflict: ResourceConflict) => {
    return bookings.filter(b => conflict.booking_ids.includes(b.id));
  };

  const getStaffMember = (staffId?: string) => {
    if (!staffId) return null;
    return staffMembers.find(s => s.id === staffId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Détection de Conflits
              </CardTitle>
              <CardDescription>
                Conflits de ressources détectés automatiquement
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => detectConflicts.mutate()}
                disabled={isDetecting}
              >
                {isDetecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Détecter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {conflicts.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Aucun conflit détecté</AlertTitle>
              <AlertDescription>
                Toutes les réservations sont compatibles. Aucun conflit de ressources détecté.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conflict) => {
                const conflictBookings = getConflictBookings(conflict);
                const primaryStaff = conflict.staff_member_ids?.[0]
                  ? getStaffMember(conflict.staff_member_ids[0])
                  : null;

                return (
                  <div
                    key={conflict.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={conflictTypeColors[conflict.conflict_type]}>
                            {conflictTypeLabels[conflict.conflict_type]}
                          </Badge>
                          {primaryStaff && (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              {primaryStaff.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(conflict.conflict_date), 'dd MMM yyyy', { locale: fr })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {conflict.conflict_start_time} - {conflict.conflict_end_time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedConflict(conflict);
                            setIsResolutionDialogOpen(true);
                          }}
                        >
                          Résoudre
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => ignoreConflict.mutate(conflict.id)}
                        >
                          Ignorer
                        </Button>
                      </div>
                    </div>

                    {/* Bookings in conflict */}
                    {conflictBookings.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Réservations en conflit :</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {conflictBookings.map((booking) => {
                            const bookingStaff = booking.staff_member_id
                              ? getStaffMember(booking.staff_member_id)
                              : null;

                            return (
                              <div
                                key={booking.id}
                                className="flex items-center gap-2 p-2 bg-muted rounded text-sm"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">Réservation #{booking.id.slice(0, 8)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(booking.scheduled_date), 'dd MMM yyyy', { locale: fr })} •{' '}
                                    {booking.scheduled_start_time} - {booking.scheduled_end_time}
                                  </div>
                                  {bookingStaff && (
                                    <div className="text-xs text-muted-foreground">
                                      Staff: {bookingStaff.name}
                                    </div>
                                  )}
                                </div>
                                <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'}>
                                  {booking.status}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Suggested resolutions */}
                    {conflict.suggested_resolutions && conflict.suggested_resolutions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          Suggestions de résolution :
                        </div>
                        <div className="space-y-1">
                          {conflict.suggested_resolutions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm"
                            >
                              <ArrowRight className="h-4 w-4 text-yellow-600" />
                              <span>
                                {suggestion.action === 'reschedule' && suggestion.booking_id && (
                                  <>Replanifier la réservation #{suggestion.booking_id.slice(0, 8)}</>
                                )}
                                {suggestion.action === 'assign_different_staff' && suggestion.staff_id && (
                                  <>Assigner un autre staff</>
                                )}
                                {suggestion.new_time && (
                                  <> à {suggestion.new_time}</>
                                )}
                                {suggestion.new_date && (
                                  <> le {format(new Date(suggestion.new_date), 'dd MMM yyyy', { locale: fr })}</>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={isResolutionDialogOpen} onOpenChange={setIsResolutionDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Résoudre le conflit</DialogTitle>
            <DialogDescription>
              Choisissez une méthode de résolution pour ce conflit
            </DialogDescription>
          </DialogHeader>
          {selectedConflict && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Type de conflit :</div>
                <Badge className={conflictTypeColors[selectedConflict.conflict_type]}>
                  {conflictTypeLabels[selectedConflict.conflict_type]}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Réservations concernées :</div>
                <div className="space-y-2">
                  {getConflictBookings(selectedConflict).map((booking) => (
                    <div
                      key={booking.id}
                      className="p-2 bg-muted rounded text-sm"
                    >
                      Réservation #{booking.id.slice(0, 8)} •{' '}
                      {format(new Date(booking.scheduled_date), 'dd MMM yyyy', { locale: fr })} •{' '}
                      {booking.scheduled_start_time} - {booking.scheduled_end_time}
                    </div>
                  ))}
                </div>
              </div>
              {selectedConflict.suggested_resolutions && selectedConflict.suggested_resolutions.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Suggestions :</div>
                  <div className="space-y-1">
                    {selectedConflict.suggested_resolutions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-2 bg-yellow-50 rounded text-sm"
                      >
                        {suggestion.action === 'reschedule' && suggestion.booking_id && (
                          <>Replanifier la réservation #{suggestion.booking_id.slice(0, 8)}</>
                        )}
                        {suggestion.action === 'assign_different_staff' && suggestion.staff_id && (
                          <>Assigner un autre staff</>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolutionDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (selectedConflict) {
                  resolveConflict.mutate({
                    conflictId: selectedConflict.id,
                    resolutionMethod: 'manual',
                  });
                }
              }}
            >
              Marquer comme résolu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

