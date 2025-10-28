/**
 * Inventory Chart Component
 * Date: 28 octobre 2025
 * 
 * Graphique de visualisation des stocks
 */

interface InventoryChartProps {
  items: any[];
}

export function InventoryChart({ items }: InventoryChartProps) {
  if (!items || items.length === 0) return null;

  // Sort items by quantity
  const sortedItems = [...items]
    .sort((a, b) => b.quantity_available - a.quantity_available)
    .slice(0, 10); // Top 10

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Top 10 articles par quantité disponible
      </p>

      <div className="space-y-3">
        {sortedItems.map((item, index) => {
          const productName =
            item.physical_product?.product?.name ||
            item.variant?.physical_product?.product?.name ||
            'N/A';

          const maxQuantity = sortedItems[0]?.quantity_available || 1;
          const percentage = (item.quantity_available / maxQuantity) * 100;

          const getColor = () => {
            if (item.quantity_available === 0) return 'bg-red-500';
            if (item.quantity_available <= item.reorder_point) return 'bg-orange-500';
            return 'bg-green-500';
          };

          return (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate flex-1">{productName}</span>
                <span className="text-muted-foreground ml-2">
                  {item.quantity_available} unités
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${getColor()} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-6 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Stock OK</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span>Stock Faible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Rupture</span>
        </div>
      </div>
    </div>
  );
}

