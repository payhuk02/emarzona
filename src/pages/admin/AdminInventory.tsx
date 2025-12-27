/**
 * Admin Inventory Dashboard
 * Vue globale de l'inventaire de tous les vendeurs
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
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
  const isMobile = useIsMobile();

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
        .select(
          `
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
        `
        )
        .order('quantity', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Stats optimisées avec useMemo
  const stats = useMemo(
    () => ({
      totalItems: inventoryItems?.length || 0,
      lowStockItems:
        inventoryItems?.filter(item => item.quantity <= (item.low_stock_threshold || 10)).length ||
        0,
      outOfStockItems: inventoryItems?.filter(item => item.quantity === 0).length || 0,
      totalValue:
        inventoryItems?.reduce(
          (sum, item) => sum + item.quantity * (item.variant?.product?.price || 0),
          0
        ) || 0,
    }),
    [inventoryItems]
  );

  useEffect(() => {
    if (!isLoading && inventoryItems) {
      logger.info(`Admin Inventory: ${inventoryItems.length} articles d'inventaire chargés`);
    }
  }, [isLoading, inventoryItems]);

  // Filter items optimisé avec useMemo
  const filteredItems = useMemo(
    () =>
      inventoryItems?.filter(item => {
        const matchesSearch =
          item.variant?.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.variant?.variant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.variant?.product?.store?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab =
          activeTab === 'all' ||
          (activeTab === 'low' && item.quantity <= (item.low_stock_threshold || 10)) ||
          (activeTab === 'out' && item.quantity === 0);

        return matchesSearch && matchesTab;
      }) || [],
    [inventoryItems, searchQuery, activeTab]
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              role="banner"
            >
              <div>
                <h1
                  className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"
                  id="admin-inventory-title"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Warehouse
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Inventaire Global
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Vue d'ensemble de l'inventaire de tous les vendeurs
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] text-xs sm:text-sm w-full sm:w-auto"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Exporter CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            </div>

            {/* Stats Cards */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
              role="region"
              aria-label="Statistiques de l'inventaire"
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    Total Articles
                  </CardTitle>
                  <Package
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">
                    {stats.totalItems}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    Stock Faible
                  </CardTitle>
                  <AlertTriangle
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-orange-500"
                    aria-hidden="true"
                  />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-orange-600">
                    {stats.lowStockItems}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    Rupture Stock
                  </CardTitle>
                  <AlertTriangle
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-red-500"
                    aria-hidden="true"
                  />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-red-600">
                    {stats.outOfStockItems}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    Valeur Totale
                  </CardTitle>
                  <DollarSign
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold break-words">
                    {stats.totalValue.toLocaleString()} FCFA
                  </div>
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
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-8 min-h-[44px] text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 gap-1.5 sm:gap-2">
                      <TabsTrigger
                        value="all"
                        className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        Tous
                      </TabsTrigger>
                      <TabsTrigger
                        value="low"
                        className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        <span className="hidden sm:inline">Stock Faible</span>
                        <span className="sm:hidden">Faible</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="out"
                        className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        Rupture
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : filteredItems && filteredItems.length > 0 ? (
                  isMobile ? (
                    <MobileTableCard
                      data={filteredItems.map(item => ({ ...item, id: item.id }))}
                      columns={[
                        {
                          key: 'product',
                          header: 'Produit',
                          priority: 'high',
                          render: row => (
                            <div>
                              <p className="font-medium">{row.variant?.product?.name || 'N/A'}</p>
                              {row.variant?.variant_name && (
                                <p className="text-xs text-muted-foreground">
                                  {row.variant.variant_name}
                                </p>
                              )}
                            </div>
                          ),
                        },
                        {
                          key: 'store',
                          header: 'Boutique',
                          priority: 'medium',
                          render: row => <span>{row.variant?.product?.store?.name || 'N/A'}</span>,
                        },
                        {
                          key: 'quantity',
                          header: 'Quantité',
                          priority: 'high',
                          render: row => (
                            <span
                              className={
                                row.quantity === 0 ? 'text-red-600 font-bold' : 'font-semibold'
                              }
                            >
                              {row.quantity}
                            </span>
                          ),
                        },
                        {
                          key: 'threshold',
                          header: 'Seuil',
                          priority: 'low',
                          render: row => <span>{row.low_stock_threshold || 10}</span>,
                        },
                        {
                          key: 'status',
                          header: 'Statut',
                          priority: 'high',
                          render: row =>
                            row.quantity === 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                Rupture
                              </Badge>
                            ) : row.quantity <= (row.low_stock_threshold || 10) ? (
                              <Badge variant="secondary" className="text-xs">
                                Stock Faible
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                OK
                              </Badge>
                            ),
                        },
                      ]}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px] sm:text-xs md:text-sm">
                              Produit
                            </TableHead>
                            <TableHead className="text-[10px] sm:text-xs md:text-sm hidden sm:table-cell">
                              Variante
                            </TableHead>
                            <TableHead className="text-[10px] sm:text-xs md:text-sm hidden md:table-cell">
                              Boutique
                            </TableHead>
                            <TableHead className="text-[10px] sm:text-xs md:text-sm">
                              Quantité
                            </TableHead>
                            <TableHead className="text-[10px] sm:text-xs md:text-sm hidden lg:table-cell">
                              Seuil
                            </TableHead>
                            <TableHead className="text-[10px] sm:text-xs md:text-sm">
                              Statut
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium text-xs sm:text-sm">
                                {item.variant?.product?.name || 'N/A'}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                                {item.variant?.variant_name || '-'}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                                {item.variant?.product?.store?.name || 'N/A'}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                <span
                                  className={item.quantity === 0 ? 'text-red-600 font-bold' : ''}
                                >
                                  {item.quantity}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                                {item.low_stock_threshold || 10}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {item.quantity === 0 ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-[9px] sm:text-[10px] md:text-xs"
                                  >
                                    Rupture
                                  </Badge>
                                ) : item.quantity <= (item.low_stock_threshold || 10) ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] sm:text-[10px] md:text-xs"
                                  >
                                    Stock Faible
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="default"
                                    className="text-[9px] sm:text-[10px] md:text-xs"
                                  >
                                    OK
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
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






