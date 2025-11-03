/**
 * Composant PhysicalSizeChartSelector - Sélection/Création de size chart
 * Date: 26 Janvier 2025
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SizeChartBuilder, type SizeChart } from '@/components/physical/SizeChartBuilder';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/hooks/useStore';
import { Ruler, Plus, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhysicalSizeChartSelectorProps {
  selectedSizeChartId?: string;
  onSelectSizeChart: (sizeChartId: string | null) => void;
}

export function PhysicalSizeChartSelector({
  selectedSizeChartId,
  onSelectSizeChart,
}: PhysicalSizeChartSelectorProps) {
  const { store } = useStore();
  const { toast } = useToast();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [newChart, setNewChart] = useState<SizeChart | null>(null);

  // Récupérer les size charts de la boutique
  const { data: sizeCharts, refetch } = useQuery({
    queryKey: ['size-charts', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      const { data, error } = await supabase
        .from('size_charts')
        .select(`
          *,
          size_chart_measurements (
            *
          )
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching size charts:', error);
        return [];
      }

      // Mapper les données au format attendu par SizeChart
      return (data || []).map((chart: any) => ({
        id: chart.id,
        name: chart.name,
        system: chart.system,
        sizes: chart.sizes || [],
        measurements: (chart.size_chart_measurements || []).map((m: any) => ({
          label: m.label,
          unit: m.unit,
          values: m.values || {},
          description: m.description,
        })),
        notes: chart.notes,
        is_default: chart.is_default,
        created_at: chart.created_at,
        updated_at: chart.updated_at,
      }));
    },
    enabled: !!store?.id,
  });

  // Récupérer le size chart sélectionné avec ses mesures
  const { data: selectedChart } = useQuery({
    queryKey: ['size-chart', selectedSizeChartId],
    queryFn: async () => {
      if (!selectedSizeChartId) return null;

      const { data: chart, error: chartError } = await supabase
        .from('size_charts')
        .select('*')
        .eq('id', selectedSizeChartId)
        .single();

      if (chartError || !chart) return null;

      const { data: measurements } = await supabase
        .from('size_chart_measurements')
        .select('*')
        .eq('size_chart_id', selectedSizeChartId)
        .order('display_order', { ascending: true });

      return {
        id: chart.id,
        name: chart.name,
        system: chart.system,
        sizes: chart.sizes || [],
        measurements: (measurements || []).map((m: any) => ({
          label: m.label,
          unit: m.unit,
          values: m.values || {},
          description: m.description,
        })),
        notes: chart.notes,
        is_default: chart.is_default,
        created_at: chart.created_at,
        updated_at: chart.updated_at,
      };
    },
    enabled: !!selectedSizeChartId,
  });

  const handleSaveChart = async (chart: SizeChart) => {
    if (!store?.id) {
      toast({
        title: 'Erreur',
        description: 'Boutique non trouvée',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Si c'est une mise à jour
      if (chart.id && chart.id.startsWith('temp-') === false) {
        // Mettre à jour le chart existant
        const { error: updateError } = await supabase
          .from('size_charts')
          .update({
            name: chart.name,
            system: chart.system,
            sizes: chart.sizes,
            notes: chart.notes,
            is_default: chart.is_default,
            updated_at: new Date().toISOString(),
          })
          .eq('id', chart.id);

        if (updateError) throw updateError;

        // Supprimer les anciennes mesures
        await supabase
          .from('size_chart_measurements')
          .delete()
          .eq('size_chart_id', chart.id);

        // Créer les nouvelles mesures
        if (chart.measurements.length > 0) {
          const measurementsData = chart.measurements.map((m, index) => ({
            size_chart_id: chart.id,
            label: m.label,
            unit: m.unit,
            values: m.values,
            description: m.description,
            display_order: index,
          }));

          const { error: measurementsError } = await supabase
            .from('size_chart_measurements')
            .insert(measurementsData);

          if (measurementsError) throw measurementsError;
        }

        toast({
          title: '✅ Size chart mis à jour',
          description: 'Le guide des tailles a été mis à jour avec succès',
        });
      } else {
        // Créer un nouveau chart
        const { data: newChartData, error: createError } = await supabase
          .from('size_charts')
          .insert({
            store_id: store.id,
            name: chart.name,
            system: chart.system,
            sizes: chart.sizes,
            notes: chart.notes,
            is_default: chart.is_default,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Créer les mesures
        if (chart.measurements.length > 0 && newChartData) {
          const measurementsData = chart.measurements.map((m, index) => ({
            size_chart_id: newChartData.id,
            label: m.label,
            unit: m.unit,
            values: m.values,
            description: m.description,
            display_order: index,
          }));

          const { error: measurementsError } = await supabase
            .from('size_chart_measurements')
            .insert(measurementsData);

          if (measurementsError) throw measurementsError;
        }

        toast({
          title: '✅ Size chart créé',
          description: 'Le guide des tailles a été créé avec succès',
        });

        // Sélectionner automatiquement le nouveau chart
        onSelectSizeChart(newChartData.id);
      }

      setIsBuilderOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder le size chart',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          Guide des Tailles (Size Chart)
        </CardTitle>
        <CardDescription>
          Ajoutez un guide des tailles pour aider vos clients à choisir la bonne taille
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sélection size chart existant */}
        <div className="space-y-2">
          <Label>Size Chart existant</Label>
          <div className="flex gap-2">
            <Select
              value={selectedSizeChartId || ''}
              onValueChange={(value) => onSelectSizeChart(value || null)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Aucun size chart sélectionné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun size chart</SelectItem>
                {sizeCharts?.map((chart) => (
                  <SelectItem key={chart.id} value={chart.id}>
                    {chart.name} ({chart.system.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un Guide des Tailles</DialogTitle>
                  <DialogDescription>
                    Créez un nouveau guide des tailles avec mesures personnalisées
                  </DialogDescription>
                </DialogHeader>
                <SizeChartBuilder
                  onSave={handleSaveChart}
                  initialChart={newChart || undefined}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Aperçu du size chart sélectionné */}
        {selectedChart && (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>{selectedChart.name}</strong> ({selectedChart.system.toUpperCase()})
                  {selectedChart.notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {selectedChart.notes}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectSizeChart(null)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Info */}
        {!selectedSizeChartId && (
          <Alert>
            <AlertDescription>
              Les guides des tailles aident les clients à choisir la bonne taille. Vous pouvez
              créer un nouveau guide ou utiliser un guide existant.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

