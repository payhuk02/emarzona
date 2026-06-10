import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle } from 'lucide-react';

interface LowStockAlertProps {
  productName: string;
  sku?: string;
  quantity: number;
  reorderPoint: number;
}

export function LowStockAlert({ productName, sku, quantity, reorderPoint }: LowStockAlertProps) {
  const isOutOfStock = quantity === 0;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isOutOfStock
          ? 'border-destructive/50 bg-destructive/5'
          : 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20'
      }`}
    >
      <div className="flex items-start gap-2 min-w-0">
        {isOutOfStock ? (
          <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{productName}</p>
          {sku && <p className="text-xs text-muted-foreground">SKU: {sku}</p>}
        </div>
      </div>
      <Badge variant={isOutOfStock ? 'destructive' : 'secondary'}>
        {quantity} / {reorderPoint}
      </Badge>
    </div>
  );
}
