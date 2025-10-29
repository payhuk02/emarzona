import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Edit3,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Percent,
  Tag,
  Shield,
  Archive,
  Trash2,
  Download,
  FileText,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Save,
  X,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Champs modifiables pour les produits digitaux
 */
export type BulkUpdateField =
  | 'price'
  | 'category'
  | 'status'
  | 'protectionLevel'
  | 'tags'
  | 'maxLicenses';

/**
 * Mode de mise à jour
 */
export type UpdateMode =
  | 'set'        // Définir une nouvelle valeur
  | 'adjust'     // Ajuster (+ ou -)
  | 'append'     // Ajouter (pour tags)
  | 'remove';    // Retirer (pour tags)

/**
 * Produit digital pour mise à jour groupée
 */
export interface BulkUpdateDigitalProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  status: 'draft' | 'published' | 'active' | 'archived' | 'suspended';
  protectionLevel?: 'basic' | 'standard' | 'advanced';
  tags: string[];
  maxLicenses?: number;
  currentLicenses?: number;
  thumbnail?: string;
}

/**
 * Changement à appliquer
 */
export interface BulkUpdateChange {
  field: BulkUpdateField;
  mode: UpdateMode;
  value: string | number;
}

/**
 * Props pour BulkDigitalUpdate
 */
export interface BulkDigitalUpdateProps {
  /** Liste des produits à mettre à jour */
  products: BulkUpdateDigitalProduct[];
  
  /** Callback lors de la sauvegarde */
  onSave?: (productIds: string[], changes: BulkUpdateChange[]) => void;
  
  /** Callback lors de l'annulation */
  onCancel?: () => void;
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Configuration des champs
 */
const FIELD_CONFIG: Record<
  BulkUpdateField,
  {
    label: string;
    icon: React.ElementType;
    modes: UpdateMode[];
    unit?: string;
  }
> = {
  price: {
    label: 'Prix',
    icon: DollarSign,
    modes: ['set', 'adjust'],
    unit: 'EUR',
  },
  category: {
    label: 'Catégorie',
    icon: Tag,
    modes: ['set'],
  },
  status: {
    label: 'Statut',
    icon: Eye,
    modes: ['set'],
  },
  protectionLevel: {
    label: 'Niveau de protection',
    icon: Shield,
    modes: ['set'],
  },
  tags: {
    label: 'Tags',
    icon: Tag,
    modes: ['append', 'remove'],
  },
  maxLicenses: {
    label: 'Limite de licences',
    icon: Package,
    modes: ['set', 'adjust'],
  },
};

/**
 * BulkDigitalUpdate - Composant de mise à jour groupée de produits digitaux
 * 
 * @example
 * ```tsx
 * <BulkDigitalUpdate 
 *   products={selectedProducts}
 *   onSave={(ids, changes) => console.log('Update:', ids, changes)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * ```
 */
export const BulkDigitalUpdate: React.FC<BulkDigitalUpdateProps> = ({
  products,
  onSave,
  onCancel,
  className,
}) => {
  // États
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(products.map((p) => p.id))
  );
  const [updateField, setUpdateField] = useState<BulkUpdateField>('price');
  const [updateMode, setUpdateMode] = useState<UpdateMode>('set');
  const [updateValue, setUpdateValue] = useState<string>('');
  const [changes, setChanges] = useState<BulkUpdateChange[]>([]);

  // Toggle sélection de produit
  const toggleProduct = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  // Sélectionner tous / aucun
  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  };

  // Ajouter un changement
  const addChange = () => {
    if (!updateValue.trim()) return;

    const newChange: BulkUpdateChange = {
      field: updateField,
      mode: updateMode,
      value: updateField === 'price' || updateField === 'maxLicenses'
        ? parseFloat(updateValue)
        : updateValue,
    };

    setChanges([...changes, newChange]);
    setUpdateValue('');
  };

  // Retirer un changement
  const removeChange = (index: number) => {
    setChanges(changes.filter((_, i) => i !== index));
  };

  // Obtenir les produits sélectionnés
  const selected = useMemo(() => {
    return products.filter((p) => selectedProducts.has(p.id));
  }, [products, selectedProducts]);

  // Calculer l'aperçu des changements
  const previewChanges = useMemo(() => {
    if (selected.length === 0) return [];

    return selected.map((product) => {
      const preview: Record<string, any> = { ...product };

      changes.forEach((change) => {
        switch (change.field) {
          case 'price':
            if (change.mode === 'set') {
              preview.price = change.value;
            } else if (change.mode === 'adjust') {
              const adjustValue = typeof change.value === 'string' && change.value.includes('%')
                ? product.price * (parseFloat(change.value) / 100)
                : parseFloat(change.value as string);
              preview.price = Math.max(0, product.price + adjustValue);
            }
            break;

          case 'category':
            preview.category = change.value;
            break;

          case 'status':
            preview.status = change.value;
            break;

          case 'protectionLevel':
            preview.protectionLevel = change.value;
            break;

          case 'tags':
            if (change.mode === 'append') {
              preview.tags = [...new Set([...product.tags, change.value])];
            } else if (change.mode === 'remove') {
              preview.tags = product.tags.filter((t) => t !== change.value);
            }
            break;

          case 'maxLicenses':
            if (change.mode === 'set') {
              preview.maxLicenses = change.value;
            } else if (change.mode === 'adjust') {
              preview.maxLicenses = Math.max(
                product.currentLicenses || 0,
                (product.maxLicenses || 0) + (change.value as number)
              );
            }
            break;
        }
      });

      return preview;
    });
  }, [selected, changes]);

  // Sauvegarder les changements
  const handleSave = () => {
    if (selectedProducts.size === 0 || changes.length === 0) return;
    onSave?.(Array.from(selectedProducts), changes);
  };

  // Obtenir les modes disponibles pour le champ sélectionné
  const availableModes = FIELD_CONFIG[updateField].modes;

  // Si le mode actuel n'est pas disponible, changer
  if (!availableModes.includes(updateMode)) {
    setUpdateMode(availableModes[0]);
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mise à jour groupée</h2>
          <p className="text-muted-foreground">
            Modifier plusieurs produits digitaux en une seule opération
          </p>
        </div>
        <Badge variant="secondary" className="text-base">
          {selectedProducts.size} / {products.length} sélectionné{selectedProducts.size > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sélection des produits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Liste des produits */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Produits</h3>
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedProducts.size === products.length ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Tout désélectionner
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Tout sélectionner
                  </>
                )}
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={cn(
                      'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all',
                      selectedProducts.has(product.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <Checkbox checked={selectedProducts.has(product.id)} />

                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{product.category}</span>
                        <span>•</span>
                        <span>{product.price} EUR</span>
                        {product.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{product.tags.length} tag{product.tags.length > 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Badge variant={
                      product.status === 'active' ? 'default' :
                      product.status === 'published' ? 'secondary' :
                      product.status === 'draft' ? 'outline' :
                      'destructive'
                    }>
                      {product.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Configuration des changements */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Modifier les champs</h3>

            <div className="space-y-4">
              {/* Sélection du champ */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="field">Champ à modifier</Label>
                  <Select
                    value={updateField}
                    onValueChange={(value) => setUpdateField(value as BulkUpdateField)}
                  >
                    <SelectTrigger id="field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FIELD_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mode de mise à jour */}
                <div>
                  <Label htmlFor="mode">Mode</Label>
                  <Select
                    value={updateMode}
                    onValueChange={(value) => setUpdateMode(value as UpdateMode)}
                  >
                    <SelectTrigger id="mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModes.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode === 'set' && 'Définir'}
                          {mode === 'adjust' && 'Ajuster (+/-)'}
                          {mode === 'append' && 'Ajouter'}
                          {mode === 'remove' && 'Retirer'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Valeur */}
              <div>
                <Label htmlFor="value">Valeur</Label>
                <div className="flex gap-2">
                  {updateField === 'status' ? (
                    <Select value={updateValue} onValueChange={setUpdateValue}>
                      <SelectTrigger id="value">
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                        <SelectItem value="suspended">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : updateField === 'protectionLevel' ? (
                    <Select value={updateValue} onValueChange={setUpdateValue}>
                      <SelectTrigger id="value">
                        <SelectValue placeholder="Niveau de protection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basique</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="advanced">Avancé</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="value"
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      placeholder={
                        updateField === 'price' && updateMode === 'adjust'
                          ? 'Ex: +10 ou -15% ou -5'
                          : updateField === 'tags'
                          ? 'Nom du tag'
                          : 'Nouvelle valeur'
                      }
                      type={updateField === 'price' || updateField === 'maxLicenses' ? 'text' : 'text'}
                      className="flex-1"
                    />
                  )}
                  <Button onClick={addChange} disabled={!updateValue.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                {FIELD_CONFIG[updateField].unit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Unité : {FIELD_CONFIG[updateField].unit}
                  </p>
                )}
              </div>

              {/* Liste des changements */}
              {changes.length > 0 && (
                <div className="space-y-2">
                  <Label>Changements à appliquer</Label>
                  <div className="space-y-2">
                    {changes.map((change, index) => {
                      const fieldConfig = FIELD_CONFIG[change.field];
                      const Icon = fieldConfig.icon;

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-sm">
                                {fieldConfig.label}
                                {fieldConfig.unit && <span> ({fieldConfig.unit})</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {change.mode === 'set' && <span>Définir : {change.value}</span>}
                                {change.mode === 'adjust' && <span>Ajuster : {change.value}</span>}
                                {change.mode === 'append' && <span>Ajouter : {change.value}</span>}
                                {change.mode === 'remove' && <span>Retirer : {change.value}</span>}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChange(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Panneau latéral - Aperçu */}
        <div className="space-y-6">
          {/* Résumé */}
          <Card className="p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Résumé</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Produits sélectionnés</span>
                <span className="text-2xl font-bold">{selectedProducts.size}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Changements</span>
                <span className="text-2xl font-bold">{changes.length}</span>
              </div>

              <Separator />

              {selectedProducts.size > 0 && changes.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-700">
                      <p className="font-semibold">Prêt à appliquer</p>
                      <p className="text-xs mt-1">
                        {changes.length} modification{changes.length > 1 ? 's' : ''} sur{' '}
                        {selectedProducts.size} produit{selectedProducts.size > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aperçu rapide */}
              {previewChanges.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Aperçu ({previewChanges.length} produits)</Label>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {previewChanges.slice(0, 5).map((preview, index) => (
                        <div
                          key={index}
                          className="p-2 bg-muted/50 rounded text-xs space-y-1"
                        >
                          <p className="font-semibold truncate">{preview.name}</p>
                          {changes.some((c) => c.field === 'price') && (
                            <p>Prix : {preview.price.toFixed(2)} EUR</p>
                          )}
                          {changes.some((c) => c.field === 'status') && (
                            <p>Statut : {preview.status}</p>
                          )}
                          {changes.some((c) => c.field === 'tags') && (
                            <p>Tags : {preview.tags.join(', ')}</p>
                          )}
                        </div>
                      ))}
                      {previewChanges.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          Et {previewChanges.length - 5} autre{previewChanges.length - 5 > 1 ? 's' : ''}...
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-4">
            <div className="space-y-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full"
                    disabled={selectedProducts.size === 0 || changes.length === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Appliquer les changements
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer les modifications ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Vous êtes sur le point de modifier {selectedProducts.size} produit
                      {selectedProducts.size > 1 ? 's' : ''}. Cette action peut affecter vos
                      ventes et vos clients.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave}>
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {onCancel && (
                <Button variant="outline" className="w-full" onClick={onCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              )}
            </div>
          </Card>

          {/* Aide */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">Astuce</p>
                <p className="text-xs">
                  Pour ajuster les prix, utilisez + ou - suivi d'un nombre ou d'un pourcentage (ex: +10%, -5)
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

BulkDigitalUpdate.displayName = 'BulkDigitalUpdate';

export default BulkDigitalUpdate;

