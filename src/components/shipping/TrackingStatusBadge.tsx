/**
 * Composant Badge pour le Statut de Tracking
 * Date: 31 Janvier 2025
 */

import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TrackingStatus = 
  | 'pending'
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled';

interface TrackingStatusBadgeProps {
  status: TrackingStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<TrackingStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  pending: {
    label: 'En attente',
    variant: 'secondary',
    icon: Clock,
    color: 'text-gray-600',
  },
  label_created: {
    label: 'Étiquette créée',
    variant: 'default',
    icon: Package,
    color: 'text-blue-600',
  },
  picked_up: {
    label: 'Ramassé',
    variant: 'default',
    icon: Truck,
    color: 'text-purple-600',
  },
  in_transit: {
    label: 'En transit',
    variant: 'default',
    icon: Truck,
    color: 'text-indigo-600',
  },
  out_for_delivery: {
    label: 'En livraison',
    variant: 'default',
    icon: Truck,
    color: 'text-yellow-600',
  },
  delivered: {
    label: 'Livré',
    variant: 'outline',
    icon: CheckCircle2,
    color: 'text-green-600',
  },
  failed: {
    label: 'Échec',
    variant: 'destructive',
    icon: AlertCircle,
    color: 'text-red-600',
  },
  returned: {
    label: 'Retourné',
    variant: 'destructive',
    icon: RefreshCw,
    color: 'text-orange-600',
  },
  cancelled: {
    label: 'Annulé',
    variant: 'destructive',
    icon: XCircle,
    color: 'text-gray-600',
  },
};

export function TrackingStatusBadge({ 
  status, 
  className,
  showIcon = true,
}: TrackingStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={cn('flex items-center gap-1.5', className)}
    >
      {showIcon && <Icon className={cn('h-3 w-3', config.color)} />}
      <span>{config.label}</span>
    </Badge>
  );
}

