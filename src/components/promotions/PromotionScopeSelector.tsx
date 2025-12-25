/**
 * Promotion Scope Selector
 * Composant pour sélectionner les produits, catégories ou collections
 * auxquels appliquer une promotion
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Package, Folder, Grid } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string | null;
  category: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface PromotionScopeSelectorProps {
  appliesTo: 'all_products' | 'specific_products' | 'categories' | 'collections';
  selectedProductIds: string[];
  selectedCategoryIds: string[];
  selectedCollectionIds: string[];
  onProductIdsChange: (ids: string[]) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onCollectionIdsChange: (ids: string[]) => void;
  storeId: string;
}

export const PromotionScopeSelector: React.FC<PromotionScopeSelectorProps> = ({
  appliesTo,
  selectedProductIds,
  selectedCategoryIds,
  selectedCollectionIds,
  onProductIdsChange,
  onCategoryIdsChange,
  onCollectionIdsChange,
  storeId,
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<
    Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      image_url: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  // Charger les données selon le type de sélection
  useEffect(() => {
    if (!isDialogOpen || !storeId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        if (appliesTo === 'specific_products') {
          const { data, error } = await supabase
            .from('products')
            .select('id, name, price, currency, image_url, category')
            .eq('store_id', storeId)
            .eq('is_active', true)
            .order('name');

          if (error) throw error;
          setProducts(data || []);
        } else if (appliesTo === 'categories') {
          // Récupérer les catégories depuis la table categories
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name, slug, description')
            .eq('is_active', true)
            .order('name');

          if (categoriesError) {
            // Fallback: récupérer les catégories depuis les produits
            const { data: productsData } = await supabase
              .from('products')
              .select('category')
              .eq('store_id', storeId)
              .not('category', 'is', null);

            const uniqueCategories = Array.from(
              new Set(productsData?.map(p => p.category).filter(Boolean))
            );

            setCategories(
              uniqueCategories.map((cat, index) => ({
                id: `cat-${index}`,
                name: cat as string,
                slug: (cat as string).toLowerCase().replace(/\s+/g, '-'),
                description: null,
              }))
            );
          } else {
            setCategories(categoriesData || []);
          }
        } else if (appliesTo === 'collections') {
          const { data, error } = await supabase
            .from('collections')
            .select('id, name, slug, description, image_url')
            .eq('store_id', storeId)
            .eq('is_active', true)
            .order('name');

          if (error) {
            // Si la table n'existe pas encore, on affiche un message
            if (error.code === '42P01') {
              toast({
                title: 'Info',
                description:
                  "La table collections n'existe pas encore. Exécutez la migration 20250128_collections_system.sql",
                variant: 'default',
              });
              setCollections([]);
            } else {
              throw error;
            }
          } else {
            setCollections(data || []);
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isDialogOpen, appliesTo, storeId, toast]);

  // Filtrer les données selon la recherche
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      p => p.name.toLowerCase().includes(query) || p.category?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      c => c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const filteredCollections = useMemo(() => {
    if (!searchQuery) return collections;
    const query = searchQuery.toLowerCase();
    return collections.filter(
      c =>
        c.name.toLowerCase().includes(query) ||
        c.slug.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [collections, searchQuery]);

  // Obtenir les éléments sélectionnés pour l'affichage
  const selectedProducts = useMemo(() => {
    return products.filter(p => selectedProductIds.includes(p.id));
  }, [products, selectedProductIds]);

  const selectedCategories = useMemo(() => {
    return categories.filter(c => selectedCategoryIds.includes(c.id));
  }, [categories, selectedCategoryIds]);

  const selectedCollections = useMemo(() => {
    return collections.filter(c => selectedCollectionIds.includes(c.id));
  }, [collections, selectedCollectionIds]);

  // ✅ PHASE 8: Mémoriser les handlers pour éviter recréations inutiles
  const handleToggleProduct = useCallback(
    (productId: string) => {
      if (selectedProductIds.includes(productId)) {
        onProductIdsChange(selectedProductIds.filter(id => id !== productId));
      } else {
        onProductIdsChange([...selectedProductIds, productId]);
      }
    },
    [selectedProductIds, onProductIdsChange]
  );

  const handleToggleCategory = useCallback(
    (categoryId: string) => {
      if (selectedCategoryIds.includes(categoryId)) {
        onCategoryIdsChange(selectedCategoryIds.filter(id => id !== categoryId));
      } else {
        onCategoryIdsChange([...selectedCategoryIds, categoryId]);
      }
    },
    [selectedCategoryIds, onCategoryIdsChange]
  );

  const handleToggleCollection = useCallback(
    (collectionId: string) => {
      if (selectedCollectionIds.includes(collectionId)) {
        onCollectionIdsChange(selectedCollectionIds.filter(id => id !== collectionId));
      } else {
        onCollectionIdsChange([...selectedCollectionIds, collectionId]);
      }
    },
    [selectedCollectionIds, onCollectionIdsChange]
  );

  const handleSelectAll = useCallback(() => {
    if (appliesTo === 'specific_products') {
      onProductIdsChange(filteredProducts.map(p => p.id));
    } else if (appliesTo === 'categories') {
      onCategoryIdsChange(filteredCategories.map(c => c.id));
    } else if (appliesTo === 'collections') {
      onCollectionIdsChange(filteredCollections.map(c => c.id));
    }
  }, [
    appliesTo,
    filteredProducts,
    filteredCategories,
    filteredCollections,
    onProductIdsChange,
    onCategoryIdsChange,
    onCollectionIdsChange,
  ]);

  const handleDeselectAll = useCallback(() => {
    if (appliesTo === 'specific_products') {
      onProductIdsChange([]);
    } else if (appliesTo === 'categories') {
      onCategoryIdsChange([]);
    } else if (appliesTo === 'collections') {
      onCollectionIdsChange([]);
    }
  }, [appliesTo, onProductIdsChange, onCategoryIdsChange, onCollectionIdsChange]);

  // Ne rien afficher si "Tous les produits"
  if (appliesTo === 'all_products') {
    return null;
  }

  const getTitle = () => {
    switch (appliesTo) {
      case 'specific_products':
        return 'Sélectionner les produits';
      case 'categories':
        return 'Sélectionner les catégories';
      case 'collections':
        return 'Sélectionner les collections';
      default:
        return '';
    }
  };

  const getSelectedCount = () => {
    switch (appliesTo) {
      case 'specific_products':
        return selectedProductIds.length;
      case 'categories':
        return selectedCategoryIds.length;
      case 'collections':
        return selectedCollectionIds.length;
      default:
        return 0;
    }
  };

  const getIcon = () => {
    switch (appliesTo) {
      case 'specific_products':
        return Package;
      case 'categories':
        return Folder;
      case 'collections':
        return Grid;
      default:
        return Package;
    }
  };

  const Icon = getIcon();

  return (
    <div className="space-y-2">
      <Label>{getTitle()}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          className="flex-1 justify-start"
        >
          <Icon className="h-4 w-4 mr-2" />
          {getSelectedCount() > 0 ? `${getSelectedCount()} sélectionné(s)` : 'Aucune sélection'}
        </Button>
        {getSelectedCount() > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (appliesTo === 'specific_products') onProductIdsChange([]);
              else if (appliesTo === 'categories') onCategoryIdsChange([]);
              else if (appliesTo === 'collections') onCollectionIdsChange([]);
            }}
            aria-label="Effacer la sélection"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Badges des sélections */}
      {appliesTo === 'specific_products' && selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedProducts.slice(0, 3).map(product => (
            <Badge key={product.id} variant="secondary" className="text-xs">
              {product.name}
            </Badge>
          ))}
          {selectedProducts.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedProducts.length - 3} autres
            </Badge>
          )}
        </div>
      )}

      {appliesTo === 'categories' && selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedCategories.slice(0, 3).map(category => (
            <Badge key={category.id} variant="secondary" className="text-xs">
              {category.name}
            </Badge>
          ))}
          {selectedCategories.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedCategories.length - 3} autres
            </Badge>
          )}
        </div>
      )}

      {appliesTo === 'collections' && selectedCollections.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedCollections.slice(0, 3).map(collection => (
            <Badge key={collection.id} variant="secondary" className="text-xs">
              {collection.name}
            </Badge>
          ))}
          {selectedCollections.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedCollections.length - 3} autres
            </Badge>
          )}
        </div>
      )}

      {/* Dialog de sélection */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogDescription>
              {appliesTo === 'specific_products' &&
                "Sélectionnez les produits auxquels cette promotion s'appliquera"}
              {appliesTo === 'categories' &&
                "Sélectionnez les catégories auxquelles cette promotion s'appliquera"}
              {appliesTo === 'collections' &&
                "Sélectionnez les collections auxquelles cette promotion s'appliquera"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Actions rapides */}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                Tout sélectionner
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
                Tout désélectionner
              </Button>
            </div>

            {/* Liste des éléments */}
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : appliesTo === 'specific_products' ? (
                <div className="space-y-2">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun produit trouvé</p>
                  ) : (
                    filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedProductIds.includes(product.id)}
                          onCheckedChange={() => handleToggleProduct(product.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.price} {product.currency}
                            {product.category && ` • ${product.category}`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : appliesTo === 'categories' ? (
                <div className="space-y-2">
                  {filteredCategories.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune catégorie trouvée
                    </p>
                  ) : (
                    filteredCategories.map(category => (
                      <div
                        key={category.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedCategoryIds.includes(category.id)}
                          onCheckedChange={() => handleToggleCategory(category.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : appliesTo === 'collections' ? (
                <div className="space-y-2">
                  {filteredCollections.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune collection trouvée
                    </p>
                  ) : (
                    filteredCollections.map(collection => (
                      <div
                        key={collection.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedCollectionIds.includes(collection.id)}
                          onCheckedChange={() => handleToggleCollection(collection.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{collection.name}</p>
                          {collection.description && (
                            <p className="text-xs text-muted-foreground">
                              {collection.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </ScrollArea>

            {/* Résumé de la sélection */}
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {getSelectedCount()} élément(s) sélectionné(s)
              </p>
              <Button type="button" onClick={() => setIsDialogOpen(false)} variant="outline">
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
