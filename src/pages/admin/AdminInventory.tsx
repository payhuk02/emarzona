/**
 * Admin Inventory Dashboard
 * Vue globale de l'inventaire de tous les vendeurs
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Warehouse,
  Search,
  AlertTriangle,
  TrendingUp,
  Package,
  DollarSign,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminInventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  // Fetch all inventory items
  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_product_inventory')
        .select(`
          *,
          variant:physical_product_variants(
            id,
            variant_name,
            product:physical_products(
              id,
              name,
              store:stores(id, name)
            )
          )
        `)
        .order('quantity', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Stats optimisées avec useMemo
  const stats = useMemo(() => ({
    totalItems: inventoryItems?.length || 0,
    lowStockItems: inventoryItems?.filter(item => 
      item.quantity <= (item.low_stock_threshold || 10)
    ).length || 0,
    outOfStockItems: inventoryItems?.filter(item => item.quantity === 0).length || 0,
    totalValue: inventoryItems?.reduce((sum, item) => 
      sum + (item.quantity * (item.variant?.product?.price || 0)), 0
    ) || 0,
  }), [inventoryItems]);

  useEffect(() => {
    if (!isLoading && inventoryItems) {
      logger.info(`Admin Inventory: ${inventoryItems.length} articles d'inventaire chargés`);
    }
  }, [isLoading, inventoryItems]);

  // Filter items optimisé avec useMemo
  const filteredItems = useMemo(() => inventoryItems?.filter(item => {
    const matchesSearch = 
      item.variant?.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variant?.variant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variant?.product?.store?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'low' && item.quantity <= (item.low_stock_threshold || 10)) ||
      (activeTab === 'out' && item.quantity === 0);

    return matchesSearch && matchesTab;
  }) || [], [inventoryItems, searchQuery, activeTab]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div ref={headerRef} className="flex items-center justify-between" role="banner">
              <div>
                <h1 className="text-3xl font-bold tracking-tight" id="admin-inventory-title">Inventaire Global</h1>
                <p className="text-muted-foreground">
                  Vue d'ensemble de l'inventaire de tous les vendeurs
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                Exporter CSV
              </Button>
            </div>

            {/* Stats Cards */}
            <div ref={statsRef} className="grid gap-4 md:grid-cols-4" role="region" aria-label="Statistiques de l'inventaire">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalItems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rupture Stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalValue.toLocaleString()} FCFA</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="all">Tous</TabsTrigger>
                      <TabsTrigger value="low">Stock Faible</TabsTrigger>
                      <TabsTrigger value="out">Rupture</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : filteredItems && filteredItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Variante</TableHead>
                        <TableHead>Boutique</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Seuil</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.variant?.product?.name || 'N/A'}
                          </TableCell>
                          <TableCell>{item.variant?.variant_name || '-'}</TableCell>
                          <TableCell>{item.variant?.product?.store?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={item.quantity === 0 ? 'text-red-600 font-bold' : ''}>
                              {item.quantity}
                            </span>
                          </TableCell>
                          <TableCell>{item.low_stock_threshold || 10}</TableCell>
                          <TableCell>
                            {item.quantity === 0 ? (
                              <Badge variant="destructive">Rupture</Badge>
                            ) : item.quantity <= (item.low_stock_threshold || 10) ? (
                              <Badge variant="secondary">Stock Faible</Badge>
                            ) : (
                              <Badge variant="default">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun article</h3>
                    <p className="text-muted-foreground">Aucun article d'inventaire trouvé.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

