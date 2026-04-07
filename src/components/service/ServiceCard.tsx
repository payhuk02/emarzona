/**
 * Service Card Component
 * Date: 28 octobre 2025
 *
 * Professional card for displaying service products
 * Optimisé avec React.memo et LazyImage pour performance mobile
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
import type { Product } from '@/types/product';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';
import { supabase } from '@/integrations/supabase/client';

interface ServiceCardProps {
  service: ServiceProduct & { product?: Product };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const ServiceCardComponent = ({
  service,
  onEdit,
  onDelete,
  showActions = true,
}: ServiceCardProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer l'utilisateur pour les alertes
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

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
    const  labels: Record<string, string> = {
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

  const imageSizes =
    '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Service Image */}
      <div className="relative aspect-video bg-muted">
        <ResponsiveProductImage
          src={service.product?.image_url}
          alt={service.product?.name || 'Service'}
          sizes={imageSizes}
          context="grid"
          fit="cover"
          className="h-full w-full"
          fallbackIcon={<Calendar className="h-16 w-16 text-muted-foreground" />}
        />

        {/* Service Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary">{getServiceTypeLabel(service.service_type)}</Badge>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="absolute top-2 right-2">
            <StableDropdownMenu
              triggerContent={<MoreVertical className="h-4 w-4" />}
              triggerProps={{
                variant: "secondary" as const,
                size: "icon" as const,
                className: "h-11 w-11 sm:h-8 sm:w-8",
                "aria-label": `Actions pour ${service.name || service.id}`
              }}
            >
              <SelectItem value="edit" onSelect={() => onEdit?.(service.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </SelectItem>
              <SelectItem value="delete"
                onSelect={() => onDelete?.(service.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </SelectItem>
            </StableDropdownMenu>
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-primary whitespace-nowrap">
                  {service.product?.price?.toLocaleString() || 0}{' '}
                  {service.product?.currency || 'XOF'}
                </p>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                {service.pricing_type === 'fixed' && 'Prix fixe'}
                {service.pricing_type === 'hourly' && 'Tarif horaire'}
                {service.pricing_type === 'per_participant' && 'Par participant'}
              </p>
            </div>
            {service.product?.id && (
              <PriceStockAlertButton
                productId={service.product.id}
                productName={service.product.name}
                currentPrice={service.product.price || 0}
                currency={service.product.currency || 'XOF'}
                productType="service"
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              />
            )}
          </div>

          {/* Stats */}
          {!service.product?.hide_purchase_count && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Réservations</p>
                <p className="font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  {service.total_bookings || 0}
                </p>
              </div>
              {!service.product?.hide_rating && (
                <div>
                  <p className="text-muted-foreground text-xs">Note moyenne</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {service.average_rating || 0}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description preview */}
          {service.product?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {service.product.description}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Button className="w-full" onClick={() => navigate(`/services/${service.product_id}`)}>
          <Calendar className="h-4 w-4 mr-2" />
          Réserver
        </Button>
      </CardFooter>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
const ServiceCard = React.memo(ServiceCardComponent, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  return (
    prevProps.service.id === nextProps.service.id &&
    prevProps.service.product_id === nextProps.service.product_id &&
    prevProps.service.product?.price === nextProps.service.product?.price &&
    prevProps.service.product?.image_url === nextProps.service.product?.image_url &&
    prevProps.service.product?.name === nextProps.service.product?.name &&
    prevProps.service.total_bookings === nextProps.service.total_bookings &&
    prevProps.service.average_rating === nextProps.service.average_rating &&
    prevProps.service.duration_minutes === nextProps.service.duration_minutes &&
    prevProps.service.location_type === nextProps.service.location_type &&
    prevProps.showActions === nextProps.showActions &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  );
});

ServiceCard.displayName = 'ServiceCard';

// Export par défaut pour compatibilité
export default ServiceCard;

/**
 * Grid of Service Cards
 */
interface ServicesGridProps {
  services: (ServiceProduct & { product?: Product })[];
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
        {[1, 2, 3, 4, 5, 6].map(i => (
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
      {services.map(service => (
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

export { ServicesGrid };






