/**
 * Service Card Component
 * Date: 28 octobre 2025
 * 
 * Professional card for displaying service products
 */

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Home,
  Navigation,
  Users,
  Star,
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ServiceProduct } from '@/hooks/service';

interface ServiceCardProps {
  service: ServiceProduct & { product?: any };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const ServiceCard = ({
  service,
  onEdit,
  onDelete,
  showActions = true,
}: ServiceCardProps) => {
  const navigate = useNavigate();

  const getLocationIcon = () => {
    switch (service.location_type) {
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

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      appointment: 'Rendez-vous',
      class: 'Cours',
      event: 'Événement',
      consultation: 'Consultation',
      other: 'Autre',
    };
    return labels[type] || type;
  };

  const LocationIcon = getLocationIcon();
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Service Image */}
      <div className="relative aspect-video bg-muted">
        {service.product?.image_url ? (
          <img
            src={service.product.image_url}
            alt={service.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        {/* Service Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary">
            {getServiceTypeLabel(service.service_type)}
          </Badge>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(service.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(service.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Service Info */}
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">
            {service.product?.name || 'Service sans nom'}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Duration */}
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(service.duration_minutes)}
            </Badge>

            {/* Location */}
            <Badge variant="outline" className="gap-1">
              <LocationIcon className="h-3 w-3" />
              {service.location_type === 'on_site' && 'Sur place'}
              {service.location_type === 'online' && 'En ligne'}
              {service.location_type === 'customer_location' && 'À domicile'}
              {service.location_type === 'flexible' && 'Flexible'}
            </Badge>

            {/* Participants */}
            {service.max_participants > 1 && (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {service.max_participants} max
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Price */}
          <div>
            <p className="text-2xl font-bold text-primary">
              {service.product?.price?.toLocaleString() || 0} XOF
            </p>
            <p className="text-sm text-muted-foreground">
              {service.pricing_type === 'fixed' && 'Prix fixe'}
              {service.pricing_type === 'hourly' && 'Tarif horaire'}
              {service.pricing_type === 'per_participant' && 'Par participant'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Réservations</p>
              <p className="font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                {service.total_bookings || 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Note moyenne</p>
              <p className="font-semibold flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {service.average_rating || 0}
              </p>
            </div>
          </div>

          {/* Description preview */}
          {service.product?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {service.product.description}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Button
          className="w-full"
          onClick={() => navigate(`/services/${service.product_id}`)}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Réserver
        </Button>
      </CardFooter>
    </Card>
  );
};

/**
 * Grid of Service Cards
 */
interface ServicesGridProps {
  services: (ServiceProduct & { product?: any })[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const ServicesGrid = ({
  services,
  loading,
  onEdit,
  onDelete,
  showActions = true,
}: ServicesGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-video bg-muted animate-pulse" />
            <CardContent className="p-4 space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun service disponible</h3>
          <p className="text-muted-foreground">
            Créez votre premier service pour commencer à recevoir des réservations
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

export default ServiceCard;
export { ServicesGrid };
