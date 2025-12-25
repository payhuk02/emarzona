/**
 * Tableau de rotation des stocks
 * Date: 28 Janvier 2025
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useStockRotationReports } from '@/hooks/physical/usePhysicalAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle } from '@/components/icons';

interface StockRotationTableProps {
  storeId: string;
  startDate: string;
  endDate: string;
}

export function StockRotationTable({ storeId, startDate, endDate }: StockRotationTableProps) {
  // Get all physical products for this store
  const { data: products } = useQuery({
    queryKey: ['store-physical-products-for-rotation', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_products')
        .select('id, product:products!inner(id, name, store_id)')
        .eq('product.store_id', storeId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId,
  });

  const productIds = products?.map((p) => p.id) || [];

  const { data: rotationReports, isLoading } = useStockRotationReports(undefined, {
    startDate,
    endDate,
  });

  // Filter reports for products in this store
  const filteredReports = rotationReports?.filter((report) =>
    productIds.includes(report.physical_product_id)
  ) || [];

  // Get product names
  const { data: productNames } = useQuery({
    queryKey: ['product-names', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .in('id', products?.map((p) => (p as any).product?.id) || []);

      if (error) throw error;
      return data || [];
    },
    enabled: productIds.length > 0,
  });

  const getVelocityBadge = (velocity: string) => {
    switch (velocity) {
      case 'fast':
        return <Badge variant="default" className="bg-green-500">Rapide</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-blue-500">Moyen</Badge>;
      case 'slow':
        return <Badge variant="secondary">Lent</Badge>;
      case 'stagnant':
        return <Badge variant="destructive">Stagnant</Badge>;
      default:
        return <Badge variant="secondary">{velocity}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Rotation des Stocks
        </CardTitle>
        <CardDescription>
          Analyse de la rotation des stocks par produit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="text-right">Stock Début</TableHead>
              <TableHead className="text-right">Stock Fin</TableHead>
              <TableHead className="text-right">Unités Vendues</TableHead>
              <TableHead className="text-right">Ratio Rotation</TableHead>
              <TableHead className="text-right">Jours de Stock</TableHead>
              <TableHead>Vitesse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Aucun rapport de rotation disponible pour cette période
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => {
                const product = products?.find((p) => p.id === report.physical_product_id);
                const productName = productNames?.find(
                  (p) => p.id === (product as any)?.product?.id
                )?.name || 'Produit inconnu';

                return (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{productName}</TableCell>
                    <TableCell className="text-right">{report.beginning_inventory}</TableCell>
                    <TableCell className="text-right">{report.ending_inventory}</TableCell>
                    <TableCell className="text-right">{report.units_sold}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {report.turnover_change_percentage && report.turnover_change_percentage > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : report.turnover_change_percentage && report.turnover_change_percentage < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : null}
                        {report.inventory_turnover_ratio.toFixed(2)}x
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {report.days_sales_of_inventory.toFixed(0)} jours
                    </TableCell>
                    <TableCell>{getVelocityBadge(report.stock_velocity)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}



