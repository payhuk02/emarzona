/**
 * Resource Conflict Settings Component
 * Date: 28 Janvier 2025
 *
 * Paramètres de détection et gestion des conflits de ressources
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Loader2, AlertTriangle } from '@/components/icons';
import {
  useResourceConflictSettings,
  useUpdateResourceConflictSettings,
  type ResourceConflictSettings as SettingsType,
} from '@/hooks/service/useResourceConflictSettings';

interface ResourceConflictSettingsProps {
  storeId: string;
}

export function ResourceConflictSettings({ storeId }: ResourceConflictSettingsProps) {
  // Charger les paramètres depuis la base de données
  const { data: settings, isLoading } = useResourceConflictSettings(storeId);
  const updateSettingsMutation = useUpdateResourceConflictSettings();

  // État local pour les modifications (avant sauvegarde)
  const [localSettings, setLocalSettings] = useState<Partial<SettingsType>>({});

  // Initialiser localSettings avec les données chargées
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        auto_detect_conflicts: settings.auto_detect_conflicts,
        detect_interval_minutes: settings.detect_interval_minutes,
        prevent_double_booking: settings.prevent_double_booking,
        check_resource_availability: settings.check_resource_availability,
        check_capacity: settings.check_capacity,
        check_time_slots: settings.check_time_slots,
        notify_on_conflict: settings.notify_on_conflict,
        auto_resolve_conflicts: settings.auto_resolve_conflicts,
        conflict_resolution_method: settings.conflict_resolution_method,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settings) return;

    updateSettingsMutation.mutate({
      store_id: storeId,
      ...localSettings,
    });
  };

  // Utiliser les settings locaux ou les settings chargés
  const currentSettings = {
    autoDetectConflicts:
      localSettings.auto_detect_conflicts ?? settings?.auto_detect_conflicts ?? true,
    detectIntervalMinutes:
      localSettings.detect_interval_minutes ?? settings?.detect_interval_minutes ?? 30,
    preventDoubleBooking:
      localSettings.prevent_double_booking ?? settings?.prevent_double_booking ?? true,
    checkResourceAvailability:
      localSettings.check_resource_availability ?? settings?.check_resource_availability ?? true,
    checkCapacity: localSettings.check_capacity ?? settings?.check_capacity ?? true,
    checkTimeSlots: localSettings.check_time_slots ?? settings?.check_time_slots ?? true,
    notifyOnConflict: localSettings.notify_on_conflict ?? settings?.notify_on_conflict ?? true,
    autoResolveConflicts:
      localSettings.auto_resolve_conflicts ?? settings?.auto_resolve_conflicts ?? false,
    conflictResolutionMethod: (localSettings.conflict_resolution_method ??
      settings?.conflict_resolution_method ??
      'manual') as 'manual' | 'auto' | 'suggest',
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
      {/* Detection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Détection Automatique
          </CardTitle>
          <CardDescription>Configurez la détection automatique des conflits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Détection automatique des conflits</Label>
              <p className="text-sm text-muted-foreground">
                Détecter automatiquement les conflits de ressources
              </p>
            </div>
            <Switch
              checked={currentSettings.autoDetectConflicts}
              onCheckedChange={checked =>
                setLocalSettings({ ...localSettings, auto_detect_conflicts: checked })
              }
            />
          </div>

          {currentSettings.autoDetectConflicts && (
            <div className="space-y-2">
              <Label>Intervalle de détection (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={1440}
                value={currentSettings.detectIntervalMinutes}
                onChange={e =>
                  setLocalSettings({
                    ...localSettings,
                    detect_interval_minutes: parseInt(e.target.value) || 30,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Fréquence de vérification des conflits (5-1440 minutes)
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications sur conflit</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications lorsqu'un conflit est détecté
              </p>
            </div>
            <Switch
              checked={currentSettings.notifyOnConflict}
              onCheckedChange={checked =>
                setLocalSettings({ ...localSettings, notify_on_conflict: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Prevention Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Prévention des Conflits</CardTitle>
          <CardDescription>
            Options pour prévenir les conflits lors de la création de réservations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Empêcher les doubles réservations</Label>
              <p className="text-sm text-muted-foreground">
                Empêcher la réservation d'un staff déjà réservé
              </p>
            </div>
            <Switch
              checked={currentSettings.preventDoubleBooking}
              onCheckedChange={checked =>
                setLocalSettings({ ...localSettings, prevent_double_booking: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Vérifier la disponibilité des ressources</Label>
              <p className="text-sm text-muted-foreground">
                Vérifier que les ressources requises sont disponibles
              </p>
            </div>
            <Switch
              checked={currentSettings.checkResourceAvailability}
              onCheckedChange={checked =>
                setLocalSettings({ ...localSettings, check_resource_availability: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Vérifier la capacité</Label>
              <p className="text-sm text-muted-foreground">
                Vérifier que la capacité maximale n'est pas dépassée
              </p>
            </div>
            <Switch
              checked={currentSettings.checkCapacity}
              onCheckedChange={checked =>
                setLocalSettings({ ...localSettings, check_capacity: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Vérifier les créneaux horaires</Label>
              <p className="text-sm text-muted-foreground">
                Vérifier que le créneau horaire est disponible
              </p>
            </div>
            <Switch
              checked={currentSettings.checkTimeSlots}
              onCheckedChange={checked =>
                setLocalSettings({ ...localSettings, check_time_slots: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Resolution Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Résolution des Conflits</CardTitle>
          <CardDescription>Configurez comment les conflits sont résolus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Résolution automatique</Label>
              <p className="text-sm text-muted-foreground">
                Résoudre automatiquement les conflits simples
              </p>
            </div>
            <Switch
              checked={currentSettings.autoResolveConflicts}
              onCheckedChange={checked =>
                setLocalSettings({ ...localSettings, auto_resolve_conflicts: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Méthode de résolution</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px] touch-manipulation cursor-pointer"
              value={currentSettings.conflictResolutionMethod}
              onChange={e =>
                setLocalSettings({
                  ...localSettings,
                  conflict_resolution_method: e.target.value as 'manual' | 'auto' | 'suggest',
                })
              }
            >
              <option value="manual">Manuelle (nécessite validation)</option>
              <option value="suggest">Suggérer des solutions</option>
              <option value="auto">Automatique (si activé)</option>
            </select>
            <p className="text-sm text-muted-foreground">
              Comment les conflits sont gérés lorsqu'ils sont détectés
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
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
    </div>
  );
}






