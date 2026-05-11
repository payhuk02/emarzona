/**
 * Composant Badge pour le Statut de Tracking
 * Date: 31 Janvier 2025
 */

import { useTranslation } from 'react-i18next';
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

const getStatusConfig = (status: TrackingStatus, t: (key: string, defaultValue?: string) => string) => {
  const  configs: Record<TrackingStatus, {
    labelKey: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }> = {
    pending: {
      labelKey: 'shipping.status.pending',
      variant: 'secondary',
      icon: Clock,
      color: 'text-gray-600',
    },
    label_created: {
      labelKey: 'shipping.status.labelCreated',
      variant: 'default',
      icon: Package,
      color: 'text-blue-600',
    },
    picked_up: {
      labelKey: 'shipping.status.pickedUp',
      variant: 'default',
      icon: Truck,
      color: 'text-purple-600',
    },
    in_transit: {
      labelKey: 'shipping.status.inTransit',
      variant: 'default',
      icon: Truck,
      color: 'text-indigo-600',
    },
    out_for_delivery: {
      labelKey: 'shipping.status.outForDelivery',
      variant: 'default',
      icon: Truck,
      color: 'text-yellow-600',
    },
    delivered: {
      labelKey: 'shipping.status.delivered',
      variant: 'outline',
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    failed: {
      labelKey: 'shipping.status.failed',
      variant: 'destructive',
      icon: AlertCircle,
      color: 'text-red-600',
    },
    returned: {
      labelKey: 'shipping.status.returned',
      variant: 'destructive',
      icon: RefreshCw,
      color: 'text-orange-600',
    },
    cancelled: {
      labelKey: 'shipping.status.cancelled',
      variant: 'destructive',
      icon: XCircle,
      color: 'text-gray-600',
    },
  };

  const config = configs[status] || configs.pending;
  return {
    ...config,
    label: t(config.labelKey, config.labelKey.split('.').pop() || ''),
  };
};

export function TrackingStatusBadge({ 
  status, 
  className,
  showIcon = true,
}: TrackingStatusBadgeProps) {
  const { t } = useTranslation();
  const config = getStatusConfig(status, t);
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







