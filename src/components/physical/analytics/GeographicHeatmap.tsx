/**
 * Heatmap géographique des ventes
 * Date: 28 Janvier 2025
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GeographicSalesPerformance } from '@/hooks/physical/usePhysicalAnalytics';
import { MapPin, TrendingUp } from 'lucide-react';

interface GeographicHeatmapProps {
  geographicSales: GeographicSalesPerformance[];
}

export function GeographicHeatmap({ geographicSales }: GeographicHeatmapProps) {
  // Aggregate by country
  const countryData = geographicSales.reduce((acc: any[], item) => {
    const existing = acc.find((a) => a.country === item.country);
    if (existing) {
      existing.revenue += item.total_revenue || 0;
      existing.orders += item.total_orders || 0;
      existing.customers += item.unique_customers || 0;
    } else {
      acc.push({
        country: item.country,
        region: item.region,
        revenue: item.total_revenue || 0,
        orders: item.total_orders || 0,
        customers: item.unique_customers || 0,
        avgOrderValue: item.average_order_value || 0,
        repeatRate: item.repeat_customer_rate || 0,
      });
    }
    return acc;
  }, []).sort((a, b) => b.revenue - a.revenue);

  // Get max revenue for color intensity
  const maxRevenue = Math.max(...countryData.map((c) => c.revenue), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Performance Géographique
        </CardTitle>
        <CardDescription>
          Répartition des ventes par pays et région
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pays / Région</TableHead>
              <TableHead className="text-right">Revenus</TableHead>
              <TableHead className="text-right">Commandes</TableHead>
              <TableHead className="text-right">Clients</TableHead>
              <TableHead className="text-right">Panier Moyen</TableHead>
              <TableHead className="text-right">Taux Répétition</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countryData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucune donnée géographique disponible
                </TableCell>
              </TableRow>
            ) : (
              countryData.map((country, index) => {
                const intensity = (country.revenue / maxRevenue) * 100;
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${intensity / 100})`,
                          }}
                        />
                        <div>
                          <div className="font-medium">{country.country}</div>
                          {country.region && (
                            <div className="text-sm text-muted-foreground">{country.region}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                      }).format(country.revenue)}
                    </TableCell>
                    <TableCell className="text-right">{country.orders}</TableCell>
                    <TableCell className="text-right">{country.customers}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                      }).format(country.avgOrderValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={country.repeatRate > 30 ? 'default' : 'secondary'}>
                        {country.repeatRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
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



