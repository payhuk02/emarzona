/**
 * Demand Forecasting Dashboard Component
 * Date: 27 Janvier 2025
 * 
 * Dashboard analytics pour les prévisions de demande
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDemandForecasts, useCalculateForecast, useReorderRecommendations, useGenerateReorderRecommendations, useUpdateRecommendationStatus } from '@/hooks/physical/useDemandForecasting';
import { useStore } from '@/hooks/useStore';
import { TrendingUp, TrendingDown, AlertTriangle, Package, Calculator, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function DemandForecastingDashboard() {
  const { store } = useStore();
  const { data: forecasts, isLoading: forecastsLoading } = useDemandForecasts(store?.id);
  const { data: recommendations, isLoading: recommendationsLoading } = useReorderRecommendations(store?.id);
  const calculateForecast = useCalculateForecast();
  const generateRecommendations = useGenerateReorderRecommendations();
  const updateStatus = useUpdateRecommendationStatus();
  const { toast } = useToast();

  const [isForecastDialogOpen, setIsForecastDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [forecastType, setForecastType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [forecastMethod, setForecastMethod] = useState<'moving_average' | 'exponential_smoothing'>('moving_average');

  const handleCalculateForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id || !selectedProductId) return;

    try {
      await calculateForecast.mutateAsync({
        storeId: store.id,
        productId: selectedProductId,
        forecastType,
        forecastDate: new Date().toISOString().split('T')[0],
        method: forecastMethod,
        periods: forecastMethod === 'moving_average' ? 30 : undefined,
        alpha: forecastMethod === 'exponential_smoothing' ? 0.3 : undefined,
      });
      setIsForecastDialogOpen(false);
      setSelectedProductId('');
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de calculer la prévision',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!store?.id) return;

    try {
      await generateRecommendations.mutateAsync(store.id);
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de générer les recommandations',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRecommendationStatus = async (recommendationId: string, status: string) => {
    await updateStatus.mutateAsync({
      recommendationId,
      status: status as any,
    });
  };

  if (forecastsLoading || recommendationsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const urgentRecommendations = recommendations?.filter(r => r.priority === 'urgent' && r.status === 'pending') || [];
  const pendingRecommendations = recommendations?.filter(r => r.status === 'pending') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Prévisions de Demande</h2>
          <p className="text-muted-foreground">
            Analysez les tendances et prévoyez la demande future
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsForecastDialogOpen(true)} variant="outline">
            <Calculator className="mr-2 h-4 w-4" />
            Calculer prévision
          </Button>
          <Button onClick={handleGenerateRecommendations} disabled={generateRecommendations.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${generateRecommendations.isPending ? 'animate-spin' : ''}`} />
            Générer recommandations
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prévisions actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecasts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recommandations urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{urgentRecommendations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recommandations en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRecommendations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confiance moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecasts && forecasts.length > 0
                ? `${(forecasts.reduce((sum, f) => sum + f.confidence_level, 0) / forecasts.length * 100).toFixed(0)}%`
                : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommandations Urgentes */}
      {urgentRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Recommandations Urgentes
            </CardTitle>
            <CardDescription>
              {urgentRecommendations.length} recommandation{urgentRecommendations.length > 1 ? 's' : ''} nécessitant une attention immédiate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Stock actuel</TableHead>
                    <TableHead>Demande prévue</TableHead>
                    <TableHead>Jours avant rupture</TableHead>
                    <TableHead>Quantité recommandée</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urgentRecommendations.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        {(rec.product as any)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rec.current_stock <= 5 ? 'destructive' : 'secondary'}>
                          {rec.current_stock}
                        </Badge>
                      </TableCell>
                      <TableCell>{rec.forecasted_demand}</TableCell>
                      <TableCell>
                        {rec.days_until_stockout !== null && rec.days_until_stockout !== undefined ? (
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {rec.days_until_stockout} jour{rec.days_until_stockout > 1 ? 's' : ''}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rec.recommended_quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={rec.status}
                          onValueChange={(value) => handleUpdateRecommendationStatus(rec.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="approved">Approuvé</SelectItem>
                            <SelectItem value="ordered">Commandé</SelectItem>
                            <SelectItem value="dismissed">Ignoré</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prévisions */}
      <Card>
        <CardHeader>
          <CardTitle>Prévisions de Demande</CardTitle>
          <CardDescription>
            {forecasts?.length || 0} prévision{forecasts && forecasts.length > 1 ? 's' : ''} active{forecasts && forecasts.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Quantité prévue</TableHead>
                  <TableHead>Revenu prévu</TableHead>
                  <TableHead>Confiance</TableHead>
                  <TableHead>Méthode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!forecasts || forecasts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Aucune prévision disponible
                    </TableCell>
                  </TableRow>
                ) : (
                  forecasts.map((forecast) => (
                    <TableRow key={forecast.id}>
                      <TableCell>
                        {(forecast.product as any)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{forecast.forecast_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(forecast.forecast_period_start), 'dd MMM', { locale: fr })} - {' '}
                        {format(new Date(forecast.forecast_period_end), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {forecast.forecasted_quantity}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                        }).format(forecast.forecasted_revenue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {forecast.confidence_level >= 0.8 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm">
                            {(forecast.confidence_level * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {forecast.forecast_method.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Calculate Forecast */}
      <Dialog open={isForecastDialogOpen} onOpenChange={setIsForecastDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculer une prévision</DialogTitle>
            <DialogDescription>
              Calculez une prévision de demande pour un produit
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCalculateForecast}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product_id">ID Produit *</Label>
                <Input
                  id="product_id"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  placeholder="UUID du produit"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forecast_type">Type de prévision *</Label>
                  <Select
                    value={forecastType}
                    onValueChange={(value: any) => setForecastType(value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forecast_method">Méthode *</Label>
                  <Select
                    value={forecastMethod}
                    onValueChange={(value: any) => setForecastMethod(value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moving_average">Moyenne mobile</SelectItem>
                      <SelectItem value="exponential_smoothing">Lissage exponentiel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsForecastDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={calculateForecast.isPending}>
                {calculateForecast.isPending ? 'Calcul...' : 'Calculer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

