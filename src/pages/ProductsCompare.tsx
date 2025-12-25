/**
 * Page de Comparaison Universelle de Produits
 * Date: 31 Janvier 2025
 *
 * Page de comparaison côte à côte pour TOUS les types de produits
 * - Digital, Physical, Service, Course, Artist
 * - Comparaison jusqu'à 4 produits
 * - Filtres et tri
 * - Export de comparaison
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  X,
  Plus,
  ShoppingCart,
  Heart,
  Share2,
  Download,
  Star,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Package,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/cart/useCart';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

const MAX_COMPARISON = 4;

interface ComparisonProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  promotional_price?: number | null;
  currency: string;
  image_url?: string;
  category?: string;
  product_type: 'digital' | 'physical' | 'service' | 'course' | 'artist';
  store_id: string;
  store_name?: string;
  // Spécifiques par type
  license_type?: string; // digital
  file_format?: string; // digital
  file_size_mb?: number; // digital
  stock_quantity?: number; // physical
  weight_kg?: number; // physical
  duration_hours?: number; // service
  total_lessons?: number; // course
  artist_type?: string; // artist
  // Communs
  average_rating?: number;
  reviews_count?: number;
  sales_count?: number;
  is_featured?: boolean;
  created_at?: string;
}

export default function ProductsCompare() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { toggleFavorite } = useMarketplaceFavorites();

  // Charger les produits depuis les paramètres URL ou localStorage
  const [productIds, setProductIds] = useState<string[]>(() => {
    const urlIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (urlIds.length > 0) return urlIds.slice(0, MAX_COMPARISON);

    let saved: string | null = null;
    try {
      saved = localStorage.getItem('products-comparison');
    } catch {
      saved = null;
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as unknown;
        return Array.isArray(parsed) ? (parsed as string[]).slice(0, MAX_COMPARISON) : [];
      } catch (e) {
        logger.error('Error loading comparison', { error: e });
      }
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'name' | 'sales'>('price');

  // Fetch des produits à comparer
  const { data: products, isLoading } = useQuery({
    queryKey: ['products-comparison', productIds],
    queryFn: async (): Promise<ComparisonProduct[]> => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          description,
          price,
          promotional_price,
          currency,
          image_url,
          category,
          product_type,
          store_id,
          is_featured,
          created_at,
          stores!inner (
            id,
            name
          ),
          digital_products (
            license_type,
            file_format,
            file_size_mb
          ),
          physical_products (
            stock_quantity,
            weight_kg
          ),
          service_products (
            duration_hours
          ),
          course_products (
            total_lessons
          ),
          artist_products (
            artist_type
          )
        `
        )
        .in('id', productIds);

      if (error) {
        logger.error('Error fetching products for comparison', { error });
        throw error;
      }

      interface ProductFromSupabase {
        id: string;
        name: string;
        description?: string;
        price: number;
        promotional_price?: number | null;
        currency: string;
        image_url?: string;
        category?: string;
        product_type: string;
        store_id: string;
        is_featured?: boolean;
        created_at?: string;
        stores?: { id: string; name: string };
        digital_products?: Array<{
          license_type?: string;
          file_format?: string;
          file_size_mb?: number;
        }>;
        physical_products?: Array<{ stock_quantity?: number; weight_kg?: number }>;
        service_products?: Array<{ duration_hours?: number }>;
        course_products?: Array<{ total_lessons?: number }>;
        artist_products?: Array<{ artist_type?: string }>;
      }
      return (data || []).map((product: ProductFromSupabase) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        promotional_price: product.promotional_price,
        currency: product.currency,
        image_url: product.image_url,
        category: product.category,
        product_type: product.product_type,
        store_id: product.store_id,
        store_name: product.stores?.name,
        license_type: product.digital_products?.[0]?.license_type,
        file_format: product.digital_products?.[0]?.file_format,
        file_size_mb: product.digital_products?.[0]?.file_size_mb,
        stock_quantity: product.physical_products?.[0]?.stock_quantity,
        weight_kg: product.physical_products?.[0]?.weight_kg,
        duration_hours: product.service_products?.[0]?.duration_hours,
        total_lessons: product.course_products?.[0]?.total_lessons,
        artist_type: product.artist_products?.[0]?.artist_type,
        is_featured: product.is_featured,
        created_at: product.created_at,
      })) as ComparisonProduct[];
    },
    enabled: productIds.length > 0,
  });

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (productIds.length > 0) {
      localStorage.setItem('products-comparison', JSON.stringify(productIds));
    }
  }, [productIds]);

  // Ajouter un produit à la comparaison
  const addProduct = (productId: string) => {
    if (productIds.includes(productId)) {
      toast({
        title: 'Produit déjà dans la comparaison',
        description: 'Ce produit est déjà sélectionné',
        variant: 'default',
      });
      return;
    }

    if (productIds.length >= MAX_COMPARISON) {
      toast({
        title: 'Limite atteinte',
        description: `Vous ne pouvez comparer que ${MAX_COMPARISON} produits maximum`,
        variant: 'destructive',
      });
      return;
    }

    setProductIds([...productIds, productId]);
    toast({
      title: 'Produit ajouté',
      description: 'Le produit a été ajouté à la comparaison',
    });
  };

  // Retirer un produit
  const removeProduct = (productId: string) => {
    setProductIds(productIds.filter(id => id !== productId));
    toast({
      title: 'Produit retiré',
      description: 'Le produit a été retiré de la comparaison',
    });
  };

  // Vider la comparaison
  const clearComparison = () => {
    setProductIds([]);
    localStorage.removeItem('products-comparison');
    toast({
      title: 'Comparaison vidée',
      description: 'Tous les produits ont été retirés',
    });
  };

  // Filtrer et trier les produits
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products || [];

    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.product_type === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      );
    }

    // Trier
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.promotional_price || a.price) - (b.promotional_price || b.price);
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'sales':
          return (b.sales_count || 0) - (a.sales_count || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, typeFilter, searchQuery, sortBy]);

  // Propriétés à comparer selon le type
  const getComparisonFields = (productType: string) => {
    const commonFields = [
      { key: 'name', label: 'Nom', type: 'text' },
      { key: 'price', label: 'Prix', type: 'price' },
      { key: 'promotional_price', label: 'Prix promo', type: 'price' },
      { key: 'category', label: 'Catégorie', type: 'text' },
      { key: 'store_name', label: 'Boutique', type: 'text' },
      { key: 'average_rating', label: 'Note', type: 'rating' },
      { key: 'reviews_count', label: 'Avis', type: 'number' },
    ];

    const typeSpecificFields: Record<
      string,
      Array<{ key: string; label: string; type: string }>
    > = {
      digital: [
        { key: 'license_type', label: 'Type de licence', type: 'text' },
        { key: 'file_format', label: 'Format', type: 'text' },
        { key: 'file_size_mb', label: 'Taille (MB)', type: 'number' },
      ],
      physical: [
        { key: 'stock_quantity', label: 'Stock', type: 'number' },
        { key: 'weight_kg', label: 'Poids (kg)', type: 'number' },
      ],
      service: [{ key: 'duration_hours', label: 'Durée (heures)', type: 'number' }],
      course: [{ key: 'total_lessons', label: 'Leçons', type: 'number' }],
      artist: [{ key: 'artist_type', label: "Type d'artiste", type: 'text' }],
    };

    return [...commonFields, ...(typeSpecificFields[productType] || [])];
  };

  // Obtenir la valeur d'une propriété
  const getPropertyValue = (
    product: ComparisonProduct,
    property: string
  ): string | number | undefined => {
    return (product as Record<string, string | number | undefined>)[property];
  };

  // Rendre une valeur selon son type
  const renderValue = (value: string | number | boolean | null | undefined, type: string) => {
    if (value === null || value === undefined)
      return <span className="text-muted-foreground">-</span>;

    switch (type) {
      case 'price':
        return <span className="font-semibold">{Number(value).toLocaleString('fr-FR')} XOF</span>;
      case 'rating':
        return (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{Number(value).toFixed(1)}</span>
          </div>
        );
      case 'number':
        return <span>{Number(value).toLocaleString('fr-FR')}</span>;
      case 'boolean':
        return value ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        );
      default:
        return <span>{String(value)}</span>;
    }
  };

  // Calculer le meilleur prix
  const getBestPrice = () => {
    if (!products || products.length === 0) return null;
    const prices = products.map(p => p.promotional_price || p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return { min: minPrice, max: maxPrice };
  };

  const bestPrice = getBestPrice();

  // Grouper par type pour l'affichage (doit être avant les early returns)
  const productsByType = useMemo(() => {
    const groups: Record<string, ComparisonProduct[]> = {};
    filteredAndSortedProducts.forEach(product => {
      if (!groups[product.product_type]) {
        groups[product.product_type] = [];
      }
      groups[product.product_type].push(product);
    });
    return groups;
  }, [filteredAndSortedProducts]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (productIds.length === 0) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6">
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Aucun produit à comparer</h2>
                  <p className="text-muted-foreground mb-4">
                    Ajoutez des produits à votre comparaison depuis les pages de produits
                  </p>
                  <Button onClick={() => navigate('/marketplace')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Parcourir les produits
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Utiliser le type du premier produit pour les champs de comparaison
  const comparisonFields =
    filteredAndSortedProducts.length > 0
      ? getComparisonFields(filteredAndSortedProducts[0].product_type)
      : [];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  Comparaison de Produits
                </h1>
                <p className="text-muted-foreground mt-2">
                  Comparez jusqu'à {MAX_COMPARISON} produits côte à côte
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearComparison}>
                  <X className="h-4 w-4 mr-2" />
                  Vider
                </Button>
                <Button variant="outline" onClick={() => navigate('/marketplace')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>

            {/* Stats */}
            {bestPrice && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produits</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filteredAndSortedProducts.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Prix Min</CardTitle>
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {bestPrice.min.toLocaleString('fr-FR')} XOF
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Prix Max</CardTitle>
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {bestPrice.max.toLocaleString('fr-FR')} XOF
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Écart</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(bestPrice.max - bestPrice.min).toLocaleString('fr-FR')} XOF
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans la comparaison..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="physical">Physique</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="course">Cours</SelectItem>
                      <SelectItem value="artist">Artiste</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sortBy}
                    onValueChange={v => setSortBy(v as 'price' | 'rating' | 'name' | 'sales')}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Prix</SelectItem>
                      <SelectItem value="rating">Note</SelectItem>
                      <SelectItem value="sales">Ventes</SelectItem>
                      <SelectItem value="name">Nom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Comparaison */}
            {filteredAndSortedProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucun produit ne correspond à vos critères
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Tableau de comparaison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comparaison Détaillée</CardTitle>
                    <CardDescription>
                      {filteredAndSortedProducts.length} produit
                      {filteredAndSortedProducts.length > 1 ? 's' : ''} à comparer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold sticky left-0 bg-background z-10">
                              Propriété
                            </th>
                            {filteredAndSortedProducts.map(product => (
                              <th
                                key={product.id}
                                className="text-center p-3 font-semibold min-w-[200px]"
                              >
                                <div className="space-y-2">
                                  <div className="relative w-24 h-24 mx-auto rounded-lg overflow-hidden border">
                                    <OptimizedImage
                                      src={product.image_url || '/placeholder-product.png'}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                      width={96}
                                      height={96}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                                      onClick={() => removeProduct(product.id)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="font-medium text-sm">{product.name}</div>
                                  <Badge variant="secondary">{product.product_type}</Badge>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonFields.map(field => (
                            <tr key={field.key} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium sticky left-0 bg-background z-10">
                                {field.label}
                              </td>
                              {filteredAndSortedProducts.map(product => (
                                <td key={product.id} className="p-3 text-center">
                                  {renderValue(getPropertyValue(product, field.key), field.type)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredAndSortedProducts.map(product => (
                        <Card key={product.id}>
                          <CardContent className="p-4 space-y-3">
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-lg font-bold">
                              {(product.promotional_price || product.price).toLocaleString('fr-FR')}{' '}
                              {product.currency}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  addItem({
                                    product_id: product.id,
                                    product_type: product.product_type as
                                      | 'digital'
                                      | 'physical'
                                      | 'service'
                                      | 'course'
                                      | 'artist',
                                    product_name: product.name,
                                    product_image_url: product.image_url || '',
                                    quantity: 1,
                                    unit_price: product.promotional_price || product.price,
                                    currency: product.currency,
                                  });
                                  toast({
                                    title: 'Ajouté au panier',
                                    description: `${product.name} a été ajouté à votre panier`,
                                  });
                                }}
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Panier
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/products/${product.id}`)}
                              >
                                Voir
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
