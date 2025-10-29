import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order' | 'backorder';

export interface InventoryStockIndicatorProps {
  quantity: number;
  lowStockThreshold?: number;
  totalSold?: number;
  variant?: 'default' | 'compact' | 'detailed';
  showProgress?: boolean;
  showTrend?: boolean;
  className?: string;
}

// ============================================================================
// UTILS
// ============================================================================

function getStockStatus(quantity: number, lowStockThreshold: number): StockStatus {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

function getStatusConfig(status: StockStatus) {
  const configs = {
    in_stock: {
      label: 'En stock',
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      badgeVariant: 'default' as const,
    },
    low_stock: {
      label: 'Stock faible',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
      badgeVariant: 'destructive' as const,
    },
    out_of_stock: {
      label: 'Rupture de stock',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: XCircle,
      iconColor: 'text-red-600',
      badgeVariant: 'destructive' as const,
    },
    pre_order: {
      label: 'Pré-commande',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: Package,
      iconColor: 'text-blue-600',
      badgeVariant: 'secondary' as const,
    },
    backorder: {
      label: 'En réapprovisionnement',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      badgeVariant: 'secondary' as const,
    },
  };

  return configs[status];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InventoryStockIndicator({
  quantity,
  lowStockThreshold = 10,
  totalSold = 0,
  variant = 'default',
  showProgress = true,
  showTrend = false,
  className,
}: InventoryStockIndicatorProps) {
  const status = getStockStatus(quantity, lowStockThreshold);
  const config = getStatusConfig(status);
  const Icon = config.icon;

  // Calculate stock percentage (for progress bar)
  const maxStock = quantity + totalSold || 100; // Estimate initial stock
  const stockPercentage = Math.min((quantity / maxStock) * 100, 100);

  // Compact variant
  if (variant === 'compact') {
    return (
      <Badge 
        variant={config.badgeVariant}
        className={cn('gap-1', className)}
      >
        <Icon className="h-3 w-3" />
        {quantity > 0 ? quantity : config.label}
      </Badge>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', config.iconColor)} />
            <span className="font-medium text-sm">{config.label}</span>
          </div>
          <span className="text-sm font-semibold">
            {quantity} {quantity === 1 ? 'unité' : 'unités'}
          </span>
        </div>

        {/* Progress Bar */}
        {showProgress && quantity > 0 && (
          <div className="space-y-1">
            <Progress 
              value={stockPercentage} 
              className={cn('h-2', {
                'bg-green-100 [&>div]:bg-green-600': status === 'in_stock',
                'bg-orange-100 [&>div]:bg-orange-600': status === 'low_stock',
              })}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{maxStock} (estimé)</span>
            </div>
          </div>
        )}

        {/* Trend */}
        {showTrend && totalSold > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingDown className="h-3 w-3" />
            <span>{totalSold} vendus</span>
          </div>
        )}

        {/* Warning message */}
        {status === 'low_stock' && (
          <p className="text-xs text-orange-600">
            ⚠️ Niveau de stock faible. Envisagez un réapprovisionnement.
          </p>
        )}
        {status === 'out_of_stock' && (
          <p className="text-xs text-red-600">
            ❌ Produit en rupture de stock. Réapprovisionnez rapidement.
          </p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border',
        config.color
      )}>
        <Icon className="h-4 w-4" />
        <div className="flex flex-col">
          <span className="text-xs font-medium">{config.label}</span>
          <span className="text-xs font-semibold">
            {quantity > 0 ? `${quantity} dispo` : 'Indisponible'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VARIANTS SHORTCUTS
// ============================================================================

export function CompactStockIndicator(props: Omit<InventoryStockIndicatorProps, 'variant'>) {
  return <InventoryStockIndicator {...props} variant="compact" />;
}

export function DetailedStockIndicator(props: Omit<InventoryStockIndicatorProps, 'variant'>) {
  return <InventoryStockIndicator {...props} variant="detailed" />;
}

// ============================================================================
// STOCK BADGE (Simple badge without details)
// ============================================================================

export interface StockBadgeProps {
  quantity: number;
  lowStockThreshold?: number;
  className?: string;
}

export function StockBadge({ quantity, lowStockThreshold = 10, className }: StockBadgeProps) {
  const status = getStockStatus(quantity, lowStockThreshold);
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.badgeVariant} className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
