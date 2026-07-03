/**
 * Sons, vibrations, DND et canaux globaux — réutilisable dans settings et centre notifications.
 */
import { Volume2, Accessibility, Moon, BellRing } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { NotificationPreferences } from '@/types/notifications';
import {
  playNotificationSound,
  type NotificationSoundType,
} from '@/lib/notifications/play-notification-sound';
import { triggerDeviceVibration } from '@/lib/notifications/vibration-patterns';
import {
  isNotificationPaused,
  pauseUntilFromHours,
  pauseUntilTomorrowMorning,
} from '@/lib/notifications/notification-pause';
import { cn } from '@/lib/utils';

type Props = {
  prefs: NotificationPreferences;
  onChange: (field: keyof NotificationPreferences, value: boolean | string | number | null) => void;
  /** Dialog compact — espacement réduit */
  compact?: boolean;
};

export function NotificationExperienceSettings({ prefs, onChange, compact = false }: Props) {
  const paused = isNotificationPaused(prefs.pause_until);
  const soundType = (prefs.notification_sound_type as NotificationSoundType) || 'default';

  const previewSound = () => {
    playNotificationSound(soundType, {
      volumePercent: prefs.sound_volume ?? 80,
      highContrast: prefs.high_contrast_sounds === true,
    });
  };

  const previewVibration = () => {
    triggerDeviceVibration(prefs.vibration_intensity, prefs.vibration_notifications !== false);
  };

  const pauseLocalValue = prefs.pause_until
    ? new Date(prefs.pause_until).toISOString().slice(0, 16)
    : '';

  const cardClass = compact ? 'border-muted/60 shadow-none' : undefined;
  const stackClass = compact ? 'space-y-4' : 'space-y-6';

  return (
    <div className={stackClass}>
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellRing className="h-5 w-5" />
            Canaux globaux
          </CardTitle>
          <CardDescription>
            Activez ou désactivez chaque canal pour toute la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="email_notifications">Emails transactionnels & alertes</Label>
            <Switch
              id="email_notifications"
              checked={prefs.email_notifications ?? true}
              onCheckedChange={v => onChange('email_notifications', v)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="push_notifications">Notifications push (navigateur / PWA)</Label>
            <Switch
              id="push_notifications"
              checked={prefs.push_notifications ?? true}
              onCheckedChange={v => onChange('push_notifications', v)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="sms_notifications">SMS (si disponible pour votre région)</Label>
            <Switch
              id="sms_notifications"
              checked={prefs.sms_notifications ?? false}
              onCheckedChange={v => onChange('sms_notifications', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={cn('border-violet-200/60 dark:border-violet-900/40', cardClass)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Moon className="h-5 w-5" />
            Ne pas déranger
          </CardTitle>
          <CardDescription>
            {paused
              ? 'Notifications silencieuses jusqu’à la fin de la pause'
              : 'Coupez sons et alertes pendant une période'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange('pause_until', null)}
            >
              Désactiver
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange('pause_until', pauseUntilFromHours(1))}
            >
              1 h
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange('pause_until', pauseUntilFromHours(8))}
            >
              8 h
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange('pause_until', pauseUntilTomorrowMorning())}
            >
              Demain 8h
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pause_until">Jusqu’à (date & heure)</Label>
            <Input
              id="pause_until"
              type="datetime-local"
              value={pauseLocalValue}
              onChange={e =>
                onChange(
                  'pause_until',
                  e.target.value ? new Date(e.target.value).toISOString() : null
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5" />
            Sons & vibrations
          </CardTitle>
          <CardDescription>Personnalisez l’expérience alerte in-app et mobile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="sound_notifications">Sons de notification</Label>
            <Switch
              id="sound_notifications"
              checked={prefs.sound_notifications ?? true}
              onCheckedChange={v => onChange('sound_notifications', v)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Volume ({prefs.sound_volume ?? 80}%)</Label>
              <Button type="button" variant="secondary" size="sm" onClick={previewSound}>
                Écouter
              </Button>
            </div>
            <Slider
              value={[prefs.sound_volume ?? 80]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => onChange('sound_volume', v)}
              aria-label="Volume des sons de notification"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification_sound_type">Type de son</Label>
            <Select value={soundType} onValueChange={v => onChange('notification_sound_type', v)}>
              <SelectTrigger id="notification_sound_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Standard</SelectItem>
                <SelectItem value="gentle">Doux</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="vibration_notifications">Vibrations (mobile)</Label>
            <Switch
              id="vibration_notifications"
              checked={prefs.vibration_notifications ?? true}
              onCheckedChange={v => onChange('vibration_notifications', v)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vibration_intensity">Intensité vibration</Label>
              <Button type="button" variant="secondary" size="sm" onClick={previewVibration}>
                Tester
              </Button>
            </div>
            <Select
              value={prefs.vibration_intensity ?? 'medium'}
              onValueChange={v => onChange('vibration_intensity', v)}
            >
              <SelectTrigger id="vibration_intensity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Légère</SelectItem>
                <SelectItem value="medium">Normale</SelectItem>
                <SelectItem value="heavy">Forte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Accessibility className="h-5 w-5" />
            Accessibilité
          </CardTitle>
          <CardDescription>Options pour une meilleure perception des alertes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="accessibility_mode">Mode accessibilité renforcé</Label>
            <Switch
              id="accessibility_mode"
              checked={prefs.accessibility_mode ?? false}
              onCheckedChange={v => onChange('accessibility_mode', v)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="high_contrast_sounds">Sons haute contraste</Label>
            <Switch
              id="high_contrast_sounds"
              checked={prefs.high_contrast_sounds ?? false}
              onCheckedChange={v => onChange('high_contrast_sounds', v)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="screen_reader_friendly">Optimisations lecteur d’écran</Label>
            <Switch
              id="screen_reader_friendly"
              checked={prefs.screen_reader_friendly ?? true}
              onCheckedChange={v => onChange('screen_reader_friendly', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
