import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Package,
  Plus,
  Trash2,
  Edit,
  Copy,
  Save,
  X,
  DollarSign,
  Clock,
  Percent,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Service disponible pour bundle
 */
export interface BundleService {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

/**
 * Item dans un bundle
 */
export interface BundleItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  originalPrice: number;
  discountedPrice?: number;
}

/**
 * Bundle de services
 */
export interface ServiceBundle {
  id: string;
  name: string;
  description: string;
  items: BundleItem[];
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  finalPrice: number;
  originalPrice: number;
  savings: number;
  totalDuration: number;
  isActive: boolean;
  validFrom?: Date | string;
  validUntil?: Date | string;
  maxPurchases?: number;
  purchasesCount: number;
}

/**
 * Props pour ServiceBundleBuilder
 */
export interface ServiceBundleBuilderProps {
  /** Bundles existants */
  bundles: ServiceBundle[];
  
  /** Services disponibles */
  availableServices: BundleService[];
  
  /** Callback pour sauvegarder un bundle */
  onSave?: (bundle: Partial<ServiceBundle>) => Promise<void>;
  
  /** Callback pour supprimer un bundle */
  onDelete?: (id: string) => Promise<void>;
  
  /** Callback pour dupliquer un bundle */
  onDuplicate?: (bundle: ServiceBundle) => Promise<void>;
  
  /** Devise */
  currency?: string;
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * ServiceBundleBuilder - Création de packs de services
 */
export const ServiceBundleBuilder: React.FC<ServiceBundleBuilderProps> = ({
  bundles,
  availableServices,
  onSave,
  onDelete,
  onDuplicate,
  currency = 'EUR',
  className,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Partial<ServiceBundle> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Ouvrir dialog pour nouveau bundle
  const handleNew = () => {
    setEditingBundle({
      name: '',
      description: '',
      items: [],
      discountType: 'percentage',
      discountValue: 10,
      isActive: true,
      purchasesCount: 0,
    });
    setIsDialogOpen(true);
  };

  // Ouvrir dialog pour éditer
  const handleEdit = (bundle: ServiceBundle) => {
    setEditingBundle({ ...bundle });
    setIsDialogOpen(true);
  };

  // Ajouter un service au bundle
  const addServiceToBundle = (service: BundleService) => {
    if (!editingBundle) return;

    const existingItem = editingBundle.items?.find((item) => item.serviceId === service.id);
    if (existingItem) {
      // Incrémenter la quantité
      const updatedItems = editingBundle.items!.map((item) =>
        item.serviceId === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setEditingBundle({ ...editingBundle, items: updatedItems });
    } else {
      // Ajouter nouveau
      const newItem: BundleItem = {
        serviceId: service.id,
        serviceName: service.name,
        quantity: 1,
        originalPrice: service.price,
      };
      setEditingBundle({
        ...editingBundle,
        items: [...(editingBundle.items || []), newItem],
      });
    }
  };

  // Retirer un service du bundle
  const removeServiceFromBundle = (serviceId: string) => {
    if (!editingBundle) return;
    setEditingBundle({
      ...editingBundle,
      items: editingBundle.items!.filter((item) => item.serviceId !== serviceId),
    });
  };

  // Modifier la quantité
  const updateItemQuantity = (serviceId: string, quantity: number) => {
    if (!editingBundle) return;
    const updatedItems = editingBundle.items!.map((item) =>
      item.serviceId === serviceId ? { ...item, quantity: Math.max(1, quantity) } : item
    );
    setEditingBundle({ ...editingBundle, items: updatedItems });
  };

  // Calculer le prix total
  const calculatePricing = () => {
    if (!editingBundle || !editingBundle.items) {
      return { originalPrice: 0, finalPrice: 0, savings: 0, totalDuration: 0 };
    }

    const originalPrice = editingBundle.items.reduce(
      (sum, item) => sum + item.originalPrice * item.quantity,
      0
    );

    const totalDuration = editingBundle.items.reduce((sum, item) => {
      const service = availableServices.find((s) => s.id === item.serviceId);
      return sum + (service?.duration || 0) * item.quantity;
    }, 0);

    let finalPrice = originalPrice;
    if (editingBundle.discountType === 'fixed') {
      finalPrice = Math.max(0, originalPrice - (editingBundle.discountValue || 0));
    } else {
      finalPrice = originalPrice * (1 - (editingBundle.discountValue || 0) / 100);
    }

    const savings = originalPrice - finalPrice;

    return { originalPrice, finalPrice, savings, totalDuration };
  };

  const pricing = calculatePricing();

  // Sauvegarder
  const handleSave = async () => {
    if (!editingBundle || !onSave) return;

    setIsSaving(true);
    try {
      const bundleToSave = {
        ...editingBundle,
        ...pricing,
      };
      await onSave(bundleToSave);
      setIsDialogOpen(false);
      setEditingBundle(null);
    } catch (error) {
      console.error('Error saving bundle:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Render bundle card
  const renderBundleCard = (bundle: ServiceBundle) => {
    const savingsPercentage = bundle.originalPrice > 0
      ? ((bundle.savings / bundle.originalPrice) * 100).toFixed(0)
      : 0;

    return (
      <Card
        key={bundle.id}
        className={cn('relative overflow-hidden', !bundle.isActive && 'opacity-60')}
      >
        {bundle.savings > 0 && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 text-xs font-bold">
            <Percent className="h-3 w-3 inline mr-1" />
            -{savingsPercentage}%
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{bundle.name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {bundle.description}
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(bundle)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              {onDuplicate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDuplicate(bundle)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(bundle.id)}
                  className="h-8 w-8 p-0 text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Prix */}
          <div>
            <div className="flex items-baseline gap-2">
              {bundle.savings > 0 && (
                <span className="text-lg line-through text-muted-foreground">
                  {bundle.originalPrice} {currency}
                </span>
              )}
              <span className="text-3xl font-bold text-primary">
                {Math.round(bundle.finalPrice)} {currency}
              </span>
            </div>
            {bundle.savings > 0 && (
              <p className="text-xs text-green-600 font-medium mt-1">
                Économisez {Math.round(bundle.savings)} {currency}
              </p>
            )}
          </div>

          <Separator />

          {/* Services inclus */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Services inclus:</p>
            <ul className="space-y-1">
              {bundle.items.map((item) => (
                <li key={item.serviceId} className="flex items-center justify-between text-sm">
                  <span>
                    {item.quantity > 1 && `${item.quantity}x `}
                    {item.serviceName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.originalPrice * item.quantity} {currency}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Durée totale</p>
              <p className="font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {bundle.totalDuration} min
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Achats</p>
              <p className="font-semibold">
                {bundle.purchasesCount}
                {bundle.maxPurchases && ` / ${bundle.maxPurchases}`}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="pt-2">
            <Badge variant={bundle.isActive ? 'default' : 'secondary'}>
              {bundle.isActive ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Packs de Services
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Créez des offres groupées avec réductions
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau pack
        </Button>
      </div>

      {/* Bundles grid */}
      {bundles.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Aucun pack créé</p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Créer le premier pack
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => renderBundleCard(bundle))}
        </div>
      )}

      {/* Dialog d'édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBundle?.id ? 'Modifier' : 'Nouveau'} pack de services
            </DialogTitle>
            <DialogDescription>
              Combinez plusieurs services avec une réduction
            </DialogDescription>
          </DialogHeader>

          {editingBundle && (
            <div className="space-y-4">
              {/* Nom et description */}
              <div className="space-y-2">
                <Label htmlFor="name">Nom du pack *</Label>
                <Input
                  id="name"
                  value={editingBundle.name}
                  onChange={(e) =>
                    setEditingBundle({ ...editingBundle, name: e.target.value })
                  }
                  placeholder="Ex: Pack Bien-être Complet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingBundle.description}
                  onChange={(e) =>
                    setEditingBundle({ ...editingBundle, description: e.target.value })
                  }
                  placeholder="Décrivez les avantages de ce pack"
                  rows={2}
                />
              </div>

              <Separator />

              {/* Sélection de services */}
              <div className="space-y-3">
                <Label>Services inclus ({editingBundle.items?.length || 0})</Label>
                
                <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2">
                  {availableServices.map((service) => {
                    const item = editingBundle.items?.find((i) => i.serviceId === service.id);
                    return (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={!!item}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                addServiceToBundle(service);
                              } else {
                                removeServiceFromBundle(service.id);
                              }
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.price} {currency} • {service.duration} min
                            </p>
                          </div>
                        </div>
                        {item && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(service.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              -
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(service.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              +
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Réduction */}
              <div className="space-y-3">
                <Label>Réduction</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Type</Label>
                    <Select
                      value={editingBundle.discountType}
                      onValueChange={(value: 'fixed' | 'percentage') =>
                        setEditingBundle({ ...editingBundle, discountType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Pourcentage</SelectItem>
                        <SelectItem value="fixed">Montant fixe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">
                      Valeur {editingBundle.discountType === 'percentage' ? '(%)' : `(${currency})`}
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      min="0"
                      value={editingBundle.discountValue}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          discountValue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Aperçu du prix */}
              {editingBundle.items && editingBundle.items.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prix original:</span>
                      <span className="font-medium">{pricing.originalPrice} {currency}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Réduction:</span>
                      <span className="font-medium">-{pricing.savings.toFixed(2)} {currency}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold">Prix final:</span>
                      <span className="text-2xl font-bold text-primary">
                        {pricing.finalPrice.toFixed(2)} {currency}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Durée totale: {pricing.totalDuration} minutes
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Options avancées */}
              <div className="space-y-3">
                <Label>Options avancées</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Valide à partir du</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={
                        editingBundle.validFrom
                          ? typeof editingBundle.validFrom === 'string'
                            ? editingBundle.validFrom.split('T')[0]
                            : editingBundle.validFrom.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          validFrom: e.target.value || undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valide jusqu'au</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={
                        editingBundle.validUntil
                          ? typeof editingBundle.validUntil === 'string'
                            ? editingBundle.validUntil.split('T')[0]
                            : editingBundle.validUntil.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          validUntil: e.target.value || undefined,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPurchases">Limite d'achats (optionnel)</Label>
                  <Input
                    id="maxPurchases"
                    type="number"
                    min="0"
                    value={editingBundle.maxPurchases || ''}
                    onChange={(e) =>
                      setEditingBundle({
                        ...editingBundle,
                        maxPurchases: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Illimité"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Label htmlFor="isActive">Pack actif</Label>
                  <Switch
                    id="isActive"
                    checked={editingBundle.isActive}
                    onCheckedChange={(checked) =>
                      setEditingBundle({ ...editingBundle, isActive: checked })
                    }
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-900">
                  <p className="font-medium">À propos des packs</p>
                  <p className="text-xs mt-1">
                    Les clients achètent le pack et peuvent réserver les services individuellement
                    selon leur convenance.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !editingBundle?.items?.length}>
              {isSaving ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

ServiceBundleBuilder.displayName = 'ServiceBundleBuilder';

export default ServiceBundleBuilder;

