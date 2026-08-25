/**
 * Service - Duration & Availability Form (Step 2)
 * Date: 28 octobre 2025
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, MapPin, Video, Home, Navigation } from 'lucide-react';
import type { ServiceProductFormData, ServiceAvailabilitySlot } from '@/types/service-product';
import { getServiceFormProfile } from '@/lib/services/service-form-profiles';
import { serviceWizardShowsCalendar } from '@/lib/service-wizard-step-validation';

interface ServiceDurationAvailabilityFormProps {
  data: Partial<ServiceProductFormData>;
  onUpdate: (data: Partial<ServiceProductFormData>) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

const SESSION_DURATIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 heure' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 heures' },
  { value: 180, label: '3 heures' },
];

const GIG_DELIVERY_DURATIONS = [
  { value: 1440, label: '1 jour' },
  { value: 4320, label: '3 jours' },
  { value: 10080, label: '7 jours' },
  { value: 20160, label: '14 jours' },
];

export const ServiceDurationAvailabilityForm = ({
  data,
  onUpdate,
}: ServiceDurationAvailabilityFormProps) => {
  const profile = getServiceFormProfile(undefined, data.category);
  const showCalendar = serviceWizardShowsCalendar(data);
  const durationPresets = showCalendar ? SESSION_DURATIONS : GIG_DELIVERY_DURATIONS;

  const handleAddSlot = () => {
    const newSlot: ServiceAvailabilitySlot = {
      day: 1, // Lundi par défaut
      start_time: '09:00',
      end_time: '17:00',
    };

    onUpdate({
      availability_slots: [...(data.availability_slots || []), newSlot],
    });
  };

  const handleRemoveSlot = (index: number) => {
    const newSlots = [...(data.availability_slots || [])];
    newSlots.splice(index, 1);
    onUpdate({ availability_slots: newSlots });
  };

  const handleUpdateSlot = (
    index: number,
    field: keyof ServiceAvailabilitySlot,
    value: string | number
  ) => {
    const newSlots = [...(data.availability_slots || [])];
    newSlots[index] = { ...newSlots[index], [field]: value };
    onUpdate({ availability_slots: newSlots });
  };

  const getLocationIcon = () => {
    switch (data.location_type) {
      case 'on_site':
        return MapPin;
      case 'online':
        return Video;
      case 'customer_location':
        return Home;
      default:
        return Navigation;
    }
  };

  const LocationIcon = getLocationIcon();

  return (
    <div className="space-y-6">
      {/* Duration */}
      <Card>
        <CardHeader>
          <CardTitle>{profile?.durationLabel || 'Durée du service'}</CardTitle>
          <CardDescription>
            {showCalendar
              ? 'Combien de temps dure une session ?'
              : 'Délai de livraison estimé, visible par le client. Ajustable selon le brief.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Duration */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {durationPresets.map(duration => (
              <Button
                key={duration.value}
                variant={data.duration_minutes === duration.value ? 'default' : 'outline'}
                onClick={() => onUpdate({ duration_minutes: duration.value })}
                className="h-auto py-3"
              >
                {duration.label}
              </Button>
            ))}
          </div>

          {/* Custom Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">
              {showCalendar ? 'Durée personnalisée (minutes)' : 'Délai personnalisé (minutes)'}
            </Label>
            <Input
              id="duration_minutes"
              type="number"
              min="1"
              step="1"
              value={data.duration_minutes || ''}
              onChange={e => onUpdate({ duration_minutes: parseInt(e.target.value) || 60 })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LocationIcon className="h-5 w-5" />
            Type de localisation
          </CardTitle>
          <CardDescription>Où le service sera-t-il fourni ?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={data.location_type}
            onValueChange={value =>
              onUpdate({
                location_type: value as 'on_site' | 'online' | 'customer_location' | 'flexible',
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent mobileVariant="sheet">
              <SelectItem value="on_site">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Sur place (à votre adresse)
                </div>
              </SelectItem>
              <SelectItem value="online">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  En ligne (visioconférence)
                </div>
              </SelectItem>
              <SelectItem value="customer_location">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Chez le client
                </div>
              </SelectItem>
              <SelectItem value="flexible">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Flexible
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Location Address */}
          {data.location_type === 'on_site' && (
            <div className="space-y-2">
              <Label htmlFor="location_address">Adresse</Label>
              <Input
                id="location_address"
                placeholder="123 rue de la République, Paris"
                value={data.location_address || ''}
                onChange={e => onUpdate({ location_address: e.target.value })}
              />
            </div>
          )}

          {/* Meeting URL — Daily.co is created per booking; custom link is optional */}
          {showCalendar && data.location_type === 'online' && (
            <div className="space-y-2">
              <Label htmlFor="meeting_url">Lien visio personnalisé (optionnel)</Label>
              <Input
                id="meeting_url"
                type="url"
                placeholder="Laisser vide pour Emarzona Visio (Daily.co)"
                value={data.meeting_url || ''}
                onChange={e => onUpdate({ meeting_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Par défaut, une salle privée Daily.co est créée à la confirmation du rendez-vous
                (lien unique client + animateur). Remplissez ce champ seulement si vous préférez
                Zoom, Meet ou un autre lien fixe.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {showCalendar && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Créneaux de disponibilité</CardTitle>
              <CardDescription>
                {profile && !profile.requireSlots
                  ? 'Optionnel en mode mixte. Sans créneau, le calendrier n’apparaît pas sur la fiche publique.'
                  : 'Quand êtes-vous disponible pour ce service ?'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.availability_slots && data.availability_slots.length > 0 ? (
                <div className="space-y-3">
                  {data.availability_slots.map((slot, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:flex sm:items-center gap-3 p-4 bg-muted rounded-lg"
                    >
                      <Select
                        value={slot.day.toString()}
                        onValueChange={value => handleUpdateSlot(index, 'day', parseInt(value))}
                      >
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent mobileVariant="sheet">
                          {DAYS_OF_WEEK.map(day => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="time"
                        value={slot.start_time}
                        onChange={e => handleUpdateSlot(index, 'start_time', e.target.value)}
                        className="w-full sm:w-[120px]"
                      />

                      <span className="text-muted-foreground hidden sm:inline">→</span>

                      <Input
                        type="time"
                        value={slot.end_time}
                        onChange={e => handleUpdateSlot(index, 'end_time', e.target.value)}
                        className="w-full sm:w-[120px]"
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSlot(index)}
                        className="justify-self-end"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun créneau ajouté
                </p>
              )}

              <Button onClick={handleAddSlot} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un créneau
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <Input
              id="timezone"
              value={data.timezone || ''}
              onChange={e => onUpdate({ timezone: e.target.value })}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Détecté automatiquement depuis votre navigateur
            </p>
          </div>
        </>
      )}
    </div>
  );
};
