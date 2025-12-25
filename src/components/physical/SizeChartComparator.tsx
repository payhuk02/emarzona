/**
 * Size Chart Comparator - Comparateur Interactif de Tailles
 * Date: 2025
 *
 * Composant pour comparer les tailles entre différents systèmes (EU, US, UK, etc.)
 * et aider les clients à choisir la bonne taille
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ruler, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export type SizeSystem = 'eu' | 'us' | 'uk' | 'asia' | 'universal';

interface SizeChart {
  id: string;
  name: string;
  system: SizeSystem;
  sizes: string[];
  measurements: Array<{
    label: string;
    unit: 'cm' | 'inch' | 'mm';
    values: Record<string, number | string>;
    description?: string;
  }>;
}

interface SizeChartComparatorProps {
  sizeCharts: SizeChart[];
  onSizeSelect?: (size: string, system: SizeSystem) => void;
  className?: string;
}

// Conversion entre systèmes de tailles (approximatif)
const SIZE_CONVERSIONS: Record<SizeSystem, Record<string, string[]>> = {
  eu: {
    XS: ['XS', 'XS', '4'],
    S: ['S', 'S', '6'],
    M: ['M', 'M', '8'],
    L: ['L', 'L', '10'],
    XL: ['XL', 'XL', '12'],
    XXL: ['XXL', 'XXL', '14'],
    '36': ['36', '5', '3'],
    '38': ['38', '6', '4'],
    '40': ['40', '7', '5'],
    '42': ['42', '8', '6'],
    '44': ['44', '9', '7'],
  },
  us: {
    XS: ['XS', 'XS', '4'],
    S: ['S', 'S', '6'],
    M: ['M', 'M', '8'],
    L: ['L', 'L', '10'],
    XL: ['XL', 'XL', '12'],
    XXL: ['XXL', 'XXL', '14'],
    '5': ['36', '5', '3'],
    '6': ['38', '6', '4'],
    '7': ['40', '7', '5'],
    '8': ['42', '8', '6'],
    '9': ['44', '9', '7'],
  },
  uk: {
    XS: ['XS', 'XS', '4'],
    S: ['S', 'S', '6'],
    M: ['M', 'M', '8'],
    L: ['L', 'L', '10'],
    XL: ['XL', 'XL', '12'],
    XXL: ['XXL', 'XXL', '14'],
    '3': ['36', '5', '3'],
    '4': ['38', '6', '4'],
    '5': ['40', '7', '5'],
    '6': ['42', '8', '6'],
    '7': ['44', '9', '7'],
  },
  asia: {},
  universal: {},
};

export function SizeChartComparator({
  sizeCharts,
  onSizeSelect,
  className,
}: SizeChartComparatorProps) {
  const [selectedSystem, setSelectedSystem] = useState<SizeSystem>('eu');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [userMeasurements, setUserMeasurements] = useState<Record<string, number>>({});

  // Trouver le size chart pour le système sélectionné
  const currentChart = useMemo(() => {
    return sizeCharts.find(chart => chart.system === selectedSystem) || sizeCharts[0];
  }, [sizeCharts, selectedSystem]);

  // Calculer la taille recommandée basée sur les mesures de l'utilisateur
  const recommendedSize = useMemo<{ size: string; score: number } | null>(() => {
    if (!currentChart || Object.keys(userMeasurements).length === 0) return null;

    let bestMatch: { size: string; score: number } | null = null;

    currentChart.sizes.forEach(size => {
      let score = 0;
      let totalWeight = 0;

      currentChart.measurements.forEach(measurement => {
        const userValue = userMeasurements[measurement.label];
        if (userValue && measurement.values[size]) {
          const chartValue = Number(measurement.values[size]);
          const diff = Math.abs(userValue - chartValue);
          const tolerance = chartValue * 0.05; // 5% de tolérance

          // Score inversement proportionnel à la différence
          const weight = 1;
          totalWeight += weight;
          score += weight * (1 - Math.min(diff / tolerance, 1));
        }
      });

      if (totalWeight > 0) {
        const finalScore = score / totalWeight;
        if (!bestMatch || finalScore > bestMatch.score) {
          bestMatch = { size, score: finalScore };
        }
      }
    });

    return bestMatch;
  }, [currentChart, userMeasurements]);

  // Obtenir les tailles équivalentes dans d'autres systèmes
  const equivalentSizes = useMemo<Record<SizeSystem, string | null>>(() => {
    if (!selectedSize || !currentChart) {
      return {
        eu: null,
        us: null,
        uk: null,
        asia: null,
        universal: null,
      };
    }

    const conversions: Record<SizeSystem, string | null> = {
      eu: null,
      us: null,
      uk: null,
      asia: null,
      universal: null,
    };

    // Trouver la conversion
    const conversion = SIZE_CONVERSIONS[currentChart.system]?.[selectedSize];
    if (conversion) {
      conversions.eu = conversion[0];
      conversions.us = conversion[1];
      conversions.uk = conversion[2];
    } else {
      conversions[currentChart.system] = selectedSize;
    }

    return conversions;
  }, [selectedSize, currentChart]);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    onSizeSelect?.(size, selectedSystem);
  };

  const handleMeasurementChange = (label: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setUserMeasurements(prev => ({
        ...prev,
        [label]: numValue,
      }));
    }
  };

  const getSystemLabel = (system: SizeSystem) => {
    const labels: Record<SizeSystem, string> = {
      eu: 'Europe (EU)',
      us: 'États-Unis (US)',
      uk: 'Royaume-Uni (UK)',
      asia: 'Asie',
      universal: 'Universel',
    };
    return labels[system] || system;
  };

  if (sizeCharts.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Aucun guide des tailles disponible</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Sélecteur de système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Comparateur de Tailles
          </CardTitle>
          <CardDescription>
            Comparez les tailles entre différents systèmes et trouvez votre taille idéale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélection système */}
          <div className="space-y-2">
            <Label>Système de tailles</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(sizeCharts.map(c => c.system))).map(system => (
                <Button
                  key={system}
                  variant={selectedSystem === system ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedSystem(system);
                    setSelectedSize(null);
                  }}
                >
                  {getSystemLabel(system)}
                </Button>
              ))}
            </div>
          </div>

          {/* Tableau de comparaison */}
          {currentChart && (
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chart">Guide des Tailles</TabsTrigger>
                <TabsTrigger value="calculator">Calculateur de Taille</TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mesure</TableHead>
                        {currentChart.sizes.map(size => (
                          <TableHead
                            key={size}
                            className={cn(
                              'text-center cursor-pointer transition-colors',
                              selectedSize === size && 'bg-primary/10 font-bold'
                            )}
                            onClick={() => handleSizeSelect(size)}
                          >
                            {size}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentChart.measurements.map((measurement, index) => (
                        <TableRow key={index}>
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
                          {currentChart.sizes.map(size => (
                            <TableCell
                              key={size}
                              className={cn('text-center', selectedSize === size && 'bg-primary/5')}
                            >
                              {measurement.values[size] !== undefined
                                ? `${measurement.values[size]} ${measurement.unit}`
                                : '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Tailles équivalentes */}
                {selectedSize && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Taille sélectionnée: {selectedSize}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(equivalentSizes).map(([system, size]) => {
                            if (!size || system === selectedSystem) return null;
                            return (
                              <Badge key={system} variant="outline">
                                {getSystemLabel(system as SizeSystem)}: {size}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="calculator" className="space-y-4">
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Entrez vos mesures pour obtenir une recommandation de taille personnalisée
                    </AlertDescription>
                  </Alert>

                  {/* Champs de mesures */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {currentChart.measurements.map((measurement, index) => (
                      <div key={index} className="space-y-2">
                        <Label htmlFor={`measurement-${index}`}>
                          {measurement.label} ({measurement.unit})
                        </Label>
                        <Input
                          id={`measurement-${index}`}
                          type="number"
                          step="0.1"
                          placeholder={`Ex: ${measurement.values[currentChart.sizes[0]] || ''}`}
                          value={userMeasurements[measurement.label] || ''}
                          onChange={e => handleMeasurementChange(measurement.label, e.target.value)}
                        />
                        {measurement.description && (
                          <p className="text-xs text-muted-foreground">{measurement.description}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Recommandation */}
                  {recommendedSize && (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium text-green-900 dark:text-green-100">
                            Taille recommandée: <strong>{recommendedSize.size}</strong>
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-200">
                            Correspondance: {Math.round(recommendedSize.score * 100)}%
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSizeSelect(recommendedSize.size)}
                            className="mt-2"
                          >
                            Sélectionner cette taille
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
