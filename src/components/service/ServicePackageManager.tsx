import React, { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Package,
  Plus,
  Trash2,
  Edit,
  Copy,
  Star,
  CheckCircle2,
  Zap,
  Crown,
  Sparkles,
  DollarSign,
  Clock,
  Users,
  Settings,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tier de package (niveaux)
 */
export type PackageTier = 'basic' | 'standard' | 'premium' | 'custom';

/**
 * Option de package
 */
export interface PackageOption {
  id: string;
  name: string;
  description?: string;
  included: boolean;
  isExtra?: boolean;
  extraPrice?: number;
}

/**
 * Package de service
 */
export interface ServicePackage {
  id: string;
  name: string;
  tier: PackageTier;
  description: string;
  basePrice: number;
  duration: number; // en minutes
  currency?: string;
  maxClients?: number;
  options: PackageOption[];
  isActive: boolean;
  isPopular?: boolean;
  discount?: number; // pourcentage
  sessions?: number; // nombre de sessions incluses
}

/**
 * Props pour ServicePackageManager
 */
export interface ServicePackageManagerProps {
  /** Packages existants */
  packages: ServicePackage[];
  
  /** Callback pour sauvegarder les packages */
  onSave?: (packages: ServicePackage[]) => void;
  
  /** Options disponibles (template) */
  availableOptions?: PackageOption[];
  
  /** Permettre l'auto-génération */
  enableAutoGenerate?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Mode édition uniquement */
  readOnly?: boolean;
}

/**
 * Configuration des tiers avec leurs couleurs et icônes
 */
const TIER_CONFIG: Record<
  PackageTier,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  basic: {
    label: 'Basic',
    icon: Package,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Fonctionnalités essentielles',
  },
  standard: {
    label: 'Standard',
    icon: CheckCircle2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Fonctionnalités complètes',
  },
  premium: {
    label: 'Premium',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Tout inclus + extras',
  },
  custom: {
    label: 'Sur mesure',
    icon: Sparkles,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Personnalisé',
  },
};

/**
 * ServicePackageManager - Gestion des packages de services
 * 
 * @example
 * ```tsx
 * import { logger } from '@/lib/logger';
 * 
 * <ServicePackageManager 
 *   packages={packages}
 *   onSave={(packages) => logger.info('Packages saved', { count: packages.length })}
 *   enableAutoGenerate={true}
 *   availableOptions={[
 *     { id: '1', name: 'Support prioritaire', included: false },
 *     { id: '2', name: 'Accès mobile', included: true },
 *   ]}
 * />
 * ```
 */
export const ServicePackageManager: React.FC<ServicePackageManagerProps> = ({
  packages: initialPackages,
  onSave,
  availableOptions = [],
  enableAutoGenerate = true,
  className,
  readOnly = false,
}) => {
  const [packages, setPackages] = useState<ServicePackage[]>(initialPackages);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Auto-générer des packages
  const autoGeneratePackages = () => {
    const baseOptions: PackageOption[] = availableOptions.length > 0
      ? availableOptions
      : [
          { id: '1', name: 'Support email', description: '24h response', included: true },
          { id: '2', name: 'Support prioritaire', description: '2h response', included: false },
          { id: '3', name: 'Accès mobile', included: true },
          { id: '4', name: 'Rapports avancés', included: false },
          { id: '5', name: 'Intégration API', included: false },
          { id: '6', name: 'Manager dédié', included: false },
        ];

    const generated: ServicePackage[] = [
      {
        id: `pkg-basic-${Date.now()}`,
        name: 'Basic',
        tier: 'basic',
        description: 'Parfait pour démarrer',
        basePrice: 49,
        duration: 30,
        currency: 'EUR',
        maxClients: 1,
        sessions: 1,
        options: baseOptions.map((opt, idx) => ({
          ...opt,
          included: idx < 2, // 2 premières options
        })),
        isActive: true,
        isPopular: false,
      },
      {
        id: `pkg-standard-${Date.now()}`,
        name: 'Standard',
        tier: 'standard',
        description: 'Le plus populaire',
        basePrice: 99,
        duration: 60,
        currency: 'EUR',
        maxClients: 3,
        sessions: 3,
        options: baseOptions.map((opt, idx) => ({
          ...opt,
          included: idx < 4, // 4 premières options
        })),
        isActive: true,
        isPopular: true,
        discount: 10,
      },
      {
        id: `pkg-premium-${Date.now()}`,
        name: 'Premium',
        tier: 'premium',
        description: 'Service complet et illimité',
        basePrice: 199,
        duration: 120,
        currency: 'EUR',
        maxClients: 10,
        sessions: 10,
        options: baseOptions.map((opt) => ({
          ...opt,
          included: true, // Toutes les options
        })),
        isActive: true,
        isPopular: false,
        discount: 20,
      },
    ];

    setPackages(generated);
  };

  // Créer/Modifier un package
  const handleSavePackage = () => {
    if (!editingPackage) return;

    const existingIndex = packages.findIndex((p) => p.id === editingPackage.id);
    let updated: ServicePackage[];

    if (existingIndex >= 0) {
      // Modifier existant
      updated = [...packages];
      updated[existingIndex] = editingPackage;
    } else {
      // Nouveau
      updated = [...packages, editingPackage];
    }

    setPackages(updated);
    setIsDialogOpen(false);
    setEditingPackage(null);
  };

  // Supprimer un package
  const handleDelete = (id: string) => {
    setPackages(packages.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  // Dupliquer un package
  const handleDuplicate = (pkg: ServicePackage) => {
    const duplicated: ServicePackage = {
      ...pkg,
      id: `pkg-${Date.now()}`,
      name: `${pkg.name} (copie)`,
      isPopular: false,
    };
    setPackages([...packages, duplicated]);
  };

  // Ouvrir le dialog pour nouveau package
  const handleNew = () => {
    const newPackage: ServicePackage = {
      id: `pkg-${Date.now()}`,
      name: '',
      tier: 'basic',
      description: '',
      basePrice: 0,
      duration: 60,
      currency: 'EUR',
      options: [],
      isActive: true,
    };
    setEditingPackage(newPackage);
    setIsDialogOpen(true);
  };

  // Ouvrir le dialog pour éditer
  const handleEdit = (pkg: ServicePackage) => {
    setEditingPackage({ ...pkg });
    setIsDialogOpen(true);
  };

  // Toggle option dans le package en cours d'édition
  const toggleOption = (optionId: string) => {
    if (!editingPackage) return;

    const updated = editingPackage.options.map((opt) =>
      opt.id === optionId ? { ...opt, included: !opt.included } : opt
    );

    setEditingPackage({ ...editingPackage, options: updated });
  };

  // Ajouter une nouvelle option custom
  const addCustomOption = () => {
    if (!editingPackage) return;

    const newOption: PackageOption = {
      id: `opt-${Date.now()}`,
      name: 'Nouvelle option',
      included: true,
    };

    setEditingPackage({
      ...editingPackage,
      options: [...editingPackage.options, newOption],
    });
  };

  // Supprimer une option
  const removeOption = (optionId: string) => {
    if (!editingPackage) return;

    setEditingPackage({
      ...editingPackage,
      options: editingPackage.options.filter((opt) => opt.id !== optionId),
    });
  };

  // Render package card
  const renderPackageCard = (pkg: ServicePackage) => {
    const config = TIER_CONFIG[pkg.tier];
    const Icon = config.icon;
    const finalPrice = pkg.discount
      ? pkg.basePrice * (1 - pkg.discount / 100)
      : pkg.basePrice;

    return (
      <Card
        key={pkg.id}
        className={cn(
          'relative overflow-hidden transition-shadow hover:shadow-lg',
          pkg.isPopular && 'ring-2 ring-primary'
        )}
      >
        {pkg.isPopular && (
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
            <Star className="h-3 w-3 inline mr-1" />
            Populaire
          </div>
        )}

        <CardHeader className={cn('pb-4', config.bgColor)}>
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-lg bg-white')}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
            {!readOnly && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(pkg)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(pkg)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(pkg.id)}
                  className="h-8 w-8 p-0 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Price */}
          <div>
            <div className="flex items-baseline gap-2">
              {pkg.discount && (
                <span className="text-lg line-through text-muted-foreground">
                  {pkg.basePrice} {pkg.currency}
                </span>
              )}
              <span className="text-3xl font-bold">
                {Math.round(finalPrice)} {pkg.currency}
              </span>
            </div>
            {pkg.discount && (
              <Badge variant="destructive" className="mt-1">
                -{pkg.discount}%
              </Badge>
            )}
            <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{pkg.duration} minutes par session</span>
            </div>
            {pkg.sessions && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{pkg.sessions} session(s) incluse(s)</span>
              </div>
            )}
            {pkg.maxClients && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Jusqu'à {pkg.maxClients} client(s)</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Options */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Fonctionnalités incluses:</p>
            <ul className="space-y-1.5">
              {pkg.options
                .filter((opt) => opt.included)
                .map((opt) => (
                  <li key={opt.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      {opt.name}
                      {opt.description && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({opt.description})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          {/* Status */}
          <div className="pt-2">
            <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
              {pkg.isActive ? 'Actif' : 'Inactif'}
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
          <h2 className="text-2xl font-bold">Gestion des Packages</h2>
          <p className="text-muted-foreground">
            Créez et gérez vos offres de service
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            {enableAutoGenerate && packages.length === 0 && (
              <Button variant="outline" onClick={autoGeneratePackages}>
                <Zap className="h-4 w-4 mr-2" />
                Générer automatiquement
              </Button>
            )}
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau package
            </Button>
          </div>
        )}
      </div>

      {/* Packages grid */}
      {packages.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Aucun package créé pour le moment
          </p>
          {!readOnly && enableAutoGenerate && (
            <Button onClick={autoGeneratePackages}>
              <Zap className="h-4 w-4 mr-2" />
              Générer 3 packages (Basic, Standard, Premium)
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => renderPackageCard(pkg))}
        </div>
      )}

      {/* Save button */}
      {!readOnly && packages.length > 0 && onSave && (
        <div className="flex justify-end">
          <Button onClick={() => onSave(packages)} size="lg">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder tous les packages
          </Button>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage?.name ? `Modifier ${editingPackage.name}` : 'Nouveau package'}
            </DialogTitle>
            <DialogDescription>
              Configurez les détails et fonctionnalités du package
            </DialogDescription>
          </DialogHeader>

          {editingPackage && (
            <div className="space-y-4">
              {/* Name & Tier */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du package *</Label>
                  <Input
                    id="name"
                    value={editingPackage.name}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, name: e.target.value })
                    }
                    placeholder="Ex: Premium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">Niveau</Label>
                  <Select
                    value={editingPackage.tier}
                    onValueChange={(value: PackageTier) =>
                      setEditingPackage({ ...editingPackage, tier: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIER_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingPackage.description}
                  onChange={(e) =>
                    setEditingPackage({ ...editingPackage, description: e.target.value })
                  }
                  placeholder="Description courte du package"
                  rows={2}
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (EUR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editingPackage.basePrice}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        basePrice: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={editingPackage.duration}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        duration: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Sessions & Clients */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessions">Nombre de sessions</Label>
                  <Input
                    id="sessions"
                    type="number"
                    value={editingPackage.sessions || ''}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        sessions: Number(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxClients">Max clients</Label>
                  <Input
                    id="maxClients"
                    type="number"
                    value={editingPackage.maxClients || ''}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        maxClients: Number(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <Label htmlFor="discount">Réduction (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={editingPackage.discount || ''}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      discount: Number(e.target.value) || undefined,
                    })
                  }
                  placeholder="0"
                />
              </div>

              <Separator />

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Fonctionnalités incluses</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomOption}
                    type="button"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                  {editingPackage.options.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune fonctionnalité. Cliquez sur "Ajouter" pour en créer.
                    </p>
                  ) : (
                    editingPackage.options.map((opt, idx) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={opt.included}
                          onCheckedChange={() => toggleOption(opt.id)}
                        />
                        <Input
                          value={opt.name}
                          onChange={(e) => {
                            const updated = [...editingPackage.options];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setEditingPackage({ ...editingPackage, options: updated });
                          }}
                          className="flex-1 h-8"
                          placeholder="Nom de l'option"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(opt.id)}
                          className="h-8 w-8 p-0 text-red-600"
                          type="button"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Package actif</Label>
                  <Switch
                    id="isActive"
                    checked={editingPackage.isActive}
                    onCheckedChange={(checked) =>
                      setEditingPackage({ ...editingPackage, isActive: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPopular">Marquer comme populaire</Label>
                  <Switch
                    id="isPopular"
                    checked={editingPackage.isPopular || false}
                    onCheckedChange={(checked) =>
                      setEditingPackage({ ...editingPackage, isPopular: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingPackage(null);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSavePackage}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce package ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le package sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

ServicePackageManager.displayName = 'ServicePackageManager';

export default ServicePackageManager;

