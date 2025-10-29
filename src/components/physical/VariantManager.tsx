import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  Package,
  Grid3x3,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface VariantOption {
  id: string;
  name: string; // ex: "Couleur", "Taille", "Matériau"
  values: string[]; // ex: ["Rouge", "Bleu", "Vert"]
}

export interface ProductVariant {
  id: string;
  sku?: string;
  barcode?: string;
  option_values: Record<string, string>; // ex: { "Couleur": "Rouge", "Taille": "M" }
  price_adjustment: number; // +/- par rapport au prix de base
  quantity: number;
  low_stock_threshold?: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface VariantManagerProps {
  basePrice: number;
  currency: string;
  options: VariantOption[];
  variants: ProductVariant[];
  onOptionsChange: (options: VariantOption[]) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
  className?: string;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function OptionEditor({
  option,
  onUpdate,
  onDelete,
}: {
  option: VariantOption;
  onUpdate: (option: VariantOption) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(option.name);
  const [newValue, setNewValue] = useState('');

  const handleAddValue = () => {
    if (newValue.trim() && !option.values.includes(newValue.trim())) {
      onUpdate({
        ...option,
        values: [...option.values, newValue.trim()],
      });
      setNewValue('');
    }
  };

  const handleRemoveValue = (value: string) => {
    onUpdate({
      ...option,
      values: option.values.filter((v) => v !== value),
    });
  };

  const handleNameChange = () => {
    if (name.trim() && name !== option.name) {
      onUpdate({ ...option, name: name.trim() });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2 flex-1">
          <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameChange}
            className="max-w-[200px] font-medium"
            placeholder="Nom de l'option"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing values */}
        <div className="flex flex-wrap gap-2">
          {option.values.map((value) => (
            <Badge key={value} variant="secondary" className="gap-2 pr-1">
              {value}
              <button
                onClick={() => handleRemoveValue(value)}
                className="hover:bg-destructive/20 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Add new value */}
        <div className="flex gap-2">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
            placeholder={`Ajouter une valeur (ex: ${option.name === 'Couleur' ? 'Rouge' : option.name === 'Taille' ? 'M' : 'Standard'})`}
          />
          <Button onClick={handleAddValue} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VariantManager({
  basePrice,
  currency,
  options,
  variants,
  onOptionsChange,
  onVariantsChange,
  className,
}: VariantManagerProps) {
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);

  // Add new option
  const handleAddOption = () => {
    if (newOptionName.trim() && !options.some((o) => o.name === newOptionName.trim())) {
      onOptionsChange([
        ...options,
        {
          id: `opt_${Date.now()}`,
          name: newOptionName.trim(),
          values: [],
        },
      ]);
      setNewOptionName('');
      setShowAddOption(false);
    }
  };

  // Update option
  const handleUpdateOption = (optionId: string, updatedOption: VariantOption) => {
    onOptionsChange(options.map((o) => (o.id === optionId ? updatedOption : o)));
  };

  // Delete option
  const handleDeleteOption = (optionId: string) => {
    onOptionsChange(options.filter((o) => o.id !== optionId));
    // Also remove all variants using this option
    const option = options.find((o) => o.id === optionId);
    if (option) {
      onVariantsChange(
        variants.filter((v) => !Object.keys(v.option_values).includes(option.name))
      );
    }
  };

  // Generate all possible variants from options
  const handleGenerateVariants = () => {
    if (options.length === 0) return;

    // Cartesian product of all option values
    const generateCombinations = (opts: VariantOption[]): Record<string, string>[] => {
      if (opts.length === 0) return [{}];
      
      const [first, ...rest] = opts;
      const restCombinations = generateCombinations(rest);
      
      const combinations: Record<string, string>[] = [];
      for (const value of first.values) {
        for (const combo of restCombinations) {
          combinations.push({ [first.name]: value, ...combo });
        }
      }
      
      return combinations;
    };

    const combinations = generateCombinations(options);
    const newVariants: ProductVariant[] = combinations.map((combo, index) => ({
      id: `var_${Date.now()}_${index}`,
      sku: '',
      barcode: '',
      option_values: combo,
      price_adjustment: 0,
      quantity: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    }));

    onVariantsChange(newVariants);
  };

  // Edit variant
  const handleSaveVariant = (variant: ProductVariant) => {
    onVariantsChange(variants.map((v) => (v.id === variant.id ? variant : v)));
    setEditingVariant(null);
  };

  // Delete variant(s)
  const handleDeleteVariants = () => {
    if (deleteVariantId) {
      onVariantsChange(variants.filter((v) => v.id !== deleteVariantId));
      setDeleteVariantId(null);
    } else if (selectedVariants.length > 0) {
      onVariantsChange(variants.filter((v) => !selectedVariants.includes(v.id)));
      setSelectedVariants([]);
    }
  };

  // Bulk actions
  const handleBulkPriceAdjustment = (adjustment: number) => {
    onVariantsChange(
      variants.map((v) =>
        selectedVariants.includes(v.id) ? { ...v, price_adjustment: adjustment } : v
      )
    );
    setSelectedVariants([]);
  };

  const handleBulkToggleActive = (isActive: boolean) => {
    onVariantsChange(
      variants.map((v) => (selectedVariants.includes(v.id) ? { ...v, is_active: isActive } : v))
    );
    setSelectedVariants([]);
  };

  const getVariantLabel = (variant: ProductVariant) => {
    return Object.entries(variant.option_values)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' / ');
  };

  const getStockStatus = (variant: ProductVariant): 'in_stock' | 'low_stock' | 'out_of_stock' => {
    if (variant.quantity === 0) return 'out_of_stock';
    if (variant.low_stock_threshold && variant.quantity <= variant.low_stock_threshold) {
      return 'low_stock';
    }
    return 'in_stock';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Options Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Options de Variantes</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Définissez les options (couleur, taille, etc.)
            </p>
          </div>
          <Button onClick={() => setShowAddOption(true)} variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter Option
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {options.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                Aucune option définie. Ajoutez des options pour créer des variantes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {options.map((option) => (
                <OptionEditor
                  key={option.id}
                  option={option}
                  onUpdate={(updated) => handleUpdateOption(option.id, updated)}
                  onDelete={() => handleDeleteOption(option.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variants Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Variantes Produit ({variants.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les prix, stocks et SKU de chaque variante
            </p>
          </div>
          <div className="flex gap-2">
            {selectedVariants.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions ({selectedVariants.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkToggleActive(true)}>
                    <Check className="h-4 w-4 mr-2" />
                    Activer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkToggleActive(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Désactiver
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteVariantId('bulk')}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer ({selectedVariants.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              onClick={handleGenerateVariants}
              disabled={options.length === 0 || options.some((o) => o.values.length === 0)}
              size="sm"
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Générer Variantes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune variante</p>
              <p className="text-sm">
                {options.length === 0
                  ? "Ajoutez d'abord des options pour créer des variantes"
                  : 'Cliquez sur "Générer Variantes" pour créer automatiquement toutes les combinaisons'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedVariants.length === variants.length}
                        onCheckedChange={(checked) => {
                          setSelectedVariants(checked ? variants.map((v) => v.id) : []);
                        }}
                      />
                    </TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead>SKU / Code-barres</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => {
                    const stockStatus = getStockStatus(variant);
                    const finalPrice = basePrice + variant.price_adjustment;

                    return (
                      <TableRow key={variant.id}>
                        {/* Checkbox */}
                        <TableCell>
                          <Checkbox
                            checked={selectedVariants.includes(variant.id)}
                            onCheckedChange={(checked) => {
                              setSelectedVariants(
                                checked
                                  ? [...selectedVariants, variant.id]
                                  : selectedVariants.filter((id) => id !== variant.id)
                              );
                            }}
                          />
                        </TableCell>

                        {/* Variant */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {variant.image_url ? (
                              <img
                                src={variant.image_url}
                                alt={getVariantLabel(variant)}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <p className="font-medium">{getVariantLabel(variant)}</p>
                          </div>
                        </TableCell>

                        {/* SKU / Barcode */}
                        <TableCell>
                          <div className="space-y-1">
                            {variant.sku && (
                              <p className="text-sm font-mono">{variant.sku}</p>
                            )}
                            {variant.barcode && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {variant.barcode}
                              </p>
                            )}
                            {!variant.sku && !variant.barcode && (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Price */}
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {finalPrice.toLocaleString()} {currency}
                            </p>
                            {variant.price_adjustment !== 0 && (
                              <p
                                className={cn(
                                  'text-xs',
                                  variant.price_adjustment > 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                )}
                              >
                                {variant.price_adjustment > 0 ? '+' : ''}
                                {variant.price_adjustment.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Stock */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                stockStatus === 'out_of_stock'
                                  ? 'destructive'
                                  : stockStatus === 'low_stock'
                                  ? 'secondary'
                                  : 'default'
                              }
                              className="gap-1"
                            >
                              {stockStatus === 'out_of_stock' && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {variant.quantity}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                            {variant.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingVariant(variant)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteVariantId(variant.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Option Dialog */}
      <Dialog open={showAddOption} onOpenChange={setShowAddOption}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une Option</DialogTitle>
            <DialogDescription>
              Créez une nouvelle option de variante (ex: Couleur, Taille, Matériau)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="option-name">Nom de l'option</Label>
              <Input
                id="option-name"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="ex: Couleur, Taille, Matériau"
                onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddOption(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddOption} disabled={!newOptionName.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Variant Dialog */}
      {editingVariant && (
        <Dialog open={!!editingVariant} onOpenChange={() => setEditingVariant(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier la Variante</DialogTitle>
              <DialogDescription>{getVariantLabel(editingVariant)}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sku">SKU</Label>
                  <Input
                    id="edit-sku"
                    value={editingVariant.sku || ''}
                    onChange={(e) =>
                      setEditingVariant({ ...editingVariant, sku: e.target.value })
                    }
                    placeholder="SKU-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-barcode">Code-barres</Label>
                  <Input
                    id="edit-barcode"
                    value={editingVariant.barcode || ''}
                    onChange={(e) =>
                      setEditingVariant({ ...editingVariant, barcode: e.target.value })
                    }
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Ajustement Prix ({currency})</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingVariant.price_adjustment}
                    onChange={(e) =>
                      setEditingVariant({
                        ...editingVariant,
                        price_adjustment: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Prix final: {(basePrice + editingVariant.price_adjustment).toLocaleString()}{' '}
                    {currency}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantité en Stock</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="0"
                    value={editingVariant.quantity}
                    onChange={(e) =>
                      setEditingVariant({ ...editingVariant, quantity: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-threshold">Seuil Stock Faible</Label>
                  <Input
                    id="edit-threshold"
                    type="number"
                    min="0"
                    value={editingVariant.low_stock_threshold || ''}
                    onChange={(e) =>
                      setEditingVariant({
                        ...editingVariant,
                        low_stock_threshold: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-image">URL Image</Label>
                  <Input
                    id="edit-image"
                    value={editingVariant.image_url || ''}
                    onChange={(e) =>
                      setEditingVariant({ ...editingVariant, image_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-active"
                  checked={editingVariant.is_active}
                  onCheckedChange={(checked) =>
                    setEditingVariant({ ...editingVariant, is_active: !!checked })
                  }
                />
                <Label htmlFor="edit-active" className="cursor-pointer">
                  Variante active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingVariant(null)}>
                Annuler
              </Button>
              <Button onClick={() => handleSaveVariant(editingVariant)}>Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteVariantId} onOpenChange={() => setDeleteVariantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteVariantId === 'bulk'
                ? `Êtes-vous sûr de vouloir supprimer ${selectedVariants.length} variante(s) ?`
                : 'Êtes-vous sûr de vouloir supprimer cette variante ?'}
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVariants} className="bg-destructive">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

