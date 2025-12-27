/**
 * Composant SizeChartDisplay - Affichage du guide des tailles
 * Date: 26 Janvier 2025
 * Amélioré: 2025 - Ajout comparateur interactif et support multi-régions
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Ruler, AlertCircle, GitCompare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { SizeChartComparator } from './SizeChartComparator';
import { logger } from '@/lib/logger';

interface SizeChartDisplayProps {
  sizeChartId: string;
  showComparator?: boolean;
  relatedSizeCharts?: string[]; // IDs de size charts liés (autres systèmes)
  className?: string;
}

export function SizeChartDisplay({
  sizeChartId,
  showComparator = true,
  relatedSizeCharts = [],
  className,
}: SizeChartDisplayProps) {
  const [viewMode, setViewMode] = useState<'table' | 'comparator'>('table');
  // Charger le size chart principal
  const {
    data: sizeChart,
    isLoading,
    error,
  } = useQuery({
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

  // Charger les size charts liés pour le comparateur
  const { data: relatedCharts = [] } = useQuery({
    queryKey: ['related-size-charts', relatedSizeCharts],
    queryFn: async () => {
      if (relatedSizeCharts.length === 0) return [];

      const { data, error } = await supabase
        .from('size_charts')
        .select(
          `
          *,
          size_chart_measurements (*)
        `
        )
        .in('id', relatedSizeCharts);

      if (error) {
        logger.error('Error fetching related size charts', { error });
        return [];
      }

      interface SizeChartMeasurement {
        label: string;
        unit: string;
        values: Record<string, unknown>;
        description?: string;
      }

      interface SizeChartData {
        id: string;
        name: string;
        system: string;
        sizes: string[];
        size_chart_measurements?: SizeChartMeasurement[];
      }

      return (data || []).map((chart: SizeChartData) => ({
        id: chart.id,
        name: chart.name,
        system: chart.system,
        sizes: chart.sizes || [],
        measurements: (chart.size_chart_measurements || []).map((m: SizeChartMeasurement) => ({
          label: m.label,
          unit: m.unit,
          values: m.values || {},
          description: m.description,
        })),
      }));
    },
    enabled: relatedSizeCharts.length > 0,
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
        <AlertDescription>Impossible de charger le guide des tailles</AlertDescription>
      </Alert>
    );
  }

  const sizes = sizeChart.sizes || [];
  const measurements = sizeChart.measurements || [];

  if (sizes.length === 0) {
    return null;
  }

  const getSystemLabel = (system: string) => {
    const  labels: Record<string, string> = {
      eu: 'EU',
      us: 'US',
      uk: 'UK',
      asia: 'Asie',
      universal: 'Universel',
    };
    return labels[system] || system.toUpperCase();
  };

  // Préparer les données pour le comparateur
  const allChartsForComparator = [
    {
      id: sizeChart.id,
      name: sizeChart.name,
      system: sizeChart.system,
      sizes: sizes,
      measurements: measurements.map(
        (m: {
          label: string;
          unit: string;
          values: Record<string, unknown>;
          description?: string;
        }) => ({
          label: m.label,
          unit: m.unit,
          values: m.values || {},
          description: m.description,
        })
      ),
    },
    ...relatedCharts,
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Guide des Tailles
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{getSystemLabel(sizeChart.system)}</Badge>
              {sizeChart.name !== 'Default' && (
                <span className="text-sm text-muted-foreground">{sizeChart.name}</span>
              )}
            </CardDescription>
          </div>
          {showComparator && allChartsForComparator.length > 1 && (
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Ruler className="h-4 w-4 mr-2" />
                Tableau
              </Button>
              <Button
                variant={viewMode === 'comparator' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('comparator')}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Comparateur
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'table' ? (
          measurements.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mesure</TableHead>
                    {sizes.map(size => (
                      <TableHead key={size} className="text-center font-semibold">
                        {size}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurements.map(
                    (
                      measurement: {
                        id?: string;
                        label: string;
                        unit: string;
                        values?: Record<string, unknown>;
                        description?: string;
                      },
                      index: number
                    ) => (
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
                        {sizes.map(size => (
                          <TableCell key={size} className="text-center">
                            {measurement.values?.[size] !== undefined
                              ? `${measurement.values[size]} ${measurement.unit}`
                              : '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Aucune mesure disponible pour ce guide des tailles.
              </AlertDescription>
            </Alert>
          )
        ) : (
          <SizeChartComparator
            sizeCharts={allChartsForComparator}
            onSizeSelect={(size, system) => {
              // Callback pour sélectionner une taille
              logger.debug('Size selected', { size, system });
            }}
          />
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






