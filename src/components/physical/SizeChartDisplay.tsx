/**
 * Composant SizeChartDisplay - Affichage du guide des tailles
 * Date: 26 Janvier 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Ruler, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface SizeChartDisplayProps {
  sizeChartId: string;
}

export function SizeChartDisplay({ sizeChartId }: SizeChartDisplayProps) {
  const { data: sizeChart, isLoading, error } = useQuery({
    queryKey: ['size-chart', sizeChartId],
    queryFn: async () => {
      const { data: chart, error: chartError } = await supabase
        .from('size_charts')
        .select('*')
        .eq('id', sizeChartId)
        .single();

      if (chartError) throw chartError;

      const { data: measurements } = await supabase
        .from('size_chart_measurements')
        .select('*')
        .eq('size_chart_id', sizeChartId)
        .order('display_order', { ascending: true });

      return {
        ...chart,
        measurements: measurements || [],
      };
    },
    enabled: !!sizeChartId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !sizeChart) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Impossible de charger le guide des tailles
        </AlertDescription>
      </Alert>
    );
  }

  const sizes = sizeChart.sizes || [];
  const measurements = sizeChart.measurements || [];

  if (sizes.length === 0) {
    return null;
  }

  const getSystemLabel = (system: string) => {
    const labels: Record<string, string> = {
      eu: 'EU',
      us: 'US',
      uk: 'UK',
      asia: 'Asie',
      universal: 'Universel',
    };
    return labels[system] || system.toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          Guide des Tailles
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Badge variant="outline">{getSystemLabel(sizeChart.system)}</Badge>
          {sizeChart.name !== 'Default' && (
            <span className="text-sm text-muted-foreground">{sizeChart.name}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {measurements.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mesure</TableHead>
                  {sizes.map((size) => (
                    <TableHead key={size} className="text-center font-semibold">
                      {size}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurements.map((measurement: any, index: number) => (
                  <TableRow key={measurement.id || index}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{measurement.label}</div>
                        {measurement.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {measurement.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {sizes.map((size) => (
                      <TableCell key={size} className="text-center">
                        {measurement.values?.[size] !== undefined
                          ? `${measurement.values[size]} ${measurement.unit}`
                          : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              Aucune mesure disponible pour ce guide des tailles.
            </AlertDescription>
          </Alert>
        )}

        {sizeChart.notes && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{sizeChart.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

