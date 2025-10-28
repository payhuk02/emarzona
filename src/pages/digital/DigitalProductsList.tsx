/**
 * Digital Products List Page - Professional
 * Date: 27 octobre 2025
 * 
 * Page de gestion des produits digitaux (pour vendeurs)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { useDigitalProducts } from '@/hooks/digital/useDigitalProducts';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Filter,
} from 'lucide-react';
import { DigitalProductsGrid } from '@/components/digital';

export const DigitalProductsList = () => {
  const navigate = useNavigate();
  const { store } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const { data: products, isLoading } = useDigitalProducts(store?.id);

  /**
   * Filter and sort products
   */
  const filteredProducts = products
    ?.filter((p) => {
      // Search filter
      const matchesSearch = p.product.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = filterType === 'all' || p.digital_type === filterType;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'downloads':
          return b.total_downloads - a.total_downloads;
        case 'price':
          return b.product.price - a.product.price;
        case 'name':
          return a.product.name.localeCompare(b.product.name);
        default:
          return 0;
      }
    });

  /**
   * Calculate stats
   */
  const stats = {
    totalProducts: products?.length || 0,
    totalDownloads: products?.reduce((sum, p) => sum + p.total_downloads, 0) || 0,
    totalRevenue: products?.reduce((sum, p) => sum + (p.product.price * p.total_downloads), 0) || 0,
    uniqueCustomers: new Set(products?.flatMap(p => [p.user_id])).size,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Produits Digitaux</h1>
                <p className="text-muted-foreground mt-1">
                  Gérez vos produits digitaux, téléchargements et licenses
                </p>
              </div>
              
              <Button onClick={() => navigate('/products/create?type=digital')}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau produit
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produits</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Produits digitaux actifs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Téléchargements</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDownloads.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Total téléchargements
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Revenus générés
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.uniqueCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    Clients uniques
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtrer & Rechercher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Type filter */}
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="software">Logiciels</SelectItem>
                      <SelectItem value="ebook">Ebooks</SelectItem>
                      <SelectItem value="template">Templates</SelectItem>
                      <SelectItem value="plugin">Plugins</SelectItem>
                      <SelectItem value="music">Musique</SelectItem>
                      <SelectItem value="video">Vidéos</SelectItem>
                      <SelectItem value="graphic">Graphisme</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Plus récents</SelectItem>
                      <SelectItem value="downloads">Plus téléchargés</SelectItem>
                      <SelectItem value="price">Prix (élevé → bas)</SelectItem>
                      <SelectItem value="name">Nom (A → Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div>
              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">
                    Tous ({filteredProducts?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="active">Actifs</TabsTrigger>
                  <TabsTrigger value="draft">Brouillons</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <DigitalProductsGrid
                    products={filteredProducts?.map(dp => ({
                      ...dp,
                      ...dp.product,
                    })) || []}
                    loading={isLoading}
                  />
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                  <DigitalProductsGrid
                    products={filteredProducts?.filter(dp => dp.product.is_active).map(dp => ({
                      ...dp,
                      ...dp.product,
                    })) || []}
                    loading={isLoading}
                  />
                </TabsContent>

                <TabsContent value="draft" className="mt-6">
                  <DigitalProductsGrid
                    products={filteredProducts?.filter(dp => !dp.product.is_active).map(dp => ({
                      ...dp,
                      ...dp.product,
                    })) || []}
                    loading={isLoading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DigitalProductsList;


