import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
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
 * import { logger } from '@/lib/logger';
 * 
 * <DigitalBundleManager 
 *   availableProducts={products}
 *   onSave={(bundle) => logger.info('Bundle saved', { bundleId: bundle.id })}
 *   mode="create"
 * />
 * 
 * <DigitalBundleManager 
 *   bundle={existingBundle}
 *   availableProducts={products}
 *   onSave={(bundle) => logger.info('Bundle updated', { bundleId: bundle.id })}
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
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
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
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
            {mode === 'create' ? 'Créer un Bundle' : 'Éditer le Bundle'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Regroupez plusieurs produits digitaux avec une réduction spéciale
          </p>
        </div>
        <Badge variant={isActive ? 'default' : 'secondary'} className="self-start sm:self-auto shrink-0">
          {isActive ? 'Actif' : 'Inactif'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Informations de base */}
          <Card className="p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Informations du bundle</h3>
            <div className="space-y-3 sm:space-y-4">
              {/* Nom */}
              <div>
                <Label htmlFor="name" className="text-xs sm:text-sm">
                  Nom du bundle <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  placeholder="Ex: Pack Formation Complète React"
                  className={cn(
                    'h-9 sm:h-10 text-xs sm:text-sm',
                    errors.name && 'border-red-500'
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  placeholder="Décrivez ce que contient ce bundle..."
                  rows={3}
                  className="text-xs sm:text-sm resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags" className="text-xs sm:text-sm">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleSpaceKeyDown}
                    placeholder="Ajouter un tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                  <Button type="button" variant="outline" onClick={addTag} size="sm" className="h-9 sm:h-10 px-2 sm:px-3 shrink-0">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                        <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="truncate max-w-[100px] sm:max-w-none">{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 sm:ml-1 hover:text-red-500 shrink-0"
                          aria-label={`Supprimer le tag ${tag}`}
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Statut actif */}
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked as boolean)}
                  className="mt-0.5 sm:mt-0 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Label htmlFor="is-active" className="cursor-pointer font-medium text-xs sm:text-sm">
                    Bundle actif
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Le bundle sera visible et achetable par les clients
                  </p>
                </div>
                {isActive ? (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
                ) : (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 shrink-0" />
                )}
              </div>

              {/* Limite d'utilisations */}
              <div>
                <Label htmlFor="max-uses" className="text-xs sm:text-sm">Limite d'utilisations (optionnel)</Label>
                <Input
                  id="max-uses"
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Illimité"
                  min="0"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
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
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">
                Produits du bundle <span className="text-red-500">*</span>
              </h3>
              <Badge variant="secondary" className="self-start sm:self-auto shrink-0 text-xs">
                {selectedProductIds.length} sélectionné{selectedProductIds.length > 1 ? 's' : ''}
              </Badge>
            </div>

            {errors.products && (
              <div className="flex items-start sm:items-center gap-2 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg mb-3 sm:mb-4">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-xs sm:text-sm text-red-700">{errors.products}</p>
              </div>
            )}

            <ScrollArea className="h-[300px] sm:h-[350px] md:h-[400px] pr-2 sm:pr-4">
              <div className="space-y-2">
                {availableProducts.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">Aucun produit disponible</p>
                  </div>
                ) : (
                  availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className={cn(
                        'flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg cursor-pointer transition-all',
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
                        className="mt-0.5 sm:mt-0 shrink-0"
                      />

                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                          {product.price} {product.currency || 'EUR'}
                        </p>
                        {!product.isAvailable && (
                          <Badge variant="destructive" className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                            Indisponible
                          </Badge>
                        )}
                      </div>

                      {selectedProductIds.includes(product.id) && (
                        <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 hidden sm:block" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Configuration de la réduction */}
          <Card className="p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Réduction</h3>
            <div className="space-y-3 sm:space-y-4">
              {/* Type de réduction */}
              <div>
                <Label htmlFor="discount-type" className="text-xs sm:text-sm">Type de réduction</Label>
                <Select
                  value={discountType}
                  onValueChange={(value) => setDiscountType(value as BundleDiscountType)}
                >
                  <SelectTrigger id="discount-type" className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs sm:text-sm">Aucune réduction</SelectItem>
                    <SelectItem value="percentage" className="text-xs sm:text-sm">Pourcentage</SelectItem>
                    <SelectItem value="fixed" className="text-xs sm:text-sm">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valeur de la réduction */}
              {discountType !== 'none' && (
                <div>
                  <Label htmlFor="discount-value" className="text-xs sm:text-sm">
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
                      className={cn(
                        'h-9 sm:h-10 text-xs sm:text-sm pr-8 sm:pr-10',
                        errors.discount && 'border-red-500'
                      )}
                    />
                    {discountType === 'percentage' ? (
                      <Percent className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
                    ) : (
                      <DollarSign className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
                    )}
                  </div>
                  {errors.discount && (
                    <p className="text-xs text-red-500 mt-1">{errors.discount}</p>
                  )}
                </div>
              )}

              {/* Aperçu de la réduction */}
              {discountType !== 'none' && discountValue > 0 && (
                <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
                    <span className="font-semibold text-green-700 text-xs sm:text-sm">
                      Économie de {savingsPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-green-700 space-y-1">
                    <p>
                      Prix original: <span className="line-through">{originalTotalPrice.toFixed(2)} EUR</span>
                    </p>
                    <p>
                      Réduction: -{(originalTotalPrice - discountedPrice).toFixed(2)} EUR
                    </p>
                    <p className="font-bold text-sm sm:text-base mt-1">
                      Prix final: {discountedPrice.toFixed(2)} EUR
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Panneau latéral - Résumé */}
        <div className="space-y-4 sm:space-y-6">
          {/* Résumé du bundle */}
          <Card className="p-3 sm:p-4 lg:p-6 lg:sticky lg:top-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Résumé</h3>

            {/* Produits sélectionnés */}
            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Produits</span>
                <span className="font-semibold">{selectedProducts.length}</span>
              </div>

              {selectedProducts.length > 0 && (
                <div className="space-y-1.5 sm:space-y-2 max-h-[120px] sm:max-h-[200px] overflow-y-auto pr-2">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between text-xs gap-2">
                      <span className="truncate flex-1 min-w-0">{product.name}</span>
                      <span className="font-medium shrink-0 whitespace-nowrap ml-2">{product.price} EUR</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-3 sm:my-4" />

            {/* Prix */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
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
                  <div className="flex items-center justify-between text-xs sm:text-sm text-green-600">
                    <span>Réduction</span>
                    <span>-{(originalTotalPrice - discountedPrice).toFixed(2)} EUR</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold">Prix final</span>
                    <span className="text-lg sm:text-xl font-bold text-green-600">
                      {discountedPrice.toFixed(2)} EUR
                    </span>
                  </div>

                  <div className="p-1.5 sm:p-2 bg-green-50 border border-green-200 rounded text-center">
                    <span className="text-xs sm:text-sm font-semibold text-green-700">
                      Économie de {savingsPercentage.toFixed(0)}%
                    </span>
                  </div>
                </>
              )}
            </div>

            <Separator className="my-3 sm:my-4" />

            {/* Informations supplémentaires */}
            <div className="space-y-1.5 sm:space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                    <span>Bundle actif</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 shrink-0" />
                    <span>Bundle inactif</span>
                  </>
                )}
              </div>

              {maxUses && (
                <div className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span>Limité à {maxUses} utilisations</span>
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span>{tags.length} tag{tags.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-3 sm:p-4">
            <div className="space-y-2">
              <Button onClick={handleSave} className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="truncate">{mode === 'create' ? 'Créer le bundle' : 'Sauvegarder'}</span>
              </Button>

              {onCancel && (
                <Button onClick={onCancel} variant="outline" className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Annuler
                </Button>
              )}

              {mode === 'edit' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-base sm:text-lg">Supprimer ce bundle ?</AlertDialogTitle>
                      <AlertDialogDescription className="text-xs sm:text-sm">
                        Cette action est irréversible. Le bundle sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                      <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">Annuler</AlertDialogCancel>
                      <AlertDialogAction className="w-full sm:w-auto bg-red-600 text-xs sm:text-sm">
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </Card>

          {/* Aide */}
          <Card className="p-3 sm:p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs sm:text-sm text-blue-700">
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

