/**
 * Staff Availability Settings Component
 * Date: 28 Janvier 2025
 * 
 * Paramètres de disponibilité du staff
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Save, Loader2 } from '@/components/icons';
import {
  useStaffAvailabilitySettings,
  useUpdateStaffAvailabilitySettings,
  type StaffAvailabilitySettings as SettingsType,
} from '@/hooks/service/useStaffAvailabilitySettings';

interface StaffAvailabilitySettingsProps {
  storeId: string;
  serviceId?: string;
}

export function StaffAvailabilitySettings({
  storeId,
  serviceId,
}: StaffAvailabilitySettingsProps) {
  // Charger les paramètres depuis la base de données
  const { data: settings, isLoading } = useStaffAvailabilitySettings(storeId, serviceId);
  const updateSettingsMutation = useUpdateStaffAvailabilitySettings();

  // État local pour les modifications (avant sauvegarde)
  const [localSettings, setLocalSettings] = useState<Partial<SettingsType>>({});

  // Initialiser localSettings avec les données chargées
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        auto_block_on_time_off: settings.auto_block_on_time_off,
        max_bookings_per_day: settings.max_bookings_per_day,
        booking_density_warning_threshold: settings.booking_density_warning_threshold,
        booking_density_critical_threshold: settings.booking_density_critical_threshold,
        default_work_hours_start: settings.default_work_hours_start,
        default_work_hours_end: settings.default_work_hours_end,
        buffer_time_between_bookings: settings.buffer_time_between_bookings,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settings) return;

    updateSettingsMutation.mutate({
      store_id: storeId,
      service_id: serviceId,
      ...localSettings,
    });
  };

  // Utiliser les settings locaux ou les settings chargés
  const currentSettings = {
    autoBlockOnTimeOff: localSettings.auto_block_on_time_off ?? settings?.auto_block_on_time_off ?? true,
    maxBookingsPerDay: localSettings.max_bookings_per_day ?? settings?.max_bookings_per_day ?? 8,
    bookingDensityWarningThreshold: localSettings.booking_density_warning_threshold ?? settings?.booking_density_warning_threshold ?? 70,
    bookingDensityCriticalThreshold: localSettings.booking_density_critical_threshold ?? settings?.booking_density_critical_threshold ?? 85,
    defaultWorkHoursStart: localSettings.default_work_hours_start ?? settings?.default_work_hours_start ?? '09:00',
    defaultWorkHoursEnd: localSettings.default_work_hours_end ?? settings?.default_work_hours_end ?? '18:00',
    bufferTimeBetweenBookings: localSettings.buffer_time_between_bookings ?? settings?.buffer_time_between_bookings ?? 15,
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de Disponibilité
          </CardTitle>
          <CardDescription>
            Configurez les paramètres par défaut pour la gestion des disponibilités
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-block on time off */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bloquer automatiquement les réservations en congé</Label>
              <p className="text-sm text-muted-foreground">
                Les réservations seront automatiquement bloquées pendant les congés approuvés
              </p>
            </div>
            <Switch
              checked={currentSettings.autoBlockOnTimeOff}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, auto_block_on_time_off: checked })
              }
            />
          </div>

          {/* Max bookings per day */}
          <div className="space-y-2">
            <Label>Nombre maximum de réservations par jour</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={currentSettings.maxBookingsPerDay}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  max_bookings_per_day: parseInt(e.target.value) || 8,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Nombre maximum de réservations qu'un membre du staff peut avoir par jour
            </p>
          </div>

          {/* Booking density thresholds */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Seuil d'avertissement (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={currentSettings.bookingDensityWarningThreshold}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    booking_density_warning_threshold: parseInt(e.target.value) || 70,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Pourcentage de charge pour déclencher un avertissement
              </p>
            </div>
            <div className="space-y-2">
              <Label>Seuil critique (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={currentSettings.bookingDensityCriticalThreshold}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    booking_density_critical_threshold: parseInt(e.target.value) || 85,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Pourcentage de charge pour déclencher une alerte critique
              </p>
            </div>
          </div>

          {/* Default work hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heure de début par défaut</Label>
              <Input
                type="time"
                value={currentSettings.defaultWorkHoursStart}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, default_work_hours_start: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Heure de fin par défaut</Label>
              <Input
                type="time"
                value={currentSettings.defaultWorkHoursEnd}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, default_work_hours_end: e.target.value })
                }
              />
            </div>
          </div>

          {/* Buffer time */}
          <div className="space-y-2">
            <Label>Temps de transition entre réservations (minutes)</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={currentSettings.bufferTimeBetweenBookings}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  buffer_time_between_bookings: parseInt(e.target.value) || 15,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Temps de transition recommandé entre deux réservations consécutives
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={updateSettingsMutation.isPending || isLoading}>
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les paramètres
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

