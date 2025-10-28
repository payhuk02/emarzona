/**
 * Shipping Dashboard
 * Date: 28 octobre 2025
 * 
 * Dashboard principal pour gérer les expéditions FedEx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Search,
  Plus,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useShipments, useUpdateShipmentTracking } from '@/hooks/shipping/useFedexShipping';
import { useStore } from '@/hooks/useStore';
import { ShipmentCard } from '@/components/shipping/ShipmentCard';
import { CreateShipmentDialog } from '@/components/shipping/CreateShipmentDialog';

export default function ShippingDashboard() {
  const navigate = useNavigate();
  const { data: store } = useStore();
  const { data: shipments, isLoading } = useShipments(store?.id || '');
  const updateTracking = useUpdateShipmentTracking();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Filter shipments
  const filteredShipments = shipments?.filter((shipment) => {
    const matchesSearch =
      shipment.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.order?.order_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && ['pending', 'label_created'].includes(shipment.status)) ||
      (activeTab === 'transit' && ['picked_up', 'in_transit', 'out_for_delivery'].includes(shipment.status)) ||
      (activeTab === 'delivered' && shipment.status === 'delivered') ||
      (activeTab === 'issues' && ['failed', 'returned', 'cancelled'].includes(shipment.status));

    return matchesSearch && matchesTab;
  });

  // Stats
  const stats = {
    total: shipments?.length || 0,
    pending: shipments?.filter((s) => ['pending', 'label_created'].includes(s.status)).length || 0,
    transit: shipments?.filter((s) => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length || 0,
    delivered: shipments?.filter((s) => s.status === 'delivered').length || 0,
  };

  const handleRefreshTracking = async (shipmentId: string) => {
    await updateTracking.mutateAsync(shipmentId);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Truck className="h-8 w-8 text-primary" />
                  Expéditions FedEx
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gérez vos envois et suivez vos colis en temps réel
                </p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Nouvelle expédition
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">En attente</p>
                      <p className="text-2xl font-bold">{stats.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">En transit</p>
                      <p className="text-2xl font-bold">{stats.transit}</p>
                    </div>
                    <Truck className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Livrés</p>
                      <p className="text-2xl font-bold">{stats.delivered}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Search & Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par numéro de tracking ou commande..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    filteredShipments?.forEach((shipment) => {
                      handleRefreshTracking(shipment.id);
                    });
                  }}
                  disabled={updateTracking.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${updateTracking.isPending ? 'animate-spin' : ''}`} />
                  Rafraîchir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                Tous ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pending">
                En attente ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="transit">
                En transit ({stats.transit})
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Livrés ({stats.delivered})
              </TabsTrigger>
              <TabsTrigger value="issues">
                Problèmes
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredShipments && filteredShipments.length > 0 ? (
                filteredShipments.map((shipment) => (
                  <ShipmentCard
                    key={shipment.id}
                    shipment={shipment}
                    onRefresh={() => handleRefreshTracking(shipment.id)}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      Aucune expédition trouvée
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {searchQuery
                        ? 'Essayez une autre recherche'
                        : 'Créez votre première expédition pour commencer'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Create Shipment Dialog */}
          <CreateShipmentDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            storeId={store?.id || ''}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}

