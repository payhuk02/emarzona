/**
 * Inventory Table Component
 * Date: 28 octobre 2025
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Package } from 'lucide-react';

interface InventoryTableProps {
  items: any[];
  onAdjust: (item: any) => void;
}

export function InventoryTable({ items, onAdjust }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-lg font-medium text-muted-foreground">
          Aucun article d'inventaire trouvé
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Créez des produits physiques pour commencer
        </p>
      </div>
    );
  }

  const getStockBadge = (item: any) => {
    if (item.quantity_available === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    } else if (item.quantity_available <= item.reorder_point) {
      return <Badge className="bg-orange-500">Stock Faible</Badge>;
    } else {
      return <Badge className="bg-green-500">Disponible</Badge>;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden overflow-x-auto">
      <div className="min-w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm">SKU</TableHead>
              <TableHead className="text-xs sm:text-sm">Produit</TableHead>
              <TableHead className="text-center text-xs sm:text-sm hidden md:table-cell">Disponible</TableHead>
              <TableHead className="text-center text-xs sm:text-sm hidden lg:table-cell">Réservé</TableHead>
              <TableHead className="text-center text-xs sm:text-sm hidden lg:table-cell">Point de Réappro.</TableHead>
              <TableHead className="text-xs sm:text-sm hidden xl:table-cell">Emplacement</TableHead>
              <TableHead className="text-right text-xs sm:text-sm hidden md:table-cell">Valeur</TableHead>
              <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Statut</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const productName =
                item.physical_product?.product?.name ||
                item.variant?.physical_product?.product?.name ||
                'N/A';

              const variantInfo = item.variant
                ? ` (${item.variant.option1_value}${
                    item.variant.option2_value ? ' / ' + item.variant.option2_value : ''
                  })`
                : '';

              return (
                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs sm:text-sm">{item.sku}</TableCell>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[200px] sm:max-w-none">{productName}</span>
                      {variantInfo && (
                        <span className="text-xs text-muted-foreground">{variantInfo}</span>
                      )}
                      {/* Mobile: Afficher infos supplémentaires */}
                      <div className="flex flex-wrap gap-2 mt-1 md:hidden">
                        <span className="text-xs text-muted-foreground">
                          Disp: <span className="font-semibold text-foreground">{item.quantity_available}</span>
                        </span>
                        {getStockBadge(item)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-xs sm:text-sm hidden md:table-cell">
                    {item.quantity_available}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                    {item.quantity_reserved}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                    {item.reorder_point}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden xl:table-cell">
                    {item.warehouse_location || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs sm:text-sm hidden md:table-cell">
                    {item.total_value?.toLocaleString() || 0} XOF
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{getStockBadge(item)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAdjust(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

