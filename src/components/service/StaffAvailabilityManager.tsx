/**
 * Staff Availability Manager Component
 * Date: 30 Janvier 2025
 * 
 * Composant pour gérer la disponibilité du staff (congés, heures personnalisées, alertes)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { StaffMember } from '@/hooks/service/useAvailability';

interface StaffAvailabilityManagerProps {
  storeId: string;
  staffMemberId?: string;
}

interface TimeOff {
  id: string;
  staff_member_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  time_off_type: 'vacation' | 'sick' | 'personal' | 'holiday' | 'training' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string;
  auto_block_bookings: boolean;
}

interface CustomHours {
  id: string;
  staff_member_id: string;
  specific_date?: string;
  day_of_week?: number;
  start_time: string;
  end_time: string;
  is_override: boolean;
  is_unavailable: boolean;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
}

interface SuggestedAction {
  action: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  estimated_impact?: string;
}

interface WorkloadAlert {
  id: string;
  staff_member_id: string;
  alert_date: string;
  alert_period_start?: string;
  alert_period_end?: string;
  current_bookings_count: number;
  max_recommended_bookings: number;
  booking_density_percentage: number;
  alert_level: 'info' | 'warning' | 'critical';
  is_resolved: boolean;
  suggested_actions?: SuggestedAction[];
}

export const StaffAvailabilityManager = ({
  storeId,
  staffMemberId,
}: StaffAvailabilityManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTimeOffDialogOpen, setIsTimeOffDialogOpen] = useState(false);
  const [isCustomHoursDialogOpen, setIsCustomHoursDialogOpen] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<TimeOff | null>(null);
  const [selectedCustomHours, setSelectedCustomHours] = useState<CustomHours | null>(null);

  // Fetch staff members
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-members', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_staff_members')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId,
  });

  // Fetch time off
  const { data: timeOffs = [] } = useQuery({
    queryKey: ['staff-time-off', storeId, staffMemberId],
    queryFn: async () => {
      let query = supabase
        .from('staff_time_off')
        .select('*')
        .eq('store_id', storeId)
        .order('start_date', { ascending: false });

      if (staffMemberId) {
        query = query.eq('staff_member_id', staffMemberId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as TimeOff[];
    },
    enabled: !!storeId,
  });

  // Fetch custom hours
  const { data: customHours = [] } = useQuery({
    queryKey: ['staff-custom-hours', storeId, staffMemberId],
    queryFn: async () => {
      let query = supabase
        .from('staff_custom_hours')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (staffMemberId) {
        query = query.eq('staff_member_id', staffMemberId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as CustomHours[];
    },
    enabled: !!storeId,
  });

  // Fetch workload alerts
  const { data: workloadAlerts = [] } = useQuery({
    queryKey: ['staff-workload-alerts', storeId, staffMemberId],
    queryFn: async () => {
      let query = supabase
        .from('staff_workload_alerts')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_resolved', false)
        .order('alert_date', { ascending: true });

      if (staffMemberId) {
        query = query.eq('staff_member_id', staffMemberId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as WorkloadAlert[];
    },
    enabled: !!storeId,
  });

  // Create/Update time off
  const createTimeOff = useMutation({
    mutationFn: async (timeOff: Partial<TimeOff>) => {
      const { data, error } = await supabase
        .from('staff_time_off')
        .insert([{
          ...timeOff,
          store_id: storeId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-time-off'] });
      setIsTimeOffDialogOpen(false);
      setSelectedTimeOff(null);
      toast({
        title: '✅ Congé créé',
        description: 'Le congé a été créé avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de créer le congé',
        variant: 'destructive',
      });
    },
  });

  // Update time off status
  const updateTimeOffStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: TimeOff['status'];
    }) => {
      const { data, error } = await supabase
        .from('staff_time_off')
        .update({
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-time-off'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut du congé a été mis à jour',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });

  // Create/Update custom hours
  const createCustomHours = useMutation({
    mutationFn: async (customHours: Partial<CustomHours>) => {
      const { data, error } = await supabase
        .from('staff_custom_hours')
        .insert([{
          ...customHours,
          store_id: storeId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-custom-hours'] });
      setIsCustomHoursDialogOpen(false);
      setSelectedCustomHours(null);
      toast({
        title: '✅ Heures personnalisées créées',
        description: 'Les heures personnalisées ont été créées avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de créer les heures personnalisées',
        variant: 'destructive',
      });
    },
  });

  // Resolve workload alert
  const resolveWorkloadAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('staff_workload_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-workload-alerts'] });
      toast({
        title: '✅ Alerte résolue',
        description: 'L\'alerte de surcharge a été marquée comme résolue',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de résoudre l\'alerte',
        variant: 'destructive',
      });
    },
  });

  const timeOffTypeLabels: Record<TimeOff['time_off_type'], string> = {
    vacation: 'Vacances',
    sick: 'Maladie',
    personal: 'Personnel',
    holiday: 'Jour férié',
    training: 'Formation',
    other: 'Autre',
  };

  const statusColors: Record<TimeOff['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const alertLevelColors: Record<WorkloadAlert['alert_level'], string> = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="time-off" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="time-off">
            <Calendar className="h-4 w-4 mr-2" />
            Congés
          </TabsTrigger>
          <TabsTrigger value="custom-hours">
            <Clock className="h-4 w-4 mr-2" />
            Heures personnalisées
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertes ({workloadAlerts.length})
          </TabsTrigger>
        </TabsList>

        {/* Time Off Tab */}
        <TabsContent value="time-off" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Congés du Staff</CardTitle>
                  <CardDescription>
                    Gérez les congés et absences du personnel
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setSelectedTimeOff(null);
                  setIsTimeOffDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un congé
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {timeOffs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun congé enregistré
                </div>
              ) : (
                <div className="space-y-4">
                  {timeOffs.map((timeOff) => {
                    const staffMember = staffMembers.find(s => s.id === timeOff.staff_member_id);
                    return (
                      <div
                        key={timeOff.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{staffMember?.name || 'Staff'}</span>
                            <Badge className={statusColors[timeOff.status]}>
                              {timeOff.status}
                            </Badge>
                            <Badge variant="outline">
                              {timeOffTypeLabels[timeOff.time_off_type]}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(timeOff.start_date), 'dd MMM yyyy', { locale: fr })} -{' '}
                            {format(new Date(timeOff.end_date), 'dd MMM yyyy', { locale: fr })}
                            {timeOff.start_time && timeOff.end_time && (
                              <> • {timeOff.start_time} - {timeOff.end_time}</>
                            )}
                          </div>
                          {timeOff.reason && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {timeOff.reason}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {timeOff.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTimeOffStatus.mutate({
                                  id: timeOff.id,
                                  status: 'approved',
                                })}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTimeOffStatus.mutate({
                                  id: timeOff.id,
                                  status: 'rejected',
                                })}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTimeOff(timeOff);
                              setIsTimeOffDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Hours Tab */}
        <TabsContent value="custom-hours" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Heures Personnalisées</CardTitle>
                  <CardDescription>
                    Définissez des heures de travail personnalisées pour le staff
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setSelectedCustomHours(null);
                  setIsCustomHoursDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter des heures
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customHours.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune heure personnalisée définie
                </div>
              ) : (
                <div className="space-y-4">
                  {customHours.map((customHour) => {
                    const staffMember = staffMembers.find(s => s.id === customHour.staff_member_id);
                    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                    return (
                      <div
                        key={customHour.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{staffMember?.name || 'Staff'}</span>
                            <Badge variant={customHour.is_unavailable ? 'destructive' : 'default'}>
                              {customHour.is_unavailable ? 'Indisponible' : 'Disponible'}
                            </Badge>
                            {!customHour.is_active && (
                              <Badge variant="outline">Inactif</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customHour.specific_date
                              ? format(new Date(customHour.specific_date), 'dd MMM yyyy', { locale: fr })
                              : customHour.day_of_week !== null && customHour.day_of_week !== undefined
                              ? dayNames[customHour.day_of_week]
                              : 'Tous les jours'}
                            {' • '}
                            {customHour.start_time} - {customHour.end_time}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCustomHours(customHour);
                            setIsCustomHoursDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Surcharge</CardTitle>
              <CardDescription>
                Alertes automatiques lorsque le staff est surchargé
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workloadAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune alerte de surcharge
                </div>
              ) : (
                <div className="space-y-4">
                  {workloadAlerts.map((alert) => {
                    const staffMember = staffMembers.find(s => s.id === alert.staff_member_id);
                    return (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{staffMember?.name || 'Staff'}</span>
                            <Badge className={alertLevelColors[alert.alert_level]}>
                              {alert.alert_level}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(alert.alert_date), 'dd MMM yyyy', { locale: fr })}
                            {alert.alert_period_start && alert.alert_period_end && (
                              <> • {alert.alert_period_start} - {alert.alert_period_end}</>
                            )}
                          </div>
                          <div className="text-sm mt-1">
                            <span className="font-medium">{alert.current_bookings_count}</span> réservations •{' '}
                            <span className="font-medium">{alert.booking_density_percentage}%</span> de charge
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveWorkloadAlert.mutate(alert.id)}
                        >
                          Résoudre
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Time Off Dialog */}
      <Dialog open={isTimeOffDialogOpen} onOpenChange={setIsTimeOffDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTimeOff ? 'Modifier le congé' : 'Ajouter un congé'}
            </DialogTitle>
            <DialogDescription>
              Définissez les détails du congé pour le staff
            </DialogDescription>
          </DialogHeader>
          <TimeOffForm
            storeId={storeId}
            staffMembers={staffMembers}
            timeOff={selectedTimeOff}
            onSubmit={(data) => {
              if (selectedTimeOff) {
                // Update logic here
                createTimeOff.mutate(data);
              } else {
                createTimeOff.mutate(data);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Custom Hours Dialog */}
      <Dialog open={isCustomHoursDialogOpen} onOpenChange={setIsCustomHoursDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomHours ? 'Modifier les heures' : 'Ajouter des heures personnalisées'}
            </DialogTitle>
            <DialogDescription>
              Définissez des heures de travail personnalisées
            </DialogDescription>
          </DialogHeader>
          <CustomHoursForm
            storeId={storeId}
            staffMembers={staffMembers}
            customHours={selectedCustomHours}
            onSubmit={(data) => {
              if (selectedCustomHours) {
                // Update logic here
                createCustomHours.mutate(data);
              } else {
                createCustomHours.mutate(data);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Time Off Form Component
const TimeOffForm = ({
  storeId,
  staffMembers,
  timeOff,
  onSubmit,
}: {
  storeId: string;
  staffMembers: StaffMember[];
  timeOff: TimeOff | null;
  onSubmit: (data: Partial<TimeOff>) => void;
}) => {
  const [formData, setFormData] = useState<Partial<TimeOff>>({
    staff_member_id: timeOff?.staff_member_id || '',
    start_date: timeOff?.start_date || '',
    end_date: timeOff?.end_date || '',
    start_time: timeOff?.start_time || '',
    end_time: timeOff?.end_time || '',
    time_off_type: timeOff?.time_off_type || 'vacation',
    reason: timeOff?.reason || '',
    auto_block_bookings: timeOff?.auto_block_bookings ?? true,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Staff</Label>
          <Select
            value={formData.staff_member_id}
            onValueChange={(value) => setFormData({ ...formData, staff_member_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un staff" />
            </SelectTrigger>
            <SelectContent>
              {staffMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type de congé</Label>
          <Select
            value={formData.time_off_type}
            onValueChange={(value) => setFormData({ ...formData, time_off_type: value as TimeOff['time_off_type'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacation">Vacances</SelectItem>
              <SelectItem value="sick">Maladie</SelectItem>
              <SelectItem value="personal">Personnel</SelectItem>
              <SelectItem value="holiday">Jour férié</SelectItem>
              <SelectItem value="training">Formation</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date de début</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div>
          <Label>Date de fin</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Heure de début (optionnel)</Label>
          <Input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        <div>
          <Label>Heure de fin (optionnel)</Label>
          <Input
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Raison (optionnel)</Label>
        <Input
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Raison du congé"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => {}}>
          Annuler
        </Button>
        <Button onClick={() => onSubmit(formData)}>
          {timeOff ? 'Modifier' : 'Créer'}
        </Button>
      </DialogFooter>
    </div>
  );
};

// Custom Hours Form Component
const CustomHoursForm = ({
  storeId,
  staffMembers,
  customHours,
  onSubmit,
}: {
  storeId: string;
  staffMembers: StaffMember[];
  customHours: CustomHours | null;
  onSubmit: (data: Partial<CustomHours>) => void;
}) => {
  const [formData, setFormData] = useState<Partial<CustomHours>>({
    staff_member_id: customHours?.staff_member_id || '',
    specific_date: customHours?.specific_date || '',
    day_of_week: customHours?.day_of_week,
    start_time: customHours?.start_time || '',
    end_time: customHours?.end_time || '',
    is_override: customHours?.is_override ?? false,
    is_unavailable: customHours?.is_unavailable ?? false,
    valid_from: customHours?.valid_from || '',
    valid_until: customHours?.valid_until || '',
    is_active: customHours?.is_active ?? true,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Staff</Label>
          <Select
            value={formData.staff_member_id}
            onValueChange={(value) => setFormData({ ...formData, staff_member_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un staff" />
            </SelectTrigger>
            <SelectContent>
              {staffMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={formData.specific_date ? 'specific' : formData.day_of_week !== null && formData.day_of_week !== undefined ? 'recurring' : ''}
            onValueChange={(value) => {
              if (value === 'specific') {
                setFormData({ ...formData, specific_date: '', day_of_week: undefined });
              } else {
                setFormData({ ...formData, specific_date: '', day_of_week: 0 });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="specific">Date spécifique</SelectItem>
              <SelectItem value="recurring">Récurrent (jour de la semaine)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {formData.specific_date !== undefined && (
        <div>
          <Label>Date spécifique</Label>
          <Input
            type="date"
            value={formData.specific_date}
            onChange={(e) => setFormData({ ...formData, specific_date: e.target.value })}
          />
        </div>
      )}
      {formData.day_of_week !== undefined && formData.day_of_week !== null && (
        <div>
          <Label>Jour de la semaine</Label>
          <Select
            value={formData.day_of_week?.toString()}
            onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Dimanche</SelectItem>
              <SelectItem value="1">Lundi</SelectItem>
              <SelectItem value="2">Mardi</SelectItem>
              <SelectItem value="3">Mercredi</SelectItem>
              <SelectItem value="4">Jeudi</SelectItem>
              <SelectItem value="5">Vendredi</SelectItem>
              <SelectItem value="6">Samedi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Heure de début</Label>
          <Input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        <div>
          <Label>Heure de fin</Label>
          <Input
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Disponibilité</Label>
          <Select
            value={formData.is_unavailable ? 'unavailable' : 'available'}
            onValueChange={(value) => setFormData({ ...formData, is_unavailable: value === 'unavailable' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="unavailable">Indisponible</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valide à partir de</Label>
          <Input
            type="date"
            value={formData.valid_from}
            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => {}}>
          Annuler
        </Button>
        <Button onClick={() => onSubmit(formData)}>
          {customHours ? 'Modifier' : 'Créer'}
        </Button>
      </DialogFooter>
    </div>
  );
};

