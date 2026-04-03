/**
 * Page Price Stock Alerts - Mes Alertes (Customer Portal)
 * Date: 2 Février 2025
 * 
 * Fonctionnalités:
 * - Liste des alertes de prix
 * - Liste des alertes de stock
 * - Statistiques des alertes
 * - Gestion des alertes (suppression)
 * - Design responsive et moderne (style Inventaire/Mes Cours)
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { usePriceAlerts, useStockAlerts, useDeletePriceAlert, useDeleteStockAlert, PriceAlert, StockAlert } from '@/hooks/usePriceStockAlerts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, DollarSign, Package, Trash2, ExternalLink, TrendingDown, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { logger } from '@/lib/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PriceStockAlerts() {
  const [userId, setUserId] = useState<string | null>(null);
  const [deletingPriceAlert, setDeletingPriceAlert] = useState<string | null>(null);
  const [deletingStockAlert, setDeletingStockAlert] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'price' | 'stock'>('price');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const alertsRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          logger.error(userError instanceof Error ? userError : 'Error fetching user', { error: userError });
          setError('Erreur lors du chargement de l\'utilisateur');
          return;
        }
        setUserId(user?.id || null);
      } catch (err) {
        logger.error(err instanceof Error ? err : 'Error in fetchUser', { error: err });
        setError('Erreur lors du chargement de l\'utilisateur');
      }
    };
    fetchUser();
  }, []);

  const { data: priceAlerts, isLoading: priceAlertsLoading, error: priceAlertsError, refetch: refetchPriceAlerts } = usePriceAlerts(userId);
  const { data: stockAlerts, isLoading: stockAlertsLoading, error: stockAlertsError, refetch: refetchStockAlerts } = useStockAlerts(userId);
  const deletePriceAlert = useDeletePriceAlert();
  const deleteStockAlert = useDeleteStockAlert();

  // Stats calculées
  const stats = useMemo(() => {
    const priceAlertsCount = priceAlerts?.length || 0;
    const stockAlertsCount = stockAlerts?.length || 0;
    const totalAlerts = priceAlertsCount + stockAlertsCount;
    const priceAlertsReached = priceAlerts?.filter(alert => {
      const priceDifference = alert.current_price - alert.target_price;
      return priceDifference <= 0;
    }).length || 0;
    const stockAlertsInStock = stockAlerts?.filter(alert => {
      const stockQuantity = alert.products?.stock_quantity;
      const isInStock = stockQuantity !== null && stockQuantity !== undefined && stockQuantity > 0;
      return isInStock;
    }).length || 0;

    return {
      total: totalAlerts,
      price: priceAlertsCount,
      stock: stockAlertsCount,
      priceReached: priceAlertsReached,
      stockInStock: stockAlertsInStock,
    };
  }, [priceAlerts, stockAlerts]);

  const handleDeletePriceAlert = useCallback(async (alert: PriceAlert) => {
    if (!userId) return;

    try {
      await deletePriceAlert.mutateAsync({
        alertId: alert.id,
        userId,
      });
      setDeletingPriceAlert(null);
      toast({
        title: 'Alerte supprimée',
        description: 'L\'alerte de prix a été supprimée avec succès.',
      });
      logger.info('Price alert deleted', { alertId: alert.id });
    } catch (error) {
      logger.error(error instanceof Error ? error : 'Error deleting price alert', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'alerte de prix.',
        variant: 'destructive',
      });
    }
  }, [userId, deletePriceAlert, toast]);

  const handleDeleteStockAlert = useCallback(async (alert: StockAlert) => {
    if (!userId) return;

    try {
      await deleteStockAlert.mutateAsync({
        alertId: alert.id,
        userId,
      });
      setDeletingStockAlert(null);
      toast({
        title: 'Alerte supprimée',
        description: 'L\'alerte de stock a été supprimée avec succès.',
      });
      logger.info('Stock alert deleted', { alertId: alert.id });
    } catch (error) {
      logger.error(error instanceof Error ? error : 'Error deleting stock alert', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'alerte de stock.',
        variant: 'destructive',
      });
    }
  }, [userId, deleteStockAlert, toast]);

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refetchPriceAlerts(), refetchStockAlerts()]);
      toast({
        title: 'Rafraîchissement réussi',
        description: 'Les alertes ont été mises à jour.',
      });
      logger.info('Alerts refreshed', {});
    } catch (err) {
      logger.error(err instanceof Error ? err : 'Error refreshing alerts', { error: err });
      toast({
        title: 'Erreur',
        description: 'Impossible de rafraîchir les alertes.',
        variant: 'destructive',
      });
    }
  }, [refetchPriceAlerts, refetchStockAlerts, toast]);

  if (!userId) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Veuillez vous connecter pour voir vos alertes
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const isLoading = priceAlertsLoading || stockAlertsLoading;
  const hasError = priceAlertsError || stockAlertsError || error;

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement des alertes...</p>
              </div>
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
            {/* Header avec animation - Style Inventaire et Mes Cours */}
            <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400 fill-purple-500 dark:fill-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Mes Alertes
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Gérez vos alertes de prix et de stock pour ne rien manquer
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  variant="outline"
                  className="min-h-[44px] h-11 sm:h-12 transition-all hover:scale-105 text-xs sm:text-sm"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Rafraîchir</span>
                  <span className="sm:hidden">Raf.</span>
                </Button>
              </div>
            </div>

            {/* Gestion d'erreurs */}
            {hasError && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4 duration-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error || 'Une erreur est survenue lors du chargement des alertes. Veuillez réessayer.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Cards */}
            <div ref={statsRef} className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Alertes</p>
                      <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {stats.total}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                      <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Alertes Prix</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {stats.price}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                      <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Alertes Stock</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {stats.stock}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Objectifs Atteints</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                        {stats.priceReached + stats.stockInStock}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
                      <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs pour Alertes de prix et de stock */}
            <div ref={alertsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'price' | 'stock')} className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
                  <TabsTrigger
                    value="price"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px]"
                  >
                    <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Prix ({stats.price})
                  </TabsTrigger>
                  <TabsTrigger
                    value="stock"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px]"
                  >
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Stock ({stats.stock})
                  </TabsTrigger>
                </TabsList>

                {/* Alertes de prix */}
                <TabsContent value="price" className="space-y-4 sm:space-y-6">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        Alertes de prix
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Vous serez notifié lorsque le prix d'un produit atteint votre objectif
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {priceAlertsLoading ? (
                        <div className="space-y-4">
                          <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Chargement des alertes de prix...</p>
                          </div>
                        </div>
                      ) : priceAlerts && priceAlerts.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {priceAlerts.map((alert) => {
                            const product = alert.products;
                            if (!product) return null;

                            const currentPrice = alert.current_price;
                            const targetPrice = alert.target_price;
                            const priceDifference = currentPrice - targetPrice;
                            const priceDifferencePercent = ((priceDifference / targetPrice) * 100).toFixed(1);
                            const isTargetReached = priceDifference <= 0;

                            return (
                              <Card
                                key={alert.id}
                                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                              >
                                <CardContent className="p-3 sm:p-4">
                                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    {product.image_url && (
                                      <Link
                                        to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                                        className="flex-shrink-0 self-start"
                                      >
                                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
                                          <ResponsiveProductImage
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      </Link>
                                    )}
                                    <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                                      <div>
                                        <Link
                                          to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                                          className="hover:text-primary transition-colors"
                                        >
                                          <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2 break-words line-clamp-2">
                                            {product.name}
                                          </h3>
                                        </Link>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                          <div>
                                            <span className="font-medium">Prix actuel:</span>{' '}
                                            <span className="text-foreground font-semibold">
                                              {currentPrice.toLocaleString('fr-FR')} {alert.currency}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="font-medium">Prix cible:</span>{' '}
                                            <span className="text-foreground font-semibold">
                                              {targetPrice.toLocaleString('fr-FR')} {alert.currency}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {isTargetReached ? (
                                          <Badge className="bg-green-500 text-white text-xs sm:text-sm">
                                            <TrendingDown className="h-3 w-3 mr-1" />
                                            Objectif atteint ! ({Math.abs(parseFloat(priceDifferencePercent))}% de réduction)
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs sm:text-sm">
                                            Encore {priceDifference.toLocaleString('fr-FR')} {alert.currency} à économiser
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="min-h-[44px] touch-manipulation text-xs sm:text-sm flex-1 sm:flex-none"
                                      >
                                        <Link
                                          to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                                        >
                                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                          <span className="hidden sm:inline">Voir</span>
                                          <span className="sm:hidden">Voir</span>
                                        </Link>
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDeletingPriceAlert(alert.id)}
                                        className="min-h-[44px] touch-manipulation text-xs sm:text-sm"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                          <CardContent className="p-8 sm:p-12 text-center">
                            <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 animate-in zoom-in duration-500" />
                            <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucune alerte de prix</h3>
                            <p className="text-sm sm:text-base text-muted-foreground mb-4">
                              Vous n'avez aucune alerte de prix active
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Alertes de stock */}
                <TabsContent value="stock" className="space-y-4 sm:space-y-6">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                        Alertes de stock
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Vous serez notifié lorsque un produit sera de nouveau en stock
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stockAlertsLoading ? (
                        <div className="space-y-4">
                          <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Chargement des alertes de stock...</p>
                          </div>
                        </div>
                      ) : stockAlerts && stockAlerts.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {stockAlerts.map((alert) => {
                            const product = alert.products;
                            if (!product) return null;

                            const stockQuantity = product.stock_quantity;
                            const isInStock = stockQuantity !== null && stockQuantity !== undefined && stockQuantity > 0;

                            return (
                              <Card
                                key={alert.id}
                                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                              >
                                <CardContent className="p-3 sm:p-4">
                                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    {product.image_url && (
                                      <Link
                                        to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                                        className="flex-shrink-0 self-start"
                                      >
                                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
                                          <ResponsiveProductImage
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      </Link>
                                    )}
                                    <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                                      <div>
                                        <Link
                                          to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                                          className="hover:text-primary transition-colors"
                                        >
                                          <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2 break-words line-clamp-2">
                                            {product.name}
                                          </h3>
                                        </Link>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {isInStock && stockQuantity != null ? (
                                          <Badge className="bg-green-500 text-white text-xs sm:text-sm">
                                            <Package className="h-3 w-3 mr-1" />
                                            En stock ! ({stockQuantity} disponible{stockQuantity > 1 ? 's' : ''})
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs sm:text-sm">
                                            <Package className="h-3 w-3 mr-1" />
                                            En rupture de stock
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="min-h-[44px] touch-manipulation text-xs sm:text-sm flex-1 sm:flex-none"
                                      >
                                        <Link
                                          to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                                        >
                                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                          <span className="hidden sm:inline">Voir</span>
                                          <span className="sm:hidden">Voir</span>
                                        </Link>
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDeletingStockAlert(alert.id)}
                                        className="min-h-[44px] touch-manipulation text-xs sm:text-sm"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                          <CardContent className="p-8 sm:p-12 text-center">
                            <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 animate-in zoom-in duration-500" />
                            <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucune alerte de stock</h3>
                            <p className="text-sm sm:text-base text-muted-foreground mb-4">
                              Vous n'avez aucune alerte de stock active
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Dialogs de confirmation de suppression */}
            <AlertDialog open={deletingPriceAlert !== null} onOpenChange={(open) => !open && setDeletingPriceAlert(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer l'alerte de prix ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer cette alerte de prix ? Vous ne recevrez plus de notifications pour ce produit.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const alert = priceAlerts?.find((a) => a.id === deletingPriceAlert);
                      if (alert && userId) {
                        handleDeletePriceAlert(alert);
                      }
                    }}
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deletingStockAlert !== null} onOpenChange={(open) => !open && setDeletingStockAlert(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer l'alerte de stock ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer cette alerte de stock ? Vous ne recevrez plus de notifications pour ce produit.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const alert = stockAlerts?.find((a) => a.id === deletingStockAlert);
                      if (alert && userId) {
                        handleDeleteStockAlert(alert);
                      }
                    }}
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






