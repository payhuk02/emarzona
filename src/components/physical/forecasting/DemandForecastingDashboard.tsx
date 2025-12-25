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
import { useDemandForecasts, useCalculateForecast, useReorderRecommendations, useGenerateReorderRecommendations, useUpdateRecommendationStatus, type DemandForecast, type ReorderRecommendation } from '@/hooks/physical/useDemandForecasting';
import { useStore } from '@/hooks/useStore';
import { TrendingUp, TrendingDown, AlertTriangle, Package, Calculator, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

// Types étendus avec relation product
interface DemandForecastWithProduct extends DemandForecast {
  product?: {
    id: string;
    name: string;
    image_url?: string | null;
  } | null;
}

interface ReorderRecommendationWithProduct extends ReorderRecommendation {
  product?: {
    id: string;
    name: string;
    image_url?: string | null;
  } | null;
}

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de calculer la prévision',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!store?.id) return;

    try {
      await generateRecommendations.mutateAsync(store.id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de générer les recommandations',
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

  // Animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const actionsRef = useScrollAnimation<HTMLDivElement>();
  const forecastsRef = useScrollAnimation<HTMLDivElement>();

  if (forecastsLoading || recommendationsLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-auto" />
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const urgentRecommendations = (recommendations?.filter(r => r.priority === 'urgent' && r.status === 'pending') || []) as ReorderRecommendationWithProduct[];
  const pendingRecommendations = (recommendations?.filter(r => r.status === 'pending') || []) as ReorderRecommendationWithProduct[];
  const forecastsWithProducts = (forecasts || []) as DemandForecastWithProduct[];
  const avgConfidence = forecastsWithProducts.length > 0
    ? (forecastsWithProducts.reduce((sum, f) => sum + f.confidence_level, 0) / forecastsWithProducts.length * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Action Buttons */}
      <div
        ref={actionsRef}
        className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <Button 
          onClick={() => setIsForecastDialogOpen(true)} 
          variant="outline"
          className="h-10 sm:h-11 flex-1 sm:flex-none"
        >
          <Calculator className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Calculer prévision</span>
          <span className="sm:hidden">Calculer</span>
        </Button>
        <Button 
          onClick={handleGenerateRecommendations} 
          disabled={generateRecommendations.isPending}
          className="h-10 sm:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1 sm:flex-none"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${generateRecommendations.isPending ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Générer recommandations</span>
          <span className="sm:hidden">Recommandations</span>
        </Button>
      </div>

      {/* Stats Cards - Responsive & Animated */}
      <div
        ref={statsRef}
        className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {[
          {
            label: 'Prévisions actives',
            value: forecastsWithProducts.length,
            icon: TrendingUp,
            color: 'from-purple-600 to-pink-600',
          },
          {
            label: 'Recommandations urgentes',
            value: urgentRecommendations.length,
            icon: AlertTriangle,
            color: 'from-red-600 to-rose-600',
          },
          {
            label: 'Recommandations en attente',
            value: pendingRecommendations.length,
            icon: Clock,
            color: 'from-yellow-600 to-orange-600',
          },
          {
            label: 'Confiance moyenne',
            value: `${avgConfidence}%`,
            icon: CheckCircle2,
            color: 'from-green-600 to-emerald-600',
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommandations Urgentes */}
      {urgentRecommendations.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/10 to-rose-500/5 backdrop-blur-sm border border-red-500/20">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 dark:text-red-400" />
              </div>
              Recommandations Urgentes
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {urgentRecommendations.length} recommandation{urgentRecommendations.length > 1 ? 's' : ''} nécessitant une attention immédiate
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Produit</TableHead>
                    <TableHead className="text-xs sm:text-sm">Stock actuel</TableHead>
                    <TableHead className="text-xs sm:text-sm">Demande prévue</TableHead>
                    <TableHead className="text-xs sm:text-sm">Jours avant rupture</TableHead>
                    <TableHead className="text-xs sm:text-sm">Quantité recommandée</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urgentRecommendations.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="text-xs sm:text-sm">
                        {rec.product?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant={rec.current_stock <= 5 ? 'destructive' : 'secondary'} className="text-xs">
                          {rec.current_stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{rec.forecasted_demand}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {rec.days_until_stockout !== null && rec.days_until_stockout !== undefined ? (
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {rec.days_until_stockout} jour{rec.days_until_stockout > 1 ? 's' : ''}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant="outline" className="text-xs">{rec.recommended_quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={rec.status}
                          onValueChange={(value) => handleUpdateRecommendationStatus(rec.id, value)}
                        >
                          <SelectTrigger className="w-28 sm:w-32 h-8 sm:h-10 text-xs sm:text-sm">
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
      <Card 
        ref={forecastsRef}
        className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            Prévisions de Demande
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {forecastsWithProducts.length} prévision{forecastsWithProducts.length > 1 ? 's' : ''} active{forecastsWithProducts.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {forecastsWithProducts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                Aucune prévision disponible
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Calculez une prévision pour commencer
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Produit</TableHead>
                    <TableHead className="text-xs sm:text-sm">Type</TableHead>
                    <TableHead className="text-xs sm:text-sm">Période</TableHead>
                    <TableHead className="text-xs sm:text-sm">Quantité prévue</TableHead>
                    <TableHead className="text-xs sm:text-sm">Revenu prévu</TableHead>
                    <TableHead className="text-xs sm:text-sm">Confiance</TableHead>
                    <TableHead className="text-xs sm:text-sm">Méthode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecastsWithProducts.map((forecast) => (
                    <TableRow key={forecast.id}>
                      <TableCell className="text-xs sm:text-sm">
                        {forecast.product?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant="secondary" className="text-xs">{forecast.forecast_type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {format(new Date(forecast.forecast_period_start), 'dd MMM', { locale: fr })} - {' '}
                        {format(new Date(forecast.forecast_period_end), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                          {forecast.forecasted_quantity}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                        }).format(forecast.forecasted_revenue)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-1">
                          {forecast.confidence_level >= 0.8 ? (
                            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                          )}
                          <span className="text-xs sm:text-sm">
                            {(forecast.confidence_level * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant="outline" className="text-xs">
                          {forecast.forecast_method.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Calculate Forecast */}
      <Dialog open={isForecastDialogOpen} onOpenChange={setIsForecastDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Calculer une prévision</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Calculez une prévision de demande pour un produit
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCalculateForecast}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product_id" className="text-xs sm:text-sm">ID Produit *</Label>
                <Input
                  id="product_id"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  placeholder="UUID du produit"
                  required
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forecast_type" className="text-xs sm:text-sm">Type de prévision *</Label>
                  <Select
                    value={forecastType}
                    onValueChange={(value: string) => setForecastType(value)}
                    required
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
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
                  <Label htmlFor="forecast_method" className="text-xs sm:text-sm">Méthode *</Label>
                  <Select
                    value={forecastMethod}
                    onValueChange={(value: string) => setForecastMethod(value)}
                    required
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
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
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsForecastDialogOpen(false)}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={calculateForecast.isPending}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {calculateForecast.isPending ? 'Calcul...' : 'Calculer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

