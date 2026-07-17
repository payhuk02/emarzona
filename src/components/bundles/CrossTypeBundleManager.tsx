/**
 * Gestion vendeur — packs cross-type (digital + physical + course + artist).
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Layers, Plus, ShoppingCart, Trash2, Package, Loader2, Sparkles } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useCart } from '@/hooks/cart/useCart';
import {
  useCreateCrossTypeBundle,
  useCrossTypeBundles,
  useDeleteCrossTypeBundle,
  useStoreProductsForBundlePicker,
  useToggleCrossTypeBundleActive,
} from '@/hooks/bundles/useCrossTypeBundles';
import {
  buildCartItemFromCrossTypeBundle,
  fetchCrossTypeBundleWithItems,
} from '@/lib/bundles/cross-type-bundle-store';
import { validateCrossTypeBundleLines } from '@/lib/checkout/cross-type-bundle';
import { hasMultiTypeCatalog } from '@/lib/commerce/cross-type-bundle-access';
import { getCartProductTypeLabel } from '@/lib/cart/cart-product-type';
import type { CrossTypeBundleLine } from '@/lib/checkout/cross-type-bundle';
import type { StoreProductForBundlePicker } from '@/lib/bundles/cross-type-bundle-store';
import { cn } from '@/lib/utils';

type SelectedLine = CrossTypeBundleLine & { key: string };

function listPrice(product: StoreProductForBundlePicker): number {
  return Number(product.promotional_price ?? product.price ?? 0);
}

export function CrossTypeBundleManager() {
  const navigate = useNavigate();
  const { store } = useStore();
  const { addCrossTypeBundle } = useCart();
  const storeId = store?.id ?? null;

  const { data: bundles, isLoading } = useCrossTypeBundles(storeId);
  const { data: products, isLoading: productsLoading } = useStoreProductsForBundlePicker(storeId);
  const createBundle = useCreateCrossTypeBundle();
  const deleteBundle = useDeleteCrossTypeBundle(storeId);
  const toggleActive = useToggleCrossTypeBundleActive(storeId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bundlePrice, setBundlePrice] = useState(0);
  const [selected, setSelected] = useState<SelectedLine[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  const originalPrice = useMemo(
    () => selected.reduce((sum, line) => sum + line.list_price * line.quantity, 0),
    [selected]
  );

  const typeSummary = useMemo(() => new Set(selected.map(s => s.product_type)), [selected]);

  const validation = useMemo(() => validateCrossTypeBundleLines(selected), [selected]);

  const catalogReady = useMemo(() => hasMultiTypeCatalog(products), [products]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setBundlePrice(0);
    setSelected([]);
  };

  const toggleProduct = (product: StoreProductForBundlePicker) => {
    setSelected(prev => {
      const exists = prev.find(p => p.product_id === product.id);
      if (exists) {
        return prev.filter(p => p.product_id !== product.id);
      }
      return [
        ...prev,
        {
          key: product.id,
          product_id: product.id,
          product_type: product.product_type,
          product_name: product.name,
          quantity: 1,
          list_price: listPrice(product),
        },
      ];
    });
  };

  const handleCreate = async () => {
    if (!storeId || !name.trim() || selected.length < 2) return;
    if (!validation.ok) return;

    await createBundle.mutateAsync({
      storeId,
      name: name.trim(),
      description: description.trim() || undefined,
      bundlePrice: bundlePrice > 0 ? bundlePrice : originalPrice,
      lines: selected,
    });

    setDialogOpen(false);
    resetForm();
  };

  const handleAddToCart = async (bundleId: string) => {
    setAddingId(bundleId);
    try {
      const bundle = await fetchCrossTypeBundleWithItems(bundleId);
      if (!bundle) throw new Error('Pack introuvable');
      const cartItem = buildCartItemFromCrossTypeBundle(bundle, store?.currency ?? 'XOF');
      await addCrossTypeBundle(cartItem);
    } finally {
      setAddingId(null);
    }
  };

  if (!storeId) {
    return (
      <Alert>
        <AlertDescription>
          Sélectionnez une boutique pour gérer les packs cross-type.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Combinez plusieurs verticaux (digital, physique, cours, artiste) en un seul prix. Au
            checkout, le pack se déplie en lignes distinctes pour le fulfillment.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={!catalogReady && !productsLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau pack
        </Button>
      </div>

      {!productsLoading && products != null && !catalogReady && (
        <Alert>
          <AlertDescription>
            Votre catalogue ne contient qu&apos;un seul type de produit. Les packs cross-type
            exigent au moins deux types (ex. digital + physique). Ajoutez des produits d&apos;un
            autre type ou contactez le support pour activer le mode multi-verticales sur votre
            boutique.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Packs enregistrés
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Chargement…' : `${bundles?.length ?? 0} pack(s) cross-type`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !bundles?.length ? (
            <p className="p-6 text-sm text-muted-foreground">
              Aucun pack cross-type. Créez-en un pour proposer digital + cours + physique en une
              commande.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prix pack</TableHead>
                  <TableHead>Économie</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundles.map(bundle => {
                  const savings = bundle.original_price - bundle.bundle_price;
                  return (
                    <TableRow key={bundle.id}>
                      <TableCell>
                        <div className="font-medium">{bundle.name}</div>
                        {bundle.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {bundle.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{bundle.bundle_price.toLocaleString('fr-FR')} XOF</TableCell>
                      <TableCell className="text-green-600">
                        {savings > 0 ? `-${savings.toLocaleString('fr-FR')} XOF` : '—'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(bundle.is_active)}
                          onCheckedChange={v =>
                            toggleActive.mutate({ bundleId: bundle.id, isActive: v })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!bundle.is_active || addingId === bundle.id}
                          onClick={() => handleAddToCart(bundle.id)}
                        >
                          {addingId === bundle.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Panier
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBundle.mutate(bundle.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau pack cross-type</DialogTitle>
            <DialogDescription>
              Sélectionnez au moins 2 produits de types différents (services exclus — réservation
              obligatoire).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bundle-name">Nom du pack</Label>
                <Input
                  id="bundle-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Pack Créateur Pro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bundle-price">Prix pack (XOF)</Label>
                <Input
                  id="bundle-price"
                  type="number"
                  min={0}
                  value={bundlePrice || ''}
                  onChange={e => setBundlePrice(Number(e.target.value))}
                  placeholder={originalPrice > 0 ? String(originalPrice) : '0'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bundle-desc">Description</Label>
              <Textarea
                id="bundle-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {selected.length} produit{selected.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant={typeSummary.size >= 2 ? 'default' : 'secondary'}>
                {typeSummary.size} type{typeSummary.size !== 1 ? 's' : ''}
              </Badge>
              {originalPrice > 0 && (
                <Badge variant="outline">
                  Catalogue : {originalPrice.toLocaleString('fr-FR')} XOF
                </Badge>
              )}
            </div>

            {!validation.ok && selected.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>{validation.message}</AlertDescription>
              </Alert>
            )}

            <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
              {productsLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                (products ?? []).map(product => {
                  const isSelected = selected.some(s => s.product_id === product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className={cn(
                        'w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors',
                        isSelected && 'bg-primary/5'
                      )}
                      onClick={() => toggleProduct(product)}
                    >
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getCartProductTypeLabel(product.product_type)} ·{' '}
                          {listPrice(product).toLocaleString('fr-FR')} XOF
                        </p>
                      </div>
                      {isSelected && (
                        <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => navigate('/cart')}>
              Voir le panier
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createBundle.isPending || !name.trim() || !validation.ok || selected.length < 2
              }
            >
              {createBundle.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer le pack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
