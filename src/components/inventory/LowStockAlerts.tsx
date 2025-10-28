/**
 * Low Stock Alerts Component
 * Date: 28 octobre 2025
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle } from 'lucide-react';
import { StockAlert } from '@/hooks/physical/useInventory';
import { cn } from '@/lib/utils';

interface LowStockAlertsProps {
  alerts: StockAlert[];
  className?: string;
}

export function LowStockAlerts({ alerts, className }: LowStockAlertsProps) {
  if (alerts.length === 0) return null;

  const outOfStock = alerts.filter((a) => a.alert_type === 'out_of_stock');
  const lowStock = alerts.filter((a) => a.alert_type === 'low_stock');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Out of Stock - Critical */}
      {outOfStock.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">
            Rupture de Stock ({outOfStock.length})
          </AlertTitle>
          <AlertDescription>
            <div className="mt-3 space-y-2">
              {outOfStock.slice(0, 5).map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800"
                >
                  <div>
                    <p className="font-medium text-sm">{alert.product_name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {alert.sku}</p>
                  </div>
                  <Badge variant="destructive">0 en stock</Badge>
                </div>
              ))}
              {outOfStock.length > 5 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  +{outOfStock.length - 5} autres articles en rupture
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Low Stock - Warning */}
      {lowStock.length > 0 && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="font-bold text-orange-900 dark:text-orange-100">
            Stock Faible ({lowStock.length})
          </AlertTitle>
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <div className="mt-3 space-y-2">
              {lowStock.slice(0, 5).map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-white dark:bg-orange-900 rounded border border-orange-200 dark:border-orange-700"
                >
                  <div>
                    <p className="font-medium text-sm">{alert.product_name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {alert.sku}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-orange-500">
                      {alert.quantity_available} en stock
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Seuil: {alert.reorder_point}
                    </p>
                  </div>
                </div>
              ))}
              {lowStock.length > 5 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  +{lowStock.length - 5} autres articles à faible stock
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

