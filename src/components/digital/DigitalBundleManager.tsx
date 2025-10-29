import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Package,
  Plus,
  Trash2,
  GripVertical,
  DollarSign,
  Percent,
  Info,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Tag,
  TrendingDown,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Produit digital pouvant être ajouté à un bundle
 */
export interface BundleDigitalProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category: string;
  thumbnail?: string;
  isAvailable: boolean;
}

/**
 * Type de réduction pour le bundle
 */
export type BundleDiscountType = 'percentage' | 'fixed' | 'none';

/**
 * Bundle de produits digitaux
 */
export interface DigitalBundle {
  id?: string;
  name: string;
  description: string;
  productIds: string[];
  discountType: BundleDiscountType;
  discountValue: number;
  isActive: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
  maxUses?: number;
  currentUses?: number;
  thumbnail?: string;
  tags?: string[];
}

/**
 * Props pour DigitalBundleManager
 */
export interface DigitalBundleManagerProps {
  /** Bundle à éditer (optionnel, pour création vide) */
  bundle?: Partial<DigitalBundle>;
  
  /** Liste des produits disponibles */
  availableProducts: BundleDigitalProduct[];
  
  /** Callback lors de la sauvegarde */
  onSave?: (bundle: DigitalBundle) => void;
  
  /** Callback lors de l'annulation */
  onCancel?: () => void;
  
  /** Mode édition ou création */
  mode?: 'create' | 'edit';
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * DigitalBundleManager - Gestionnaire de création/édition de bundles de produits digitaux
 * 
 * @example
 * ```tsx
 * <DigitalBundleManager 
 *   availableProducts={products}
 *   onSave={(bundle) => console.log('Bundle saved:', bundle)}
 *   mode="create"
 * />
 * 
 * <DigitalBundleManager 
 *   bundle={existingBundle}
 *   availableProducts={products}
 *   onSave={(bundle) => console.log('Bundle updated:', bundle)}
 *   mode="edit"
 * />
 * ```
 */
export const DigitalBundleManager: React.FC<DigitalBundleManagerProps> = ({
  bundle,
  availableProducts,
  onSave,
  onCancel,
  mode = 'create',
  className,
}) => {
  // États du formulaire
  const [name, setName] = useState(bundle?.name || '');
  const [description, setDescription] = useState(bundle?.description || '');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(bundle?.productIds || []);
  const [discountType, setDiscountType] = useState<BundleDiscountType>(
    bundle?.discountType || 'percentage'
  );
  const [discountValue, setDiscountValue] = useState(bundle?.discountValue || 0);
  const [isActive, setIsActive] = useState(bundle?.isActive !== undefined ? bundle.isActive : true);
  const [maxUses, setMaxUses] = useState(bundle?.maxUses?.toString() || '');
  const [tags, setTags] = useState<string[]>(bundle?.tags || []);
  const [newTag, setNewTag] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculer les produits sélectionnés
  const selectedProducts = useMemo(() => {
    return availableProducts.filter((p) => selectedProductIds.includes(p.id));
  }, [availableProducts, selectedProductIds]);

  // Calculer le prix total sans réduction
  const originalTotalPrice = useMemo(() => {
    return selectedProducts.reduce((sum, product) => sum + product.price, 0);
  }, [selectedProducts]);

  // Calculer le prix après réduction
  const discountedPrice = useMemo(() => {
    if (discountType === 'none') return originalTotalPrice;
    if (discountType === 'percentage') {
      return originalTotalPrice * (1 - discountValue / 100);
    }
    return Math.max(0, originalTotalPrice - discountValue);
  }, [originalTotalPrice, discountType, discountValue]);

  // Calculer le pourcentage d'économie
  const savingsPercentage = useMemo(() => {
    if (originalTotalPrice === 0) return 0;
    return ((originalTotalPrice - discountedPrice) / originalTotalPrice) * 100;
  }, [originalTotalPrice, discountedPrice]);

  // Toggle sélection de produit
  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Ajouter un tag
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Supprimer un tag
  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Valider le formulaire
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom du bundle est requis';
    }

    if (selectedProductIds.length < 2) {
      newErrors.products = 'Sélectionnez au moins 2 produits';
    }

    if (discountType !== 'none') {
      if (discountValue <= 0) {
        newErrors.discount = 'La réduction doit être supérieure à 0';
      }
      if (discountType === 'percentage' && discountValue > 100) {
        newErrors.discount = 'La réduction ne peut pas dépasser 100%';
      }
      if (discountType === 'fixed' && discountValue >= originalTotalPrice) {
        newErrors.discount = 'La réduction ne peut pas être supérieure au prix total';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sauvegarder le bundle
  const handleSave = () => {
    if (!validate()) return;

    const bundleData: DigitalBundle = {
      ...(bundle?.id && { id: bundle.id }),
      name,
      description,
      productIds: selectedProductIds,
      discountType,
      discountValue,
      isActive,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      currentUses: bundle?.currentUses || 0,
      tags,
    };

    onSave?.(bundleData);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Créer un Bundle' : 'Éditer le Bundle'}
          </h2>
          <p className="text-muted-foreground">
            Regroupez plusieurs produits digitaux avec une réduction spéciale
          </p>
        </div>
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Actif' : 'Inactif'}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informations du bundle</h3>
            <div className="space-y-4">
              {/* Nom */}
              <div>
                <Label htmlFor="name">
                  Nom du bundle <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pack Formation Complète React"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez ce que contient ce bundle..."
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ajouter un tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Statut actif */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="is-active" className="cursor-pointer font-medium">
                    Bundle actif
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Le bundle sera visible et achetable par les clients
                  </p>
                </div>
                {isActive ? (
                  <Eye className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Limite d'utilisations */}
              <div>
                <Label htmlFor="max-uses">Limite d'utilisations (optionnel)</Label>
                <Input
                  id="max-uses"
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Illimité"
                  min="0"
                />
                {bundle?.currentUses !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {bundle.currentUses} utilisation{bundle.currentUses > 1 ? 's' : ''} actuellement
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Sélection des produits */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Produits du bundle <span className="text-red-500">*</span>
              </h3>
              <Badge variant="secondary">
                {selectedProductIds.length} sélectionné{selectedProductIds.length > 1 ? 's' : ''}
              </Badge>
            </div>

            {errors.products && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-700">{errors.products}</p>
              </div>
            )}

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {availableProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun produit disponible</p>
                  </div>
                ) : (
                  availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className={cn(
                        'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all',
                        selectedProductIds.includes(product.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300',
                        !product.isAvailable && 'opacity-50 cursor-not-allowed'
                      )}
                      onClick={() => product.isAvailable && toggleProduct(product.id)}
                    >
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        disabled={!product.isAvailable}
                      />

                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          {product.price} {product.currency || 'EUR'}
                        </p>
                        {!product.isAvailable && (
                          <Badge variant="destructive" className="text-xs">
                            Indisponible
                          </Badge>
                        )}
                      </div>

                      {selectedProductIds.includes(product.id) && (
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Configuration de la réduction */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Réduction</h3>
            <div className="space-y-4">
              {/* Type de réduction */}
              <div>
                <Label htmlFor="discount-type">Type de réduction</Label>
                <Select
                  value={discountType}
                  onValueChange={(value) => setDiscountType(value as BundleDiscountType)}
                >
                  <SelectTrigger id="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune réduction</SelectItem>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valeur de la réduction */}
              {discountType !== 'none' && (
                <div>
                  <Label htmlFor="discount-value">
                    Valeur de la réduction
                    {discountType === 'percentage' && ' (%)'}
                    {discountType === 'fixed' && ' (EUR)'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="discount-value"
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      max={discountType === 'percentage' ? 100 : undefined}
                      step={discountType === 'percentage' ? 1 : 0.01}
                      className={errors.discount ? 'border-red-500' : ''}
                    />
                    {discountType === 'percentage' ? (
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {errors.discount && (
                    <p className="text-xs text-red-500 mt-1">{errors.discount}</p>
                  )}
                </div>
              )}

              {/* Aperçu de la réduction */}
              {discountType !== 'none' && discountValue > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">
                      Économie de {savingsPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-sm text-green-700">
                    <p>
                      Prix original: <span className="line-through">{originalTotalPrice.toFixed(2)} EUR</span>
                    </p>
                    <p>
                      Réduction: -{(originalTotalPrice - discountedPrice).toFixed(2)} EUR
                    </p>
                    <p className="font-bold text-base mt-1">
                      Prix final: {discountedPrice.toFixed(2)} EUR
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Panneau latéral - Résumé */}
        <div className="space-y-6">
          {/* Résumé du bundle */}
          <Card className="p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Résumé</h3>

            {/* Produits sélectionnés */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Produits</span>
                <span className="font-semibold">{selectedProducts.length}</span>
              </div>

              {selectedProducts.length > 0 && (
                <div className="space-y-2">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1">{product.name}</span>
                      <span className="font-medium ml-2">{product.price} EUR</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Prix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prix total</span>
                <span className={cn(
                  'font-semibold',
                  discountType !== 'none' && discountValue > 0 && 'line-through text-muted-foreground'
                )}>
                  {originalTotalPrice.toFixed(2)} EUR
                </span>
              </div>

              {discountType !== 'none' && discountValue > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>Réduction</span>
                    <span>-{(originalTotalPrice - discountedPrice).toFixed(2)} EUR</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Prix final</span>
                    <span className="text-xl font-bold text-green-600">
                      {discountedPrice.toFixed(2)} EUR
                    </span>
                  </div>

                  <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
                    <span className="text-sm font-semibold text-green-700">
                      Économie de {savingsPercentage.toFixed(0)}%
                    </span>
                  </div>
                </>
              )}
            </div>

            <Separator className="my-4" />

            {/* Informations supplémentaires */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Bundle actif</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span>Bundle inactif</span>
                  </>
                )}
              </div>

              {maxUses && (
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Limité à {maxUses} utilisations</span>
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>{tags.length} tag{tags.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-4">
            <div className="space-y-2">
              <Button onClick={handleSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Créer le bundle' : 'Sauvegarder'}
              </Button>

              {onCancel && (
                <Button onClick={onCancel} variant="outline" className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              )}

              {mode === 'edit' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce bundle ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le bundle sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600">
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </Card>

          {/* Aide */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">Conseil</p>
                <p>
                  Les bundles avec une réduction de 20-30% ont généralement le meilleur taux de conversion.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

DigitalBundleManager.displayName = 'DigitalBundleManager';

export default DigitalBundleManager;

