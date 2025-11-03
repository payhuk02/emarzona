/**
 * Page Ma Wishlist - Liste complète des favoris
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Affichage de tous les produits favoris avec détails
 * - Filtres par type de produit
 * - Recherche dans les favoris
 * - Actions: ajouter au panier, retirer des favoris
 * - Statistiques de la wishlist
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { useCart } from '@/hooks/cart/useCart';
import {
  Heart,
  ShoppingBag,
  Search,
  Trash2,
  Package,
  Download,
  BookOpen,
  Calendar,
  AlertCircle,
  Filter,
  X,
  ShoppingCart,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  product_type: string;
  category: string | null;
  store_id: string;
  stores?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  created_at: string;
}

export default function CustomerMyWishlist() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { favorites, toggleFavorite, loading: favoritesLoading } = useMarketplaceFavorites();
  const { addItem } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');

  // Convertir le Set en array pour les requêtes
  const favoriteIds = Array.from(favorites);

  // Fetch favorite products with details
  const { data: favoriteProducts, isLoading, refetch } = useQuery({
    queryKey: ['favorite-products', favoriteIds],
    queryFn: async (): Promise<FavoriteProduct[]> => {
      if (favoriteIds.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          description,
          price,
          currency,
          image_url,
          product_type,
          category,
          store_id,
          created_at,
          stores!inner (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .in('id', favoriteIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: favoriteIds.length > 0 && !favoritesLoading,
  });

  // Filtrer les produits selon la recherche et le filtre de type
  const filteredProducts = useMemo(() => {
    if (!favoriteProducts) return [];

    let filtered = favoriteProducts;

    // Filtre par type
    if (productTypeFilter !== 'all') {
      filtered = filtered.filter(p => p.product_type === productTypeFilter);
    }

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [favoriteProducts, productTypeFilter, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    if (!favoriteProducts) {
      return { total: 0, byType: {} };
    }

    const byType: Record<string, number> = {};
    favoriteProducts.forEach(p => {
      byType[p.product_type] = (byType[p.product_type] || 0) + 1;
    });

    return {
      total: favoriteProducts.length,
      byType,
    };
  }, [favoriteProducts]);

  // Gérer l'ajout au panier
  const handleAddToCart = async (product: FavoriteProduct) => {
    try {
      await addItem.mutateAsync({
        productId: product.id,
        productType: product.product_type,
        quantity: 1,
        price: product.price,
      });

      toast({
        title: 'Ajouté au panier',
        description: `${product.name} a été ajouté à votre panier`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter au panier',
        variant: 'destructive',
      });
    }
  };

  // Gérer la suppression des favoris
  const handleRemoveFavorite = async (productId: string, productName: string) => {
    await toggleFavorite(productId);
    await refetch();
    
    toast({
      title: 'Retiré des favoris',
      description: `${productName} a été retiré de votre wishlist`,
    });
  };

  // Navigation vers le détail du produit
  const handleViewProduct = (product: FavoriteProduct) => {
    const productType = product.product_type;
    const storeSlug = product.stores?.slug;

    if (!storeSlug) {
      toast({
        title: 'Erreur',
        description: 'Boutique introuvable',
        variant: 'destructive',
      });
      return;
    }

    // Navigation selon le type de produit
    switch (productType) {
      case 'digital':
        navigate(`/marketplace/${storeSlug}/${product.slug}`);
        break;
      case 'physical':
        navigate(`/products/physical/${product.id}`);
        break;
      case 'service':
        navigate(`/services/${product.id}`);
        break;
      case 'course':
        navigate(`/courses/${product.id}`);
        break;
      default:
        navigate(`/marketplace/${storeSlug}/${product.slug}`);
    }
  };

  // Obtenir l'icône selon le type de produit
  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'digital':
        return <Download className="h-4 w-4" />;
      case 'physical':
        return <Package className="h-4 w-4" />;
      case 'service':
        return <Calendar className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Obtenir le label du type
  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'digital':
        return 'Produit Digital';
      case 'physical':
        return 'Produit Physique';
      case 'service':
        return 'Service';
      case 'course':
        return 'Cours en Ligne';
      default:
        return type;
    }
  };

  if (favoritesLoading || isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48" />
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
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                  Ma Wishlist
                </h1>
                <p className="text-muted-foreground mt-1">
                  {stats.total > 0
                    ? `${stats.total} produit${stats.total > 1 ? 's' : ''} dans votre wishlist`
                    : 'Aucun produit dans votre wishlist'}
                </p>
              </div>
            </div>

            {/* Statistiques */}
            {stats.total > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </CardContent>
                </Card>
                {stats.byType.digital && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{stats.byType.digital}</div>
                      <p className="text-xs text-muted-foreground">Digitaux</p>
                    </CardContent>
                  </Card>
                )}
                {stats.byType.physical && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{stats.byType.physical}</div>
                      <p className="text-xs text-muted-foreground">Physiques</p>
                    </CardContent>
                  </Card>
                )}
                {stats.byType.service && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{stats.byType.service}</div>
                      <p className="text-xs text-muted-foreground">Services</p>
                    </CardContent>
                  </Card>
                )}
                {stats.byType.course && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{stats.byType.course}</div>
                      <p className="text-xs text-muted-foreground">Cours</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Filtres et recherche */}
            {stats.total > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher dans votre wishlist..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Type de produit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="digital">Produits Digitaux</SelectItem>
                        <SelectItem value="physical">Produits Physiques</SelectItem>
                        <SelectItem value="service">Services</SelectItem>
                        <SelectItem value="course">Cours en Ligne</SelectItem>
                      </SelectContent>
                    </Select>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        onClick={() => setSearchQuery('')}
                        className="w-full md:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Réinitialiser
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liste vide */}
            {!favoritesLoading && !isLoading && stats.total === 0 && (
              <Alert>
                <Heart className="h-4 w-4" />
                <AlertDescription>
                  Votre wishlist est vide. Commencez à ajouter des produits favoris depuis le marketplace !
                </AlertDescription>
              </Alert>
            )}

            {/* Résultats de recherche vides */}
            {stats.total > 0 && filteredProducts.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun produit ne correspond à votre recherche. Essayez de modifier vos filtres.
                </AlertDescription>
              </Alert>
            )}

            {/* Liste des produits favoris */}
            {filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={product.image_url || '/placeholder-product.png'}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.png';
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                        onClick={() => handleRemoveFavorite(product.id, product.name)}
                      >
                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                      </Button>
                      <Badge
                        className="absolute top-2 left-2"
                        variant="secondary"
                      >
                        {getProductTypeIcon(product.product_type)}
                        <span className="ml-1">{getProductTypeLabel(product.product_type)}</span>
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {product.description || 'Aucune description'}
                      </CardDescription>
                      {product.stores && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Boutique: {product.stores.name}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {product.price.toLocaleString('fr-FR')} {product.currency}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleViewProduct(product)}
                        >
                          Voir le produit
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => handleAddToCart(product)}
                          disabled={addItem.isPending}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Ajouter
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => handleRemoveFavorite(product.id, product.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Retirer des favoris
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

