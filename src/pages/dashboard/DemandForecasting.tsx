/**
 * Page de Prévisions de Demande
 * Date: 31 Janvier 2025
 * 
 * Interface complète pour :
 * - Visualiser les prévisions de demande
 * - Générer des prévisions
 * - Voir les suggestions de réapprovisionnement
 * - Analyser la précision des prévisions
 */

import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Package,
  Calendar,
  Target,
  Loader2,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/useStore';
import { exportReorderSuggestionsToCSV, exportDemandForecastsToCSV } from '@/lib/inventory-export';

interface DemandForecast {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  forecast_period_start: string;
  forecast_period_end: string;
  forecast_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  forecasted_quantity: number;
  confidence_level: number;
  forecast_method: string;
  method_parameters: Record<string, any>;
  historical_data_points: number;
  mae?: number;
  mse?: number;
  mape?: number;
  is_active: boolean;
  last_updated: string;
  products?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

interface ReorderSuggestion {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  current_stock: number;
  forecasted_demand: number;
  safety_stock: number;
  reorder_point: number;
  suggested_quantity: number;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  estimated_stockout_date?: string;
  suggested_supplier_id?: string;
  estimated_cost?: number;
  status: 'pending' | 'reviewed' | 'ordered' | 'dismissed';
  products?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

export default function DemandForecasting() {
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedTab, setSelectedTab] = useState<'forecasts' | 'suggestions' | 'analytics'>('suggestions');
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [generateForm, setGenerateForm] = useState({
    forecast_method: 'moving_average',
    periods: '30',
    forecast_days: '30',
  });

  // Fetch forecasts
  const { data: forecasts = [], isLoading: forecastsLoading } = useQuery({
    queryKey: ['demand-forecasts', store?.id],
    queryFn: async (): Promise<DemandForecast[]> => {
      if (!store?.id) return [];

      const { data, error } = await supabase
        .from('demand_forecasts')
        .select(`
          *,
          products (
            id,
            name,
            image_url
          )
        `)
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('last_updated', { ascending: false });

      if (error) {
        logger.error('Error fetching demand forecasts', { error });
        return [];
      }

      return (data || []) as DemandForecast[];
    },
    enabled: !!store?.id,
  });

  // Fetch reorder suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading, refetch: refetchSuggestions } = useQuery({
    queryKey: ['reorder-suggestions', store?.id, urgencyFilter, statusFilter],
    queryFn: async (): Promise<ReorderSuggestion[]> => {
      if (!store?.id) return [];

      let  query= supabase
        .from('reorder_suggestions')
        .select(`
          *,
          products (
            id,
            name,
            image_url
          )
        `)
        .eq('store_id', store.id);

      if (urgencyFilter !== 'all') {
        query = query.eq('urgency_level', urgencyFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('urgency_level', { ascending: false })
        .order('estimated_stockout_date', { ascending: true });

      if (error) {
        logger.error('Error fetching reorder suggestions', { error });
        return [];
      }

      return (data || []) as ReorderSuggestion[];
    },
    enabled: !!store?.id,
  });

  // Generate suggestions mutation
  const generateSuggestions = useMutation({
    mutationFn: async () => {
      if (!store?.id) throw new Error('Store ID manquant');

      const { data, error } = await supabase.rpc('generate_reorder_suggestions', {
        p_store_id: store.id,
        p_urgency_filter: null,
      });

      if (error) {
        logger.error('Error generating reorder suggestions', { error });
        throw error;
      }

      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      setIsGenerateDialogOpen(false);
      toast({
        title: '✅ Suggestions générées',
        description: `${count} suggestion(s) de réapprovisionnement créée(s)`,
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de générer les suggestions',
        variant: 'destructive',
      });
    },
  });

  // Update suggestion status mutation
  const updateSuggestionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReorderSuggestion['status'] }) => {
      const { error } = await supabase
        .from('reorder_suggestions')
        .update({ status })
        .eq('id', id);

      if (error) {
        logger.error('Error updating suggestion status', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut de la suggestion a été mis à jour',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });

  // Stats
  const stats = useMemo(() => {
    const critical = suggestions.filter((s) => s.urgency_level === 'critical').length;
    const high = suggestions.filter((s) => s.urgency_level === 'high').length;
    const medium = suggestions.filter((s) => s.urgency_level === 'medium').length;
    const low = suggestions.filter((s) => s.urgency_level === 'low').length;
    const pending = suggestions.filter((s) => s.status === 'pending').length;
    const totalSuggestedQuantity = suggestions.reduce((sum, s) => sum + s.suggested_quantity, 0);
    const totalEstimatedCost = suggestions.reduce((sum, s) => sum + (s.estimated_cost || 0), 0);

    return {
      total: suggestions.length,
      critical,
      high,
      medium,
      low,
      pending,
      totalSuggestedQuantity,
      totalEstimatedCost,
    };
  }, [suggestions]);

  // Get urgency badge
  const getUrgencyBadge = (urgency: string) => {
    const  config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      critical: { label: 'Critique', variant: 'destructive', className: 'bg-red-600 text-white' },
      high: { label: 'Élevée', variant: 'destructive', className: 'bg-orange-600 text-white' },
      medium: { label: 'Moyenne', variant: 'secondary', className: 'bg-yellow-600 text-white' },
      low: { label: 'Faible', variant: 'outline', className: '' },
    };

    const cfg = config[urgency] || { label: urgency, variant: 'secondary' as const, className: '' };

    return (
      <Badge variant={cfg.variant} className={cn(cfg.className)}>
        {cfg.label}
      </Badge>
    );
  };

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  if (storeLoading || forecastsLoading || suggestionsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Prévisions de Demande
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Analysez la demande et recevez des suggestions de réapprovisionnement
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetchSuggestions()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    try {
                      exportReorderSuggestionsToCSV(suggestions.map((s) => ({
                        product_name: s.products?.name || 'Produit',
                        current_stock: s.current_stock,
                        forecasted_demand: s.forecasted_demand,
                        safety_stock: s.safety_stock,
                        reorder_point: s.reorder_point,
                        suggested_quantity: s.suggested_quantity,
                        urgency_level: s.urgency_level,
                        estimated_stockout_date: s.estimated_stockout_date,
                        estimated_cost: s.estimated_cost,
                        status: s.status,
                      })));
                      toast({
                        title: '✅ Export réussi',
                        description: `${suggestions.length} suggestion(s) exportée(s) en CSV`,
                      });
                    } catch ( _error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : String(error);
                      toast({
                        title: '❌ Erreur',
                        description: errorMessage || 'Impossible d\'exporter les données',
                        variant: 'destructive',
                      });
                    }
                  }}
                  disabled={suggestions.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter CSV
                </Button>
                <Button onClick={() => setIsGenerateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Générer suggestions
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Critique</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.critical}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Élevée</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">{stats.high}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Moyenne</CardTitle>
                  <Target className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.medium}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Faible</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.low}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">En attente</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.pending}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Quantité suggérée</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalSuggestedQuantity.toLocaleString('fr-FR')}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Coût estimé</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">
                    {stats.totalEstimatedCost.toLocaleString('fr-FR')} XOF
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertes critiques */}
            {stats.critical > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{stats.critical} produit(s) en urgence critique</strong> - Rupture de stock imminente. Action requise immédiatement.
                </AlertDescription>
              </Alert>
            )}

            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les urgences</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="reviewed">Revu</SelectItem>
                      <SelectItem value="ordered">Commandé</SelectItem>
                      <SelectItem value="dismissed">Ignoré</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
              <TabsList>
                <TabsTrigger value="suggestions">
                  <Package className="h-4 w-4 mr-2" />
                  Suggestions ({suggestions.length})
                </TabsTrigger>
                <TabsTrigger value="forecasts">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Prévisions ({forecasts.length})
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="space-y-4">
                {suggestions.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Aucune suggestion de réapprovisionnement</p>
                      <Button onClick={() => setIsGenerateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Générer des suggestions
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Suggestions de Réapprovisionnement</CardTitle>
                      <CardDescription>
                        {suggestions.length} suggestion(s) trouvée(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produit</TableHead>
                              <TableHead>Stock actuel</TableHead>
                              <TableHead>Demande prévue</TableHead>
                              <TableHead>Point de réappro.</TableHead>
                              <TableHead>Quantité suggérée</TableHead>
                              <TableHead>Urgence</TableHead>
                              <TableHead>Rupture estimée</TableHead>
                              <TableHead>Coût estimé</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {suggestions.map((suggestion) => (
                              <TableRow key={suggestion.id}>
                                <TableCell className="font-medium">
                                  {suggestion.products?.name || 'Produit'}
                                </TableCell>
                                <TableCell>
                                  <span className={cn(
                                    suggestion.current_stock === 0 && 'text-red-600 font-semibold',
                                    suggestion.current_stock <= suggestion.safety_stock && 'text-orange-600 font-semibold'
                                  )}>
                                    {suggestion.current_stock}
                                  </span>
                                </TableCell>
                                <TableCell>{suggestion.forecasted_demand}</TableCell>
                                <TableCell>{suggestion.reorder_point}</TableCell>
                                <TableCell className="font-semibold text-blue-600">
                                  {suggestion.suggested_quantity}
                                </TableCell>
                                <TableCell>{getUrgencyBadge(suggestion.urgency_level)}</TableCell>
                                <TableCell>
                                  {suggestion.estimated_stockout_date
                                    ? format(new Date(suggestion.estimated_stockout_date), 'dd MMM yyyy', { locale: fr })
                                    : '-'}
                                </TableCell>
                                <TableCell>
                                  {suggestion.estimated_cost
                                    ? `${suggestion.estimated_cost.toLocaleString('fr-FR')} XOF`
                                    : '-'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{suggestion.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {suggestion.status === 'pending' && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => updateSuggestionStatus.mutate({ id: suggestion.id, status: 'reviewed' })}
                                        >
                                          Revu
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => updateSuggestionStatus.mutate({ id: suggestion.id, status: 'ordered' })}
                                        >
                                          Commandé
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="forecasts" className="space-y-4">
                {forecasts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucune prévision disponible</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          try {
                            exportDemandForecastsToCSV(forecasts.map((f) => ({
                              product_name: f.products?.name || 'Produit',
                              forecast_period_start: f.forecast_period_start,
                              forecast_period_end: f.forecast_period_end,
                              forecast_type: f.forecast_type,
                              forecasted_quantity: f.forecasted_quantity,
                              confidence_level: f.confidence_level,
                              forecast_method: f.forecast_method,
                              historical_data_points: f.historical_data_points,
                              mae: f.mae,
                              mse: f.mse,
                              mape: f.mape,
                            })));
                            toast({
                              title: '✅ Export réussi',
                              description: `${forecasts.length} prévision(s) exportée(s) en CSV`,
                            });
                          } catch ( _error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : String(error);
                            toast({
                              title: '❌ Erreur',
                              description: errorMessage || 'Impossible d\'exporter les données',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter CSV
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {forecasts.map((forecast) => (
                        <Card key={forecast.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>{forecast.products?.name || 'Produit'}</CardTitle>
                                <CardDescription>
                                  {format(new Date(forecast.forecast_period_start), 'dd MMM yyyy', { locale: fr })} -{' '}
                                  {format(new Date(forecast.forecast_period_end), 'dd MMM yyyy', { locale: fr })}
                                </CardDescription>
                              </div>
                              <Badge variant="outline">{forecast.forecast_method}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Quantité prévue</Label>
                                <p className="font-bold text-2xl">{forecast.forecasted_quantity}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Niveau de confiance</Label>
                                <p className="font-bold text-2xl">{(forecast.confidence_level * 100).toFixed(0)}%</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Points de données</Label>
                                <p className="font-bold text-2xl">{forecast.historical_data_points}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">MAPE</Label>
                                <p className="font-bold text-2xl">
                                  {forecast.mape ? `${forecast.mape.toFixed(1)}%` : '-'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics des Prévisions</CardTitle>
                    <CardDescription>
                      Analysez la précision de vos prévisions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Les analytics détaillés seront disponibles prochainement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Generate Suggestions Dialog */}
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Générer des suggestions de réapprovisionnement</DialogTitle>
                  <DialogDescription>
                    Analysez vos stocks et générez des suggestions automatiques
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label>Méthode de prévision</Label>
                    <Select
                      value={generateForm.forecast_method}
                      onValueChange={(v) => setGenerateForm({ ...generateForm, forecast_method: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moving_average">Moyenne mobile</SelectItem>
                        <SelectItem value="exponential_smoothing">Lissage exponentiel</SelectItem>
                        <SelectItem value="linear_regression">Régression linéaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsGenerateDialogOpen(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => generateSuggestions.mutate()}
                      disabled={generateSuggestions.isPending}
                      className="flex-1"
                    >
                      {generateSuggestions.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Générer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







