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
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead className="text-center">Disponible</TableHead>
            <TableHead className="text-center">Réservé</TableHead>
            <TableHead className="text-center">Point de Réappro.</TableHead>
            <TableHead>Emplacement</TableHead>
            <TableHead className="text-right">Valeur</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell className="font-medium">
                  {productName}
                  {variantInfo && (
                    <span className="text-sm text-muted-foreground">{variantInfo}</span>
                  )}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {item.quantity_available}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {item.quantity_reserved}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {item.reorder_point}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.warehouse_location || 'N/A'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.total_value?.toLocaleString() || 0} XOF
                </TableCell>
                <TableCell>{getStockBadge(item)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAdjust(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

