/**
 * Digital Bundles List Page
 * Date: 27 Janvier 2025
 * 
 * Page de gestion des bundles de produits digitaux
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  DollarSign,
  Package,
  Grid3X3,
  List,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useDigitalBundles, useFeaturedBundles } from '@/hooks/digital/useDigitalBundles';
import { DigitalBundlesGrid } from '@/components/digital';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

export const DigitalBundlesList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store } = useStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'featured'>('all');

  // Data fetching
  const { data: allBundles, isLoading: isLoadingAll } = useDigitalBundles(store?.id);
  const { data: featuredBundles, isLoading: isLoadingFeatured } = useFeaturedBundles(store?.id, 6);

  // Filter bundles
  const filteredBundles = useMemo(() => {
    const bundles = activeTab === 'featured' ? (featuredBundles || []) : (allBundles || []);
    
    if (!searchQuery) return bundles;

    return bundles.filter((bundle) =>
      bundle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bundle.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allBundles, featuredBundles, activeTab, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const bundles = allBundles || [];
    return {
      totalBundles: bundles.length,
      totalSales: bundles.reduce((sum, b) => sum + b.total_sales, 0),
      totalRevenue: bundles.reduce((sum, b) => sum + b.total_revenue, 0),
      featuredCount: bundles.filter((b) => b.is_featured).length,
    };
  }, [allBundles]);

  const isLoading = activeTab === 'featured' ? isLoadingFeatured : isLoadingAll;

  const handleViewBundle = useCallback((bundleId: string) => {
    const bundle = allBundles?.find((b) => b.id === bundleId);
    if (bundle) {
      navigate(`/bundles/${bundle.slug}`);
    }
  }, [allBundles, navigate]);

  const handleCreateBundle = useCallback(() => {
    navigate('/dashboard/bundles/new');
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Bundles de Produits</h1>
                    <p className="text-purple-100 mt-1">
                      Groupez vos produits digitaux pour augmenter vos ventes
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleCreateBundle}
                  className="bg-white text-purple-600 hover:bg-purple-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Bundle
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bundles</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBundles}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventes Totales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSales}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalRevenue.toLocaleString()} XOF
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Vedette</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.featuredCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Search */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtrer & Rechercher
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <List className="h-4 w-4 mr-2" />
                          Liste
                        </>
                      ) : (
                        <>
                          <Grid3X3 className="h-4 w-4 mr-2" />
                          Grille
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un bundle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bundles */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'featured')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">
                  Tous ({allBundles?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="featured">
                  <Sparkles className="h-4 w-4 mr-2" />
                  En Vedette ({featuredBundles?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <DigitalBundlesGrid
                  bundles={filteredBundles}
                  loading={isLoading}
                  variant={viewMode === 'compact' ? 'compact' : 'default'}
                  onView={handleViewBundle}
                />
              </TabsContent>

              <TabsContent value="featured" className="mt-6">
                <DigitalBundlesGrid
                  bundles={filteredBundles}
                  loading={isLoading}
                  variant="featured"
                  onView={handleViewBundle}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DigitalBundlesList;

