/**
 * Service - Preview (Step 5)
 * Date: 28 octobre 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Home,
  Navigation,
  DollarSign,
  Users,
  Package,
  CheckCircle2,
  XCircle,
  Tag,
} from 'lucide-react';
import type { ServiceProductFormData } from '@/types/service-product';

interface ServicePreviewProps {
  data: Partial<ServiceProductFormData>;
  onUpdate: (data: Partial<ServiceProductFormData>) => void;
}

const DAYS_OF_WEEK_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export const ServicePreview = ({ data }: ServicePreviewProps) => {
  const getLocationIcon = () => {
    switch (data.location_type) {
      case 'on_site': return MapPin;
      case 'online': return Video;
      case 'customer_location': return Home;
      default: return Navigation;
    }
  };

  const LocationIcon = getLocationIcon();

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      appointment: 'Rendez-vous',
      class: 'Cours / Formation',
      event: 'Événement',
      consultation: 'Consultation',
      other: 'Autre',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informations de base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Type de service</p>
            <p className="text-lg font-semibold">
              {data.service_type && getServiceTypeLabel(data.service_type)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Nom</p>
            <p className="text-lg font-semibold">{data.name || 'Non défini'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-sm">{data.description || 'Non définie'}</p>
          </div>

          {data.tags && data.tags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duration & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Durée & Localisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Durée</p>
              <p className="text-xl font-bold text-primary">
                {data.duration_minutes && formatDuration(data.duration_minutes)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Localisation</p>
              <div className="flex items-center gap-2">
                <LocationIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {data.location_type === 'on_site' && 'Sur place'}
                  {data.location_type === 'online' && 'En ligne'}
                  {data.location_type === 'customer_location' && 'Chez le client'}
                  {data.location_type === 'flexible' && 'Flexible'}
                </span>
              </div>
            </div>
          </div>

          {data.location_address && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Adresse</p>
              <p className="text-sm">{data.location_address}</p>
            </div>
          )}

          {data.meeting_url && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">URL de réunion</p>
              <p className="text-sm text-primary font-mono break-all">{data.meeting_url}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability */}
      {data.availability_slots && data.availability_slots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Créneaux de disponibilité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.availability_slots.map((slot, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Badge variant="outline">
                    {DAYS_OF_WEEK_LABELS[slot.day]}
                  </Badge>
                  <span className="font-mono text-sm">
                    {slot.start_time} → {slot.end_time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff & Capacity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personnel & Capacité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Personnel requis</span>
            {data.requires_staff ? (
              <Badge variant="default">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Oui
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Non
              </Badge>
            )}
          </div>

          {data.requires_staff && data.staff_members && data.staff_members.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Membres du personnel ({data.staff_members.length})
              </p>
              <div className="space-y-2">
                {data.staff_members.map((member, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    {member.role && (
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground">Capacité maximum</p>
            <p className="text-xl font-bold">
              {data.max_participants} participant{data.max_participants && data.max_participants > 1 ? 's' : ''}
            </p>
            {data.max_participants && data.max_participants > 1 && (
              <p className="text-sm text-muted-foreground">Service de groupe</p>
            )}
          </div>

          {data.resources_needed && data.resources_needed.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Ressources nécessaires</p>
              <div className="flex flex-wrap gap-2">
                {data.resources_needed.map((resource, index) => (
                  <Badge key={index} variant="secondary">
                    <Package className="h-3 w-3 mr-1" />
                    {resource}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Tarification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Prix de base</p>
            <p className="text-2xl font-bold text-primary">
              {data.price?.toLocaleString()} XOF
            </p>
            <p className="text-sm text-muted-foreground">
              {data.pricing_type === 'fixed' && 'Prix fixe'}
              {data.pricing_type === 'hourly' && 'Tarif horaire'}
              {data.pricing_type === 'per_participant' && 'Par participant'}
            </p>
          </div>

          {data.deposit_required && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Acompte</p>
              <p className="font-semibold">
                {data.deposit_amount}{' '}
                {data.deposit_type === 'percentage' ? '%' : 'XOF'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Options */}
      <Card>
        <CardHeader>
          <CardTitle>Options de réservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Annulation autorisée</span>
            {data.booking_options?.allow_booking_cancellation ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>

          {data.booking_options?.allow_booking_cancellation && (
            <p className="text-sm text-muted-foreground">
              Délai: {data.booking_options.cancellation_deadline_hours}h avant le RDV
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm">Approbation manuelle</span>
            {data.booking_options?.require_approval ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>

          {(data.booking_options?.buffer_time_before || data.booking_options?.buffer_time_after) && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Temps tampon</p>
              <p className="text-sm">
                Avant: {data.booking_options.buffer_time_before} min / 
                Après: {data.booking_options.buffer_time_after} min
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground">Réservation à l'avance</p>
            <p className="text-sm">
              Maximum {data.booking_options?.advance_booking_days} jours
            </p>
          </div>

          {data.booking_options?.max_bookings_per_day && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Limite quotidienne</p>
              <p className="text-sm">
                {data.booking_options.max_bookings_per_day} réservations/jour
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

