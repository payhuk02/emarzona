/**
 * Composant amélioré de gestion des bundles de produits physiques
 * Date: 28 Janvier 2025
 * Avec gestion inventaire, promotions automatiques, prix dynamiques
 * Design responsive avec le même style que Mes Templates
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  ShoppingBag,
  TrendingDown,
  Tag,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign,
  PackageSearch,
  Percent,
} from 'lucide-react';
import {
  useBundles,
  useBundle,
  useCreateBundle,
  useUpdateBundle,
  useCheckBundleAvailability,
  useApplyBundlePromotion,
  Bundle,
  BundleType,
} from '@/hooks/physical/useBundles';
import { useStore } from '@/hooks/useStore';
import { usePhysicalProducts } from '@/hooks/physical/usePhysicalProducts';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

export function BundlesManager() {
  const { store } = useStore();
  const { toast } = useToast();
  const { data: bundles, isLoading } = useBundles(store?.id || null, { is_active: true });
  const { data: products } = usePhysicalProducts(store?.id || null);
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const checkAvailability = useCheckBundleAvailability();
  const applyPromotion = useApplyBundlePromotion();

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const bundlesRef = useScrollAnimation<HTMLDivElement>();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [bundleForm, setBundleForm] = useState({
    name: '',
    description: '',
    type: 'fixed' as BundleType,
    bundle_price: 0,
    track_inventory: false,
    total_quantity: 0,
    is_active: true,
    show_savings: true,
    show_individual_prices: false,
    items: [] as Array<{
      product_id: string;
      variant_id?: string;
      quantity: number;
      price: number;
      is_required: boolean;
    }>,
  });
  const [promotionDiscount, setPromotionDiscount] = useState(0);
  const [promotionType, setPromotionType] = useState<'percentage' | 'amount'>('percentage');

  // Stats calculées
  const stats = useMemo(() => {
    if (!bundles) return { total: 0, active: 0, totalSavings: 0, avgDiscount: 0 };
    const total = bundles.length;
    const active = bundles.filter(b => b.is_active).length;
    const totalSavings = bundles.reduce((sum, b) => sum + (b.original_price - b.bundle_price), 0);
    const avgDiscount = bundles.length > 0 
      ? bundles.reduce((sum, b) => sum + b.discount_percentage, 0) / bundles.length 
      : 0;
    return { total, active, totalSavings, avgDiscount };
  }, [bundles]);

  // Calculer le prix original et les économies
  const bundleCalculations = useMemo(() => {
    const originalPrice = bundleForm.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discountAmount = originalPrice - bundleForm.bundle_price;
    const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

    return {
      originalPrice,
      discountAmount,
      discountPercentage,
    };
  }, [bundleForm.items, bundleForm.bundle_price]);

  const handleCreateBundle = async () => {
    if (!store?.id || bundleForm.items.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter au moins un produit au bundle',
        variant: 'destructive',
      });
      return;
    }

    await createBundle.mutateAsync({
      store_id: store.id,
      ...bundleForm,
    });

    setShowCreateDialog(false);
    resetForm();
  };

  const handleApplyPromotion = async () => {
    if (!selectedBundle) return;

    await applyPromotion.mutateAsync({
      bundleId: selectedBundle.id,
      discountPercentage: promotionType === 'percentage' ? promotionDiscount : undefined,
      discountAmount: promotionType === 'amount' ? promotionDiscount : undefined,
    });

    setShowPromotionDialog(false);
    setPromotionDiscount(0);
    setSelectedBundle(null);
  };

  const resetForm = () => {
    setBundleForm({
      name: '',
      description: '',
      type: 'fixed',
      bundle_price: 0,
      track_inventory: false,
      total_quantity: 0,
      is_active: true,
      show_savings: true,
      show_individual_prices: false,
      items: [],
    });
  };

  const addProductToBundle = (productId: string, variantId?: string) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = bundleForm.items.find(
      (item) => item.product_id === productId && item.variant_id === variantId
    );

    if (existingItem) {
      setBundleForm({
        ...bundleForm,
        items: bundleForm.items.map((item) =>
          item.product_id === productId && item.variant_id === variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      setBundleForm({
        ...bundleForm,
        items: [
          ...bundleForm.items,
          {
            product_id: productId,
            variant_id: variantId,
            quantity: 1,
            price: product.price || 0,
            is_required: true,
          },
        ],
      });
    }

    // Recalculer le prix du bundle automatiquement
    const newOriginalPrice = bundleForm.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) + (product.price || 0);
    const suggestedDiscount = newOriginalPrice * 0.1; // 10% de réduction par défaut
    setBundleForm({
      ...bundleForm,
      bundle_price: newOriginalPrice - suggestedDiscount,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards - Responsive */}
      {bundles && bundles.length > 0 && (
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {[
            { label: 'Total Bundles', value: stats.total, icon: ShoppingBag, color: 'from-purple-600 to-pink-600' },
            { label: 'Actifs', value: stats.active, icon: CheckCircle2, color: 'from-green-600 to-emerald-600' },
            { label: 'Économies Total', value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.totalSavings), icon: DollarSign, color: 'from-blue-600 to-cyan-600', isCurrency: true },
            { label: 'Réduction Moyenne', value: `${stats.avgDiscount.toFixed(1)}%`, icon: TrendingDown, color: 'from-orange-600 to-yellow-600' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  {stat.isCurrency ? (
                    <div className={`text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                  ) : (
                    <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bundles List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                Gestion des Bundles
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Créez et gérez des bundles de produits avec promotions automatiques
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm">Créer un Bundle</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!bundles || bundles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center py-8 sm:py-12">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                Aucun bundle créé. Créez votre premier bundle pour commencer.
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un Bundle
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3 sm:space-y-4">
                {bundles.map((bundle, index) => (
                  <BundleCard
                    key={bundle.id}
                    bundle={bundle}
                    onPromotion={() => {
                      setSelectedBundle(bundle);
                      setShowPromotionDialog(true);
                    }}
                    onEdit={() => {
                      setSelectedBundle(bundle);
                      setShowEditDialog(true);
                    }}
                    animationDelay={index * 50}
                  />
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Nom</TableHead>
                      <TableHead className="min-w-[120px]">Type</TableHead>
                      <TableHead className="min-w-[150px]">Prix Original</TableHead>
                      <TableHead className="min-w-[150px]">Prix Bundle</TableHead>
                      <TableHead className="min-w-[120px]">Économies</TableHead>
                      <TableHead className="min-w-[120px]">Inventaire</TableHead>
                      <TableHead className="min-w-[100px]">Statut</TableHead>
                      <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bundles.map((bundle) => (
                      <TableRow key={bundle.id}>
                        <TableCell className="font-medium text-sm">{bundle.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{bundle.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="line-through text-muted-foreground text-sm">
                            {bundle.original_price.toLocaleString()} FCFA
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600 text-sm">
                            {bundle.bundle_price.toLocaleString()} FCFA
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-500 text-xs">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            -{bundle.discount_percentage.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {bundle.track_inventory ? (
                            <span className="text-sm">{bundle.total_quantity || 0} unités</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Illimité</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {bundle.is_active ? (
                            <Badge variant="default" className="bg-green-500 text-xs">Actif</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBundle(bundle);
                                setShowPromotionDialog(true);
                              }}
                              className="h-8 text-xs"
                            >
                              <Tag className="h-3.5 w-3.5 mr-1.5" />
                              Promotion
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBundle(bundle);
                                setShowEditDialog(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Création Bundle */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un Bundle</DialogTitle>
            <DialogDescription>
              Créez un bundle de produits avec prix dynamiques et promotions
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info" className="text-xs sm:text-sm">Informations</TabsTrigger>
              <TabsTrigger value="products" className="text-xs sm:text-sm">Produits</TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs sm:text-sm">Prix</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Nom du Bundle</Label>
                <Input
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                  placeholder="Ex: Pack Starter"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  placeholder="Description du bundle..."
                  className="text-xs sm:text-sm"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Type de Bundle</Label>
                <Select
                  value={bundleForm.type}
                  onValueChange={(v) => setBundleForm({ ...bundleForm, type: v as BundleType })}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixé (produits définis)</SelectItem>
                    <SelectItem value="flexible">Flexible (choix parmi produits)</SelectItem>
                    <SelectItem value="mix_and_match">Mix & Match</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="track-inventory"
                  checked={bundleForm.track_inventory}
                  onCheckedChange={(checked) =>
                    setBundleForm({ ...bundleForm, track_inventory: checked })
                  }
                />
                <Label htmlFor="track-inventory" className="text-xs sm:text-sm">Suivre l'inventaire</Label>
              </div>
              {bundleForm.track_inventory && (
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Quantité disponible</Label>
                  <Input
                    type="number"
                    value={bundleForm.total_quantity}
                    onChange={(e) =>
                      setBundleForm({ ...bundleForm, total_quantity: Number(e.target.value) })
                    }
                    min="0"
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Ajouter des produits</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {products?.map((product) => (
                    <Button
                      key={product.id}
                      variant="outline"
                      onClick={() => addProductToBundle(product.id)}
                      className="justify-start h-9 sm:h-10 text-xs sm:text-sm"
                    >
                      <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                      {product.name}
                    </Button>
                  ))}
                </div>
              </div>
              {bundleForm.items.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Produits dans le bundle</Label>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px] text-xs">Produit</TableHead>
                          <TableHead className="min-w-[80px] text-xs">Quantité</TableHead>
                          <TableHead className="min-w-[100px] text-xs">Prix unitaire</TableHead>
                          <TableHead className="min-w-[100px] text-xs">Total</TableHead>
                          <TableHead className="min-w-[80px] text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bundleForm.items.map((item, index) => {
                          const product = products?.find((p) => p.id === item.product_id);
                          return (
                            <TableRow key={index}>
                              <TableCell className="text-xs sm:text-sm">{product?.name || 'N/A'}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newItems = [...bundleForm.items];
                                    newItems[index].quantity = Number(e.target.value);
                                    setBundleForm({ ...bundleForm, items: newItems });
                                  }}
                                  min="1"
                                  className="w-16 sm:w-20 h-8 text-xs"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => {
                                    const newItems = [...bundleForm.items];
                                    newItems[index].price = Number(e.target.value);
                                    setBundleForm({ ...bundleForm, items: newItems });
                                  }}
                                  min="0"
                                  className="w-20 sm:w-24 h-8 text-xs"
                                />
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {(item.price * item.quantity).toLocaleString()} FCFA
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setBundleForm({
                                      ...bundleForm,
                                      items: bundleForm.items.filter((_, i) => i !== index),
                                    });
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p className="font-semibold">Prix Original: {bundleCalculations.originalPrice.toLocaleString()} FCFA</p>
                      <p className="text-muted-foreground">
                        Économies: {bundleCalculations.discountAmount.toLocaleString()} FCFA ({bundleCalculations.discountPercentage.toFixed(1)}%)
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Prix du Bundle</Label>
                  <Input
                    type="number"
                    value={bundleForm.bundle_price}
                    onChange={(e) =>
                      setBundleForm({ ...bundleForm, bundle_price: Number(e.target.value) })
                    }
                    min="0"
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Le prix sera automatiquement ajusté pour refléter les économies
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-savings"
                    checked={bundleForm.show_savings}
                    onCheckedChange={(checked) =>
                      setBundleForm({ ...bundleForm, show_savings: checked })
                    }
                  />
                  <Label htmlFor="show-savings" className="text-xs sm:text-sm">Afficher les économies</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-individual"
                    checked={bundleForm.show_individual_prices}
                    onCheckedChange={(checked) =>
                      setBundleForm({ ...bundleForm, show_individual_prices: checked })
                    }
                  />
                  <Label htmlFor="show-individual" className="text-xs sm:text-sm">Afficher les prix individuels</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateBundle}
              disabled={createBundle.isPending || bundleForm.items.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {createBundle.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Promotion */}
      <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appliquer une Promotion</DialogTitle>
            <DialogDescription>
              Appliquez une promotion automatique au bundle: {selectedBundle?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Type de promotion</Label>
              <Select
                value={promotionType}
                onValueChange={(v) => setPromotionType(v as 'percentage' | 'amount')}
              >
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage</SelectItem>
                  <SelectItem value="amount">Montant fixe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">
                {promotionType === 'percentage' ? 'Pourcentage de réduction' : 'Montant de réduction'}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={promotionDiscount}
                  onChange={(e) => setPromotionDiscount(Number(e.target.value))}
                  min="0"
                  max={promotionType === 'percentage' ? 100 : undefined}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {promotionType === 'percentage' ? '%' : 'FCFA'}
                </span>
              </div>
            </div>
            {selectedBundle && (
              <Alert>
                <Percent className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  Prix actuel: {selectedBundle.bundle_price.toLocaleString()} FCFA
                  {promotionType === 'percentage' && promotionDiscount > 0 && (
                    <p className="mt-1">
                      Nouveau prix: {((selectedBundle.original_price * (100 - promotionDiscount)) / 100).toLocaleString()} FCFA
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromotionDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleApplyPromotion}
              disabled={applyPromotion.isPending || promotionDiscount <= 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {applyPromotion.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Application...
                </>
              ) : (
                'Appliquer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Bundle Card Component for Mobile View
interface BundleCardProps {
  bundle: Bundle;
  onPromotion: () => void;
  onEdit: () => void;
  animationDelay?: number;
}

function BundleCard({ bundle, onPromotion, onEdit, animationDelay = 0 }: BundleCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1">
                {bundle.name}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                <Badge variant="outline" className="text-xs">{bundle.type}</Badge>
              </CardDescription>
            </div>
          </div>
          {bundle.is_active ? (
            <Badge variant="default" className="bg-green-500 text-xs">Actif</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Inactif</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground line-through">Prix original:</span>
            <span>{bundle.original_price.toLocaleString()} FCFA</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Prix bundle:</span>
            <span className="font-semibold text-green-600">{bundle.bundle_price.toLocaleString()} FCFA</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Économies:</span>
            <Badge variant="default" className="bg-green-500 text-xs">
              <TrendingDown className="h-3 w-3 mr-1" />
              -{bundle.discount_percentage.toFixed(1)}%
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Inventaire:</span>
            <span>
              {bundle.track_inventory ? `${bundle.total_quantity || 0} unités` : 'Illimité'}
            </span>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onPromotion}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Promotion</span>
          </Button>
          <Button
            onClick={onEdit}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Modifier</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
