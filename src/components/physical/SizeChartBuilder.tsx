import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Ruler,
  Plus,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  Eye,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type MeasurementUnit = 'cm' | 'inch' | 'mm';
export type SizeSystem = 'eu' | 'us' | 'uk' | 'asia' | 'universal';

export interface SizeChartMeasurement {
  label: string; // e.g., "Tour de poitrine", "Longueur", "Largeur épaules"
  unit: MeasurementUnit;
  values: Record<string, number | string>; // size name -> measurement value
  description?: string;
}

export interface SizeChart {
  id: string;
  name: string;
  system: SizeSystem;
  sizes: string[]; // e.g., ["XS", "S", "M", "L", "XL"]
  measurements: SizeChartMeasurement[];
  notes?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SizeChartBuilderProps {
  productId?: string;
  initialChart?: SizeChart;
  onSave?: (chart: SizeChart) => void;
  className?: string;
}

// ============================================================================
// TEMPLATES
// ============================================================================

const SIZE_TEMPLATES: Record<string, Partial<SizeChart>> = {
  tshirt_eu: {
    name: 'T-Shirt Standard (EU)',
    system: 'eu',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    measurements: [
      {
        label: 'Tour de poitrine',
        unit: 'cm',
        values: { XS: 86, S: 91, M: 96, L: 101, XL: 106, XXL: 111 },
      },
      {
        label: 'Longueur',
        unit: 'cm',
        values: { XS: 68, S: 70, M: 72, L: 74, XL: 76, XXL: 78 },
      },
      {
        label: 'Largeur épaules',
        unit: 'cm',
        values: { XS: 41, S: 42, M: 44, L: 46, XL: 48, XXL: 50 },
      },
    ],
  },
  shoes_eu: {
    name: 'Chaussures (EU)',
    system: 'eu',
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
    measurements: [
      {
        label: 'Longueur du pied',
        unit: 'cm',
        values: {
          '36': 23.0,
          '37': 23.5,
          '38': 24.0,
          '39': 24.5,
          '40': 25.0,
          '41': 25.5,
          '42': 26.0,
          '43': 26.5,
          '44': 27.0,
          '45': 27.5,
        },
      },
    ],
  },
  pants_universal: {
    name: 'Pantalon Universel',
    system: 'universal',
    sizes: ['28', '30', '32', '34', '36', '38', '40'],
    measurements: [
      {
        label: 'Tour de taille',
        unit: 'cm',
        values: { '28': 71, '30': 76, '32': 81, '34': 86, '36': 91, '38': 96, '40': 101 },
      },
      {
        label: 'Tour de hanches',
        unit: 'cm',
        values: { '28': 89, '30': 94, '32': 99, '34': 104, '36': 109, '38': 114, '40': 119 },
      },
      {
        label: 'Longueur jambe',
        unit: 'cm',
        values: { '28': 81, '30': 81, '32': 81, '34': 81, '36': 81, '38': 81, '40': 81 },
      },
    ],
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SizeChartBuilder({
  productId,
  initialChart,
  onSave,
  className,
}: SizeChartBuilderProps) {
  const [chart, setChart] = useState<Partial<SizeChart>>(
    initialChart || {
      name: '',
      system: 'eu',
      sizes: [],
      measurements: [],
      is_default: false,
    }
  );

  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');
  const [newMeasurementLabel, setNewMeasurementLabel] = useState('');

  // Add size
  const handleAddSize = () => {
    if (!newSizeName.trim() || chart.sizes?.includes(newSizeName.trim())) return;

    setChart((prev) => ({
      ...prev,
      sizes: [...(prev.sizes || []), newSizeName.trim()],
    }));
    setNewSizeName('');
  };

  // Remove size
  const handleRemoveSize = (sizeName: string) => {
    setChart((prev) => ({
      ...prev,
      sizes: prev.sizes?.filter((s) => s !== sizeName) || [],
      measurements: prev.measurements?.map((m) => {
        const newValues = { ...m.values };
        delete newValues[sizeName];
        return { ...m, values: newValues };
      }) || [],
    }));
  };

  // Add measurement
  const handleAddMeasurement = () => {
    if (!newMeasurementLabel.trim()) return;

    const newMeasurement: SizeChartMeasurement = {
      label: newMeasurementLabel.trim(),
      unit: 'cm',
      values: {},
    };

    // Initialize values for all sizes
    chart.sizes?.forEach((size) => {
      newMeasurement.values[size] = '';
    });

    setChart((prev) => ({
      ...prev,
      measurements: [...(prev.measurements || []), newMeasurement],
    }));
    setNewMeasurementLabel('');
  };

  // Remove measurement
  const handleRemoveMeasurement = (index: number) => {
    setChart((prev) => ({
      ...prev,
      measurements: prev.measurements?.filter((_, i) => i !== index) || [],
    }));
  };

  // Update measurement value
  const handleUpdateMeasurement = (
    measurementIndex: number,
    sizeName: string,
    value: string | number
  ) => {
    setChart((prev) => ({
      ...prev,
      measurements: prev.measurements?.map((m, i) => {
        if (i !== measurementIndex) return m;
        return {
          ...m,
          values: {
            ...m.values,
            [sizeName]: value,
          },
        };
      }) || [],
    }));
  };

  // Load template
  const handleLoadTemplate = (templateKey: string) => {
    const template = SIZE_TEMPLATES[templateKey];
    if (!template) return;

    setChart({
      ...template,
      id: chart.id || `chart_${Date.now()}`,
      created_at: chart.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_default: false,
    });
    setShowTemplates(false);
  };

  // Save chart
  const handleSave = () => {
    if (!chart.name || !chart.sizes || chart.sizes.length === 0) {
      alert('Veuillez remplir le nom et ajouter au moins une taille');
      return;
    }

    const finalChart: SizeChart = {
      id: chart.id || `chart_${Date.now()}`,
      name: chart.name,
      system: chart.system || 'universal',
      sizes: chart.sizes,
      measurements: chart.measurements || [],
      notes: chart.notes,
      is_default: chart.is_default || false,
      created_at: chart.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave?.(finalChart);
  };

  // Export as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(chart, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guide-tailles-${chart.name?.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Créateur de Guide des Tailles</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Créez un guide des tailles professionnel pour vos produits
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplates(true)} className="gap-2">
              <Copy className="h-4 w-4" />
              Modèles
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2">
              <Eye className="h-4 w-4" />
              Aperçu
            </Button>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Sauvegarder
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="chart-name">Nom du Guide *</Label>
              <Input
                id="chart-name"
                placeholder="Ex: Guide T-Shirt Homme"
                value={chart.name || ''}
                onChange={(e) => setChart({ ...chart, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size-system">Système de Tailles</Label>
              <Select
                value={chart.system || 'universal'}
                onValueChange={(value: SizeSystem) => setChart({ ...chart, system: value })}
              >
                <SelectTrigger id="size-system">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eu">Europe (EU)</SelectItem>
                  <SelectItem value="us">États-Unis (US)</SelectItem>
                  <SelectItem value="uk">Royaume-Uni (UK)</SelectItem>
                  <SelectItem value="asia">Asie</SelectItem>
                  <SelectItem value="universal">Universel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tailles ({chart.sizes?.length || 0})</Label>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Ex: S, M, L, XL, 38, 40..."
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSize()}
              />
              <Button onClick={handleAddSize} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>

            {chart.sizes && chart.sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chart.sizes.map((size) => (
                  <Badge key={size} variant="secondary" className="gap-2 px-3 py-1">
                    {size}
                    <button
                      onClick={() => handleRemoveSize(size)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Measurements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Mesures ({chart.measurements?.length || 0})</Label>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Ex: Tour de poitrine, Longueur, Largeur..."
                value={newMeasurementLabel}
                onChange={(e) => setNewMeasurementLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMeasurement()}
              />
              <Button
                onClick={handleAddMeasurement}
                disabled={!chart.sizes || chart.sizes.length === 0}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>

            {(!chart.sizes || chart.sizes.length === 0) && (
              <p className="text-sm text-muted-foreground">
                ⚠️ Ajoutez d'abord des tailles avant d'ajouter des mesures
              </p>
            )}

            {chart.measurements && chart.measurements.length > 0 && chart.sizes && chart.sizes.length > 0 && (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Mesure</TableHead>
                      {chart.sizes.map((size) => (
                        <TableHead key={size} className="text-center">
                          {size}
                        </TableHead>
                      ))}
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chart.measurements.map((measurement, mIndex) => (
                      <TableRow key={mIndex}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{measurement.label}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {measurement.unit}
                            </Badge>
                          </div>
                        </TableCell>
                        {chart.sizes!.map((size) => (
                          <TableCell key={size}>
                            <Input
                              type="text"
                              placeholder="-"
                              value={measurement.values[size] || ''}
                              onChange={(e) =>
                                handleUpdateMeasurement(mIndex, size, e.target.value)
                              }
                              className="text-center"
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMeasurement(mIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Les mesures sont en centimètres. Mesurez à plat. Tolérance ±1cm."
              value={chart.notes || ''}
              onChange={(e) => setChart({ ...chart, notes: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modèles de Guide des Tailles</DialogTitle>
            <DialogDescription>
              Sélectionnez un modèle pré-configuré pour démarrer rapidement
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2 py-4">
            {Object.entries(SIZE_TEMPLATES).map(([key, template]) => (
              <Card key={key} className="cursor-pointer hover:border-primary" onClick={() => handleLoadTemplate(key)}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    {template.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Système:</span> {template.system?.toUpperCase()}
                    </p>
                    <p>
                      <span className="font-medium">Tailles:</span> {template.sizes?.join(', ')}
                    </p>
                    <p>
                      <span className="font-medium">Mesures:</span> {template.measurements?.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplates(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{chart.name || 'Guide des Tailles'}</DialogTitle>
            <DialogDescription>
              Aperçu du guide tel qu'il apparaîtra aux clients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {chart.measurements && chart.measurements.length > 0 && chart.sizes && chart.sizes.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mesure</TableHead>
                      {chart.sizes.map((size) => (
                        <TableHead key={size} className="text-center font-bold">
                          {size}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chart.measurements.map((measurement, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {measurement.label} ({measurement.unit})
                        </TableCell>
                        {chart.sizes!.map((size) => (
                          <TableCell key={size} className="text-center">
                            {measurement.values[size] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Aucune donnée à afficher. Ajoutez des tailles et des mesures.
              </p>
            )}

            {chart.notes && (
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm font-medium mb-2">📏 Notes importantes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{chart.notes}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

