/**
 * Composant de Gestion des Préférences de Notifications pour Réservations
 * Date: 3 Février 2025
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { BookingNotificationPreferences } from '@/lib/notifications/service-booking-notifications';
import { getUserBookingNotificationPreferences } from '@/lib/notifications/service-booking-notifications';

interface BookingNotificationPreferencesProps {
  userId: string;
  className?: string;
}

export function BookingNotificationPreferences({
  userId,
  className,
}: BookingNotificationPreferencesProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<BookingNotificationPreferences>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    in_app_enabled: true,
    reminder_24h_enabled: true,
    reminder_2h_enabled: true,
    reminder_30min_enabled: false,
    confirmation_enabled: true,
    reminder_enabled: true,
    cancellation_enabled: true,
    reschedule_enabled: true,
    completion_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les préférences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getUserBookingNotificationPreferences(userId);
        setPreferences(prefs);
      } catch (error) {
        console.error('Error loading preferences', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadPreferences();
    }
  }, [userId]);

  // Sauvegarder les préférences
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: '✅ Préférences sauvegardées',
        description: 'Vos préférences de notifications ont été mises à jour',
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de sauvegarder les préférences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Canaux de Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canaux de Notification
          </CardTitle>
          <CardDescription>
            Choisissez comment vous souhaitez recevoir les notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email_enabled">Email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les notifications par email
                </p>
              </div>
            </div>
            <Switch
              id="email_enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, email_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sms_enabled">SMS</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les notifications par SMS
                </p>
              </div>
            </div>
            <Switch
              id="sms_enabled"
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, sms_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push_enabled">Notifications Push</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les notifications push sur votre appareil
                </p>
              </div>
            </div>
            <Switch
              id="push_enabled"
              checked={preferences.push_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, push_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="in_app_enabled">Notifications In-App</Label>
                <p className="text-sm text-muted-foreground">
                  Afficher les notifications dans l'application
                </p>
              </div>
            </div>
            <Switch
              id="in_app_enabled"
              checked={preferences.in_app_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, in_app_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Timing des Rappels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing des Rappels
          </CardTitle>
          <CardDescription>
            Quand souhaitez-vous recevoir des rappels avant votre réservation ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminder_24h_enabled">Rappel 24h avant</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir un rappel 24 heures avant la réservation
              </p>
            </div>
            <Switch
              id="reminder_24h_enabled"
              checked={preferences.reminder_24h_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, reminder_24h_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminder_2h_enabled">Rappel 2h avant</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir un rappel 2 heures avant la réservation
              </p>
            </div>
            <Switch
              id="reminder_2h_enabled"
              checked={preferences.reminder_2h_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, reminder_2h_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminder_30min_enabled">Rappel 30min avant</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir un rappel 30 minutes avant la réservation
              </p>
            </div>
            <Switch
              id="reminder_30min_enabled"
              checked={preferences.reminder_30min_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, reminder_30min_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Types de Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Types de Notifications</CardTitle>
          <CardDescription>
            Choisissez quels types de notifications vous souhaitez recevoir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="confirmation_enabled">Confirmations</Label>
              <p className="text-sm text-muted-foreground">
                Notifications de confirmation de réservation
              </p>
            </div>
            <Switch
              id="confirmation_enabled"
              checked={preferences.confirmation_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, confirmation_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminder_enabled">Rappels</Label>
              <p className="text-sm text-muted-foreground">
                Rappels automatiques avant la réservation
              </p>
            </div>
            <Switch
              id="reminder_enabled"
              checked={preferences.reminder_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, reminder_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cancellation_enabled">Annulations</Label>
              <p className="text-sm text-muted-foreground">
                Notifications d'annulation de réservation
              </p>
            </div>
            <Switch
              id="cancellation_enabled"
              checked={preferences.cancellation_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, cancellation_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reschedule_enabled">Replanifications</Label>
              <p className="text-sm text-muted-foreground">
                Notifications de replanification de réservation
              </p>
            </div>
            <Switch
              id="reschedule_enabled"
              checked={preferences.reschedule_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, reschedule_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="completion_enabled">Complétions</Label>
              <p className="text-sm text-muted-foreground">
                Notifications de complétion de réservation
              </p>
            </div>
            <Switch
              id="completion_enabled"
              checked={preferences.completion_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, completion_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Sauvegarder les préférences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}







