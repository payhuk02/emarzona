/**
 * Digital Products Comparison Page
 * Date: 27 Janvier 2025
 *
 * Page de comparaison côte à côte de produits digitaux
 * Permet de comparer jusqu'à 4 produits simultanément
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  X,
  Plus,
  Download,
  Star,
  Shield,
  HardDrive,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const MAX_COMPARISON = 4;

interface ComparisonProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  promotional_price?: number;
  currency: string;
  image_url?: string;
  category?: string;
  license_type?: string;
  file_format?: string;
  file_size_mb?: number;
  average_rating?: number;
  total_reviews?: number;
  total_downloads?: number;
  is_active?: boolean;
  created_at?: string;
}

export const DigitalProductsCompare = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Charger les produits depuis les paramètres URL ou localStorage
  const [productIds, setProductIds] = useState<string[]>(() => {
    const urlIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (urlIds.length > 0) return urlIds.slice(0, MAX_COMPARISON);

    let saved: string | null = null;
    try {
      saved = localStorage.getItem('digital-products-comparison');
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

  // Fetch des produits à comparer
  const { data: products, isLoading } = useQuery({
    queryKey: ['digitalProductsComparison', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          digital_products (
            id,
            license_type,
            main_file_format,
            total_size_mb,
            total_downloads
          )
        `
        )
        .in('id', productIds)
        .eq('product_type', 'digital')
        .eq('is_active', true);

      if (error) throw error;

      interface ProductWithDigital {
        id: string;
        name: string;
        description?: string;
        price: number;
        promotional_price?: number;
        currency: string;
        image_url?: string;
        category?: string;
        average_rating?: number;
        total_reviews?: number;
        is_active?: boolean;
        created_at?: string;
        digital_products?: Array<{
          license_type?: string;
          main_file_format?: string;
          total_size_mb?: number;
          total_downloads?: number;
        }>;
      }

      return (data || []).map((product: ProductWithDigital) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        promotional_price: product.promotional_price,
        currency: product.currency,
        image_url: product.image_url,
        category: product.category,
        license_type: product.digital_products?.[0]?.license_type || 'N/A',
        file_format: product.digital_products?.[0]?.main_file_format || 'N/A',
        file_size_mb: product.digital_products?.[0]?.total_size_mb || 0,
        average_rating: product.average_rating || 0,
        total_reviews: product.total_reviews || 0,
        total_downloads: product.digital_products?.[0]?.total_downloads || 0,
        is_active: product.is_active,
        created_at: product.created_at,
      })) as ComparisonProduct[];
    },
    enabled: productIds.length > 0,
  });

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (productIds.length > 0) {
      try {
        localStorage.setItem('digital-products-comparison', JSON.stringify(productIds));
      } catch {
        // ignore
      }
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
    try {
      localStorage.removeItem('digital-products-comparison');
    } catch {
      // ignore
    }
    toast({
      title: 'Comparaison vidée',
      description: 'Tous les produits ont été retirés',
    });
  };

  // Fonction pour obtenir la valeur d'une propriété
  const getPropertyValue = (
    product: ComparisonProduct,
    property: string
  ): string | number | undefined => {
    return (product as Record<string, string | number | undefined>)[property];
  };

  // Propriétés à comparer
  const comparisonFields = [
    { key: 'name', label: 'Nom', type: 'text' },
    { key: 'price', label: 'Prix', type: 'price' },
    { key: 'category', label: 'Catégorie', type: 'text' },
    { key: 'license_type', label: 'Type de licence', type: 'text' },
    { key: 'file_format', label: 'Format', type: 'text' },
    { key: 'file_size_mb', label: 'Taille', type: 'size' },
    { key: 'average_rating', label: 'Note', type: 'rating' },
    { key: 'total_reviews', label: 'Avis', type: 'number' },
    { key: 'total_downloads', label: 'Téléchargements', type: 'number' },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="p-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
            Aucun produit à comparer
          </h2>
          <p className="text-muted-foreground mb-6">
            Ajoutez des produits à votre comparaison pour les voir côte à côte
          </p>
          <Button onClick={() => navigate('/digital/search')}>
            <Plus className="h-4 w-4 mr-2" />
            Rechercher des produits
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2">
              Comparaison de produits
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
              Comparez jusqu'à {MAX_COMPARISON} produits digitaux côte à côte
            </p>
          </div>
          <div className="flex items-center gap-2">
            {products.length < MAX_COMPARISON && (
              <Button variant="outline" onClick={() => navigate('/digital/search')}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            )}
            <Button variant="destructive" onClick={clearComparison}>
              <X className="h-4 w-4 mr-2" />
              Vider
            </Button>
          </div>
        </div>

        {/* Tableau de comparaison */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-background border-r p-4 text-left min-w-[200px]">
                      Propriété
                    </th>
                    {products.map(product => (
                      <th
                        key={product.id}
                        className="relative border-r p-4 text-center min-w-[250px] bg-muted/50"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeProduct(product.id)}
                          aria-label={`Retirer ${product.name} de la comparaison`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="space-y-2">
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-2">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/digital/${product.id}`)}
                            className="w-full"
                          >
                            Voir les détails
                          </Button>
                        </div>
                      </th>
                    ))}
                    {/* Colonnes vides pour les produits manquants */}
                    {Array.from({ length: MAX_COMPARISON - products.length }).map((_, i) => (
                      <th
                        key={`empty-${i}`}
                        className="border-r p-4 text-center min-w-[250px] bg-muted/20"
                      >
                        <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/digital/search')}
                          >
                            Ajouter
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFields.map(field => (
                    <tr key={field.key} className="border-t">
                      <td className="sticky left-0 z-10 bg-background border-r p-4 font-medium">
                        {field.label}
                      </td>
                      {products.map(product => {
                        const value = getPropertyValue(product, field.key);
                        return (
                          <td key={product.id} className="border-r p-4 text-center">
                            {field.type === 'price' && (
                              <div className="flex flex-col items-center gap-1">
                                {product.promotional_price ? (
                                  <>
                                    <span className="text-lg font-bold text-primary">
                                      {product.promotional_price.toLocaleString()}{' '}
                                      {product.currency}
                                    </span>
                                    <span className="text-sm line-through text-muted-foreground">
                                      {value.toLocaleString()} {product.currency}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-lg font-bold">
                                    {value.toLocaleString()} {product.currency}
                                  </span>
                                )}
                              </div>
                            )}
                            {field.type === 'rating' && (
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">
                                  {value ? value.toFixed(1) : 'N/A'}
                                </span>
                              </div>
                            )}
                            {field.type === 'size' && (
                              <span>{value ? `${value.toFixed(2)} MB` : 'N/A'}</span>
                            )}
                            {field.type === 'number' && (
                              <span className="font-medium">
                                {value ? value.toLocaleString() : '0'}
                              </span>
                            )}
                            {field.type === 'text' && (
                              <span className="text-sm">{value || 'N/A'}</span>
                            )}
                          </td>
                        );
                      })}
                      {/* Colonnes vides */}
                      {Array.from({ length: MAX_COMPARISON - products.length }).map((_, i) => (
                        <td
                          key={`empty-${i}`}
                          className="border-r p-4 text-center text-muted-foreground"
                        >
                          -
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Description */}
                  <tr className="border-t">
                    <td className="sticky left-0 z-10 bg-background border-r p-4 font-medium">
                      Description
                    </td>
                    {products.map(product => (
                      <td key={product.id} className="border-r p-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {product.description || 'Aucune description'}
                        </p>
                      </td>
                    ))}
                    {Array.from({ length: MAX_COMPARISON - products.length }).map((_, i) => (
                      <td key={`empty-${i}`} className="border-r p-4" />
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/digital/search')}>
            Rechercher d'autres produits
          </Button>
          <Button onClick={() => navigate('/dashboard/digital-products')}>
            Voir tous mes produits
          </Button>
        </div>
      </div>
    </div>
  );
};

// Hook pour ajouter un produit à la comparaison depuis n'importe où
export const useAddToComparison = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  return useCallback(
    (productId: string) => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem('digital-products-comparison');
      } catch {
        saved = null;
      }
      let currentIds: string[] = [];
      try {
        const parsed = saved ? (JSON.parse(saved) as unknown) : [];
        currentIds = Array.isArray(parsed) ? (parsed as string[]) : [];
      } catch {
        currentIds = [];
      }

      if (currentIds.includes(productId)) {
        toast({
          title: 'Déjà dans la comparaison',
          description: 'Ce produit est déjà sélectionné',
        });
        return;
      }

      if (currentIds.length >= MAX_COMPARISON) {
        toast({
          title: 'Limite atteinte',
          description: `Vous ne pouvez comparer que ${MAX_COMPARISON} produits maximum`,
          variant: 'destructive',
        });
        navigate('/digital/compare');
        return;
      }

      const updated = [...currentIds, productId];
      try {
        localStorage.setItem('digital-products-comparison', JSON.stringify(updated));
      } catch {
        // ignore
      }

      toast({
        title: 'Produit ajouté',
        description: 'Le produit a été ajouté à la comparaison',
      });

      // Optionnel: rediriger vers la page de comparaison
      if (updated.length === MAX_COMPARISON) {
        navigate('/digital/compare');
      }
    },
    [navigate, toast]
  );
};
