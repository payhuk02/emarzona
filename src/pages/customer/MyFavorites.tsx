/**
 * Page My Favorites - Mes Favoris (Customer Portal)
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Liste tous produits favoris
 * - Statistiques favoris
 * - Filtres par type produit et catégorie
 * - Recherche par nom produit
 * - Actions rapides (voir, ajouter au panier, retirer)
 * - Tri par date ajout, prix, popularité
 */

import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { useCart } from '@/hooks/cart/useCart';
import {
  Heart,
  Search,
  ArrowLeft,
  ShoppingBag,
  Eye,
  Trash2,
  Filter,
  Grid,
  List,
  TrendingUp,
  Package,
  Download,
  BookOpen,
  Calendar,
  SortAsc,
} from 'lucide-react';

type ProductType = 'all' | 'digital' | 'physical' | 'service' | 'course';
type SortOption = 'date' | 'price_asc' | 'price_desc' | 'name';

interface FavoriteProduct {
  id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    price: number;
    promotional_price?: number;
    currency: string;
    product_type: string;
    category?: string;
    slug: string;
    stores?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export default function MyFavorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { favorites, toggleFavorite, clearAllFavorites, favoritesCount } = useMarketplaceFavorites();
  const { addItem } = useCart();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProductType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch favorite products with details
  const { data: favoriteProducts, isLoading } = useQuery({
    queryKey: ['favorite-products', user?.id, typeFilter, sortOption],
    queryFn: async (): Promise<FavoriteProduct[]> => {
      if (!user?.id || favorites.size === 0) return [];

      let query = supabase
        .from('user_favorites')
        .select(`
          id,
          product_id,
          created_at,
          product:products (
            id,
            name,
            description,
            image_url,
            price,
            promotional_price,
            currency,
            product_type,
            category,
            slug,
            stores:store_id (
              id,
              name,
              slug
            )
          )
        `)
        .eq('user_id', user.id)
        .in('product_id', Array.from(favorites));

      // Filter by product type
      if (typeFilter !== 'all') {
        query = query.eq('products.product_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort products
      let sorted = (data as FavoriteProduct[]) || [];

      if (sortOption === 'date') {
        sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortOption === 'price_asc') {
        sorted.sort((a, b) => {
          const priceA = a.product.promotional_price || a.product.price;
          const priceB = b.product.promotional_price || b.product.price;
          return priceA - priceB;
        });
      } else if (sortOption === 'price_desc') {
        sorted.sort((a, b) => {
          const priceA = a.product.promotional_price || a.product.price;
          const priceB = b.product.promotional_price || b.product.price;
          return priceB - priceA;
        });
      } else if (sortOption === 'name') {
        sorted.sort((a, b) => a.product.name.localeCompare(b.product.name));
      }

      return sorted;
    },
    enabled: !!user?.id && favorites.size > 0,
  });

  // Filter by search query
  const filteredProducts = favoriteProducts?.filter((item) => {
    const productName = item.product?.name || '';
    return productName.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  // Statistics
  const stats = {
    total: favoriteProducts?.length || 0,
    digital: favoriteProducts?.filter(p => p.product?.product_type === 'digital').length || 0,
    physical: favoriteProducts?.filter(p => p.product?.product_type === 'physical').length || 0,
    service: favoriteProducts?.filter(p => p.product?.product_type === 'service').length || 0,
    course: favoriteProducts?.filter(p => p.product?.product_type === 'course').length || 0,
  };

  const handleAddToCart = async (product: any) => {
    try {
      await addItem({
        product_id: product.id,
        product_type: product.product_type as any,
        quantity: 1,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    await toggleFavorite(productId);
    queryClient.invalidateQueries({ queryKey: ['favorite-products'] });
  };

  const getProductTypeIcon = (type: string) => {
    const icons = {
      digital: <Download className="h-4 w-4" />,
      physical: <Package className="h-4 w-4" />,
      service: <Calendar className="h-4 w-4" />,
      course: <BookOpen className="h-4 w-4" />,
    };
    return icons[type as keyof typeof icons] || <Package className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/account')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                    Mes Favoris
                  </h1>
                </div>
                <p className="text-muted-foreground">
                  Retrouvez tous vos produits favoris en un seul endroit
                </p>
              </div>
              {favoriteProducts && favoriteProducts.length > 0 && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (confirm('Voulez-vous vraiment retirer tous vos favoris ?')) {
                      await clearAllFavorites();
                      queryClient.invalidateQueries({ queryKey: ['favorite-products'] });
                    }
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tout supprimer
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Produits favoris</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Digitaux</CardTitle>
                  <Download className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.digital}</div>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Physiques</CardTitle>
                  <Package className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.physical}</div>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Services</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.service}</div>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cours</CardTitle>
                  <BookOpen className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.course}</div>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Type Filter */}
                  <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as ProductType)}>
                    <TabsList>
                      <TabsTrigger value="all">Tous</TabsTrigger>
                      <TabsTrigger value="digital">Digitaux</TabsTrigger>
                      <TabsTrigger value="physical">Physiques</TabsTrigger>
                      <TabsTrigger value="service">Services</TabsTrigger>
                      <TabsTrigger value="course">Cours</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Sort */}
                  <Tabs value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                    <TabsList>
                      <TabsTrigger value="date">
                        <SortAsc className="h-4 w-4 mr-1" />
                        Date
                      </TabsTrigger>
                      <TabsTrigger value="price_asc">Prix ↑</TabsTrigger>
                      <TabsTrigger value="price_desc">Prix ↓</TabsTrigger>
                      <TabsTrigger value="name">Nom</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* View Mode */}
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'produit favori' : 'produits favoris'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery || typeFilter !== 'all'
                        ? 'Aucun produit ne correspond à vos critères'
                        : favoritesCount === 0
                        ? 'Aucun favori'
                        : 'Aucun produit trouvé'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {favoritesCount === 0
                        ? 'Ajoutez des produits à vos favoris en cliquant sur l\'icône cœur'
                        : 'Essayez de modifier vos filtres de recherche'}
                    </p>
                    {favoritesCount === 0 && (
                      <Button onClick={() => navigate('/marketplace')}>
                        Découvrir la marketplace
                      </Button>
                    )}
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((item) => {
                      const product = item.product;
                      const price = product.promotional_price || product.price;
                      const hasPromo = product.promotional_price && product.promotional_price < product.price;

                      return (
                        <Card key={item.id} className="hover:shadow-lg transition-shadow">
                          {product.image_url && (
                            <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                                onClick={() => handleRemoveFavorite(product.id)}
                              >
                                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                              </Button>
                            </div>
                          )}
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="line-clamp-2 text-lg">{product.name}</CardTitle>
                                {product.stores && (
                                  <CardDescription className="mt-1">
                                    Par {product.stores.name}
                                  </CardDescription>
                                )}
                              </div>
                              {getProductTypeIcon(product.product_type)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Price */}
                            <div>
                              {hasPromo && (
                                <p className="text-sm text-muted-foreground line-through">
                                  {product.price.toLocaleString('fr-FR')} {product.currency}
                                </p>
                              )}
                              <p className="text-xl font-bold">
                                {price.toLocaleString('fr-FR')} {product.currency}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                asChild
                              >
                                <Link to={`/stores/${product.stores?.slug}/products/${product.slug}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleAddToCart(product)}
                              >
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                Panier
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map((item) => {
                      const product = item.product;
                      const price = product.promotional_price || product.price;
                      const hasPromo = product.promotional_price && product.promotional_price < product.price;

                      return (
                        <Card key={item.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                                    {product.stores && (
                                      <p className="text-sm text-muted-foreground mb-2">
                                        Par {product.stores.name}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <Badge variant="outline">
                                        {getProductTypeIcon(product.product_type)}
                                        <span className="ml-1 capitalize">{product.product_type}</span>
                                      </Badge>
                                      {product.category && (
                                        <Badge variant="secondary">{product.category}</Badge>
                                      )}
                                      <span className="text-sm text-muted-foreground">
                                        Ajouté le {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="text-right">
                                      {hasPromo && (
                                        <p className="text-sm text-muted-foreground line-through">
                                          {product.price.toLocaleString('fr-FR')} {product.currency}
                                        </p>
                                      )}
                                      <p className="text-xl font-bold">
                                        {price.toLocaleString('fr-FR')} {product.currency}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                      >
                                        <Link to={`/stores/${product.stores?.slug}/products/${product.slug}`}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Voir
                                        </Link>
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleAddToCart(product)}
                                      >
                                        <ShoppingBag className="h-4 w-4 mr-2" />
                                        Panier
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveFavorite(product.id)}
                                      >
                                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
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

