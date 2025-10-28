/**
 * Inventory Stock Indicator Component
 * Date: 28 octobre 2025
 * 
 * Indicateurs et badges pour le stock
 */

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
} from 'lucide-react';
import type { InventoryItem } from '@/hooks/physical/useInventory';

interface StockLevelIndicatorProps {
  quantity: number;
  reorderPoint?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StockLevelIndicator = ({
  quantity,
  reorderPoint = 10,
  showProgress = false,
  size = 'md',
}: StockLevelIndicatorProps) => {
  const getStatus = () => {
    if (quantity === 0) {
      return {
        label: 'Rupture de stock',
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-destructive',
      };
    } else if (quantity <= reorderPoint) {
      return {
        label: 'Stock faible',
        variant: 'secondary' as const,
        icon: AlertTriangle,
        color: 'text-yellow-600',
      };
    } else {
      return {
        label: 'En stock',
        variant: 'default' as const,
        icon: CheckCircle2,
        color: 'text-green-600',
      };
    }
  };

  const status = getStatus();
  const Icon = status.icon;
  const percentage = Math.min((quantity / (reorderPoint * 2)) * 100, 100);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={status.variant} className={`gap-1 ${sizeClasses[size]}`}>
          <Icon className={iconSizes[size]} />
          {status.label}
        </Badge>
        <span className={`font-semibold ${status.color} ${sizeClasses[size]}`}>
          {quantity} unités
        </span>
      </div>

      {showProgress && (
        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Point de réapprovisionnement: {reorderPoint}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Inventory Stats Card
 */
interface InventoryStatsProps {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const InventoryStats = ({
  totalItems,
  totalValue,
  lowStockCount,
  outOfStockCount,
}: InventoryStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Total Articles
          </span>
        </div>
        <p className="text-2xl font-bold">{totalItems}</p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-muted-foreground">
            Valeur Stock
          </span>
        </div>
        <p className="text-2xl font-bold text-green-600">
          {totalValue.toLocaleString()} XOF
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-muted-foreground">
            Stock Faible
          </span>
        </div>
        <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-muted-foreground">
            Rupture
          </span>
        </div>
        <p className="text-2xl font-bold text-destructive">{outOfStockCount}</p>
      </div>
    </div>
  );
};

/**
 * Low Stock Alert
 */
interface LowStockAlertProps {
  productName: string;
  sku: string;
  quantity: number;
  reorderPoint: number;
  onReorder?: () => void;
}

export const LowStockAlert = ({
  productName,
  sku,
  quantity,
  reorderPoint,
  onReorder,
}: LowStockAlertProps) => {
  const isOutOfStock = quantity === 0;

  return (
    <Alert variant={isOutOfStock ? 'destructive' : 'default'}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isOutOfStock ? 'Rupture de stock' : 'Stock faible'}
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>
            <span className="font-semibold">{productName}</span> ({sku})
          </p>
          <p className="text-sm">
            Stock actuel: <span className="font-semibold">{quantity}</span> / Point
            de réapprovisionnement: {reorderPoint}
          </p>
          {onReorder && (
            <button
              onClick={onReorder}
              className="text-sm font-medium underline hover:no-underline"
            >
              Réapprovisionner maintenant
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

/**
 * Stock Movement Badge
 */
interface StockMovementBadgeProps {
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage' | 'transfer' | 'recount';
  quantity: number;
}

export const StockMovementBadge = ({ type, quantity }: StockMovementBadgeProps) => {
  const config = {
    purchase: { label: 'Achat', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    sale: { label: 'Vente', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    adjustment: { label: 'Ajustement', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    return: { label: 'Retour', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    damage: { label: 'Dommage', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    transfer: { label: 'Transfert', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
    recount: { label: 'Recomptage', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  };

  const { label, color } = config[type];
  const Icon = quantity > 0 ? TrendingUp : TrendingDown;

  return (
    <Badge className={`gap-1 ${color}`} variant="outline">
      <Icon className="h-3 w-3" />
      {label}: {quantity > 0 ? '+' : ''}{quantity}
    </Badge>
  );
};

