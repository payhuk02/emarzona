import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Plus,
  Trash2,
  Search,
  ShoppingBag,
  TrendingDown,
  Tag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type BundleType = 'fixed' | 'flexible' | 'mix_and_match';

export interface BundleProduct {
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_label?: string;
  sku?: string;
  image_url?: string;
  quantity: number;
  price: number;
  is_required: boolean; // For flexible bundles
}

export interface ProductBundle {
  id: string;
  name: string;
  description?: string;
  type: BundleType;
  image_url?: string;
  
  // Products
  products: BundleProduct[];
  min_products?: number; // For flexible bundles
  max_products?: number; // For flexible bundles
  
  // Pricing
  original_price: number; // Sum of individual prices
  bundle_price: number;
  discount_percentage: number;
  discount_amount: number;
  
  // Inventory
  track_inventory: boolean;
  total_quantity?: number;
  
  // Display
  is_active: boolean;
  show_savings: boolean;
  show_individual_prices: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface ProductBundleBuilderProps {
  initialBundle?: ProductBundle;
  onSave?: (bundle: ProductBundle) => void;
  className?: string;
}

// ============================================================================
// MOCK PRODUCTS FOR SELECTION
// ============================================================================

const MOCK_PRODUCTS = [
  {
    id: 'prod_1',
    name: 'T-Shirt Premium',
    variant_label: 'Rouge / M',
    sku: 'TSH-RED-M',
    price: 15000,
    image_url: undefined,
  },
  {
    id: 'prod_2',
    name: 'Jeans Classic',
    sku: 'JNS-BLU-32',
    price: 35000,
    image_url: undefined,
  },
  {
    id: 'prod_3',
    name: 'Sneakers Pro',
    variant_label: 'Blanc / 42',
    sku: 'SNK-WHT-42',
    price: 45000,
    image_url: undefined,
  },
  {
    id: 'prod_4',
    name: 'Casquette Sport',
    sku: 'CAP-BLK',
    price: 8000,
    image_url: undefined,
  },
  {
    id: 'prod_5',
    name: 'Montre Classique',
    sku: 'WTC-SLV',
    price: 75000,
    image_url: undefined,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductBundleBuilder({
  initialBundle,
  onSave,
  className,
}: ProductBundleBuilderProps) {
  const [bundle, setBundle] = useState<Partial<ProductBundle>>(
    initialBundle || {
      name: '',
      type: 'fixed',
      products: [],
      original_price: 0,
      bundle_price: 0,
      discount_percentage: 0,
      discount_amount: 0,
      track_inventory: false,
      is_active: true,
      show_savings: true,
      show_individual_prices: false,
    }
  );

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate prices
  const calculatePrices = (products: BundleProduct[], bundlePrice?: number) => {
    const originalPrice = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const currentBundlePrice = bundlePrice || bundle.bundle_price || 0;
    const discountAmount = originalPrice - currentBundlePrice;
    const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

    return {
      original_price: originalPrice,
      bundle_price: currentBundlePrice,
      discount_amount: discountAmount,
      discount_percentage: Math.max(0, discountPercentage),
    };
  };

  // Add product to bundle
  const handleAddProduct = (product: typeof MOCK_PRODUCTS[0]) => {
    const newBundleProduct: BundleProduct = {
      product_id: product.id,
      product_name: product.name,
      variant_label: product.variant_label,
      sku: product.sku,
      image_url: product.image_url,
      quantity: 1,
      price: product.price,
      is_required: true,
    };

    const newProducts = [...(bundle.products || []), newBundleProduct];
    const prices = calculatePrices(newProducts);

    setBundle({
      ...bundle,
      products: newProducts,
      ...prices,
    });
  };

  // Remove product
  const handleRemoveProduct = (productId: string) => {
    const newProducts = (bundle.products || []).filter((p) => p.product_id !== productId);
    const prices = calculatePrices(newProducts);

    setBundle({
      ...bundle,
      products: newProducts,
      ...prices,
    });
  };

  // Update quantity
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const newProducts = (bundle.products || []).map((p) =>
      p.product_id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    );
    const prices = calculatePrices(newProducts);

    setBundle({
      ...bundle,
      products: newProducts,
      ...prices,
    });
  };

  // Update bundle price
  const handleUpdateBundlePrice = (price: number) => {
    const prices = calculatePrices(bundle.products || [], price);

    setBundle({
      ...bundle,
      ...prices,
    });
  };

  // Apply discount percentage
  const handleApplyDiscountPercentage = (percentage: number) => {
    const originalPrice = (bundle.products || []).reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );
    const discountAmount = (originalPrice * percentage) / 100;
    const bundlePrice = originalPrice - discountAmount;

    setBundle({
      ...bundle,
      bundle_price: bundlePrice,
      discount_amount: discountAmount,
      discount_percentage: percentage,
      original_price: originalPrice,
    });
  };

  // Save bundle
  const handleSave = () => {
    if (!bundle.name || !bundle.products || bundle.products.length === 0) {
      alert('Veuillez remplir le nom et ajouter au moins un produit');
      return;
    }

    const finalBundle: ProductBundle = {
      id: bundle.id || `bundle_${Date.now()}`,
      name: bundle.name,
      description: bundle.description,
      type: bundle.type || 'fixed',
      image_url: bundle.image_url,
      products: bundle.products,
      min_products: bundle.min_products,
      max_products: bundle.max_products,
      original_price: bundle.original_price || 0,
      bundle_price: bundle.bundle_price || 0,
      discount_percentage: bundle.discount_percentage || 0,
      discount_amount: bundle.discount_amount || 0,
      track_inventory: bundle.track_inventory || false,
      total_quantity: bundle.total_quantity,
      is_active: bundle.is_active !== undefined ? bundle.is_active : true,
      show_savings: bundle.show_savings !== undefined ? bundle.show_savings : true,
      show_individual_prices:
        bundle.show_individual_prices !== undefined ? bundle.show_individual_prices : false,
      created_at: bundle.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave?.(finalBundle);
  };

  // Filter products for picker
  const availableProducts = MOCK_PRODUCTS.filter((p) => {
    if (bundle.products?.some((bp) => bp.product_id === p.id)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.variant_label?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Créateur de Pack Produits</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Créez des packs attractifs avec remises groupées
              </p>
            </div>
            <Button onClick={handleSave} className="gap-2">
              <Package className="h-4 w-4" />
              Sauvegarder le Pack
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bundle-name">Nom du Pack *</Label>
              <Input
                id="bundle-name"
                placeholder="Ex: Pack Sportif Complet"
                value={bundle.name || ''}
                onChange={(e) => setBundle({ ...bundle, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bundle-type">Type de Pack</Label>
              <Select
                value={bundle.type || 'fixed'}
                onValueChange={(value: BundleType) => setBundle({ ...bundle, type: value })}
              >
                <SelectTrigger id="bundle-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixe (tous les produits inclus)</SelectItem>
                  <SelectItem value="flexible">Flexible (client choisit)</SelectItem>
                  <SelectItem value="mix_and_match">Mix & Match</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le pack et ses avantages..."
              value={bundle.description || ''}
              onChange={(e) => setBundle({ ...bundle, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Products in Bundle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Produits du Pack ({bundle.products?.length || 0})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProductPicker(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter Produit
              </Button>
            </div>

            {(!bundle.products || bundle.products.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Aucun produit
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Ajoutez des produits pour créer votre pack
                </p>
                <Button onClick={() => setShowProductPicker(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter des produits
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Prix Unitaire</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Sous-total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bundle.products.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.product_name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.product_name}</p>
                              {product.variant_label && (
                                <p className="text-xs text-muted-foreground">
                                  {product.variant_label}
                                </p>
                              )}
                              {product.sku && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {product.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-medium">
                            {product.price.toLocaleString()} XOF
                          </span>
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(product.product_id, Number(e.target.value))
                            }
                            className="w-20"
                          />
                        </TableCell>

                        <TableCell>
                          <span className="font-bold">
                            {(product.price * product.quantity).toLocaleString()} XOF
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(product.product_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pricing */}
          {bundle.products && bundle.products.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Tarification du Pack</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Prix Total Original</Label>
                    <div className="text-2xl font-bold text-muted-foreground line-through">
                      {bundle.original_price?.toLocaleString()} XOF
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bundle-price">Prix du Pack *</Label>
                    <Input
                      id="bundle-price"
                      type="number"
                      min="0"
                      value={bundle.bundle_price || 0}
                      onChange={(e) => handleUpdateBundlePrice(Number(e.target.value))}
                      className="text-xl font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount-percentage">Remise (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="discount-percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={bundle.discount_percentage?.toFixed(0) || 0}
                        onChange={(e) => handleApplyDiscountPercentage(Number(e.target.value))}
                      />
                      <Badge variant="destructive" className="text-lg px-4 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        -{bundle.discount_percentage?.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-background border p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Prix Total Original:</span>
                    <span className="font-medium">
                      {bundle.original_price?.toLocaleString()} XOF
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remise:</span>
                    <span className="font-medium text-green-600">
                      -{bundle.discount_amount?.toLocaleString()} XOF
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Prix Final du Pack:</span>
                    <span className="text-primary">
                      {bundle.bundle_price?.toLocaleString()} XOF
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Options */}
          <div className="space-y-4">
            <Label>Options d'Affichage</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Afficher les économies</p>
                    <p className="text-sm text-muted-foreground">
                      Montre le montant économisé au client
                    </p>
                  </div>
                </div>
                <Switch
                  checked={bundle.show_savings}
                  onCheckedChange={(checked) => setBundle({ ...bundle, show_savings: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Prix individuels</p>
                    <p className="text-sm text-muted-foreground">
                      Affiche le prix de chaque produit séparément
                    </p>
                  </div>
                </div>
                <Switch
                  checked={bundle.show_individual_prices}
                  onCheckedChange={(checked) =>
                    setBundle({ ...bundle, show_individual_prices: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Pack actif</p>
                    <p className="text-sm text-muted-foreground">
                      Le pack est visible et achetable
                    </p>
                  </div>
                </div>
                <Switch
                  checked={bundle.is_active}
                  onCheckedChange={(checked) => setBundle({ ...bundle, is_active: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Picker Dialog */}
      <Dialog open={showProductPicker} onOpenChange={setShowProductPicker}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ajouter des Produits au Pack</DialogTitle>
            <DialogDescription>
              Sélectionnez les produits à inclure dans le pack
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {availableProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun produit disponible</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {availableProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:border-primary"
                    onClick={() => {
                      handleAddProduct(product);
                      setShowProductPicker(false);
                      setSearchQuery('');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          {product.variant_label && (
                            <p className="text-sm text-muted-foreground">{product.variant_label}</p>
                          )}
                          {product.sku && (
                            <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{product.price.toLocaleString()} XOF</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductPicker(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

