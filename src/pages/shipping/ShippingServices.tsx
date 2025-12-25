/**
 * 🚚 Services de Livraison - Gestion Complète
 * Page de gestion des services de livraison pour produits physiques
 * Gère les transporteurs, zones de livraison, tarifs et configurations
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Truck,
  Plus,
  Settings,
  MapPin,
  DollarSign,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Edit,
  Trash2,
  Globe,
  Package,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { ShippingCarriersManager } from '@/components/shipping/ShippingCarriersManager';
import { ShippingZonesManager } from '@/components/shipping/ShippingZonesManager';
import { ShippingRatesManager } from '@/components/shipping/ShippingRatesManager';
import { ShippingSettings } from '@/components/shipping/ShippingSettings';

export default function ShippingServices() {
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('carriers');

  // Charger les statistiques
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['shipping-services-stats', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;

      const [carriersResult, zonesResult, ratesResult] = await Promise.all([
        supabase
          .from('shipping_carriers')
          .select('id, is_active', { count: 'exact' })
          .eq('store_id', store.id),
        supabase
          .from('shipping_zones')
          .select('id, is_active', { count: 'exact' })
          .eq('store_id', store.id),
        supabase
          .from('shipping_rates')
          .select('id, is_active')
          .eq('shipping_zones.store_id', store.id)
          .limit(1000),
      ]);

      const activeCarriers = carriersResult.data?.filter((c) => c.is_active).length || 0;
      const activeZones = zonesResult.data?.filter((z) => z.is_active).length || 0;
      const activeRates = ratesResult.data?.filter((r) => r.is_active).length || 0;

      return {
        totalCarriers: carriersResult.count || 0,
        activeCarriers,
        totalZones: zonesResult.count || 0,
        activeZones,
        totalRates: ratesResult.data?.length || 0,
        activeRates,
      };
    },
    enabled: !!store?.id,
  });

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card>
                <CardContent className="p-12 text-center">
                  <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Aucune boutique trouvée</h2>
                  <p className="text-muted-foreground mb-6">
                    Vous devez créer une boutique avant de pouvoir gérer les services de livraison.
                  </p>
                </CardContent>
              </Card>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 backdrop-blur-sm border border-blue-500/20">
                    <Truck className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-500 dark:text-blue-400" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Services de Livraison
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Configurez vos transporteurs, zones de livraison et tarifs
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0"
              >
                <Link to="/dashboard/contact-shipping-service">
                  <Phone className="h-4 w-4 mr-2" />
                  Contacter un Service
                </Link>
              </Button>
            </div>

            {/* Stats Cards */}
            {statsLoading ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                      <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Transporteurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {stats?.totalCarriers || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.activeCarriers || 0} actif{stats?.activeCarriers !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Zones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {stats?.totalZones || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.activeZones || 0} active{stats?.activeZones !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                      <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Tarifs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {stats?.totalRates || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.activeRates || 0} actif{stats?.activeRates !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
                <TabsTrigger
                  value="carriers"
                  className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Transporteurs</span>
                  <span className="sm:hidden">Carriers</span>
                </TabsTrigger>
                <TabsTrigger
                  value="zones"
                  className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Zones</span>
                  <span className="sm:hidden">Zones</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rates"
                  className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Tarifs</span>
                  <span className="sm:hidden">Tarifs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Paramètres</span>
                  <span className="sm:hidden">Config</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="carriers" className="space-y-4">
                <ShippingCarriersManager storeId={store.id} />
              </TabsContent>

              <TabsContent value="zones" className="space-y-4">
                <ShippingZonesManager storeId={store.id} />
              </TabsContent>

              <TabsContent value="rates" className="space-y-4">
                <ShippingRatesManager storeId={store.id} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <ShippingSettings storeId={store.id} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

